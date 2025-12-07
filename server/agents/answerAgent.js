const { callLLM } = require('../utils/bedrockClient');

/**
 * Creates a structured render plan for Answer Renderer.
 * @param {string} userPrompt
 * @param {Array} plan - Steps from Super Agent
 * @param {Object} context - Final key:value outputs from executor
 */
async function runAnswerAgent({ userPrompt, plan, context }) {
  const systemMessage = {
    role: 'system',
    content: `
You are the Answer Agent in a financial research copilot.

You will receive:
- A user query
- A plan showing which agents were used (FinancialCalculator, LatexWriter, GraphQueryWriter, etc.)
- The final output data from those agents

🎯 Your job is to create a JSON render_plan for the frontend to display the response using prebuilt UI components.

🧱 Supported components:
- AgentText     → For summary or explanations
- AgentTable    → For displaying numeric values or financial breakdowns (use array of objects format)
- AgentLatex    → For rendered LaTeX formula blocks
- AgentGraph    → For showing charts/trends over time

🧠 How to decide:
- If FinancialCalculator data exists: ALWAYS create AgentTable using the calculated values
- If LaTeX exists (from LatexWriter): include AgentLatex
- If chart_data or chart object exists: include AgentGraph (use the chart data AS-IS, do not reformat)
- Always add AgentText at the end for narrative summary

📊 AgentTable data format:
For FinancialCalculator output, convert the values array to table format:
Input: {"key": "debt_to_equity_ratio", "values": [{"ticker": "GOOG", "year": 2021, "value": 0.1128}, ...]}
Output: [
  { "Year": "2021", "Google": 0.1128, "Apple": 2.1638 },
  { "Year": "2022", "Google": 0.1159, "Apple": 2.6146 },
  { "Year": "2023", "Google": 0.0957, "Apple": 1.7876 },
  { "Year": "2024", "Google": 0.0783, "Apple": 1.8724 }
]

📈 AgentGraph data format:
Use the chart data exactly as provided by GraphQueryWriter. Do NOT reformat or restructure it.
The chart data should already be in the correct format with "data" array containing objects with "name" and company keys.

✅ Output JSON format:
{
  "render_plan": [
    { "component": "AgentGraph", "data": {...} },
    { "component": "AgentTable", "data": [...] },
    { "component": "AgentLatex", "data": "..." },
    { "component": "AgentText", "data": "..." }
  ]
}

IMPORTANT RULES:
1. ALWAYS include AgentTable when FinancialCalculator data is available
2. Convert FinancialCalculator values array to proper table format with Year and company columns
3. Use the exact chart data from GraphQueryWriter - do not modify it
4. Only return the JSON — no markdown, no explanation
`
  };

  const userMessage = {
    role: 'user',
    content: `
User Prompt:
${userPrompt}

Agent Plan:
${JSON.stringify(plan, null, 2)}

Agent Outputs:
${JSON.stringify(context, null, 2)}

IMPORTANT: If you see FinancialCalculator data with a "values" array, convert it to table format with Year and company columns.
`
  };

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

    const result = JSON.parse(cleaned);
    console.log('🧾 AnswerAgent generated render plan:', JSON.stringify(result, null, 2));
    return result;
  } catch (err) {
    console.error('❌ Answer Agent - Failed to parse response:', response);
    return null;
  }
}

module.exports = { runAnswerAgent };
