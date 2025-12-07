const { callLLM } = require('../utils/bedrockClient');

async function runLatexWriter({ instruction, data }) {
  const systemMessage = {
    role: 'system',
    content: `
You are a LaTeX formula writer for a financial research copilot.

You will receive:
- A financial instruction (e.g., "Calculate the debt to equity ratio using Total Debt / Total Equity Gross Minority Interest")
- A list of example data blobs, each with:
  - ticker
  - year
  - data: object of field values used in the formula

🎯 Your task is to:
1. Convert the financial formula into a valid LaTeX expression
2. Return ONLY the LaTeX code without any explanatory text

✅ Output format (example):
\\[
\\text{Debt to Equity Ratio} = \\frac{\\text{Total Debt}}{\\text{Total Equity Gross Minority Interest}}
\\]

❌ Do NOT include any explanatory text like "Here's the LaTeX code block for..."
❌ Do NOT include markdown formatting
❌ Do NOT include JSON
✅ Return ONLY the LaTeX code enclosed in \\[ ... \\].
✅ The response should start with \\[ and end with \\].
`
  };

  const userMessage = {
    role: 'user',
    content: `
Convert this instruction to LaTeX formula. Return ONLY the LaTeX code.

Instruction:
${instruction}

Financial Data Samples (from multiple companies):
${JSON.stringify(data, null, 2)}

Return ONLY the LaTeX code starting with \\[ and ending with \\]. Do not include any other text.
`
  };

  const response = await callLLM({
    messages: [systemMessage, userMessage],
    model: 'mistral.mixtral-8x7b-instruct-v0:1',
    temperature: 0.1
  });

  // Clean the response to extract only the LaTeX code
  let cleaned = response.trim();
  
  // Try to extract LaTeX code if it's wrapped in \[ ... \]
  const latexMatch = cleaned.match(/\\\[([\s\S]*?)\\\]/);
  if (latexMatch) {
    cleaned = `\\[${latexMatch[1].trim()}\\]`;
  }
  
  // If no \[ ... \] found, try to find any LaTeX-like content
  if (!cleaned.startsWith('\\[')) {
    const anyLatexMatch = cleaned.match(/(\\[a-zA-Z]+.*)/);
    if (anyLatexMatch) {
      cleaned = `\\[${anyLatexMatch[1].trim()}\\]`;
    }
  }
  
  return cleaned;
}

module.exports = { runLatexWriter };
