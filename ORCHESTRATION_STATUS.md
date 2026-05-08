# TeQoin Send Orchestration - Status

**Status**: ✅ Native wallet-to-wallet send loop implemented

## Summary

The previous bridge flow has been replaced with direct ETH sends between two wallets:
- Wallet A -> Wallet B single send
- Alternating wallet A <-> wallet B loop
- Configurable send amount per tx
- Configurable number of transactions

## Config

Use `dev/hardhat/.env` with:
- `PRIVATE_KEY`
- `SECOND_PRIVATE_KEY`
- `WALLET_A_ADDRESS` and `WALLET_B_ADDRESS` optional placeholders
- `SEND_AMOUNT_ETH`
- `SEND_ITERATIONS`

## Modes

- `-Dev send` for one-way A -> B
- `-Dev send-all` for alternating A <-> B
- `-Dev full` for compile -> send loop -> deploy -> smoke test

## Notes

- These are normal ETH transfers, so wallet history and explorer are expected to label them as `Send`.
- `bridge` and `bridge-all` remain as aliases for compatibility.
