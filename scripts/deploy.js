const hre = require("hardhat");

async function main() {
  console.log("🚀 Deploying GCoin...");

  const GCoin = await hre.ethers.getContractFactory("GCoin");
  const gcoin = await GCoin.deploy();

  await gcoin.deployed();

  console.log("✅ GCoin deployed to:", gcoin.address);
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});