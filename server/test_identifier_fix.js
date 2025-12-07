// Test the parsing logic with the actual response format
const testResponse = `{
  "mapping": [
    {
      "ticker": "AAPL",
      "year": "2022",
      "statement_type": "balance"
    }
  ]
}`;

function testParsing(response) {
  try {
    let cleaned = response.trim();
    
    // Remove markdown code blocks if present
    if (cleaned.startsWith('```json')) {
      cleaned = cleaned.replace(/```json\n?/, '').replace(/```\n?$/, '');
    } else if (cleaned.startsWith('```')) {
      cleaned = cleaned.replace(/```\n?/, '').replace(/```\n?$/, '');
    }
    
    // Try to extract JSON if it's mixed with other text
    const jsonMatch = cleaned.match(/\{[\s\S]*\}/);
    if (jsonMatch) {
      cleaned = jsonMatch[0];
    }
    
    const parsed = JSON.parse(cleaned);
    
    // Validate the response structure
    if (!parsed.mapping || !Array.isArray(parsed.mapping)) {
      console.error('❌ Invalid response structure:', parsed);
      return null;
    }
    
    console.log('✅ Successfully parsed:', JSON.stringify(parsed, null, 2));
    return parsed;
  } catch (err) {
    console.error('❌ Failed to parse:', err.message);
    return null;
  }
}

console.log('🧪 Testing Company Identifier Agent parsing fix...');
testParsing(testResponse);
