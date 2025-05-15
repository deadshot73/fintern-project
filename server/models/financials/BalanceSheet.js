const mongoose = require('mongoose');
module.exports = mongoose.model('BalanceSheet', new mongoose.Schema({
  ticker: String,
  year: String,
  data: Object,
}));
