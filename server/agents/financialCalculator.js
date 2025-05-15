const { callLLM } = require('../utils/openRouterClient');

async function runFinancialCalculator({ instruction, data }) {
  const systemMessage = {
    role: 'system',
    content: `
You are a financial calculator agent.

You will receive:
- A natural language instruction describing a financial metric (e.g., quick ratio, EPS, ROE)
- A list of financial data entries. Each entry contains:
  - ticker (e.g. AAPL)
  - year (e.g. 2023)
  - data: a JSON object of financial fields and values

🎯 Your job is to:
1. Apply the same instruction to each company's financial data
2. Compute the metric using the fields available
3. Return your output as an array of results, each tagged with its ticker and year

✅ Output format:
{
  "key": "metric_name_in_snake_case",
  "values": [
    { "ticker": "AAPL", "year": 2023, "value": 1.27 },
    { "ticker": "GOOG", "year": 2023, "value": 1.45 }
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

  const response = await callLLM({
    messages: [systemMessage, userMessage],
    model: 'deepseek/deepseek-chat-v3-0324',
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
