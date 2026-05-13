const axios = require("axios");

const BASE_URL = "https://sandbox.cashfree.com/payout";

const headers = {
  "x-client-id": process.env.CASHFREE_APP_ID,
  "x-client-secret": process.env.CASHFREE_SECRET_KEY,
  "x-api-version": "2025-01-01",
  "Content-Type": "application/json"
};

// Fraud check
function validate(bankDetails, amount) {
  if (amount > 50000) {
    throw new Error("High amount - manual review required");
  }

  if (!bankDetails.ifsc || bankDetails.ifsc.length < 11) {
    throw new Error("Invalid IFSC");
  }
}

async function sendPayout({ amount, bankDetails, referenceId }) {
  validate(bankDetails, amount);

  const payload = {
    beneId: bankDetails.beneId || "test_bene",
    amount,
    transferId: referenceId,
    transferMode: "banktransfer",
    source: "business"
  };

  const res = await axios.post(
    `${BASE_URL}/v1.2/requestTransfer`,
    payload,
    { headers }
  );

  return res.data;
}

module.exports = { sendPayout };