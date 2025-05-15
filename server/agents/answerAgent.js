const { callLLM } = require('../utils/openRouterClient');

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
- AgentTable    → For displaying numeric values or financial breakdowns
- AgentLatex    → For rendered LaTeX formula blocks
- AgentGraph    → For showing charts/trends over time

🧠 How to decide:
- If context contains multiple values or metrics: use AgentTable
- If LaTeX exists (from LatexWriter): include AgentLatex
- If chart_data or chart object exists: include AgentGraph
- Always add AgentText at the end for narrative summary

✅ Output JSON format:
{
  "render_plan": [
    { "component": "AgentGraph", "data": {...} },
    { "component": "AgentTable", "data": {...} },
    { "component": "AgentLatex", "data": "..." },
    { "component": "AgentText", "data": "..." }
  ]
}

Only include components based on the available context.
Do NOT include undefined or empty data.
Only return the JSON — no markdown, no explanation.
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
    console.error('❌ Answer Agent - Failed to parse response:', response);
    return null;
  }
}

module.exports = { runAnswerAgent };
