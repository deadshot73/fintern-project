const { BedrockRuntimeClient, InvokeModelCommand } = require('@aws-sdk/client-bedrock-runtime');

// Debug: Check if environment variables are loaded
console.log('🔍 AWS Credentials Check:');
console.log('AWS_ACCESS_KEY_ID present:', !!process.env.AWS_ACCESS_KEY_ID);
console.log('AWS_SECRET_ACCESS_KEY present:', !!process.env.AWS_SECRET_ACCESS_KEY);
console.log('AWS_REGION:', process.env.AWS_REGION || 'us-east-1');

// Request throttling to prevent rate limiting
let lastRequestTime = 0;
const minRequestInterval = 500; // 500ms between requests

// Initialize Bedrock client with better error handling
let bedrockClient;
try {
  bedrockClient = new BedrockRuntimeClient({
    region: process.env.AWS_REGION || 'us-east-1',
    credentials: {
      accessKeyId: process.env.AWS_ACCESS_KEY_ID,
      secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
    },
  });
  console.log('✅ Bedrock client initialized successfully');
} catch (error) {
  console.error('❌ Failed to initialize Bedrock client:', error);
  throw error;
}

function getModelFormat(modelId) {
  if (modelId.includes('titan')) {
    return 'titan';
  } else if (modelId.includes('mistral')) {
    return 'mistral';
  } else if (modelId.includes('claude')) {
    return 'claude';
  } else if (modelId.includes('llama')) {
    return 'llama';
  } else if (modelId.includes('ai21')) {
    return 'ai21';
  } else if (modelId.includes('cohere')) {
    return 'cohere';
  } else {
    return 'titan'; // default to titan format
  }
}

function formatRequestForModel(messages, modelId, temperature) {
  const format = getModelFormat(modelId);
  
  switch (format) {
    case 'titan':
      const titanPrompt = messages.map(msg => {
        if (msg.role === 'user') {
          return `User: ${msg.content}`;
        } else if (msg.role === 'assistant') {
          return `Bot: ${msg.content}`;
        }
        return msg.content;
      }).join('\n') + '\nBot:';

      return {
        inputText: titanPrompt,
        textGenerationConfig: {
          maxTokenCount: 4096,
          temperature: temperature,
          topP: 1,
          stopSequences: ['User:']
        }
      };
    
    case 'mistral':
      const mistralPrompt = messages.map(msg => {
        if (msg.role === 'user') {
          return `[INST] ${msg.content} [/INST]`;
        } else if (msg.role === 'assistant') {
          return msg.content;
        }
        return msg.content;
      }).join('\n');

      return {
        prompt: mistralPrompt,
        max_tokens: 4096,
        temperature: temperature,
        top_p: 1
      };
    
    case 'claude':
      const claudePrompt = messages.map(msg => {
        if (msg.role === 'user') {
          return `Human: ${msg.content}`;
        } else if (msg.role === 'assistant') {
          return `Assistant: ${msg.content}`;
        }
        return msg.content;
      }).join('\n\n') + '\n\nAssistant:';

      return {
        prompt: claudePrompt,
        max_tokens: 4096,
        temperature: temperature,
        top_p: 1,
        stop_sequences: ['\n\nHuman:']
      };
    
    default:
      // Default to titan format
      const defaultPrompt = messages.map(msg => {
        if (msg.role === 'user') {
          return `User: ${msg.content}`;
        } else if (msg.role === 'assistant') {
          return `Bot: ${msg.content}`;
        }
        return msg.content;
      }).join('\n') + '\nBot:';

      return {
        inputText: defaultPrompt,
        textGenerationConfig: {
          maxTokenCount: 4096,
          temperature: temperature,
          topP: 1,
          stopSequences: ['User:']
        }
      };
  }
}

function parseResponseForModel(responseBody, modelId) {
  const format = getModelFormat(modelId);
  
  try {
    switch (format) {
      case 'titan':
        return responseBody.results[0].outputText;
      case 'mistral':
        return responseBody.outputs[0].text;
      case 'claude':
        return responseBody.completion;
      case 'llama':
        return responseBody.generation;
      case 'ai21':
        return responseBody.completions[0].data.text;
      case 'cohere':
        return responseBody.generations[0].text;
      default:
        return responseBody.results[0].outputText;
    }
  } catch (error) {
    console.error('Error parsing response:', error);
    return JSON.stringify(responseBody);
  }
}

async function callLLM({ messages, model = 'mistral.mixtral-8x7b-instruct-v0:1', temperature = 0.2 }) {
  const maxRetries = 10;
  const baseDelay = 1000; // 1 second

  // Throttle requests to prevent rate limiting
  const now = Date.now();
  const timeSinceLastRequest = now - lastRequestTime;
  if (timeSinceLastRequest < minRequestInterval) {
    const waitTime = minRequestInterval - timeSinceLastRequest;
    console.log(`⏳ Throttling request. Waiting ${waitTime}ms...`);
    await new Promise(resolve => setTimeout(resolve, waitTime));
  }
  lastRequestTime = Date.now();

  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      const requestBody = formatRequestForModel(messages, model, temperature);

      const command = new InvokeModelCommand({
        modelId: model,
        contentType: 'application/json',
        body: JSON.stringify(requestBody),
      });

      const response = await bedrockClient.send(command);
      const responseBody = JSON.parse(new TextDecoder().decode(response.body));
      
      const result = parseResponseForModel(responseBody, model).trim();
      console.log('🤖 Bedrock LLM Response:', result);
      return result;
    } catch (error) {
      console.error(`Bedrock LLM error (attempt ${attempt}/${maxRetries}):`, error.message);
      
      // Check if it's a throttling error
      if (error.name === 'ThrottlingException' || error.message.includes('Too many requests')) {
        if (attempt < maxRetries) {
          const delay = baseDelay * Math.pow(2, attempt - 1); // Exponential backoff
          console.log(`⏳ Rate limited. Waiting ${delay}ms before retry...`);
          await new Promise(resolve => setTimeout(resolve, delay));
          continue;
        }
      }
      
      // If it's not a throttling error or we've exhausted retries, throw the error
      if (attempt === maxRetries) {
        throw new Error('Bedrock LLM call failed after all retries');
      }
    }
  }
}

module.exports = { callLLM }; 