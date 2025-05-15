const { callLLM } = require('../utils/openRouterClient');

async function runSuperAgent({ userPrompt, instruction, metadata, data }) {
  const systemMessage = {
    role: 'system',
    content: `
You are a Super Planner Agent for a financial AI assistant.

You will receive:
- A user question
- An instruction from a Financial Expert Agent
- Metadata (mapping of ticker/year/statement_type)
- Financial data as an array of entries with:
  - ticker
  - year
  - statement_type
  - data (fields → values)

🎯 Your task is to create a structured JSON plan of agents that will execute this instruction across the provided financial data.

🚨 Most important:
- DO NOT alter or reinterpret the expert's instruction.
- DO NOT split the instruction or add steps unless explicitly required.
- DO NOT create formulas — your job is only to delegate, not to think financially.

✅ Agents available:

1. ✅ FinancialCalculator
  - Input: expert instruction, fields from data
  - Output: { "key": "metric_key", "value": number or array }

2. ✅ LatexWriter
  - Input: formula and values from calculator
  - Output: rendered LaTeX for reports

3. ✅ AnswerAgent
  - Input: the numeric output from calculator
  - Output: human-readable answer

4. ✅ GraphQueryWriter
  - Input: chart or trend request + data
  - Output: { chart_type, title, x_axis_label, y_axis_label, data: [] }

📦 PLAN FORMAT:
Return exactly:

{
  "steps": [
    {
      "agent": "GraphQueryWriter",
      "instruction": "Generate a line chart showing revenue over years for Apple",
      "input": {
        "from": "data",
        "fields": ["Total Revenue"]
      },
      "output_format": {
        "type": "graph",
        "key": "chart_data"
      }
    },
    {
      "agent": "AnswerAgent",
      "instruction": "Summarize the trend shown in the chart",
      "input": {
        "from": "previous_step",
        "fields": ["chart_data"]
      },
      "output_format": {
        "type": "text",
        "key": "answer"
      }
    }
  ]
}

✅ Use only the fields mentioned in the expert instruction.
✅ Always include LatexWriter if calculations are used.
✅ Include GraphQueryWriter when charts/trends/compare/visualize is requested.
✅ Return a valid JSON plan with "steps".
`
  };

  const allFields = Array.from(
    new Set(
      data
        .flatMap(entry => Object.keys(entry.data || {}))
        .filter(key => typeof key === 'string')
    )
  );

  const userMessage = {
    role: 'user',
    content: `
Instruction from Financial Expert:
${instruction}

User Prompt:
${userPrompt}

Metadata Mapping:
${JSON.stringify(metadata, null, 2)}

Available Fields (from financial data):
${allFields.join(', ')}
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
    console.error('❌ Failed to parse Super Agent output:', response);
    return null;
  }
}

module.exports = { runSuperAgent };
