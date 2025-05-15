require('dotenv').config();

const {
  fetchFinancialData,
  fetchMultipleFinancialData
} = require('./agents/dataFetcher');

// 🧪 Single company/year test
async function testSingleFetch() {
  console.log('🔹 Testing Single Company Fetch (AAPL, 2024)...\n');

  const result = await fetchFinancialData({
    ticker: 'AAPL',
    year: '2024',
    statement_type: 'income'
  });

  console.log('📦 Single Result:\n', JSON.stringify(result, null, 2));
}

// 🧪 Multiple companies/years test
async function testMultiFetch() {
  console.log('\n🔹 Testing Multiple Companies/Years Fetch...\n');

  const mappingArray = [
    { ticker: 'AAPL', year: '2022', statement_type: 'income' },
    { ticker: 'AAPL', year: '2023', statement_type: 'income' },
    { ticker: 'AAPL', year: '2024', statement_type: 'income' },
    { ticker: 'GOOG', year: '2024', statement_type: 'income' }
  ];

  const results = await fetchMultipleFinancialData(mappingArray);

  console.log('📦 Multi Result:\n', JSON.stringify(results, null, 2));
}

(async () => {
  await testSingleFetch();
  await testMultiFetch();
})();
