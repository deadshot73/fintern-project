const { callLLM } = require('../utils/bedrockClient');

/**
 * @param {string} userPrompt                – original user question
 * @param {Array<{ticker:string,year:string,field:string,value:number}>} data
 */
async function runGraphQueryWriter ({ userPrompt, data }) {
  console.log('📈 GraphQueryWriter input data:', data);
  
  const systemMessage = {
    role   : 'system',
    content: `
You are a Graph-Query writer for a financial research copilot.

Input: User prompt + array of {ticker, year, field, value} rows

Output: Recharts-compatible JSON for multi-company comparison:
{
  "chart_type": "line",
  "title": "Chart Title",
  "x_axis_label": "Year", 
  "y_axis_label": "Metric Name",
  "data": [
    {"name": "2021", "Company1": 1.2, "Company2": 2.3},
    {"name": "2022", "Company1": 1.3, "Company2": 2.4}
  ]
}

Rules:
- Group by year, each company as separate data key
- Use year as "name" field
- Include all (ticker, year) rows
- Return valid JSON only
- Keep response concise
`
  };

  const userMessage = {
    role: 'user',
    content: `
Prompt: ${userPrompt}

Data: ${JSON.stringify(data, null, 2)}

Create chart data with separate keys for each company.`
  };

  const resp = await callLLM({
    messages   : [systemMessage, userMessage],
    model      : 'mistral.mixtral-8x7b-instruct-v0:1',
    temperature: 0.2
  });

  let cleaned = '';
  
  try {
    console.log('📈 GraphQueryWriter raw response:', resp);
    
    // More robust JSON cleaning
    cleaned = resp.trim();
    
    // Remove markdown code blocks
    cleaned = cleaned.replace(/```json\s*/g, '');
    cleaned = cleaned.replace(/```\s*/g, '');
    
    // Remove any leading/trailing whitespace and newlines
    cleaned = cleaned.trim();
    
    // If the response starts with a newline or whitespace, clean it
    cleaned = cleaned.replace(/^\s+/, '');
    cleaned = cleaned.replace(/\s+$/, '');
    
    console.log('📈 GraphQueryWriter cleaned response:', cleaned);
    
    // Check if response is complete JSON
    if (!cleaned.startsWith('{') || !cleaned.includes('"data"')) {
      console.error('❌ GraphQueryWriter: Incomplete or malformed JSON response');
      console.error('❌ Response starts with:', cleaned.substring(0, 100));
      return null;
    }
    
    const result = JSON.parse(cleaned);
    
    console.log('📈 GraphQueryWriter parsed result:', result);
    
    // Validate that data array is not empty
    if (!result.data || !Array.isArray(result.data) || result.data.length === 0) {
      console.error('❌ GraphQueryWriter: Empty data array generated');
      return null;
    }
    
    // Additional validation: ensure multi-company data structure
    const uniqueTickers = [...new Set(data.map(row => row.ticker))];
    if (uniqueTickers.length > 1) {
      // Check if the first data point has keys for all companies
      const firstDataPoint = result.data[0];
      const dataKeys = Object.keys(firstDataPoint).filter(key => key !== 'name');
      
      if (dataKeys.length < uniqueTickers.length) {
        console.warn('⚠️ GraphQueryWriter: Multi-company data structure may be incomplete');
        console.log('Expected companies:', uniqueTickers);
        console.log('Found data keys:', dataKeys);
      }
    }
    
    return result;
  } catch (err) {
    console.error('❌ Graph Query Writer – parse error:', err.message);
    console.error('❌ Raw response was:', resp);
    console.error('❌ Cleaned response was:', cleaned);
    
    // Try to extract partial JSON if possible
    try {
      const jsonMatch = resp.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        console.log('🔧 Attempting to extract JSON from response...');
        const extracted = jsonMatch[0];
        const partialResult = JSON.parse(extracted);
        console.log('🔧 Extracted partial result:', partialResult);
        
        // Check if we have at least some data
        if (partialResult.data && Array.isArray(partialResult.data) && partialResult.data.length > 0) {
          console.log('✅ Using extracted partial result');
          return partialResult;
        }
      }
    } catch (extractErr) {
      console.error('❌ Failed to extract partial JSON:', extractErr.message);
    }
    
    return null;
  }
}

module.exports = { runGraphQueryWriter };
