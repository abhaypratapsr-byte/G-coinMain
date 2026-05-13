const hre = require("hardhat");

async function main() {
  const GCoin = await hre.ethers.getContractFactory("GCoin");

  console.log("Deploying GCoin contract...");

  const gcoin = await GCoin.deploy();

  await gcoin.deployed();

  console.log("GCoin deployed to:", gcoin.address);
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });