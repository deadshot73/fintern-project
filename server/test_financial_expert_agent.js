require('dotenv').config();

const { runFinancialExpertAgent } = require('./agents/financialExpertAgent');

// Mocked multi-company, multi-year financial data
const financialData = [
  {
    ticker: 'AAPL',
    year: 2023,
    statement_type: 'income',
    data: {
      "Total Revenue": 383285000,
      "Cash": 2000000,
      "Receivables": 1000000,
      "Current Liabilities": 800000,
      "Net Income": 96995000
    }
  },
  {
    ticker: 'GOOG',
    year: 2023,
    statement_type: 'income',
    data: {
      "Total Revenue": 307394000,
      "Cash": 3000000,
      "Receivables": 1500000,
      "Current Liabilities": 1200000,
      "Net Income": 73795000
    }
  }
];

// Example prompts
const prompt1 = "What is the total revenue of Apple and Google in 2023?";
const prompt2 = "What is the quick ratio of Apple and Google in 2023?";

async function testExpertAgent(userPrompt) {
  console.log(`👤 Prompt: ${userPrompt}\n`);

  const expertResponse = await runFinancialExpertAgent({
    userPrompt,
    data: financialData
  });

  console.log('🧠 Expert Agent Output:\n', expertResponse);
}

(async () => {
  await testExpertAgent(prompt1);
  console.log('\n' + '='.repeat(60) + '\n');
  await testExpertAgent(prompt2);
})();
