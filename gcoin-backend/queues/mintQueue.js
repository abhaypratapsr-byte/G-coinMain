const { Queue } = require('bullmq');
const connection = require('../config/redis');

let mintQueue = null;

if (connection) {
  mintQueue = new Queue('mintQueue', {
    connection,
  });

  console.log('✅ Mint Queue initialized');
} else {
  console.log('⚠️ Redis disabled. Mint Queue not initialized.');
}

module.exports = mintQueue;