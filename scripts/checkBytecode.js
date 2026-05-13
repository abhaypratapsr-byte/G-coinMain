const { ethers } = require("hardhat");
async function main() {
  const onchain = await ethers.provider.getCode("YOUR_CONTRACT_ADDRESS_HERE");
  console.log("ON-CHAIN:", onchain.slice(2, 82));
}
main().catch(console.error);
