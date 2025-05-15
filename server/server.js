require('dotenv').config();
const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const bcrypt = require('bcryptjs');
const User = require('./userModel');
const ChatSession = require('./chatSessionModel');
const companyRoutes = require('./routes/companies');
const financialRoutes = require('./routes/financials');


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
  const { username, email, password } = req.body;

  const existingUser = await User.findOne({ email });
  if (existingUser) {
    return res.status(409).json({ error: 'User already registered' });
  }

  const hashedPassword = await bcrypt.hash(password, 10);
  const newUser = new User({ username, email, password: hashedPassword });

  await newUser.save();
  res.json({ message: 'User registered successfully' });
});

app.post('/api/login', async (req, res) => {
    const { email, password } = req.body;
  
    const user = await User.findOne({ email });
    if (!user) {
      return res.status(401).json({ error: 'User not found' });
    }
  
    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(401).json({ error: 'Invalid password' });
    }
  
    res.json({ message: 'Login successful', username: user.username, userId: user._id });
  });

  app.post('/api/chat/start', async (req, res) => {
    const { userId, message } = req.body;
  
    try {
      const session = new ChatSession({
        userId,
        messages: [{ sender: 'user', text: message }]
      });
  
      await session.save();
      res.json({ chatId: session._id });
    } catch (error) {
      console.error(error);
      res.status(500).json({ error: 'Failed to create chat session' });
    }
  });
  
  app.post('/api/chat/:chatId/message', async (req, res) => {
    const { sender, text } = req.body;
    const { chatId } = req.params;
  
    try {
      const chat = await ChatSession.findById(chatId);
      if (!chat) {
        return res.status(404).json({ error: 'Chat session not found' });
      }
  
      chat.messages.push({ sender, text });
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
  
  

app.listen(5000, () => console.log('Server running on http://localhost:5000'));
