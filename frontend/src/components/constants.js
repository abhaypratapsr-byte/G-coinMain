// ─── Constants ─────────────────────────────────────────────────────────────────
export const CONTRACT_ADDRESS = "0xa08862c6eaBBF4a8527B1C7abd9E3FE38A2d943f"
export const RAZORPAY_KEY = "rzp_test_STwx0saGKQbjnX"
export const AMOY_CHAIN_ID = "0x13882"
export const AMOY_CHAIN_ID_DECIMAL = 80002

// Error codes
export const ERROR_CODE_USER_REJECTED = 4001
export const ERROR_CODE_CHAIN_NOT_ADDED = 4902

// Timeouts (in milliseconds)
export const PARTICLE_ANIMATION_DURATION = 1800
export const SUCCESS_MESSAGE_DURATION = 6000
export const ERROR_MESSAGE_DURATION = 3000
export const CANCEL_MESSAGE_DURATION = 3000
export const REDEEM_SUCCESS_DURATION = 3000
export const ERROR_TIMEOUT = 4000

// Network configuration
export const AMOY_NETWORK_CONFIG = {
  chainId: AMOY_CHAIN_ID,
  chainName: "Polygon Amoy Testnet",
  nativeCurrency: { name: "MATIC", symbol: "MATIC", decimals: 18 },
  rpcUrls: ["https://rpc-amoy.polygon.technology"],
  blockExplorerUrls: ["https://amoy.polygonscan.com"],
}

// Quick amount options
export const QUICK_AMOUNTS = [100, 500, 1000, 5000]
