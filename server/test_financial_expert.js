const { runFinancialExpertAgent } = require('./agents/financialExpertAgent');

async function testFinancialExpert() {
  console.log('🧪 Testing Financial Expert Agent...');
  
  const testData = [
    {
      "ticker": "AAPL",
      "year": "2022",
      "statement_type": "balance",
      "data": {
        "Total Debt": 132480000,
        "Total Equity Gross Minority Interest": 50672000
      }
    }
  ];
  
  const testQuery = "what is the debt to equity ratio of apple for 2022";
  
  try {
    const result = await runFinancialExpertAgent({
      userPrompt: testQuery,
      data: testData
    });
    console.log('✅ Result:', JSON.stringify(result, null, 2));
  } catch (error) {
    console.error('❌ Error:', error);
  }
}

testFinancialExpert();
