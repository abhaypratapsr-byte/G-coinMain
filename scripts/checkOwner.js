import pkg from "hardhat";

const { ethers } = pkg;

async function main() {
  const contract = await ethers.getContractAt(
    "GCoin",
    "0xdED4FD10426CD1DC53d2e98b51eDbB114C638aB2"
  );

  const owner = await contract.owner();

  console.log("CURRENT OWNER:", owner);
}

main().catch(console.error);