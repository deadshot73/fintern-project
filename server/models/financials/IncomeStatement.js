const mongoose = require('mongoose');
module.exports = mongoose.model('IncomeStatement', new mongoose.Schema({
  ticker: String,
  year: String,
  data: Object,
}));
