const { ethers } = require("hardhat");
require("dotenv").config();

const TEQOIN_CHAIN_ID = 420377n;
const TEQOIN_RPC_URL = process.env.TEQOIN_RPC_URL || "https://rpc.teqoin.io";
const PRIVATE_KEY = process.env.PRIVATE_KEY;
const SECOND_PRIVATE_KEY = process.env.SECOND_PRIVATE_KEY || process.env.WALLET_B_PRIVATE_KEY;
const WALLET_A_ADDRESS = process.env.WALLET_A_ADDRESS || "";
const WALLET_B_ADDRESS = process.env.WALLET_B_ADDRESS || "";
const SEND_AMOUNT_ETH = process.env.SEND_AMOUNT_ETH || process.env.BRIDGE_AMOUNT || process.env.BRIDGE_ETH_L2_TO_L1 || "0.001";
const SEND_ITERATIONS = parseInt(process.env.SEND_ITERATIONS || process.env.BRIDGE_ITERATIONS || "10", 10);

function isPlaceholder(value) {
  if (!value) return true;
  const trimmed = value.trim();
  return trimmed.length === 0 || trimmed.startsWith("<");
}

function readAddress(value, label) {
  if (isPlaceholder(value)) return null;
  if (!ethers.isAddress(value)) {
    throw new Error(`${label} must be a valid 20-byte address`);
  }
  return ethers.getAddress(value);
}

function asWei(amountEth) {
  if (!amountEth || Number(amountEth) <= 0) return 0n;
  return ethers.parseEther(amountEth);
}

async function assertChain(provider, expectedChainId, label) {
  const network = await provider.getNetwork();
  if (network.chainId !== expectedChainId) {
    throw new Error(`${label} chain id mismatch. Expected ${expectedChainId}, got ${network.chainId}`);
  }
}

async function estimateTransferCostWei(provider) {
  const feeData = await provider.getFeeData();
  const gasPrice = feeData.maxFeePerGas ?? feeData.gasPrice ?? 0n;
  return 21000n * gasPrice;
}

async function main() {
  if (!PRIVATE_KEY) {
    throw new Error("PRIVATE_KEY is required in .env");
  }

  if (SEND_ITERATIONS > 1 && !SECOND_PRIVATE_KEY) {
    throw new Error("SECOND_PRIVATE_KEY is required for alternating two-way sends when SEND_ITERATIONS > 1");
  }

  const provider = new ethers.JsonRpcProvider(TEQOIN_RPC_URL);
  await assertChain(provider, TEQOIN_CHAIN_ID, "TeQoin RPC");

  const walletA = new ethers.Wallet(PRIVATE_KEY, provider);
  const walletB = SECOND_PRIVATE_KEY ? new ethers.Wallet(SECOND_PRIVATE_KEY, provider) : null;

  const derivedWalletA = ethers.getAddress(await walletA.getAddress());
  const derivedWalletB = walletB ? ethers.getAddress(await walletB.getAddress()) : null;

  const walletAAddress = readAddress(WALLET_A_ADDRESS, "WALLET_A_ADDRESS") || derivedWalletA;
  const walletBAddress = readAddress(WALLET_B_ADDRESS, "WALLET_B_ADDRESS") || derivedWalletB;

  if (walletAAddress !== derivedWalletA) {
    throw new Error(`WALLET_A_ADDRESS does not match the address derived from PRIVATE_KEY (${derivedWalletA})`);
  }

  if (walletB && walletBAddress !== derivedWalletB) {
    throw new Error(`WALLET_B_ADDRESS does not match the address derived from SECOND_PRIVATE_KEY (${derivedWalletB})`);
  }

  if (!walletBAddress) {
    throw new Error("WALLET_B_ADDRESS (or a SECOND_PRIVATE_KEY that derives one) is required for reverse sends");
  }

  const sendAmountWei = asWei(SEND_AMOUNT_ETH);
  if (sendAmountWei <= 0n) {
    throw new Error("SEND_AMOUNT_ETH must be greater than 0");
  }

  console.log("==============================================");
  console.log("TeQoin Wallet A ↔ Wallet B Native Send Loop");
  console.log(`Executing ${SEND_ITERATIONS} send transactions (alternating directions)`);
  console.log("==============================================");
  console.log(`Wallet A: ${walletAAddress}`);
  console.log(`Wallet B: ${walletBAddress}`);
  console.log(`Amount per tx: ${SEND_AMOUNT_ETH} ETH`);

  const totalA = Math.ceil(SEND_ITERATIONS / 2);
  const totalB = Math.floor(SEND_ITERATIONS / 2);
  console.log(`Planned sends: A→B ${totalA} tx, B→A ${totalB} tx`);

  const txHashes = [];

  console.log(`\nStarting ${SEND_ITERATIONS} alternating send transactions...`);
  for (let i = 1; i <= SEND_ITERATIONS; i++) {
    const direction = i % 2 === 1 ? "A→B" : "B→A";
    const sender = i % 2 === 1 ? walletA : walletB;
    const senderAddress = i % 2 === 1 ? walletAAddress : walletBAddress;
    const recipientAddress = i % 2 === 1 ? walletBAddress : walletAAddress;

    if (!sender) {
      throw new Error(`Missing wallet for ${direction}. Provide SECOND_PRIVATE_KEY for reverse sends.`);
    }

    try {
      console.log(`\n[${i}/${SEND_ITERATIONS}] Sending ${SEND_AMOUNT_ETH} ETH (${direction})...`);
      const balance = await provider.getBalance(senderAddress);
      const gasReserve = await estimateTransferCostWei(provider);
      const required = sendAmountWei + gasReserve;

      if (balance < required) {
        throw new Error(`Insufficient balance for ${direction}. Need at least ${ethers.formatEther(required)} ETH, have ${ethers.formatEther(balance)} ETH`);
      }

      const tx = await sender.sendTransaction({ to: recipientAddress, value: sendAmountWei });
      console.log(`  TX: ${tx.hash}`);
      const rcpt = await tx.wait();
      console.log(`  ✓ Confirmed in block ${rcpt.blockNumber}`);
      txHashes.push({ iteration: i, direction, hash: tx.hash, amount: SEND_AMOUNT_ETH });
    } catch (err) {
      console.error(`  ✗ Iteration ${i} failed: ${err.message}`);
      txHashes.push({ iteration: i, direction, hash: null, amount: SEND_AMOUNT_ETH, error: err.message });
    }
  }

  console.log("\n================ Summary ================");
  console.log(`Total iterations: ${SEND_ITERATIONS}`);
  const successful = txHashes.filter((tx) => tx.hash);
  console.log(`Successful sends: ${successful.length}/${SEND_ITERATIONS}`);
  for (let i = 0; i < txHashes.length; i++) {
    const tx = txHashes[i];
    if (tx.hash) {
      console.log(`  [${tx.iteration}] ${tx.direction} ${tx.amount} ETH -> ${tx.hash}`);
    } else {
      console.log(`  [${tx.iteration}] ${tx.direction} FAILED: ${tx.error}`);
    }
  }
  console.log("Total send transactions submitted:", successful.length);
}

main().catch((err) => {
  console.error("Send loop failed:", err.message);
  process.exitCode = 1;
});
