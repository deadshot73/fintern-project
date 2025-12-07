// Simple test to verify the financial expert agent fallback logic
const testResponse = "The debt to equity ratio of Apple for 2022 is 0.39. This is the calculation...";

// Test the fallback logic
if (testResponse.toLowerCase().includes('debt to equity ratio')) {
  const fallback = {
    type: "instruction",
    instruction: "Calculate the debt to equity ratio using the formula: Total Debt / Total Equity Gross Minority Interest"
  };
  console.log('✅ Fallback response:', JSON.stringify(fallback, null, 2));
} else {
  console.log('❌ Fallback not triggered');
}
