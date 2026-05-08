# TeQoin Send-Loop on Android (Termux)

Tutorial lengkap untuk menjalankan TeQoin send-loop script di Android menggunakan Termux.

## Prerequisites

### 1. Install Termux
- Download dari [F-Droid](https://f-droid.org/packages/com.termux/) (recommended) atau [Google Play](https://play.google.com/store/apps/details?id=com.termux)
- Buka Termux dan jalankan setup dasar

### 2. Update dan Install Dependencies

```bash
# Update package list
apt update && apt upgrade -y

# Install Node.js dan npm
apt install -y nodejs npm

# Install git dan curl
apt install -y git curl

# Verify installations
node --version
npm --version
```

**Expected Output:**
```
v18.x.x atau lebih tinggi
npm 9.x.x atau lebih tinggi
```

### 3. Setup Storage Access (PENTING)

```bash
# Request storage permission
termux-setup-storage

# Verify
ls -la ~/storage/
```

Pastikan bisa akses `~/storage/documents` atau folder lain.

---

## Step-by-Step Setup

### Step 1: Clone Repository

```bash
# Navigate ke storage
cd ~/storage/documents

# Clone TeQoin repo
git clone https://github.com/Rifqi-Ai/TeQoin-Test.git

# Enter directory
cd TeQoin-Test
```

### Step 2: Install Dependencies

```bash
# Navigate ke hardhat directory
cd dev/hardhat

# Install npm packages (ini agak lama, sabar)
npm install
```

⏱️ **Catatan**: Install bisa 5-10 menit di Android karena keterbatasan hardware.

### Step 3: Configure Environment

```bash
# Copy .env.example ke .env
cp .env.example .env

# Edit .env dengan nano
nano .env
```

**Ganti nilai-nilai ini:**

```env
# Wallet A - Private Key (pengirim pertama)
# ⚠️ JANGAN SHARE PRIVATE KEY!
PRIVATE_KEY=YOUR_WALLET_A_PRIVATE_KEY_HERE

# Wallet B - Private Key (pengirim kedua)
# ⚠️ JANGAN SHARE PRIVATE KEY!
SECOND_PRIVATE_KEY=YOUR_WALLET_B_PRIVATE_KEY_HERE

# Berapa transaction mau dikirim (default: 10)
SEND_ITERATIONS=10

# Jumlah ETH per transaction (dalam ETH)
SEND_AMOUNT_ETH=0.001

# Wallet addresses (optional, untuk validation)
WALLET_A_ADDRESS=0xYourWalletAAddressHere
WALLET_B_ADDRESS=0xYourWalletBAddressHere

# Hardhat Network Config
HARDHAT_NETWORK=teqoin
```

**How to edit in nano:**
1. Navigasi dengan arrow keys
2. Edit nilai yang mau diganti
3. Tekan `Ctrl+X` → `Y` → `Enter` untuk save

### Step 4: Compile Smart Contract

```bash
# From dev/hardhat directory
npm run compile
```

**Expected Output:**
```
> teqoin-test@1.0.0 compile
> hardhat compile
Compiling 1 file with 0.8.20
Compilation successful
```

### Step 5: Run Send-Loop

**Opsi A: Jalankan script langsung dengan npx**

```bash
npx hardhat run scripts/multi-bridge.js --network teqoin
```

**Opsi B: Gunakan batch command (jika ada PowerShell)**

Kalau pake Termux, PowerShell batch file tidak bisa. Gunakan opsi A.

### Step 6: Monitor Transactions

Script akan output seperti ini:

```
Starting send loop...
Iteration 1/10: Wallet A sending 0.001 ETH to Wallet B
  TX Hash: 0x1234...
  Block: 1523476
  Confirmed: ✓

Iteration 2/10: Wallet B sending 0.001 ETH to Wallet A
  TX Hash: 0x5678...
  Block: 1523477
  Confirmed: ✓

... (total 10 transactions)

All 10 transactions completed successfully!
```

---

## Troubleshooting

### Issue: "Node.js not found"
```bash
# Reinstall Node.js
apt remove -y nodejs npm
apt install -y nodejs npm
```

### Issue: "npm ERR! not ok code undefined"
```bash
# Clear npm cache
npm cache clean --force

# Try install again
npm install
```

### Issue: "Module not found: ethers"
```bash
# Make sure you're in dev/hardhat directory
cd dev/hardhat

# Reinstall dependencies
rm -rf node_modules package-lock.json
npm install
```

### Issue: "Connection refused / RPC error"
```
Pastikan:
1. Device memiliki internet connection aktif
2. TeQoin RPC (https://rpc.teqoin.io) dapat diakses
3. Private key benar dan wallet punya ETH balance
```

Cek balance dengan Etherscan: https://teqoin.blockscout.com

### Issue: "Insufficient gas / Transaction failed"
```
Pastikan wallet punya ETH balance minimal untuk:
- SEND_ITERATIONS × SEND_AMOUNT_ETH + gas fees
- Default: 10 × 0.001 ETH = 0.01 ETH (+ gas ~0.002 ETH)
- Recommend: minimum 0.015 ETH per wallet
```

### Issue: Storage not accessible
```bash
# Request storage permission lagi
termux-setup-storage

# Atau akses dari output folder
cd /sdcard/Download
```

---

## Performance Notes

- **Execution Time**: 10 transactions biasanya selesai dalam 2-3 menit
- **Network**: Menggunakan TeQoin L2 testnet (Chain ID 420377)
- **Gas**: Relatif murah di testnet, kira-kira 0.0002 ETH per tx

## Advanced: Custom Configuration

### Ubah jumlah transaction

Edit `.env`:
```env
SEND_ITERATIONS=100  # Kirim 100 transactions
SEND_AMOUNT_ETH=0.0001  # Lebih kecil untuk test
```

### Gunakan wallet berbeda

Edit `.env` dengan private keys milik Anda sendiri:
```env
PRIVATE_KEY=your_wallet_a_private_key_64_hex_chars
SECOND_PRIVATE_KEY=your_wallet_b_private_key_64_hex_chars
```

**⚠️ CRITICAL SECURITY WARNING**: 
- **JANGAN PERNAH share private key ke siapa pun**
- **JANGAN upload `.env` ke GitHub** (sudah di `.gitignore`, pastikan tidak di-commit)
- **Gunakan HANYA testnet wallet**, bukan mainnet
- Private keys di `.env` lokal, bukan di repo
- Kalau kunci ter-expose, segera move funds ke wallet baru

---

## Next Steps

1. ✅ Clone repo
2. ✅ Install dependencies
3. ✅ Configure .env
4. ✅ Run send-loop
5. (Optional) Modifikasi script untuk custom logic
6. (Optional) Deploy smart contract sendiri

---

## Quick Reference

```bash
# Navigate to project
cd ~/storage/documents/TeQoin-Test/dev/hardhat

# View logs
cat .logs (if available)

# Check wallet balance
npx hardhat run scripts/check-balance.js --network teqoin

# Run with custom iterations (via env override)
SEND_ITERATIONS=5 npx hardhat run scripts/multi-bridge.js --network teqoin
```

---

## Support

Jika ada error atau pertanyaan:
1. Cek troubleshooting section di atas
2. Verify `.env` configuration
3. Ensure internet connection stabil
4. Check TeQoin RPC status: https://rpc.teqoin.io

---

**Last Updated**: May 2026  
**Tested On**: Termux v0.118.0+, Node.js v18+, Android 11+
