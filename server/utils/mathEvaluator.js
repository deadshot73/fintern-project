function normalizeKey(key) {
    return key.replace(/[^a-zA-Z0-9]/g, '_');
  }
  
  function mathEval(formula, data) {
    try {
      const keyMap = {};
      const safeData = {};
  
      // 1. Normalize keys and build key map
      for (const [originalKey, value] of Object.entries(data)) {
        const safeKey = normalizeKey(originalKey);
        keyMap[originalKey] = safeKey;
        safeData[safeKey] = value;
      }
  
      // 2. Build JS-safe variable declarations
      const context = Object.entries(safeData)
        .map(([safeKey, value]) => `let ${safeKey} = ${value || 0};`)
        .join('\n');
  
      // 3. Replace original keys in formula with normalized keys
      const normalizedFormula = Object.entries(keyMap).reduce((expr, [original, safe]) => {
        const regex = new RegExp(`\\b${original}\\b`, 'g');
        return expr.replace(regex, safe);
      }, formula);
  
      // 4. Identify missing fields
      const requiredVars = normalizedFormula.match(/\b[A-Za-z_][A-Za-z0-9_]*\b/g) || [];
      const missingVars = requiredVars.filter(v => !(v in safeData));
  
      if (missingVars.length > 0) {
        console.warn('⚠️ Missing data for fields in formula:', missingVars);
        return null;
      }
  
      // 5. Evaluate final JS formula
      const fn = new Function(`${context}\nreturn ${normalizedFormula};`);
      return fn();
    } catch (err) {
      console.error('❌ Error evaluating formula:', formula);
      return null;
    }
  }
  
  module.exports = { mathEval };
  