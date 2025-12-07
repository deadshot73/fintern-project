const { callLLM } = require('../utils/bedrockClient');

async function runSuperAgent({ userPrompt, instruction, metadata, data }) {
  const systemMessage = {
    role: 'system',
    content: `
You are a Super Planner Agent for a financial AI assistant. You MUST respond with ONLY valid JSON in the exact format specified.

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

❌ Do NOT include any explanations, questions, or prose text.
❌ Do NOT include markdown formatting.
✅ Return ONLY the JSON object in the exact format below.

🚨 Most important:
- DO NOT alter or reinterpret the expert's instruction.
- DO NOT split the instruction or add steps unless explicitly required.
- DO NOT create formulas — your job is only to delegate, not to think financially.

✅ Agents available:

1. ✅ FinancialCalculator
  - Input: expert instruction, fields from data
  - Output: { "key": "metric_key", "values": [{"ticker": "AAPL", "year": 2021, "value": 2.0}, ...] }
  - Use for: ratio calculations, financial metrics

2. ✅ LatexWriter
  - Input: formula and values from calculator
  - Output: rendered LaTeX for reports

3. ✅ AnswerAgent
  - Input: the numeric output from calculator
  - Output: human-readable answer

4. ✅ GraphQueryWriter
  - Input: chart or trend request + data
  - Output: { chart_type, title, x_axis_label, y_axis_label, data: [] }
  - Use for: trends, comparisons, visualizations, charts, graphs

📦 PLAN FORMAT:
Return exactly:

{
  "steps": [
    {
      "agent": "FinancialCalculator",
      "instruction": "Calculate the debt to equity ratio using Total Debt / Total Equity Gross Minority Interest",
      "input": {
        "from": "data",
        "fields": ["Total Debt", "Total Equity Gross Minority Interest"]
      },
      "output_format": {
        "type": "calculation",
        "key": "debt_to_equity_ratio"
      }
    },
    {
      "agent": "LatexWriter",
      "instruction": "Display the debt to equity ratio formula in LaTeX format",
      "input": {
        "from": "previous_step",
        "fields": ["debt_to_equity_ratio"]
      },
      "output_format": {
        "type": "latex",
        "key": "formula"
      }
    },
    {
      "agent": "GraphQueryWriter",
      "instruction": "Generate a line chart showing debt to equity ratio over years for each company",
      "input": {
        "from": "previous_step",
        "fields": ["debt_to_equity_ratio"]
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
✅ Always include FinancialCalculator for ratio calculations.
✅ ALWAYS include LatexWriter when FinancialCalculator is used (for formula display).
✅ ALWAYS include GraphQueryWriter when charts/trends/compare/visualize is requested.
✅ For comparison queries (multiple companies), ensure GraphQueryWriter gets the correct fields.
✅ Return a valid JSON plan with "steps".

CRITICAL: If the plan includes FinancialCalculator, it MUST also include LatexWriter to display the formula.
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
Create a JSON plan for this instruction. Return ONLY the JSON object.

Instruction from Financial Expert:
${instruction}

User Prompt:
${userPrompt}

Metadata Mapping:
${JSON.stringify(metadata, null, 2)}

Available Fields (from financial data):
${allFields.join(', ')}

IMPORTANT: If the instruction involves ratio calculations or financial metrics, make sure to include FinancialCalculator with the appropriate fields.

CRITICAL: Always include LatexWriter after FinancialCalculator to display the formula used in the calculation.

Return ONLY the JSON object. Do not include any explanations or prose text.
`
  };

  const response = await callLLM({
    messages: [systemMessage, userMessage],
    model: 'mistral.mixtral-8x7b-instruct-v0:1',
    temperature: 0.2
  });

  try {
    let cleaned = response.trim();
    
    // Remove markdown code blocks if present
    if (cleaned.includes('```json')) {
      const jsonMatch = cleaned.match(/```json\s*(\{[\s\S]*?\})\s*```/);
      if (jsonMatch) {
        cleaned = jsonMatch[1];
      }
    } else if (cleaned.includes('```')) {
      const jsonMatch = cleaned.match(/```\s*(\{[\s\S]*?\})\s*```/);
      if (jsonMatch) {
        cleaned = jsonMatch[1];
      }
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
    if (!parsed.steps || !Array.isArray(parsed.steps)) {
      console.error('❌ Invalid response structure:', parsed);
      return null;
    }
    
    return parsed;
  } catch (err) {
    console.error('❌ Failed to parse Super Agent output:', response);
    console.error('❌ Parse error:', err.message);
    return null;
  }
}

module.exports = { runSuperAgent };
