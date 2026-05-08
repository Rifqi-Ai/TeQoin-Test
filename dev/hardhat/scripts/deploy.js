const { ethers } = require("hardhat");
const fs = require("fs");
const path = require("path");

async function main() {
  const [deployer] = await ethers.getSigners();

  console.log("Deployer:", deployer.address);
  console.log("Balance:", (await ethers.provider.getBalance(deployer.address)).toString());

  const Counter = await ethers.getContractFactory("Counter");
  const counter = await Counter.deploy();
  await counter.waitForDeployment();

  const address = await counter.getAddress();
  console.log("Counter deployed to:", address);
  console.log("TX hash:", counter.deploymentTransaction().hash);

  const outDir = path.join(__dirname, "..", "deployments");
  fs.mkdirSync(outDir, { recursive: true });
  const outFile = path.join(outDir, "latest-counter.json");
  fs.writeFileSync(outFile, JSON.stringify({ address, txHash: counter.deploymentTransaction().hash, deployedAt: new Date().toISOString() }, null, 2));
  console.log("Saved deployment info:", outFile);
}

main().catch((err) => {
  console.error(err);
  process.exitCode = 1;
});
