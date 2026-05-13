require('dotenv').config();
const { ethers } = require("ethers");

const provider = new ethers.JsonRpcProvider(process.env.RPC_URL);

// Validate private key
const privateKey = process.env.PRIVATE_KEY;
if (!privateKey) {
  throw new Error("PRIVATE_KEY environment variable is not set");
}

if (privateKey === "[ REDACTED ]" || privateKey.includes("your_wallet_private_key")) {
  throw new Error("PRIVATE_KEY is set to placeholder value. Please set a valid private key in your .env file");
}

let wallet;
try {
  wallet = new ethers.Wallet(privateKey, provider);
} catch (error) {
  throw new Error(`Invalid PRIVATE_KEY format. Must be a valid hex private key (64 characters, starting with 0x). Error: ${error.message}`);
}

module.exports = wallet;