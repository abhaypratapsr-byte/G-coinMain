import pkg from "hardhat";

const { ethers } = pkg;

async function main() {
  const contract = await ethers.getContractAt(
    "GCoin",
    "0xCcAe191Eee8EF1991179757e642e0448fA6a4c78"
  );

  const owner = await contract.owner();

  console.log("CURRENT OWNER:", owner);
}

main().catch(console.error);