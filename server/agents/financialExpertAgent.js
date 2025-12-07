const { callLLM } = require('../utils/bedrockClient');

async function runFinancialExpertAgent({ userPrompt, data }) {
  const systemMessage = {
    role: 'system',
    content: `
You are a financial expert assistant. You MUST respond with ONLY valid JSON in the exact format specified.

You will receive:
- A user prompt about one or more companies' financials
- A list of financial data blobs, each with:
  - ticker
  - year
  - statement_type
  - data: a dictionary of field name → value

Your job is to analyze the request and return ONLY a JSON object in one of these formats:

1. For **direct metrics** (values that exist in the data):
{
  "type": "direct_answer",
  "key": "Total Debt",
  "values": [
    { "ticker": "AAPL", "year": "2022", "value": 132480000 }
  ],
  "message": "Apple's total debt in 2022 was $132.48 billion."
}

2. For **calculated metrics** (like ratios):
{
  "type": "instruction",
  "instruction": "Calculate the debt to equity ratio using the formula: Total Debt / Total Equity Gross Minority Interest"
}

3. For **visualizations, charts, trends, or comparisons**:
{
  "type": "graph",
  "instruction": "Plot the trend of debt to equity ratio from 2021 to 2024 for each company"
}

✅ Rules:
- Use exact field names from the data
- For debt to equity ratio, use "Total Debt" and "Total Equity Gross Minority Interest"
- Return ONLY the JSON object, no explanations or prose
- Do not include markdown formatting
- Do not ask questions or provide suggestions

❌ Do NOT include:
- Explanations outside the JSON
- Questions or suggestions
- Markdown formatting
- Prose text
- Multiple JSON objects

Return ONLY the JSON object in the exact format above.
`
  };

  const userMessage = {
    role: 'user',
    content: `
Analyze this financial query and return ONLY a JSON object in the specified format.

User Query: ${userPrompt}

Available Financial Data:
${JSON.stringify(data, null, 2)}

Return ONLY the JSON object. Do not include any explanations, questions, or prose text.
`
  };

  const response = await callLLM({
    messages: [systemMessage, userMessage],
    model: 'mistral.mixtral-8x7b-instruct-v0:1',
    temperature: 0.2
  });

  try {
    let cleaned = response
      .replace(/```json/g, '')
      .replace(/```/g, '')
      .trim();

    // Try to extract JSON from the response if it's mixed with text
    const jsonMatch = cleaned.match(/\{[\s\S]*\}/);
    if (jsonMatch) {
      cleaned = jsonMatch[0];
    }

    const parsed = JSON.parse(cleaned);
    
    // Validate that we have the required fields
    if (!parsed.type) {
      console.error('❌ Missing type field in response:', parsed);
      return null;
    }
    
    return parsed;
  } catch (err) {
    console.error('❌ Failed to parse Financial Expert Agent output:', response);
    console.error('❌ Parse error:', err.message);
    
    // Try to create a fallback response for simple queries
    if (response.toLowerCase().includes('debt to equity ratio')) {
      return {
        type: "instruction",
        instruction: "Calculate the debt to equity ratio using the formula: Total Debt / Total Equity Gross Minority Interest"
      };
    }
    
    return null;
  }
}

module.exports = { runFinancialExpertAgent };
