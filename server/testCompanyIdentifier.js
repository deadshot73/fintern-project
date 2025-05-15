require('dotenv').config();
const { runCompanyIdentifierAgent } = require('./agents/companyIdentifierAgent');

async function testIdentifier() {
  const prompt = "Compare Apple (ticker : AAPL) and Google’s (ticker : GOOG) net income in 2023 and 2024.";
  const result = await runCompanyIdentifierAgent(prompt);
  console.log(result);
}

testIdentifier();
