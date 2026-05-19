require('dotenv').config();
const IORedis = require('ioredis');

let connection = null;

if (process.env.REDIS_URL) {
  connection = new IORedis(process.env.REDIS_URL, {
    maxRetriesPerRequest: null,
  });

  connection.on('connect', () => {
    console.log('✅ Redis connected');
  });

  connection.on('error', (err) => {
    console.log('❌ Redis error:', err.message);
  });

} else {
  console.log('⚠️ Redis connection is disabled.');
}

module.exports = connection;