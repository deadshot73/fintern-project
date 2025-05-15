const { callLLM } = require('../utils/openRouterClient');

/**
 * @param {string} userPrompt                – original user question
 * @param {Array<{ticker:string,year:string,field:string,value:number}>} data
 */
async function runGraphQueryWriter ({ userPrompt, data }) {
  const systemMessage = {
    role   : 'system',
    content: `
You are a Graph-Query writer for a financial research copilot.

You will receive:
- The user's original prompt.
- A lightweight array of rows, each with:
  { ticker, year, field, value }

Task:
1. Identify which field is being plotted (e.g. "Total Revenue").
2. Build a Recharts-compatible JSON config:
   {
     "chart_type"   : "line" | "bar",
     "title"        : "...",
     "x_axis_label" : "Year",
     "y_axis_label" : "Total Revenue (in millions)",
     "data": [
       { "name": "AAPL 2021", "value": 365.8 },
       { "name": "AAPL 2022", "value": 394.3 },
       ...
     ]
   }

Guidelines:
- Include **all** matching (ticker, year) rows.
- If only one ticker but many years, use year for \`name\`.
- Values may be divided by 1 000 000 and rounded to 1-2 decimals for readability.
- Return **valid JSON only** – no markdown.
`
  };

  const userMessage = {
    role   : 'user',
    content: `
User Prompt:
${userPrompt}

Rows:
${JSON.stringify(data, null, 2)}
`
  };

  const resp = await callLLM({
    messages   : [systemMessage, userMessage],
    model      : 'deepseek/deepseek-chat-v3-0324',
    temperature: 0.2
  });

  try {
    const cleaned = resp.replace(/```json/g, '').replace(/```/g, '').trim();
    return JSON.parse(cleaned);
  } catch (err) {
    console.error('❌ Graph Query Writer – parse error:\n', resp);
    return null;
  }
}

module.exports = { runGraphQueryWriter };
