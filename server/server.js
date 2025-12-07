require('dotenv').config();

// Debug: Check environment variables
console.log('🔍 Environment Check:');
console.log('AWS_ACCESS_KEY_ID present:', !!process.env.AWS_ACCESS_KEY_ID);
console.log('AWS_SECRET_ACCESS_KEY present:', !!process.env.AWS_SECRET_ACCESS_KEY);
console.log('AWS_REGION:', process.env.AWS_REGION || 'us-east-1');

const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const bcrypt = require('bcryptjs');
const User = require('./userModel');
const ChatSession = require('./chatSessionModel');
const Report = require('./models/Report');
const ReportMetadata = require('./models/ReportMetadata');
const companyRoutes = require('./routes/companies');
const financialRoutes = require('./routes/financials');

// Import AI pipeline agents
const { runCompanyIdentifierAgent } = require('./agents/companyIdentifierAgent');
const { fetchMultipleFinancialData } = require('./agents/dataFetcher');
const { runFinancialExpertAgent } = require('./agents/financialExpertAgent');
const { runSuperAgent } = require('./agents/superAgent');
const { runExecutor } = require('./agents/executorAgent');
const { runAnswerAgent } = require('./agents/answerAgent');


const app = express();
app.use(cors());
app.use(express.json());
app.use('/api/companies', companyRoutes);
app.use('/api/companies', financialRoutes); // nested under same prefix
// MongoDB connection
mongoose.connect('mongodb+srv://mailparththakral:2Ba72zNukWjm5oiN@fintern.waeq6ms.mongodb.net/?retryWrites=true&w=majority&appName=fintern', {
    useNewUrlParser: true,
    useUnifiedTopology: true,
  });
  

// Signup API
app.post('/api/signup', async (req, res) => {
  const { email, password } = req.body;

  try {
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(409).json({ error: 'User already registered' });
    }

    const hashedPassword = await bcrypt.hash(password, 10);
    const newUser = new User({ email, password: hashedPassword });

    await newUser.save();
    res.json({ message: 'User registered successfully' });
  } catch (error) {
    console.error('Signup error:', error);
    res.status(500).json({ error: 'Failed to register user' });
  }
});

app.post('/api/login', async (req, res) => {
    const { email, password } = req.body;
  
    try {
      const user = await User.findOne({ email });
      if (!user) {
        return res.status(401).json({ error: 'User not found' });
      }
    
      const isMatch = await bcrypt.compare(password, user.password);
      if (!isMatch) {
        return res.status(401).json({ error: 'Invalid password' });
      }
    
      res.json({ 
        message: 'Login successful', 
        email: user.email, 
        userId: user._id 
      });
    } catch (error) {
      console.error('Login error:', error);
      res.status(500).json({ error: 'Login failed' });
    }
  });

  app.post('/api/chat/start', async (req, res) => {
    const { userId, message } = req.body;
  
    try {
      const session = new ChatSession({
        userId,
        messages: [{ sender: 'user', type: 'text', content: message }]
      });
  
      await session.save();
      res.json({ chatId: session._id });
    } catch (error) {
      console.error(error);
      res.status(500).json({ error: 'Failed to create chat session' });
    }
  });

  app.post('/api/chat/new', async (req, res) => {
    const { userId } = req.body;
  
    try {
      const session = new ChatSession({
        userId,
        messages: []
      });
  
      await session.save();
      res.json({ chatId: session._id });
    } catch (error) {
      console.error(error);
      res.status(500).json({ error: 'Failed to create new chat session' });
    }
  });
  
  app.post('/api/chat/:chatId/message', async (req, res) => {
    const { sender, type, content } = req.body;
    const { chatId } = req.params;
  
    try {
      const chat = await ChatSession.findById(chatId);
      if (!chat) {
        return res.status(404).json({ error: 'Chat session not found' });
      }
  
      chat.messages.push({ sender, type: type || 'text', content });
      await chat.save();
  
      res.json({ success: true });
    } catch (err) {
      console.error(err);
      res.status(500).json({ error: 'Failed to save message' });
    }
  });
  
  app.get('/api/chat/:chatId', async (req, res) => {
    const { chatId } = req.params;
  
    try {
      const chat = await ChatSession.findById(chatId);
      if (!chat) {
        return res.status(404).json({ error: 'Chat not found' });
      }
  
      res.json({ messages: chat.messages });
    } catch (err) {
      console.error(err);
      res.status(500).json({ error: 'Error fetching chat' });
    }
  });

  app.get('/api/chats/:userId', async (req, res) => {
    const { userId } = req.params;
  
    try {
      const chats = await ChatSession.find({ userId }).sort({ createdAt: -1 });
      res.json(chats);
    } catch (err) {
      console.error(err);
      res.status(500).json({ error: 'Failed to fetch chat sessions' });
    }
  });

  app.delete('/api/chat/:chatId', async (req, res) => {
    const { chatId } = req.params;
  
    try {
      const chat = await ChatSession.findByIdAndDelete(chatId);
      if (!chat) {
        return res.status(404).json({ error: 'Chat session not found' });
      }
  
      res.json({ message: 'Chat session deleted successfully' });
    } catch (err) {
      console.error(err);
      res.status(500).json({ error: 'Failed to delete chat session' });
    }
  });

  // Save report endpoint
  app.post('/api/report', async (req, res) => {
    const { userId, chatId, selectedEntities } = req.body;
  
    try {
      if (!userId || !chatId || !selectedEntities || !Array.isArray(selectedEntities)) {
        return res.status(400).json({ error: 'Missing required fields: userId, chatId, and selectedEntities array' });
      }
  
      const report = new Report({
        userId,
        chatId,
        selectedEntities
      });
  
      await report.save();
      res.json({ message: 'Report saved successfully', reportId: report._id });
    } catch (err) {
      console.error('Error saving report:', err);
      res.status(500).json({ error: 'Failed to save report' });
    }
  });

  // Get all report metadata for a user
  app.get('/api/report-metadata/:userId', async (req, res) => {
    const { userId } = req.params;
  
    try {
      const reports = await ReportMetadata.find({ userId }).sort({ createdAt: -1 });
      res.json(reports);
    } catch (err) {
      console.error('Error fetching report metadata:', err);
      res.status(500).json({ error: 'Failed to fetch report metadata' });
    }
  });

  // Generate summary between two entities
  async function generateSummaryBetweenEntities(chatId, startEntity, endEntity, allMessages) {
    try {
      // If allMessages not provided, fetch from database
      let messages = allMessages;
      if (!messages || messages.length === 0) {
        const chat = await ChatSession.findById(chatId);
        if (!chat) {
          return 'Chat session not found.';
        }
        messages = chat.messages;
      }

      // Get messages between startEntity and endEntity (inclusive)
      const entities = [];
      let currentEntity = null;
      let serialNumber = 1;

      messages.forEach((msg) => {
        const messageContent = msg.content || msg.text || '';
        if (msg.sender === 'user') {
          if (currentEntity) {
            entities.push(currentEntity);
          }
          currentEntity = {
            serialNumber: serialNumber++,
            userMessage: messageContent,
            aiMessages: []
          };
        } else if (msg.sender === 'agent' && currentEntity) {
          currentEntity.aiMessages.push({
            type: msg.type || 'text',
            content: messageContent
          });
        }
      });
      if (currentEntity) {
        entities.push(currentEntity);
      }

      // Filter entities in the range
      const relevantEntities = entities.filter(e => 
        e.serialNumber >= startEntity && e.serialNumber <= endEntity
      );

      if (relevantEntities.length === 0) {
        return 'No entities found in the specified range.';
      }

      // Create a prompt for summarization
      const conversationText = relevantEntities.map(entity => {
        const aiResponse = entity.aiMessages.map(ai => {
          if (ai.type === 'text') {
            return ai.content;
          } else if (ai.type === 'table') {
            return `[Table data: ${JSON.stringify(ai.content)}]`;
          } else if (ai.type === 'graph') {
            return `[Graph: ${ai.content.title || 'Chart'}]`;
          } else if (ai.type === 'latex') {
            return `[Formula: ${ai.content}]`;
          }
          return JSON.stringify(ai.content);
        }).join('\n');

        return `User: ${entity.userMessage}\nAI: ${aiResponse}`;
      }).join('\n\n');

      const { callLLM } = require('./utils/bedrockClient');
      const summaryPrompt = `Please provide a concise summary of the following conversation between a user and a financial AI assistant. Focus on the key financial insights, calculations, and conclusions discussed.

Conversation:
${conversationText}

Summary:`;

      const summary = await callLLM({
        messages: [
          { role: 'user', content: summaryPrompt }
        ],
        temperature: 0.3
      });

      return summary.trim();
    } catch (error) {
      console.error('Error generating summary:', error);
      return `Summary generation failed: ${error.message}`;
    }
  }

  // Save report metadata with summaries
  app.post('/api/report-metadata', async (req, res) => {
    const { userId, chatId, reportName, selectedEntities, summaries, existingReportId } = req.body;
  
    try {
      if (!userId || !chatId || !reportName || !selectedEntities || !Array.isArray(selectedEntities)) {
        return res.status(400).json({ error: 'Missing required fields' });
      }

      if (existingReportId) {
        // Add to existing report metadata
        const existingReport = await ReportMetadata.findById(existingReportId);
        if (!existingReport) {
          return res.status(404).json({ error: 'Report metadata not found' });
        }

        // Merge entities and summaries
        existingReport.selectedEntities.push(...selectedEntities);
        existingReport.summaries.push(...(summaries || []));
        existingReport.updatedAt = new Date();

        await existingReport.save();
        res.json({ message: 'Report metadata updated successfully', reportId: existingReport._id });
      } else {
        // Create new report metadata
        const reportMetadata = new ReportMetadata({
          userId,
          chatId,
          reportName,
          selectedEntities,
          summaries: summaries || []
        });

        await reportMetadata.save();
        res.json({ message: 'Report metadata saved successfully', reportId: reportMetadata._id });
      }
    } catch (err) {
      console.error('Error saving report metadata:', err);
      res.status(500).json({ error: 'Failed to save report metadata' });
    }
  });

  // Generate summaries endpoint
  app.post('/api/generate-summaries', async (req, res) => {
    const { chatId, selectedEntityNumbers, allMessages } = req.body;
  
    try {
      if (!chatId || !selectedEntityNumbers || !Array.isArray(selectedEntityNumbers) || selectedEntityNumbers.length < 2) {
        return res.status(400).json({ error: 'Invalid request: need at least 2 selected entities' });
      }

      // Sort entity numbers
      const sortedEntities = [...selectedEntityNumbers].sort((a, b) => a - b);
      const summaries = [];

      // Generate summaries between consecutive entities
      for (let i = 0; i < sortedEntities.length - 1; i++) {
        const startEntity = sortedEntities[i];
        const endEntity = sortedEntities[i + 1];
        
        const summaryContent = await generateSummaryBetweenEntities(
          chatId,
          startEntity,
          endEntity,
          allMessages
        );

        summaries.push({
          name: `summary_${startEntity}_${endEntity}`,
          startEntity,
          endEntity,
          content: summaryContent
        });
      }

      res.json({ summaries });
    } catch (err) {
      console.error('Error generating summaries:', err);
      res.status(500).json({ error: 'Failed to generate summaries' });
    }
  });

  // Logout endpoint (for future session management)
  app.post('/api/logout', async (req, res) => {
    try {
      // For now, just return success (client will clear localStorage)
      res.json({ message: 'Logged out successfully' });
    } catch (error) {
      console.error('Logout error:', error);
      res.status(500).json({ error: 'Logout failed' });
    }
  });

  // AI Query endpoint
  app.post('/api/query', async (req, res) => {
    const { prompt, userId, chatId } = req.body;
  
    try {
      console.log('👤 User Query:', prompt);
      
      // Save user message to chat session if userId and chatId provided
      if (userId && chatId) {
        try {
          const chat = await ChatSession.findById(chatId);
          if (chat) {
            chat.messages.push({ 
              sender: 'user', 
              type: 'text', 
              content: prompt 
            });
            await chat.save();
          }
        } catch (error) {
          console.error('Failed to save user message:', error);
        }
      }
  
      // Step 1: Company Identifier Agent
      const meta = await runCompanyIdentifierAgent(prompt);
      console.log('🧠 Identifier:', meta);
  
      if (!meta?.mapping || meta.mapping.length === 0) {
        return res.json([{
          sender: 'agent',
          type: 'text',
          content: 'I could not identify any companies in your query. Please try rephrasing your question with specific company names or ticker symbols.'
        }]);
      }
  
            // Step 2: Fetch all financial data entries
      const finData = await fetchMultipleFinancialData(meta.mapping);
      if (!finData || finData.length === 0) {
        return res.json([{
          sender: 'agent',
          type: 'text',
          content: 'I could not find financial data for the requested companies. Please check the company names and try again.'
        }]);
      }

      console.log(`📊 Fetched ${finData.length} data files`);
      console.log('📊 Raw Financial Data:', JSON.stringify(finData, null, 2));
  
      // Step 3: Run Financial Expert Agent
      const expert = await runFinancialExpertAgent({
        userPrompt: prompt,
        data: finData
      });
  
            console.log('🧠 Expert Agent Output:', JSON.stringify(expert, null, 2));

      // Check if expert agent failed
      if (!expert) {
        return res.json([{
          sender: 'agent',
          type: 'text',
          content: 'I encountered an error while analyzing your query. Please try rephrasing your question or try again later.'
        }]);
      }

      // Check if expert agent returned valid response
      if (!expert.type) {
        return res.json([{
          sender: 'agent',
          type: 'text',
          content: 'I could not understand your query properly. Please try rephrasing your question.'
        }]);
      }

      // Step 4A: Direct answer
      if (expert.type === 'direct_answer') {
        const answer = await runAnswerAgent({
          userPrompt: prompt,
          plan: [{ agent: 'direct_answer' }],
          context: {
            [expert.key]: expert.values,
            message: expert.message
          }
        });
  
        if (answer?.render_plan) {
          console.log('🎨 Direct Answer Render Plan:', answer.render_plan);
          const messages = answer.render_plan.map(item => {
            let type;
            switch (item.component) {
              case 'AgentText':
                type = 'text';
                break;
              case 'AgentTable':
                type = 'table';
                break;
              case 'AgentGraph':
                type = 'graph';
                break;
              case 'AgentLatex':
                type = 'latex';
                break;
              default:
                type = 'text';
            }
            const message = {
              sender: 'agent',
              type: type,
              content: item.data
            };
            console.log('📝 Direct Answer Message:', message);
            return message;
          });
          console.log('📨 Direct Answer Messages:', messages);
          
          // Save agent messages to chat session
          if (userId && chatId) {
            try {
              const chat = await ChatSession.findById(chatId);
              if (chat) {
                messages.forEach(msg => {
                  chat.messages.push(msg);
                });
                await chat.save();
              }
            } catch (error) {
              console.error('Failed to save agent messages:', error);
            }
          }
          
          return res.json(messages);
        }
      }
  
            // Step 4B: Instruction → Super Agent → Plan
      const plan = await runSuperAgent({
        userPrompt: prompt,
        instruction: expert.instruction,
        metadata: meta.mapping,
        data: finData
      });

      console.log('📋 Super Agent Plan:', JSON.stringify(plan, null, 2));

      if (!plan?.steps) {
        return res.json([{
          sender: 'agent',
          type: 'text',
          content: 'I could not create a plan to answer your query. Please try rephrasing your question.'
        }]);
      }
  
      // Step 5: Execute the plan
      const context = await runExecutor(plan, finData, prompt);
      console.log('✅ Execution Context:', context);
  
      // Step 6: Generate final answer
      const finalAnswer = await runAnswerAgent({
        userPrompt: prompt,
        plan: plan.steps,
        context: context
      });
  
      if (finalAnswer?.render_plan) {
        console.log('🎨 Render Plan:', finalAnswer.render_plan);
        const messages = finalAnswer.render_plan.map(item => {
          let type;
          switch (item.component) {
            case 'AgentText':
              type = 'text';
              break;
            case 'AgentTable':
              type = 'table';
              break;
            case 'AgentGraph':
              type = 'graph';
              break;
            case 'AgentLatex':
              type = 'latex';
              break;
            default:
              type = 'text';
          }
          const message = {
            sender: 'agent',
            type: type,
            content: item.data
          };
          console.log('📝 Generated Message:', message);
          return message;
        });
        console.log('📨 Final Messages:', messages);
        
        // Save agent messages to chat session
        if (userId && chatId) {
          try {
            const chat = await ChatSession.findById(chatId);
            if (chat) {
              messages.forEach(msg => {
                chat.messages.push(msg);
              });
              await chat.save();
            }
          } catch (error) {
            console.error('Failed to save agent messages:', error);
          }
        }
        
        return res.json(messages);
      } else {
        return res.json([{
          sender: 'agent',
          type: 'text',
          content: 'I processed your query but could not generate a proper response. Please try again.'
        }]);
      }
  
    } catch (error) {
      console.error('❌ Query processing error:', error);
      res.json([{
        sender: 'agent',
        type: 'text',
        content: 'Sorry, I encountered an error while processing your query. Please try again.'
      }]);
    }
  });
  
  

app.listen(5000, () => console.log('Server running on http://localhost:5000'));
