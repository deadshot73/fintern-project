const { callLLM } = require('../utils/openRouterClient');

async function runCompanyIdentifierAgent(prompt) {
  const systemMessage = {
    role: 'system',
    content: `
You are a financial expert metadata extractor.

🎯 Your job is to read a user's financial question and return an array of metadata objects that identify which company financial statements are needed to solve the query.

✅ Output Format:
{
  "mapping": [
    {
      "ticker": "AAPL",
      "year": "2023",
      "statement_type": "income"
    },
    {
      "ticker": "GOOG",
      "year": "2023",
      "statement_type": "income"
    }
  ]
}

✅ Rules for statement_type (infer based on the question):
- Use "income" for: revenue, earnings, profit, expenses, EPS, operating income, net income, etc.
- Use "balance" for: assets, liabilities, equity, debt, working capital, current ratio, etc.
- Use "cashflow" for: free cash flow, cash from operations/investing/financing

📌 Each entry should be uniquely defined by:
- One company ticker (e.g. AAPL, MSFT)
- One fiscal year (e.g. 2022, 2023)
- One statement type ("income", "balance", "cashflow")

❌ Do NOT include explanations.
❌ Do NOT include null values.
✅ Only return valid JSON using the format above.
`
  };

  const userMessage = {
    role: 'user',
    content: prompt
  };

  const response = await callLLM({
    messages: [systemMessage, userMessage],
    model: 'deepseek/deepseek-chat-v3-0324', // use deepseek for better structure
    temperature: 0
  });

  try {
    const cleaned = response
      .replace(/```json/g, '')
      .replace(/```/g, '')
      .trim();

    const parsed = JSON.parse(cleaned);
    return parsed;
  } catch (err) {
    console.error('❌ Failed to parse Identifier Agent output:', response);
    return null;
  }
}

module.exports = { runCompanyIdentifierAgent };
