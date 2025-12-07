const { runCompanyIdentifierAgent } = require('./agents/companyIdentifierAgent');

async function testCompanyIdentifier() {
  console.log('🧪 Testing Company Identifier Agent...');
  
  const testQuery = "plot a graph comparing the trend of debt to equity ratio of google and apple for 2021 to 2024";
  
  try {
    const result = await runCompanyIdentifierAgent(testQuery);
    console.log('✅ Result:', JSON.stringify(result, null, 2));
  } catch (error) {
    console.error('❌ Error:', error);
  }
}

testCompanyIdentifier();
