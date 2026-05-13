const fs = require('fs');

function log(type, message, data = {}) {
  const logData = {
    type,
    message,
    data,
    time: new Date().toISOString()
  };

  fs.appendFileSync('logs.txt', JSON.stringify(logData) + '\n');
}

module.exports = log;