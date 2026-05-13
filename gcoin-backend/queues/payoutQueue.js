const { Queue } = require('bullmq');
const connection = require('../config/redis');

const payoutQueue = new Queue('payoutQueue', { connection });

module.exports = payoutQueue;