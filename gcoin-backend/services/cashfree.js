const axios = require("axios");

// Cashfree Payout API
const BASE_URL = "https://sandbox.cashfree.com/payout"; // change to production later

const headers = {
  "x-client-id": process.env.CASHFREE_APP_ID,
  "x-client-secret": process.env.CASHFREE_SECRET_KEY,
  "x-api-version": "2023-08-01", // ✅ use stable version
  "Content-Type": "application/json"
};
// ✅ SEND PAYOUT (USED IN YOUR WORKER)
const sendPayout = async ({ amount, bankDetails, referenceId }) => {
  try {
   const payload = {
  beneId: bankDetails.beneId || "test_bene",
  amount: amount,
  transferId: referenceId,
  transferMode: "banktransfer",
  source: "business"   
};

    const response = await axios.post(
      `${BASE_URL}/v1.2/requestTransfer`,
      payload,
      { headers }
    );

    console.log("💸 Payout Success:", response.data);

    return {
      data: response.data
    };

  } catch (error) {
    console.error("❌ Cashfree Payout Error:", error.response?.data || error.message);
    throw error;
  }
};

// ✅ EXPORT
module.exports = {
  sendPayout
};