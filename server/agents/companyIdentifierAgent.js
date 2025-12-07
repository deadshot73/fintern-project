const { callLLM } = require('../utils/bedrockClient');

async function runCompanyIdentifierAgent(prompt) {
  const systemMessage = {
    role: 'system',
    content: `
You are a financial expert metadata extractor. You MUST respond with ONLY valid JSON in the exact format specified.

🎯 Your job is to read a user's financial question and return an array of metadata objects that identify which company financial statements are needed to solve the query.

✅ Output Format (ONLY return this JSON structure):
{
  "mapping": [
    {
      "ticker": "AAPL",
      "year": "2023",
      "statement_type": "balance"
    },
    {
      "ticker": "GOOG",
      "year": "2023",
      "statement_type": "balance"
    }
  ]
}

✅ Company Ticker Mapping:
- Google = GOOG
- Apple = AAPL
- Microsoft = MSFT
- Amazon = AMZN
- Tesla = TSLA
- Meta = META
- Netflix = NFLX
- Nvidia = NVDA

✅ Rules for statement_type:
- Use "balance" for: assets, liabilities, equity, debt, debt to equity ratio, working capital, current ratio, etc.
- Use "income" for: revenue, earnings, profit, expenses, EPS, operating income, net income, etc.
- Use "cashflow" for: free cash flow, cash from operations/investing/financing

📌 Each entry should be uniquely defined by:
- One company ticker (e.g. AAPL, GOOG)
- One fiscal year (e.g. 2021, 2022, 2023, 2024)
- One statement type ("income", "balance", "cashflow")

❌ Do NOT include any explanations, questions, or prose text.
❌ Do NOT include null values.
❌ Do NOT ask for additional information.
✅ ONLY return the JSON object in the exact format above.
✅ If multiple years are mentioned, create separate entries for each year.
`
  };

  const userMessage = {
    role: 'user',
    content: `Extract company metadata from this query: ${prompt}

Return ONLY the JSON object with the mapping array. Do not include any other text or explanations.`
  };

  const response = await callLLM({
    messages: [systemMessage, userMessage],
    model: 'mistral.mixtral-8x7b-instruct-v0:1',
    temperature: 0
  });

  try {
    let cleaned = response.trim();
    
    // Remove markdown code blocks if present
    if (cleaned.startsWith('```json')) {
      cleaned = cleaned.replace(/```json\n?/, '').replace(/```\n?$/, '');
    } else if (cleaned.startsWith('```')) {
      cleaned = cleaned.replace(/```\n?/, '').replace(/```\n?$/, '');
    }
    
    // Try to extract JSON if it's mixed with other text
    const jsonMatch = cleaned.match(/\{[\s\S]*\}/);
    if (jsonMatch) {
      cleaned = jsonMatch[0];
    }
    
    // Fix escaped characters that might be in the JSON
    cleaned = cleaned.replace(/\\_/g, '_'); // Fix escaped underscores
    cleaned = cleaned.replace(/\\"/g, '"'); // Fix escaped quotes if any
    
    const parsed = JSON.parse(cleaned);
    
    // Validate the response structure
    if (!parsed.mapping || !Array.isArray(parsed.mapping)) {
      console.error('❌ Invalid response structure:', parsed);
      return null;
    }
    
    return parsed;
  } catch (err) {
    console.error('❌ Failed to parse Identifier Agent output:', response);
    console.error('❌ Parse error:', err.message);
    return null;
  }
}

module.exports = { runCompanyIdentifierAgent };
