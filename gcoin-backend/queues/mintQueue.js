const { Queue } = require('bullmq');
const connection = require('../config/redis');

const mintQueue = new Queue('mintQueue', { connection });

module.exports = mintQueue;