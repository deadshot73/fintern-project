const axios = require('axios');

const OPENROUTER_API_KEY = process.env.OPENROUTER_API_KEY; // Use env var for security
console.log('API Key present:', !!OPENROUTER_API_KEY); // Debug log
const OPENROUTER_BASE_URL = 'https://openrouter.ai/api/v1';

async function callLLM({ messages, model = 'deepseek/deepseek-chat-v3-0324', temperature = 0.2 }) {

  try {
    const response = await axios.post(
      `${OPENROUTER_BASE_URL}/chat/completions`,
      {
        model,
        messages,
        temperature
      },
      {
        headers: {
          Authorization: `Bearer ${OPENROUTER_API_KEY}`,
          'Content-Type': 'application/json'
        }
      }
    );

    const result = response.data.choices[0].message.content.trim();
    return result;
    console.log(result)
  } catch (error) {
    console.error('LLM error:', error.response?.data || error.message);
    throw new Error('LLM call failed');
  }
}

module.exports = { callLLM };
