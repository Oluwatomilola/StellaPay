#![no_std]

use soroban_sdk::{
    Address, Env, String, contract, contractevent, contractimpl, contracttype, symbol_short,
};

#[contractevent]
#[derive(Clone, Debug, Eq, PartialEq)]
pub struct PaymentSetEvent {
    #[topic]
    pub to: Address,
    pub amount: i128,
    pub memo: String,
}

#[contracttype]
#[derive(Clone, Debug, Eq, PartialEq)]
pub struct LastPayment {
    pub to: Address,
    pub amount: i128,
    pub memo: String,
}

#[contract]
pub struct Contract;

#[contractimpl]
impl Contract {
    pub fn set_last_payment(env: Env, to: Address, amount: i128, memo: String) {
        let stored = LastPayment {
            to: to.clone(),
            amount,
            memo: memo.clone(),
        };

        env.storage()
            .persistent()
            .set(&symbol_short!("LAST_PAY"), &stored);

        PaymentSetEvent { to, amount, memo }.publish(&env);
    }

    pub fn last_payment(env: Env) -> Option<LastPayment> {
        env.storage().persistent().get(&symbol_short!("LAST_PAY"))
    }
}

#[cfg(test)]
mod test {
    use super::*;
    use soroban_sdk::{Address, Env, String};
    use stellar_strkey::{Strkey, ed25519};

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
}
