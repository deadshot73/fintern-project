require('dotenv').config();

const { runCompanyIdentifierAgent } = require('./agents/companyIdentifierAgent');
const { fetchFinancialData } = require('./agents/dataFetcher');
const { runSuperAgent } = require('./agents/superAgent');

async function runAgentPipeline(userPrompt) {
  console.log('👤 [User Prompt]:', userPrompt);

  console.log('\n🧠 [Company Identifier Agent] Running...');
  const metadata = await runCompanyIdentifierAgent(userPrompt);
  console.log('✅ [Metadata Extracted]:', metadata);

  if (!metadata || !metadata.ticker || !metadata.year || !metadata.statement_type) {
    console.log('❌ [Error] Incomplete metadata. Cannot proceed to data fetcher.');
    return;
  }

  console.log('\n📡 [Data Fetcher Agent] Fetching data from backend...');
  const financialData = await fetchFinancialData(metadata);

  if (!financialData) {
    console.log('❌ [Error] No financial data found for:', metadata);
  } else {
    console.log('✅ [Financial Data Fetched]:');
    console.dir(financialData, { depth: null });
  }
  console.log('\n🧠 [Super Agent] Planning response...');
const plan = await runSuperAgent({
  userPrompt,
  metadata,
  data: financialData.data
});
console.log('✅ [Plan]:', JSON.stringify(plan, null, 2));
}

// 🔁 RUN TEST
runAgentPipeline("Tell me the quick ratio of Alphabet (Ticker : GOOG) in 2024");
