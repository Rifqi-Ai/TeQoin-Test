const { ethers } = require("hardhat");
const fs = require("fs");
const path = require("path");

async function main() {
  const deploymentFile = path.join(__dirname, "..", "deployments", "latest-counter.json");
  if (!fs.existsSync(deploymentFile)) {
    throw new Error("Deployment file not found. Run -Dev deploy or -Dev full first.");
  }

  const { address } = JSON.parse(fs.readFileSync(deploymentFile, "utf8"));
  if (!address) {
    throw new Error("Invalid deployment file: missing contract address");
  }

  const [signer] = await ethers.getSigners();
  const counter = await ethers.getContractAt("Counter", address, signer);

  console.log("Counter address:", address);
  console.log("Signer:", signer.address);

  const before = await counter.number();
  console.log("number() before:", before.toString());

  const tx1 = await counter.increment();
  await tx1.wait();
  console.log("increment tx:", tx1.hash);

  const tx2 = await counter.setNumber(42);
  await tx2.wait();
  console.log("setNumber(42) tx:", tx2.hash);

  const after = await counter.number();
  console.log("number() after:", after.toString());
}

main().catch((err) => {
  console.error(err);
  process.exitCode = 1;
});
