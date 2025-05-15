const express = require('express');
const router = express.Router();

const FinancialIncome = require('../models/financials/IncomeStatement');
const FinancialBalance = require('../models/financials/BalanceSheet');
const FinancialCashflow = require('../models/financials/CashFlowStatement');

const modelMap = {
  income: FinancialIncome,
  balance: FinancialBalance,
  cashflow: FinancialCashflow
};

// GET financials
router.get('/:ticker/:statement/:year', async (req, res) => {
  const { ticker, statement, year } = req.params;
  const Model = modelMap[statement];
  if (!Model) return res.status(400).json({ error: 'Invalid statement type' });

  const doc = await Model.findOne({ ticker: ticker.toUpperCase(), year });
  if (!doc) return res.status(404).json({ error: 'Data not found' });
  res.json(doc);
});

// CREATE or UPDATE financials
router.post('/:ticker/:statement/:year', async (req, res) => {
  const { ticker, statement, year } = req.params;
  const data = req.body.data;
  const Model = modelMap[statement];
  if (!Model) return res.status(400).json({ error: 'Invalid statement type' });

  const doc = await Model.findOneAndUpdate(
    { ticker: ticker.toUpperCase(), year },
    { data, ticker: ticker.toUpperCase(), year },
    { upsert: true, new: true }
  );
  res.json(doc);
});

// DELETE financials
router.delete('/:ticker/:statement/:year', async (req, res) => {
  const { ticker, statement, year } = req.params;
  const Model = modelMap[statement];
  if (!Model) return res.status(400).json({ error: 'Invalid statement type' });

  const result = await Model.findOneAndDelete({ ticker: ticker.toUpperCase(), year });
  if (!result) return res.status(404).json({ error: 'Record not found' });
  res.json({ message: 'Deleted' });
});

module.exports = router;
