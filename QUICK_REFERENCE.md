# TeQoin Bridge Orchestration - Quick Reference

## 🚀 One-Line Commands

```powershell
# Full orchestration: compile → 10x bridge → deploy → test
pwsh -File .\explore-teqoin-testnet.ps1 -Dev full

# Just 10x bridge loop
pwsh -File .\explore-teqoin-testnet.ps1 -Dev bridge-all

# Single bridge transaction
pwsh -File .\explore-teqoin-testnet.ps1 -Dev bridge

# Deploy Counter contract
pwsh -File .\explore-teqoin-testnet.ps1 -Dev deploy

# Run smoke tests on deployed Counter
pwsh -File .\explore-teqoin-testnet.ps1 -Dev tx-smoke

# Check RPC + User checklist (no transactions)
pwsh -File .\explore-teqoin-testnet.ps1
```

## ⚙️ Configuration (.env)

```env
PRIVATE_KEY=<your_64_hex_chars_no_0x>     # Wallet private key
BRIDGE_ETH_L2_TO_L1=0.001                  # Amount per iteration
BRIDGE_ITERATIONS=10                       # Number of loop iterations
BRIDGE_ASSETS=ETH,USDC,USDT,DAI           # Assets to attempt
```

## 📊 Expected Output (-Dev full)

```
[1/10] Bridging 0.001 ETH (L2→L1)...
  TX: 0x60c3740cabccf42923f517fa78a8b2cddf0bfaa4bf6a9fb09cc9956ab13b57fc
  ✓ Confirmed in block 1469059

[2/10] Bridging 0.001 ETH (L2→L1)...
  TX: 0x22feefe9b964f633669c8ded80048e2b4563361f6b689fbf0357c772541c171d
  ✓ Confirmed in block 1469060

... [3-9] ...

[10/10] Bridging 0.001 ETH (L2→L1)...
  TX: 0x43aa4362d9657809e4b7b046c01c1b9e7322a4c3eb5ae235e2ef0693a88595e9
  ✓ Confirmed in block 1469072

Successful bridges: 10/10

Counter deployed to: 0xDE4526DAe39b1796885B4aa84F78e11142AE929D
TX hash: 0x207718ac6e1e5ef5f0b23e439f4089f4684b9d4f3779c74b3e732db37f8d570f

increment tx: 0xe49b33b1f1e814ddd35673759f20bc3eb54f4d81b96b8c249d953fc9f6fb25d8
setNumber(42) tx: 0x9209e58eac3b7506a7c59f110e26c139155892e7fa6bcca51e64cdb96635a54c
number() after: 42
```

## 🔗 Network Info

- **Chain ID**: 420377 (TeQoin testnet)
- **RPC**: https://rpc.teqoin.io
- **Fallback RPC**: https://rpc-backup.teqoin.io
- **Explorer**: https://testnet-blockscan.teqoin.io
- **Faucet**: https://faucet.teqoin.io

## 📋 On-Chain Operations

| Command | Operations | Count |
|---------|------------|-------|
| `-Dev bridge` | Single L2→L1 bridge | 1 tx |
| `-Dev bridge-all` | 10x L2→L1 bridges | 10 tx |
| `-Dev deploy` | Deploy Counter | 1 tx |
| `-Dev tx-smoke` | increment + setNumber | 2 tx |
| `-Dev full` | All of above | 13 tx |

## ⏱️ Timeline

- **L2→L1 Bridge**: Submitted immediately, confirmed in ~1-2 blocks (~13 seconds)
- **L1 Finalization**: Requires 7-day challenge period (standard OP Stack)
- **Full Command Runtime**: ~30-60 seconds (including 10 bridge iterations)

## 🐛 Troubleshooting

**Problem**: "missing revert data" error  
**Solution**: This was L1→L2 bridge trying to use Mainnet contract on Sepolia. Feature is now disabled (unidirectional L2→L1 only).

**Problem**: "Insufficient L2 balance"  
**Solution**: Request testnet ETH from faucet: https://faucet.teqoin.io

**Problem**: RPC connection timeout  
**Solution**: Automatic fallback to `rpc-backup.teqoin.io` is triggered. Check network connectivity.

## 📚 Files

- **Main Script**: `explore-teqoin-testnet.ps1` (PowerShell orchestrator)
- **Bridge Loop**: `dev/hardhat/scripts/multi-bridge.js` (Node.js, 10x iterations)
- **Deploy**: `dev/hardhat/scripts/deploy.js` (Hardhat deployment)
- **Smoke Test**: `dev/hardhat/scripts/tx-smoke.js` (Hardhat test tx)
- **Config**: `dev/hardhat/.env` (Runtime configuration)

## 📖 Documentation

- Full status: [ORCHESTRATION_STATUS.md](ORCHESTRATION_STATUS.md)
- Setup guide: [README.md](README.md)
- This card: [QUICK_REFERENCE.md](QUICK_REFERENCE.md)

---

**Last tested**: ✅ Full orchestration with 10x bridge loop  
**Status**: 🟢 Production-ready
