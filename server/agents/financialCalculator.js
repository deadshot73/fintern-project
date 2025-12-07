const { callLLM } = require('../utils/bedrockClient');

async function runFinancialCalculator({ instruction, data }) {
  const systemMessage = {
    role: 'system',
    content: `
You are a financial calculator agent.

You will receive:
- A natural language instruction describing a financial metric (e.g., current ratio, quick ratio, EPS, ROE)
- Financial data organized by ticker and year:
  {
    "AAPL": {
      "2021": { "Current Assets": 1000000, "Current Liabilities": 500000 },
      "2022": { "Current Assets": 1100000, "Current Liabilities": 550000 },
      "2023": { "Current Assets": 1200000, "Current Liabilities": 600000 }
    }
  }

🎯 Your job is to:
1. Apply the same instruction to each company and year's financial data
2. Compute the metric using the fields available for each year
3. Return your output as an array of results, each tagged with its ticker and year

✅ Output format:
{
  "key": "metric_name_in_snake_case",
  "values": [
    { "ticker": "AAPL", "year": 2021, "value": 2.0 },
    { "ticker": "AAPL", "year": 2022, "value": 2.0 },
    { "ticker": "AAPL", "year": 2023, "value": 2.0 }
  ]
}

✅ Only return valid JSON.
✅ Use only the fields available in each data blob.
❌ Do NOT include explanations or formulas.
❌ Do NOT include markdown or extra text.
`
  };

  const userMessage = {
    role: 'user',
    content: `
Instruction:
${instruction}

Financial Data:
${JSON.stringify(data, null, 2)}
`
  };

  console.log('🔢 FinancialCalculator Input Data:', JSON.stringify(data, null, 2));

  const response = await callLLM({
    messages: [systemMessage, userMessage],
    model: 'mistral.mixtral-8x7b-instruct-v0:1',
    temperature: 0.2
  });

  try {
    const cleaned = response
      .replace(/```json/g, '')
      .replace(/```/g, '')
      .trim();

    const parsed = JSON.parse(cleaned);

    console.log('🧾 Raw LLM response:\n', response);
    console.log('🧽 Cleaned:\n', cleaned);

    return parsed;
  } catch (err) {
    console.error('❌ Financial Calculator: Failed to parse response:', response);
    return null;
  }
}

module.exports = { runFinancialCalculator };
