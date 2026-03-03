#![no_std]

use soroban_sdk::{contractimpl, symbol, Address, Env, Symbol, String};

const LAST_DESTINATION: Symbol = symbol!("last_destination");
const LAST_AMOUNT: Symbol = symbol!("last_amount");
const LAST_MEMO: Symbol = symbol!("last_memo");

pub struct SimplePayment;

#[contractimpl]
impl SimplePayment {
    pub fn set_last_payment(env: Env, destination: Address, amount: i128, memo: String) {
        env.storage().set(&LAST_DESTINATION, &destination);
        env.storage().set(&LAST_AMOUNT, &amount);
        env.storage().set(&LAST_MEMO, &memo.clone());

        PaymentEvent::publish(&env, &destination, &amount, &memo);
    }

    pub fn get_last_payment(env: Env) -> Option<(Address, i128, String)> {
        let destination: Option<Address> = env.storage().get(&LAST_DESTINATION).unwrap_or(None);
        let amount: Option<i128> = env.storage().get(&LAST_AMOUNT).unwrap_or(None);
        let memo: Option<String> = env.storage().get(&LAST_MEMO).unwrap_or(None);

        destination
            .zip(amount)
            .zip(memo)
            .map(|((dest, amount), memo)| (dest, amount, memo))
    }
}

struct PaymentEvent;

impl PaymentEvent {
    fn publish(env: &Env, destination: &Address, amount: &i128, memo: &String) {
        env.events().publish(
            (symbol!("payment:set"),),
            (destination, amount, memo),
        );
    }
}

#[cfg(test)]
mod test {
    use super::*;
    use soroban_sdk::BytesN;

    fn instantiate(env: &Env) -> (Address, SimplePaymentClient) {
        let contract_id = env.register_contract(None, SimplePayment);
        let client = SimplePaymentClient::new(env, &contract_id);
        let destination = Address::from_account_id(&BytesN::from_array(env, [1u8; 32]));
        (destination, client)
    }

    #[test]
    fn stores_and_reads_payment() {
        let env = Env::default();
        let (destination, client) = instantiate(&env);
        let memo = String::from_val(&env, "test payment");
        let amount = 500i128;

        client.set_last_payment(&destination, &amount, &memo);
        let stored = client.get_last_payment();

        assert!(stored.is_some(), "Expected stored payment to exist but got None");

        let (read_destination, read_amount, read_memo) = stored.unwrap();
        assert_eq!(destination, read_destination);
        assert_eq!(amount, read_amount);
        assert_eq!(memo, read_memo);
    }
}
