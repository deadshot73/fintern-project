const axios = require('axios');

const BASE_URL = 'http://localhost:5000/api/companies'; // Your backend base

async function fetchFinancialData({ ticker, statement_type, year }) {
  try {
    const url = `${BASE_URL}/${ticker}/${statement_type}/${year}`;
    const res = await axios.get(url);

    return {
      ticker,
      year,
      statement_type,
      data: res.data.data  // access `data` inside the response explicitly
    };
  } catch (err) {
    console.error(`❌ Data Fetcher error for ${ticker} ${statement_type} ${year}:`, err.response?.data || err.message);
    return null;
  }
}

async function fetchMultipleFinancialData(mappingArray) {
  const results = await Promise.all(
    mappingArray.map(item => fetchFinancialData(item))
  );

  // Only return valid results with data
  return results.filter(item => item && item.data);
}

module.exports = { fetchFinancialData, fetchMultipleFinancialData };
