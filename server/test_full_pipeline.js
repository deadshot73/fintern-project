require('dotenv').config();

const { runCompanyIdentifierAgent } = require('./agents/companyIdentifierAgent');
const { fetchMultipleFinancialData } = require('./agents/dataFetcher');
const { runFinancialExpertAgent } = require('./agents/financialExpertAgent');
const { runSuperAgent } = require('./agents/superAgent');
const { runExecutor } = require('./agents/executorAgent');
const { runAnswerAgent } = require('./agents/answerAgent');

async function fullPipeline(userPrompt) {
  console.log('\n👤 Prompt:', userPrompt);

  // Step 1: Company Identifier Agent
  const meta = await runCompanyIdentifierAgent(userPrompt);
  console.log('🧠 Identifier:', meta);

  if (!meta?.mapping || meta.mapping.length === 0) {
    console.error('❌ Identifier Agent did not return any mappings.');
    return;
  }

  // Step 2: Fetch all financial data entries
  const finData = await fetchMultipleFinancialData(meta.mapping);
  if (!finData || finData.length === 0) {
    console.error('❌ No financial data found.');
    return;
  }

  console.log(`📊 Fetched ${finData.length} data files`);

  // Step 3: Run Financial Expert Agent
// Step 3: Run Financial Expert Agent
const expert = await runFinancialExpertAgent({
  userPrompt,
  data: finData
});

console.log('🧠 Expert Agent Output:\n' + '='.repeat(60));
console.log(JSON.stringify(expert, null, 2));
console.log('='.repeat(60));


  // Step 4A: Direct answer
  if (expert.type === 'direct_answer') {
    const answer = await runAnswerAgent({
      instruction: `Summarize the following metric: ${expert.key}`,
      context: {
        [expert.key]: expert.values,
        message: expert.message
      }
    });

    console.log('\n✅ Final Answer (Direct):\n', answer.text);
    return;
  }

  // Step 4B: Instruction → Super Agent → Plan
  const plan = await runSuperAgent({
    userPrompt,
    instruction: expert.instruction,
    metadata: meta.mapping,
    data: finData
  });

  if (!plan || !plan.steps) {
    console.error('❌ Super Agent failed to return a valid plan.');
    return;
  }

  console.log('🗺️  Plan:\n', JSON.stringify(plan, null, 2));

  // Step 5: Executor Agent
  const finalContext = await runExecutor(plan, finData);

  console.log('\n✅ Final Answer (Calculated):\n', JSON.stringify(finalContext, null, 2)?.answer || '[No answer returned]');
}

// Example query
fullPipeline('Calculate Current Ratio of Apple for 2024 and Quick Ratio of GGoole for 2021');

