import pkg from "hardhat";

const { ethers } = pkg;

async function main() {
  const CONTRACT = "0xdED4FD10426CD1DC53d2e98b51eDbB114C638aB2";

  const NEW_OWNER = "0xA8F9f6Bc7aDc2BD0750F2a9c576823EF54aCBF71";

  console.log("Transferring ownership...");

  const gcoin = await ethers.getContractAt("GCoin", CONTRACT);

  const tx = await gcoin.transferOwnership(NEW_OWNER);

  console.log("Tx sent:", tx.hash);

  await tx.wait();

  console.log("✅ Ownership transferred");
}

main().catch(console.error);