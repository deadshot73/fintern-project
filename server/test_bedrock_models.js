const { BedrockRuntimeClient, InvokeModelCommand } = require('@aws-sdk/client-bedrock-runtime');
require('dotenv').config();

// Test different model IDs with their specific formats
const testModels = [
  // Anthropic Claude models
  { id: 'anthropic.claude-3-sonnet-20240229-v1:0', format: 'claude' },
  { id: 'anthropic.claude-3-haiku-20240307-v1:0', format: 'claude' },
  { id: 'anthropic.claude-3-opus-20240229-v1:0', format: 'claude' },
  { id: 'anthropic.claude-2.1', format: 'claude' },
  { id: 'anthropic.claude-2.0', format: 'claude' },
  { id: 'anthropic.claude-instant-1.2', format: 'claude' },
  
  // Amazon Titan models
  { id: 'amazon.titan-text-express-v1', format: 'titan' },
  { id: 'amazon.titan-text-lite-v1', format: 'titan' },
  { id: 'amazon.titan-embed-text-v1', format: 'titan-embed' },
  
  // AI21 models
  { id: 'ai21.j2-ultra-v1', format: 'ai21' },
  { id: 'ai21.j2-mid-v1', format: 'ai21' },
  
  // Meta models
  { id: 'meta.llama2-70b-chat-v1', format: 'llama' },
  { id: 'meta.llama2-13b-chat-v1', format: 'llama' },
  { id: 'meta.llama2-7b-chat-v1', format: 'llama' },
  
  // DeepSeek models
  { id: 'deepseek.r1-v1:0', format: 'deepseek' },
  { id: 'deepseek.deepseek-r1-v1:0', format: 'deepseek' },
  
  // Cohere models
  { id: 'cohere.command-text-v14', format: 'cohere' },
  { id: 'cohere.command-light-text-v14', format: 'cohere' },
  
  // Mistral models
  { id: 'mistral.mistral-7b-instruct-v0:2', format: 'mistral' },
  { id: 'mistral.mixtral-8x7b-instruct-v0:1', format: 'mistral' },
  { id: 'mistral.mistral-large-latest', format: 'mistral' }
];

function getRequestBody(modelId, format) {
  const basePrompt = "Hello, can you help me with a simple question?";
  
  switch (format) {
    case 'claude':
      return {
        prompt: `Human: ${basePrompt}\n\nAssistant:`,
        max_tokens: 100,
        temperature: 0.2,
        top_p: 1,
        stop_sequences: ['\n\nHuman:']
      };
    
    case 'titan':
      return {
        inputText: `User: ${basePrompt}\nBot:`,
        textGenerationConfig: {
          maxTokenCount: 100,
          temperature: 0.2,
          topP: 1,
          stopSequences: ['User:']
        }
      };
    
    case 'ai21':
      return {
        prompt: basePrompt,
        maxTokens: 100,
        temperature: 0.2,
        topP: 1,
        stopSequences: ['Human:']
      };
    
    case 'llama':
      return {
        prompt: `<s>[INST] ${basePrompt} [/INST]`,
        max_gen_len: 100,
        temperature: 0.2,
        top_p: 1
      };
    
    case 'deepseek':
      return {
        prompt: `Human: ${basePrompt}\n\nAssistant:`,
        max_tokens: 100,
        temperature: 0.2,
        top_p: 1,
        stop_sequences: ['\n\nHuman:']
      };
    
    case 'cohere':
      return {
        prompt: basePrompt,
        max_tokens: 100,
        temperature: 0.2,
        p: 1,
        stop_sequences: ['Human:']
      };
    
    case 'mistral':
      return {
        prompt: `<s>[INST] ${basePrompt} [/INST]`,
        max_tokens: 100,
        temperature: 0.2,
        top_p: 1
      };
    
    default:
      return {
        prompt: basePrompt,
        max_tokens: 100,
        temperature: 0.2
      };
  }
}

function parseResponse(responseBody, format) {
  try {
    switch (format) {
      case 'claude':
        return responseBody.completion;
      case 'titan':
        return responseBody.results[0].outputText;
      case 'ai21':
        return responseBody.completions[0].data.text;
      case 'llama':
        return responseBody.generation;
      case 'deepseek':
        return responseBody.completion;
      case 'cohere':
        return responseBody.generations[0].text;
      case 'mistral':
        return responseBody.outputs[0].text;
      default:
        return JSON.stringify(responseBody);
    }
  } catch (error) {
    return `Error parsing response: ${error.message}`;
  }
}

async function testModel(modelConfig) {
  try {
    const bedrockClient = new BedrockRuntimeClient({
      region: process.env.AWS_REGION || 'us-east-1',
      credentials: {
        accessKeyId: process.env.AWS_ACCESS_KEY_ID,
        secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
      },
    });

    const requestBody = getRequestBody(modelConfig.id, modelConfig.format);

    const command = new InvokeModelCommand({
      modelId: modelConfig.id,
      contentType: 'application/json',
      body: JSON.stringify(requestBody),
    });

    console.log(`Testing model: ${modelConfig.id} (${modelConfig.format} format)`);
    const response = await bedrockClient.send(command);
    const responseBody = JSON.parse(new TextDecoder().decode(response.body));
    const result = parseResponse(responseBody, modelConfig.format);
    
    console.log(`✅ Model ${modelConfig.id} works!`);
    console.log(`   Response: ${result.substring(0, 100)}...`);
    return { success: true, model: modelConfig.id, format: modelConfig.format };
  } catch (error) {
    console.log(`❌ Model ${modelConfig.id} failed: ${error.message}`);
    return { success: false, model: modelConfig.id, error: error.message };
  }
}

async function main() {
  console.log('🔍 Testing Amazon Bedrock models...');
  console.log('AWS Credentials Check:');
  console.log('  AWS_ACCESS_KEY_ID present:', !!process.env.AWS_ACCESS_KEY_ID);
  console.log('  AWS_SECRET_ACCESS_KEY present:', !!process.env.AWS_SECRET_ACCESS_KEY);
  console.log('  AWS_REGION:', process.env.AWS_REGION || 'us-east-1');
  console.log('');
  
  const results = [];
  
  for (const model of testModels) {
    const result = await testModel(model);
    results.push(result);
    console.log(''); // Add spacing between tests
  }
  
  console.log('📊 SUMMARY:');
  console.log('===========');
  const workingModels = results.filter(r => r.success);
  const failedModels = results.filter(r => !r.success);
  
  console.log(`✅ Working models (${workingModels.length}):`);
  workingModels.forEach(m => console.log(`   - ${m.model} (${m.format})`));
  
  console.log(`❌ Failed models (${failedModels.length}):`);
  failedModels.forEach(m => console.log(`   - ${m.model}: ${m.error}`));
  
  if (workingModels.length > 0) {
    console.log('\n🎯 RECOMMENDATION:');
    console.log('Use one of the working models above. For financial analysis, I recommend:');
    const recommended = workingModels.find(m => m.format === 'claude') || workingModels[0];
    console.log(`   ${recommended.model} (${recommended.format} format)`);
  } else {
    console.log('\n⚠️  No working models found. Please check:');
    console.log('   1. AWS credentials are properly configured');
    console.log('   2. Models are enabled in AWS Bedrock console');
    console.log('   3. AWS account has access to Bedrock models');
  }
}

main(); 