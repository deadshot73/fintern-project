// Test the Super Agent parsing logic with the actual response format
const testResponse = `Here's the JSON plan for the given instruction:

\`\`\`json
{
  "steps": [
    {
      "agent": "FinancialCalculator",
      "instruction": "Calculate the debt to equity ratio using Total Debt / Total Equity Gross Minority Interest",
      "input": {
        "from": "data",
        "fields": ["Total Debt", "Total Equity Gross Minority Interest"]
      },
      "output_format": {
        "type": "calculation",
        "key": "debt_to_equity_ratio"
      }
    }
  ]
}
\`\`\`

In this plan, the FinancialCalculator agent calculates the debt to equity ratio using the provided fields.`;

function testSuperAgentParsing(response) {
  try {
    let cleaned = response.trim();
    
    // Remove markdown code blocks if present
    if (cleaned.includes('```json')) {
      const jsonMatch = cleaned.match(/```json\s*(\{[\s\S]*?\})\s*```/);
      if (jsonMatch) {
        cleaned = jsonMatch[1];
      }
    } else if (cleaned.includes('```')) {
      const jsonMatch = cleaned.match(/```\s*(\{[\s\S]*?\})\s*```/);
      if (jsonMatch) {
        cleaned = jsonMatch[1];
      }
    }
    
    // Try to extract JSON if it's mixed with other text
    const jsonMatch = cleaned.match(/\{[\s\S]*\}/);
    if (jsonMatch) {
      cleaned = jsonMatch[0];
    }
    
    // Fix escaped characters that might be in the JSON
    cleaned = cleaned.replace(/\\_/g, '_'); // Fix escaped underscores
    cleaned = cleaned.replace(/\\"/g, '"'); // Fix escaped quotes if any
    
    const parsed = JSON.parse(cleaned);
    
    // Validate the response structure
    if (!parsed.steps || !Array.isArray(parsed.steps)) {
      console.error('❌ Invalid response structure:', parsed);
      return null;
    }
    
    console.log('✅ Successfully parsed Super Agent response:', JSON.stringify(parsed, null, 2));
    return parsed;
  } catch (err) {
    console.error('❌ Failed to parse Super Agent response:', err.message);
    return null;
  }
}

console.log('🧪 Testing Super Agent parsing fix...');
testSuperAgentParsing(testResponse);
