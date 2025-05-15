const { callLLM } = require('../utils/openRouterClient');

async function runFinancialExpertAgent({ userPrompt, data }) {
  const systemMessage = {
    role: 'system',
    content: `
You are a financial expert assistant.

You will receive:
- A user prompt about one or more companies' financials
- A list of financial data blobs, each with:
  - ticker
  - year
  - statement_type
  - data: a dictionary of field name → value

Your job is to:
1. If the user asks for a **visualization, chart, trend, or comparison**, return type "graph" with an appropriate high-level instruction.
2. If the requested metric can be directly extracted from the data, return type "direct_answer" with values.
3. If it requires calculation, return type "instruction" with a complete formula in natural language (not math notation).

🧠 For "graph" type, respond like:
{
  "type": "graph",
  "instruction": "Plot the trend of Net Income from 2020 to 2024 for each company"
}

📘 For direct metric:
{
  "type": "direct_answer",
  "key": "Net Income",
  "values": [
    { "ticker": "AAPL", "year": "2023", "value": 96995000 },
    { "ticker": "GOOG", "year": "2023", "value": 73795000 }
  ],
  "message": "The net income in 2023 is $96.9B for Apple and $73.8B for Google."
}

📐 For derived metric:
{
  "type": "instruction",
  "instruction": "Calculate the quick ratio for each company using the formula: (Cash + Receivables) / Current Liabilities"
}

✅ Always match field names to the ones present in the data
✅ NEVER invent companies, fields, or formulas
✅ Return clean, parseable JSON only
❌ No markdown or prose explanations
`
  };

  const userMessage = {
    role: 'user',
    content: `
User Prompt:
${userPrompt}

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

    return JSON.parse(cleaned);
  } catch (err) {
    console.error('❌ Financial Expert Agent - Failed to parse:', response);
    return null;
  }
}

module.exports = { runFinancialExpertAgent };
