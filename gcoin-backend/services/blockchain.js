const { ethers } = require('ethers');
const dotenv = require('dotenv');
const fs = require('fs');
const path = require('path');

dotenv.config();

class BlockchainService {
  constructor() {
    this.provider = null;
    this.wallet = null;
    this.contract = null;
    this.initialized = false;
  }

  async initialize() {
    try {
      if (this.initialized) return;


      // Initialize provider
      this.provider = new ethers.JsonRpcProvider(process.env.RPC_URL);
      console.log('✅ Web3 Provider initialized');

      // Initialize wallet
      this.wallet = new ethers.Wallet(process.env.PRIVATE_KEY, this.provider);
      console.log(`🔑 Wallet address: ${this.wallet.address}`);

      // Load ABI
      const abiPath = path.join(__dirname, '..', 'abi.json');
      const abi = JSON.parse(fs.readFileSync(abiPath, 'utf8'));

      // Initialize contract
      this.contract = new ethers.Contract(
        process.env.CONTRACT_ADDRESS,
        abi,
        this.wallet
      );
      console.log(`📜 Contract address: ${process.env.CONTRACT_ADDRESS}`);

      // Test connection
      const network = await this.provider.getNetwork();
      console.log(`⛓️ Network: ${network.name} (chainId: ${network.chainId})`);

      this.initialized = true;
    } catch (error) {
      console.error('❌ Blockchain initialization error:', error.message);
      throw error;
    }
  }

async getDecimals() {
  await this.initialize();
  return await this.contract.decimals();
}

  async getBalance(address) {
  await this.initialize();
  try {
    const balance = await this.contract.balanceOf(address);
    const decimals = await this.getDecimals();

    return ethers.formatUnits(balance, decimals);
  } catch (error) {
    console.error('Error getting balance:', error);
    throw error;
  }
}

  async mintTokens(toAddress, amount, orderId) {
    await this.initialize();
    try {
      const decimals = await this.getDecimals();
      const amountInWei = ethers.parseUnits(amount.toString(), decimals);

      console.log(`🪙 Minting ${amount} GCoin to ${toAddress}...`);
      
      const tx = await this.contract.mint(toAddress, amountInWei, orderId);
      console.log(`⏳ Transaction sent: ${tx.hash}`);
       if (!tx.hash) throw new Error("Mint transaction failed");
      const receipt = await tx.wait();
      console.log(`✅ Minting confirmed in block ${receipt.blockNumber}`);
      
      return {
        success: true,
        txHash: receipt.transactionHash,
        blockNumber: receipt.blockNumber
      };
    } catch (error) {
      console.error('Error minting tokens:', error);
      throw error;
    }
  }

  async burnTokens(fromAddress, amount) {
  await this.initialize();

  try {
    const decimals = await this.getDecimals();
    const amountInWei = ethers.parseUnits(amount.toString(), decimals);

    console.log(`🔥 Burning ${amount} GCoin from ${fromAddress}...`);

    const balance = await this.contract.balanceOf(fromAddress);

    if (balance < amountInWei) {
      throw new Error(
        `Insufficient balance. Has: ${ethers.formatUnits(balance, decimals)}, Needs: ${amount}`
      );
    }

    const tx = await this.contract.burnFrom(fromAddress, amountInWei);

    if (!tx.hash) throw new Error("Burn transaction failed");

    const receipt = await tx.wait();

    return {
      success: true,
      txHash: receipt.transactionHash
    };

  } catch (error) {
    console.error('Error burning tokens:', error);
    throw error;
  }
}
  async getTransactionReceipt(txHash) {
    await this.initialize();
    try {
      const receipt = await this.provider.getTransactionReceipt(txHash);
      return receipt;
    } catch (error) {
      console.error('Error getting transaction receipt:', error);
      throw error;
    }
  }

  async estimateGas(method, ...args) {
    await this.initialize();
    try {
      const gasEstimate = await this.contract[method].estimateGas(...args);
      return gasEstimate;
    } catch (error) {
      console.error('Error estimating gas:', error);
      throw error;
    }
  }
}

// Export singleton instance
const blockchainService = new BlockchainService();
module.exports = blockchainService;