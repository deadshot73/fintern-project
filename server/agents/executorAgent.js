const { runFinancialCalculator } = require('./financialCalculator');
const { runLatexWriter       } = require('./latexWriter');
const { runGraphQueryWriter  } = require('./graphQueryWriter');
const { runAnswerAgent       } = require('./answerAgent');

/**
 * Execute the Super-Agent plan
 * @param {Object}   plan
 * @param {Array}    dataFiles – full financial blobs
 * @param {string}   userPrompt
 */
async function runExecutor (plan, dataFiles, userPrompt) {
  console.log('🔧 Executor Plan:', JSON.stringify(plan, null, 2));
  console.log('📊 Data Files:', dataFiles.length, 'files');
  const context = {};

  for (const step of plan.steps) {
    console.log('🔄 Processing step:', step.agent, 'with input:', step.input);
    const { agent, instruction, input, output_format } = step;
    const outputKey = output_format?.key || agent;
    let relevantData = {};
    let result;

    /* ── Build input for this step ───────────────────────── */
    if (input?.from === 'data') {
      if (agent === 'GraphQueryWriter') {
        // 👉 Send ultra-compact rows: { ticker, year, field, value }
        relevantData = [];
        for (const file of dataFiles) {
          for (const field of input.fields || []) {
            if (file.data?.[field] !== undefined) {
              relevantData.push({
                ticker : file.ticker,
                year   : file.year,
                field  : field,
                value  : file.data[field]
              });
            }
          }
        }
      } else {
        // FinancialCalculator / LatexWriter need year-specific data
        for (const file of dataFiles) {
          for (const field of input.fields || []) {
            if (file.data?.[field] !== undefined) {
              if (!relevantData[file.ticker]) relevantData[file.ticker] = {};
              if (!relevantData[file.ticker][file.year]) relevantData[file.ticker][file.year] = {};
              relevantData[file.ticker][file.year][field] = file.data[field];
            }
          }
        }
      }
    } else if (input?.from === 'previous_step' || input?.from === 'output') {
      relevantData = context;
    }

    /* ── Dispatch to the correct agent ───────────────────── */
    switch (agent) {
      case 'FinancialCalculator':
        console.log(`🔢 [${agent}] Running…`);
        result = await runFinancialCalculator({ instruction, data: relevantData });
        break;

      case 'LatexWriter':
        console.log(`🧮 [${agent}] Running…`);
        result = await runLatexWriter({ instruction, data: relevantData });
        break;

      case 'GraphQueryWriter':
        console.log(`📈 [${agent}] Running…`);
        console.log('   ↳ relevantData type:', typeof relevantData, Array.isArray(relevantData) ? 'array' : 'not array');
        console.log('   ↳ relevantData:', relevantData);
        if (Array.isArray(relevantData)) {
          console.log('   ↳ data sample →', JSON.stringify(relevantData.slice(0, 3), null, 2));
        }
        result = await runGraphQueryWriter({ userPrompt, data: relevantData });
        break;

      case 'AnswerAgent':
        console.log(`🧾 [${agent}] Running…`);
        result = await runAnswerAgent({ userPrompt, plan, context });
        break;

      default:
        console.warn('⚠️  Unknown agent:', agent);
    }

    if (result) {
      console.log(`✅ [${agent} Output]:\n`, result);
      context[outputKey] = result;
    } else {
      console.error(`❌ ${agent} failed or returned null`);
    }
  }

  return context;
}

module.exports = { runExecutor };
