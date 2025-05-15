const express = require('express');
const router = express.Router();
const Company = require('../models/Company');

// GET company by ticker
router.get('/:ticker', async (req, res) => {
  try {
    const company = await Company.findOne({ ticker: req.params.ticker.toUpperCase() });
    if (!company) return res.status(404).json({ error: 'Company not found' });
    res.json(company);
  } catch (err) {
    res.status(500).json({ error: 'Server error' });
  }
});

// CREATE or UPDATE company
router.post('/:ticker', async (req, res) => {
  const ticker = req.params.ticker.toUpperCase();
  const data = req.body;

  try {
    const company = await Company.findOneAndUpdate(
      { ticker },
      { ...data, ticker },
      { upsert: true, new: true }
    );
    res.json(company);
  } catch (err) {
    res.status(500).json({ error: 'Failed to save company' });
  }
});

// DELETE company
router.delete('/:ticker', async (req, res) => {
  try {
    const result = await Company.findOneAndDelete({ ticker: req.params.ticker.toUpperCase() });
    if (!result) return res.status(404).json({ error: 'Company not found' });
    res.json({ message: 'Company deleted' });
  } catch (err) {
    res.status(500).json({ error: 'Server error' });
  }
});

module.exports = router;
