const mongoose = require('mongoose');
module.exports = mongoose.model('CashFlowStatement', new mongoose.Schema({
  ticker: String,
  year: String,
  data: Object,
}));
