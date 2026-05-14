const { Queue } = require('bullmq');
const connection = require('../config/redis');

let payoutQueue;

if (connection) {
  payoutQueue = new Queue('payoutQueue', {
    connection
  });
} else {
  console.warn('⚠️ Redis connection is disabled. Payout queue will run in mock mode.');
  payoutQueue = {
    add: async (name, data, opts) => {
      console.log('[MockQueue] skipping queue add:', name, data, opts);
      return Promise.resolve({ id: `mock-${Date.now()}`, name, data });
    }
  };
}

module.exports = payoutQueue;