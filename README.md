# TeQoin Testnet Explorer (User + Dev)

Repo ini berisi skrip 1 command untuk eksplorasi TeQoin testnet dari sisi user dan developer.

## Quick Start

```powershell
pwsh -File .\explore-teqoin-testnet.ps1
```

## Developer Modes

```powershell
# Check RPC + checklist + compile
pwsh -File .\explore-teqoin-testnet.ps1 -Dev compile

# Single send from wallet A to wallet B
pwsh -File .\explore-teqoin-testnet.ps1 -Dev send

# Alternating send loop A ↔ B
pwsh -File .\explore-teqoin-testnet.ps1 -Dev send-all

# Deploy Counter contract
pwsh -File .\explore-teqoin-testnet.ps1 -Dev deploy

# Smoke test on Counter
pwsh -File .\explore-teqoin-testnet.ps1 -Dev tx-smoke

# Full flow: compile → send loop → deploy → smoke test
pwsh -File .\explore-teqoin-testnet.ps1 -Dev full
```

## What Changed

- `bridge` mode is now a native ETH send from wallet A to wallet B.
- `bridge-all` is now an alternating send loop between wallet A and wallet B.
- The explorer may show these transactions as `Send` because that is now the intended behavior.

## Required `.env` Values

- `PRIVATE_KEY` - private key for wallet A
- `SECOND_PRIVATE_KEY` - private key for wallet B
- `WALLET_A_ADDRESS` - optional validation address for wallet A
- `WALLET_B_ADDRESS` - optional validation address for wallet B
- `SEND_AMOUNT_ETH` - ETH per transaction
- `SEND_ITERATIONS` - number of alternating transactions

## Example Output

```text
[1/10] Sending 0.001 ETH (A→B)...
  TX: 0x...
  ✓ Confirmed in block ...

[2/10] Sending 0.001 ETH (B→A)...
  TX: 0x...
  ✓ Confirmed in block ...

Successful sends: 10/10
```

## Notes

- Wallet A is derived from `PRIVATE_KEY`.
- Wallet B needs `SECOND_PRIVATE_KEY` for the reverse direction.
- `SEND_AMOUNT_ETH` and `SEND_ITERATIONS` control how much ETH is sent and how many transactions run.
- `dev/hardhat/.env.example` contains the placeholder fields.
