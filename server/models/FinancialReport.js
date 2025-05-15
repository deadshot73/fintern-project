const mongoose = require('mongoose');

const financialReportSchema = new mongoose.Schema({
  companyId: { type: mongoose.Schema.Types.ObjectId, ref: 'Company' },
  fiscalYear: String,
  statementType: String, // 'income', 'cash_flow', 'balance'
  data: { type: Object }, // flexible structure
});

module.exports = mongoose.model('FinancialReport', financialReportSchema);
