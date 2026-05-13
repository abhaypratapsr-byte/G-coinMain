const mongoose = require('mongoose');

const schema = new mongoose.Schema({
  action: String,
  user: String,
  data: Object,
  createdAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model('AuditLog', schema);