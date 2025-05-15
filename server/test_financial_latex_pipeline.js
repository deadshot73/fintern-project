require('dotenv').config();

const { runFinancialCalculator } = require('./agents/financialCalculator');
const { runLatexWriter } = require('./agents/latexWriter');

function normalizeKey(key) {
    return key.replace(/[^a-zA-Z0-9]/g, '_');
  }
  

// Sample data and instruction
const instruction = "Calculate the quick ratio using (Cash + Receivables) / Current Liabilities.";
const data = {
  "Cash": 1000000,
  "Receivables": 500000,
  "Current Liabilities": 800000,
  "Inventory": 200000
};

// ⚙️ JavaScript-side evaluator for LLM-returned formula
function mathEval(formula, data) {
    try {
      const keyMap = {};
  
      // Build JS-safe variables and a mapping
      const context = Object.entries(data).map(([key, value]) => {
        const safeKey = normalizeKey(key);
        keyMap[key] = safeKey;
        return `let ${safeKey} = ${value || 0};`;
      }).join('\n');
  
      // Replace raw keys in formula with safe versions
      const normalizedFormula = Object.entries(keyMap).reduce((expr, [original, safe]) => {
        const regex = new RegExp(`\\b${original}\\b`, 'g');
        return expr.replace(regex, safe);
      }, formula);
  
      const fn = new Function(`${context}\nreturn ${normalizedFormula};`);
      return fn();
    } catch (err) {
      console.error('❌ Error evaluating formula:', formula);
      return null;
    }
  }
  

async function testPipeline() {
  console.log('🔢 Running Financial Calculator...');
  const calcStep = await runFinancialCalculator({ instruction, data });

  if (!calcStep || !calcStep.key || !calcStep.formula) {
    console.log('❌ Calculation failed.');
    return;
  }

  console.log('✅ Parsed Formula:', calcStep.formula);

  const value = mathEval(calcStep.formula, data);
  if (value == null) {
    console.log('❌ Math evaluation failed.');
    return;
  }

  const finalResult = {
    key: calcStep.key,
    value: Number(value.toFixed(4))
  };
  console.log('✅ Evaluated Result:', finalResult);

  // Run LaTeX writer
  console.log('\n🧾 Running LaTeX Writer...');
  const latex = await runLatexWriter({ instruction, data });
  console.log('✅ LatexWriter Output:\n', latex);
}

testPipeline();
