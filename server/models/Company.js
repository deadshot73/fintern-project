const mongoose = require('mongoose');

const companySchema = new mongoose.Schema({
  name: String,
  ticker: String,
  sector: String,
  exchange: String,
  country: String,
});

module.exports = mongoose.model('Company', companySchema);
