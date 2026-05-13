require('dotenv').config();
const IORedis = require('ioredis');

// Temporarily disable Redis connection for MVP
// const connection = new IORedis(process.env.REDIS_URL, {
//   maxRetriesPerRequest: null
// });

const connection = null; // Disabled

module.exports = connection;