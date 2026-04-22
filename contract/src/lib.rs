#![no_std]

use core::cmp::min;

use soroban_sdk::{
    contract, contracterror, contractevent, contractimpl, contracttype, panic_with_error,
    token, Address, Env, MuxedAddress, String, TryFromVal, Vec,
};

const MAX_RECENT_PAYMENTS: u32 = 12;
const BPS_DENOMINATOR: i128 = 10_000;
const INSTANCE_TTL_THRESHOLD: u32 = 1_000;
const INSTANCE_TTL_BUMP: u32 = 20_000;

#[contracterror]
#[derive(Copy, Clone, Debug, Eq, PartialEq, PartialOrd, Ord)]
#[repr(u32)]
pub enum ContractError {
    AlreadyInitialized = 1,
    NotInitialized = 2,
    Unauthorized = 3,
    InvalidAmount = 4,
    InvalidBps = 5,
    InsufficientShares = 6,
    NothingToClaim = 7,
    Overflow = 8,
}

#[contractevent]
#[derive(Clone, Debug, Eq, PartialEq)]
pub struct PaymentSetEvent {
    #[topic]
    pub to: Address,
    pub amount: i128,
    pub memo: String,
}

#[contractevent]
#[derive(Clone, Debug, Eq, PartialEq)]
pub struct TokenPaymentSettledEvent {
    #[topic]
    pub payment_id: u64,
    #[topic]
    pub payer: Address,
    #[topic]
    pub to: Address,
    pub amount: i128,
    pub fee_amount: i128,
    pub reward_points: i128,
    pub memo: String,
}

#[contractevent]
#[derive(Clone, Debug, Eq, PartialEq)]
pub struct LiquidityAddedEvent {
    #[topic]
    pub provider: Address,
    pub amount: i128,
    pub shares_minted: i128,
}

#[contractevent]
#[derive(Clone, Debug, Eq, PartialEq)]
pub struct LiquidityRemovedEvent {
    #[topic]
    pub provider: Address,
    pub shares_burned: i128,
    pub amount_out: i128,
}

#[contractevent]
#[derive(Clone, Debug, Eq, PartialEq)]
pub struct RewardPoolFundedEvent {
    #[topic]
    pub admin: Address,
    pub amount: i128,
    pub reward_reserve: i128,
}

#[contractevent]
#[derive(Clone, Debug, Eq, PartialEq)]
pub struct RewardsClaimedEvent {
    #[topic]
    pub user: Address,
    pub amount: i128,
    pub remaining_reward_points: i128,
}

#[contracttype]
#[derive(Clone, Debug, Eq, PartialEq)]
pub struct LastPayment {
    pub to: Address,
    pub amount: i128,
    pub memo: String,
}

#[contracttype]
#[derive(Clone, Debug, Eq, PartialEq)]
pub struct PaymentRecord {
    pub id: u64,
    pub payer: Address,
    pub to: Address,
    pub amount: i128,
    pub fee_amount: i128,
    pub reward_points: i128,
    pub memo: String,
    pub timestamp: u64,
}

#[contracttype]
#[derive(Clone, Debug, Eq, PartialEq)]
pub struct Config {
    pub admin: Address,
    pub pool_token: Address,
    pub payment_fee_bps: u32,
    pub reward_rate_bps: u32,
}

#[contracttype]
#[derive(Clone, Debug, Eq, PartialEq)]
pub struct PoolState {
    pub total_liquidity: i128,
    pub total_shares: i128,
    pub reward_reserve: i128,
    pub collected_fees: i128,
    pub payment_count: u64,
}

#[contracttype]
#[derive(Clone, Debug, Eq, PartialEq)]
pub struct StoredPosition {
    pub shares: i128,
    pub principal: i128,
}

#[contracttype]
#[derive(Clone, Debug, Eq, PartialEq)]
pub struct ProviderPosition {
    pub provider: Address,
    pub shares: i128,
    pub principal: i128,
    pub redeemable_amount: i128,
    pub reward_points: i128,
}

#[contracttype]
#[derive(Clone, Debug, Eq, PartialEq)]
pub struct TokenMetadata {
    pub token: Address,
    pub name: String,
    pub symbol: String,
    pub decimals: u32,
}

#[contracttype]
#[derive(Clone, Debug, Eq, PartialEq)]
pub struct PaymentQuote {
    pub amount: i128,
    pub fee_amount: i128,
    pub recipient_amount: i128,
    pub reward_points: i128,
}

#[contracttype]
#[derive(Clone)]
pub enum DataKey {
    Config,
    LastPayment,
    PoolState,
    PaymentFeed,
    Position(Address),
    RewardPoints(Address),
}

#[contract]
pub struct Contract;

#[contractimpl]
impl Contract {
    pub fn initialize(
        env: Env,
        admin: Address,
        pool_token: Address,
        payment_fee_bps: u32,
        reward_rate_bps: u32,
    ) {
        if env.storage().persistent().has(&DataKey::Config) {
            panic_with_error!(&env, ContractError::AlreadyInitialized);
        }

        admin.require_auth();
        validate_bps(&env, payment_fee_bps);
        validate_bps(&env, reward_rate_bps);

        let config = Config {
            admin,
            pool_token,
            payment_fee_bps,
            reward_rate_bps,
        };

        env.storage().persistent().set(&DataKey::Config, &config);
        env.storage()
            .persistent()
            .set(&DataKey::PoolState, &default_pool_state());
        bump_instance_ttl(&env);
    }

    pub fn config(env: Env) -> Config {
        bump_instance_ttl(&env);
        read_config(&env)
    }

    pub fn token_metadata(env: Env) -> TokenMetadata {
        bump_instance_ttl(&env);
        let config = read_config(&env);
        let token_client = token::TokenClient::new(&env, &config.pool_token);

        TokenMetadata {
            token: config.pool_token,
            name: token_client.name(),
            symbol: token_client.symbol(),
            decimals: token_client.decimals(),
        }
    }

    pub fn pool_state(env: Env) -> PoolState {
        bump_instance_ttl(&env);
        read_pool_state(&env)
    }

    pub fn provider_position(env: Env, provider: Address) -> ProviderPosition {
        bump_instance_ttl(&env);
        provider_snapshot(&env, provider)
    }

    pub fn quote_payment(env: Env, amount: i128) -> PaymentQuote {
        bump_instance_ttl(&env);
        if amount <= 0 {
            panic_with_error!(&env, ContractError::InvalidAmount);
        }

        let config = read_config(&env);
        let fee_amount = calc_bps_amount(&env, amount, config.payment_fee_bps);
        let recipient_amount = amount - fee_amount;

        if recipient_amount <= 0 {
            panic_with_error!(&env, ContractError::InvalidAmount);
        }

        PaymentQuote {
            amount,
            fee_amount,
            recipient_amount,
            reward_points: calc_bps_amount(&env, amount, config.reward_rate_bps),
        }
    }

    pub fn fund_reward_pool(env: Env, admin: Address, amount: i128) -> PoolState {
        bump_instance_ttl(&env);
        require_admin(&env, &admin);
        assert_positive(&env, amount);

        let config = read_config(&env);
        let token_client = token::TokenClient::new(&env, &config.pool_token);
        let contract_muxed = as_muxed_address(&env, &env.current_contract_address());

        token_client.transfer(&admin, &contract_muxed, &amount);

        let mut pool = read_pool_state(&env);
        pool.reward_reserve = checked_add(&env, pool.reward_reserve, amount);
        write_pool_state(&env, &pool);

        RewardPoolFundedEvent {
            admin,
            amount,
            reward_reserve: pool.reward_reserve,
        }
        .publish(&env);

        pool
    }

    pub fn add_liquidity(env: Env, provider: Address, amount: i128) -> ProviderPosition {
        bump_instance_ttl(&env);
        provider.require_auth();
        assert_positive(&env, amount);

        let config = read_config(&env);
        let mut pool = read_pool_state(&env);
        let token_client = token::TokenClient::new(&env, &config.pool_token);
        let contract_muxed = as_muxed_address(&env, &env.current_contract_address());

        let shares_minted = if pool.total_liquidity == 0 || pool.total_shares == 0 {
            amount
        } else {
            checked_mul_div(&env, amount, pool.total_shares, pool.total_liquidity)
        };

        if shares_minted <= 0 {
            panic_with_error!(&env, ContractError::InvalidAmount);
        }

        token_client.transfer(&provider, &contract_muxed, &amount);

        pool.total_liquidity = checked_add(&env, pool.total_liquidity, amount);
        pool.total_shares = checked_add(&env, pool.total_shares, shares_minted);
        write_pool_state(&env, &pool);

        let mut position = read_position(&env, &provider);
        position.shares = checked_add(&env, position.shares, shares_minted);
        position.principal = checked_add(&env, position.principal, amount);
        write_position(&env, &provider, &position);

        LiquidityAddedEvent {
            provider: provider.clone(),
            amount,
            shares_minted,
        }
        .publish(&env);

        provider_snapshot(&env, provider)
    }

    pub fn remove_liquidity(env: Env, provider: Address, shares: i128) -> ProviderPosition {
        bump_instance_ttl(&env);
        provider.require_auth();
        assert_positive(&env, shares);

        let config = read_config(&env);
        let mut pool = read_pool_state(&env);
        let mut position = read_position(&env, &provider);

        if shares > position.shares || shares > pool.total_shares {
            panic_with_error!(&env, ContractError::InsufficientShares);
        }

        let amount_out = checked_mul_div(&env, shares, pool.total_liquidity, pool.total_shares);
        let principal_reduction = checked_mul_div(&env, shares, position.principal, position.shares);
        let token_client = token::TokenClient::new(&env, &config.pool_token);
        let provider_muxed = as_muxed_address(&env, &provider);

        pool.total_liquidity = checked_sub(&env, pool.total_liquidity, amount_out);
        pool.total_shares = checked_sub(&env, pool.total_shares, shares);
        write_pool_state(&env, &pool);

        position.shares = checked_sub(&env, position.shares, shares);
        position.principal = checked_sub(&env, position.principal, principal_reduction);
        write_position(&env, &provider, &position);

        token_client.transfer(&env.current_contract_address(), &provider_muxed, &amount_out);

        LiquidityRemovedEvent {
            provider: provider.clone(),
            shares_burned: shares,
            amount_out,
        }
        .publish(&env);

        provider_snapshot(&env, provider)
    }

    pub fn settle_token_payment(
        env: Env,
        payer: Address,
        to: Address,
        amount: i128,
        memo: String,
    ) -> PaymentRecord {
        bump_instance_ttl(&env);
        payer.require_auth();
        assert_positive(&env, amount);

        let config = read_config(&env);
        let quote = Self::quote_payment(env.clone(), amount);
        let mut pool = read_pool_state(&env);
        let token_client = token::TokenClient::new(&env, &config.pool_token);
        let recipient_muxed = as_muxed_address(&env, &to);
        let contract_muxed = as_muxed_address(&env, &env.current_contract_address());

        token_client.transfer(&payer, &recipient_muxed, &quote.recipient_amount);

        if quote.fee_amount > 0 {
            token_client.transfer(&payer, &contract_muxed, &quote.fee_amount);
            pool.total_liquidity = checked_add(&env, pool.total_liquidity, quote.fee_amount);
            pool.collected_fees = checked_add(&env, pool.collected_fees, quote.fee_amount);
        }

        pool.payment_count = pool.payment_count.saturating_add(1);
        write_pool_state(&env, &pool);

        let reward_key = DataKey::RewardPoints(payer.clone());
        let existing_rewards = read_reward_points(&env, &payer);
        let updated_rewards = checked_add(&env, existing_rewards, quote.reward_points);
        env.storage().persistent().set(&reward_key, &updated_rewards);

        let record = PaymentRecord {
            id: pool.payment_count,
            payer: payer.clone(),
            to: to.clone(),
            amount,
            fee_amount: quote.fee_amount,
            reward_points: quote.reward_points,
            memo: memo.clone(),
            timestamp: env.ledger().timestamp(),
        };

        push_payment_record(&env, &record);
        write_last_payment(
            &env,
            &LastPayment {
                to: to.clone(),
                amount,
                memo: memo.clone(),
            },
        );

        TokenPaymentSettledEvent {
            payment_id: record.id,
            payer,
            to,
            amount,
            fee_amount: quote.fee_amount,
            reward_points: quote.reward_points,
            memo,
        }
        .publish(&env);

        record
    }

    pub fn claim_rewards(env: Env, user: Address) -> i128 {
        bump_instance_ttl(&env);
        user.require_auth();

        let config = read_config(&env);
        let mut pool = read_pool_state(&env);
        let available_points = read_reward_points(&env, &user);
        let claim_amount = min(available_points, pool.reward_reserve);

        if claim_amount <= 0 {
            panic_with_error!(&env, ContractError::NothingToClaim);
        }

        let remaining_points = checked_sub(&env, available_points, claim_amount);
        pool.reward_reserve = checked_sub(&env, pool.reward_reserve, claim_amount);
        write_pool_state(&env, &pool);
        env.storage()
            .persistent()
            .set(&DataKey::RewardPoints(user.clone()), &remaining_points);

        let token_client = token::TokenClient::new(&env, &config.pool_token);
        let user_muxed = as_muxed_address(&env, &user);
        token_client.transfer(&env.current_contract_address(), &user_muxed, &claim_amount);

        RewardsClaimedEvent {
            user,
            amount: claim_amount,
            remaining_reward_points: remaining_points,
        }
        .publish(&env);

        claim_amount
    }

    pub fn reward_points(env: Env, user: Address) -> i128 {
        bump_instance_ttl(&env);
        read_reward_points(&env, &user)
    }

    pub fn recent_payments(env: Env, limit: u32) -> Vec<PaymentRecord> {
        bump_instance_ttl(&env);
        let stored: Vec<PaymentRecord> = env
            .storage()
            .persistent()
            .get(&DataKey::PaymentFeed)
            .unwrap_or(Vec::new(&env));

        let mut result = Vec::new(&env);
        let capped_limit = min(limit, stored.len());

        let mut index = 0;
        while index < capped_limit {
            result.push_back(stored.get_unchecked(index));
            index += 1;
        }

        result
    }

    pub fn set_rates(env: Env, admin: Address, payment_fee_bps: u32, reward_rate_bps: u32) {
        bump_instance_ttl(&env);
        require_admin(&env, &admin);
        validate_bps(&env, payment_fee_bps);
        validate_bps(&env, reward_rate_bps);

        let mut config = read_config(&env);
        config.payment_fee_bps = payment_fee_bps;
        config.reward_rate_bps = reward_rate_bps;
        env.storage().persistent().set(&DataKey::Config, &config);
    }

    pub fn set_last_payment(env: Env, to: Address, amount: i128, memo: String) {
        bump_instance_ttl(&env);
        let stored = LastPayment {
            to: to.clone(),
            amount,
            memo: memo.clone(),
        };

        write_last_payment(&env, &stored);
        PaymentSetEvent { to, amount, memo }.publish(&env);
    }

    pub fn last_payment(env: Env) -> Option<LastPayment> {
        bump_instance_ttl(&env);
        env.storage().persistent().get(&DataKey::LastPayment)
    }
}

fn read_config(env: &Env) -> Config {
    env.storage()
        .persistent()
        .get(&DataKey::Config)
        .unwrap_or_else(|| panic_with_error!(env, ContractError::NotInitialized))
}

fn read_pool_state(env: &Env) -> PoolState {
    env.storage()
        .persistent()
        .get(&DataKey::PoolState)
        .unwrap_or(default_pool_state())
}

fn write_pool_state(env: &Env, pool: &PoolState) {
    env.storage().persistent().set(&DataKey::PoolState, pool);
}

fn read_position(env: &Env, provider: &Address) -> StoredPosition {
    env.storage()
        .persistent()
        .get(&DataKey::Position(provider.clone()))
        .unwrap_or(StoredPosition {
            shares: 0,
            principal: 0,
        })
}

fn write_position(env: &Env, provider: &Address, position: &StoredPosition) {
    env.storage()
        .persistent()
        .set(&DataKey::Position(provider.clone()), position);
}

fn read_reward_points(env: &Env, user: &Address) -> i128 {
    env.storage()
        .persistent()
        .get(&DataKey::RewardPoints(user.clone()))
        .unwrap_or(0)
}

fn provider_snapshot(env: &Env, provider: Address) -> ProviderPosition {
    let pool = read_pool_state(env);
    let position = read_position(env, &provider);
    let redeemable_amount = if position.shares == 0 || pool.total_shares == 0 {
        0
    } else {
        checked_mul_div(env, position.shares, pool.total_liquidity, pool.total_shares)
    };

    ProviderPosition {
        provider: provider.clone(),
        shares: position.shares,
        principal: position.principal,
        redeemable_amount,
        reward_points: read_reward_points(env, &provider),
    }
}

fn push_payment_record(env: &Env, record: &PaymentRecord) {
    let mut feed: Vec<PaymentRecord> = env
        .storage()
        .persistent()
        .get(&DataKey::PaymentFeed)
        .unwrap_or(Vec::new(env));

    feed.insert(0, record.clone());

    while feed.len() > MAX_RECENT_PAYMENTS {
        feed.pop_back();
    }

    env.storage().persistent().set(&DataKey::PaymentFeed, &feed);
}

fn write_last_payment(env: &Env, last_payment: &LastPayment) {
    env.storage().persistent().set(&DataKey::LastPayment, last_payment);
}

fn require_admin(env: &Env, admin: &Address) {
    let config = read_config(env);
    if config.admin != *admin {
        panic_with_error!(env, ContractError::Unauthorized);
    }
    admin.require_auth();
}

fn validate_bps(env: &Env, bps: u32) {
    if bps > BPS_DENOMINATOR as u32 {
        panic_with_error!(env, ContractError::InvalidBps);
    }
}

fn assert_positive(env: &Env, amount: i128) {
    if amount <= 0 {
        panic_with_error!(env, ContractError::InvalidAmount);
    }
}

fn checked_add(env: &Env, left: i128, right: i128) -> i128 {
    left.checked_add(right)
        .unwrap_or_else(|| panic_with_error!(env, ContractError::Overflow))
}

fn checked_sub(env: &Env, left: i128, right: i128) -> i128 {
    left.checked_sub(right)
        .unwrap_or_else(|| panic_with_error!(env, ContractError::Overflow))
}

fn checked_mul_div(env: &Env, amount: i128, multiplier: i128, divisor: i128) -> i128 {
    if divisor == 0 {
        panic_with_error!(env, ContractError::InvalidAmount);
    }

    amount
        .checked_mul(multiplier)
        .and_then(|value| value.checked_div(divisor))
        .unwrap_or_else(|| panic_with_error!(env, ContractError::Overflow))
}

fn calc_bps_amount(env: &Env, amount: i128, bps: u32) -> i128 {
    checked_mul_div(env, amount, bps as i128, BPS_DENOMINATOR)
}

fn default_pool_state() -> PoolState {
    PoolState {
        total_liquidity: 0,
        total_shares: 0,
        reward_reserve: 0,
        collected_fees: 0,
        payment_count: 0,
    }
}

fn as_muxed_address(env: &Env, address: &Address) -> MuxedAddress {
    MuxedAddress::try_from_val(env, &address.to_val())
        .unwrap_or_else(|_| panic_with_error!(env, ContractError::Overflow))
}

fn bump_instance_ttl(env: &Env) {
    env.storage()
        .instance()
        .extend_ttl(INSTANCE_TTL_THRESHOLD, INSTANCE_TTL_BUMP);
}

#[cfg(test)]
mod test {
    use super::*;
    use soroban_sdk::testutils::Address as _;
    use soroban_sdk::{token, Address, Env, String};
    use stellar_strkey::{ed25519, Strkey};

    fn random_address(env: &Env, seed: u8) -> Address {
        let mut bytes = [0u8; 32];
        bytes[0] = seed;
        let strkey = Strkey::PublicKeyEd25519(ed25519::PublicKey(bytes)).to_string();
        Address::from_str(env, &strkey)
    }

    #[test]
    fn last_payment_is_none_before_set() {
        let env = Env::default();
        let contract_id = env.register(Contract, ());
        let client = ContractClient::new(&env, &contract_id);

        assert!(client.last_payment().is_none());
    }

    #[test]
    fn set_and_read_payment_roundtrip() {
        let env = Env::default();
        let contract_id = env.register(Contract, ());
        let client = ContractClient::new(&env, &contract_id);
        let destination = random_address(&env, 5);
        let memo = String::from_str(&env, "test memo");

        client.set_last_payment(&destination, &10, &memo);

        let stored = client.last_payment().expect("payment not stored");
        assert_eq!(stored.to, destination);
        assert_eq!(stored.amount, 10);
        assert_eq!(stored.memo, memo);
    }

    #[test]
    fn token_payment_and_liquidity_flow() {
        let env = Env::default();
        env.mock_all_auths();

        let admin = Address::generate(&env);
        let payer = Address::generate(&env);
        let provider = Address::generate(&env);
        let recipient = Address::generate(&env);
        let token_contract = env.register_stellar_asset_contract_v2(admin.clone());
        let token_admin = token::StellarAssetClient::new(&env, &token_contract.address());
        let token_client = token::TokenClient::new(&env, &token_contract.address());

        token_admin.mint(&payer, &200_000);
        token_admin.mint(&provider, &150_000);
        token_admin.mint(&admin, &20_000);

        let contract_id = env.register(Contract, ());
        let client = ContractClient::new(&env, &contract_id);

        client.initialize(&admin, &token_contract.address(), &100, &500);
        client.fund_reward_pool(&admin, &10_000);
        client.add_liquidity(&provider, &100_000);

        let record =
            client.settle_token_payment(&payer, &recipient, &10_000, &String::from_str(&env, "invoice-42"));

        assert_eq!(record.id, 1);
        assert_eq!(record.amount, 10_000);
        assert_eq!(record.fee_amount, 100);
        assert_eq!(record.reward_points, 500);
        assert_eq!(token_client.balance(&recipient), 9_900);

        let pool = client.pool_state();
        assert_eq!(pool.total_liquidity, 100_100);
        assert_eq!(pool.reward_reserve, 10_000);
        assert_eq!(pool.collected_fees, 100);

        let provider_position = client.provider_position(&provider);
        assert_eq!(provider_position.redeemable_amount, 100_100);
        assert_eq!(client.reward_points(&payer), 500);

        let claimed = client.claim_rewards(&payer);
        assert_eq!(claimed, 500);
        assert_eq!(client.reward_points(&payer), 0);
        assert_eq!(token_client.balance(&payer), 190_500);

        let withdrawn_position = client.remove_liquidity(&provider, &provider_position.shares);
        assert_eq!(withdrawn_position.shares, 0);
        assert_eq!(token_client.balance(&provider), 150_100);

        let payments = client.recent_payments(&5);
        assert_eq!(payments.len(), 1);
        assert_eq!(payments.get_unchecked(0).memo, String::from_str(&env, "invoice-42"));
    }
}
