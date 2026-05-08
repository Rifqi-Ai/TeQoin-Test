const { ethers } = require("hardhat");
require("dotenv").config();

/**
 * Native TeQoin wallet-to-wallet send
 *
 * Prerequisites:
 * - Set PRIVATE_KEY in .env for wallet A
 * - Set WALLET_B_ADDRESS in .env for the recipient
 * - Optionally set SECOND_PRIVATE_KEY if you want wallet B to send back later
 */

const TEQOIN_RPC_URL = process.env.TEQOIN_RPC_URL || "https://rpc.teqoin.io";
const PRIVATE_KEY = process.env.PRIVATE_KEY;
const WALLET_A_ADDRESS = process.env.WALLET_A_ADDRESS || "";
const WALLET_B_ADDRESS = process.env.WALLET_B_ADDRESS || "";
const SEND_AMOUNT_ETH = process.env.SEND_AMOUNT_ETH || process.env.BRIDGE_AMOUNT || "0.01";

function normalizeAddress(value) {
  const trimmed = (value || "").trim();
  if (!trimmed || trimmed.startsWith("<")) return null;
  if (!ethers.isAddress(trimmed)) {
    throw new Error(`Invalid address: ${trimmed}`);
  }
  return ethers.getAddress(trimmed);
}

async function main() {
  if (!PRIVATE_KEY) {
    throw new Error("PRIVATE_KEY is required in .env");
  }

  const provider = new ethers.JsonRpcProvider(TEQOIN_RPC_URL);
  const signer = new ethers.Wallet(PRIVATE_KEY, provider);
  const signerAddress = ethers.getAddress(await signer.getAddress());
  const recipientAddress = normalizeAddress(WALLET_B_ADDRESS);
  const configuredSenderAddress = normalizeAddress(WALLET_A_ADDRESS) || signerAddress;

  if (!recipientAddress) {
    throw new Error("WALLET_B_ADDRESS is required for wallet-to-wallet send");
  }

  if (configuredSenderAddress !== signerAddress) {
    throw new Error(`WALLET_A_ADDRESS does not match the address derived from PRIVATE_KEY (${signerAddress})`);
  }

  console.log("===============================");
  console.log("TeQoin Wallet Send (A -> B)");
  console.log("===============================");
  console.log("Wallet A:", signerAddress);
  console.log("Wallet B:", recipientAddress);

  const balance = await provider.getBalance(signerAddress);
  console.log("Wallet A balance:", ethers.formatEther(balance), "ETH");

  const sendAmount = ethers.parseEther(SEND_AMOUNT_ETH);
  console.log("Send amount:", SEND_AMOUNT_ETH, "ETH");

  if (balance < sendAmount) {
    throw new Error(`Insufficient balance. Need ${SEND_AMOUNT_ETH} ETH, have ${ethers.formatEther(balance)} ETH`);
  }

  console.log("\nSending native ETH from wallet A to wallet B...");
  const tx = await signer.sendTransaction({
    to: recipientAddress,
    value: sendAmount,
  });

  console.log("Transaction hash:", tx.hash);
  console.log("Waiting for confirmation (~5-15 seconds)...");

  const receipt = await tx.wait();
  console.log("✅ Send transaction confirmed!");
  console.log("Block:", receipt.blockNumber);
  console.log("Gas used:", receipt.gasUsed.toString());
  console.log("Note: wallet history will show this as Send because it is a direct wallet transfer.");

  console.log("\n===============================");
  console.log("Send completed successfully!");
  console.log("===============================");
  console.log("Monitor at: https://testnet-blockscan.teqoin.io/transaction/details?tx=" + tx.hash);
}

main().catch((err) => {
  console.error("Send failed:", err.message);
  process.exitCode = 1;
});
