const { callLLM } = require('../utils/openRouterClient');

async function runLatexWriter({ instruction, data }) {
  const systemMessage = {
    role: 'system',
    content: `
You are a LaTeX formula writer for a financial research copilot.

You will receive:
- A financial instruction (e.g., "Calculate the quick ratio using the formula: (Cash + Receivables) / Current Liabilities")
- A list of example data blobs, each with:
  - ticker
  - year
  - data: object of field values used in the formula

🎯 Your task is to:
1. Convert the financial formula into a valid LaTeX expression
2. Optionally plug in example numeric values (only if simple)
3. Return only the LaTeX code block

✅ Output format (example):
\\[
\\frac{\\text{Cash} + \\text{Receivables}}{\\text{Current Liabilities}} = \\frac{1000000 + 500000}{800000}
\\]

❌ Do NOT include explanation or text.
❌ Do NOT return markdown or JSON.
✅ Return only valid LaTeX enclosed in \\[ ... \\].
`
  };

  const userMessage = {
    role: 'user',
    content: `
Instruction:
${instruction}

Financial Data Samples (from multiple companies):
${JSON.stringify(data, null, 2)}
`
  };

  const response = await callLLM({
    messages: [systemMessage, userMessage],
    model: 'deepseek/deepseek-chat-v3-0324',
    temperature: 0.1
  });

  return response.trim();
}

module.exports = { runLatexWriter };
