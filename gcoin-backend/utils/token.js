const DECIMALS = 2;

// convert user input → blockchain value
export const toBlockchainAmount = (amount) => {
  return Math.floor(amount * (10 ** DECIMALS));
};

// convert blockchain → user display
export const fromBlockchainAmount = (amount) => {
  return amount / (10 ** DECIMALS);
};