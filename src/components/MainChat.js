import React, { useState, useEffect } from 'react';
import ChatWindow from './ChatWindow';
import InputBar from './InputBar';
import axios from 'axios';

function MainChat() {
  const [messages, setMessages] = useState([]);
  const [chatId, setChatId] = useState(null);
  const [userId, setUserId] = useState(null);

  // Initialize chat session and get user info
  useEffect(() => {
    const storedUserId = localStorage.getItem('userId');
    if (storedUserId) {
      setUserId(storedUserId);
      // Create a new chat session
      createChatSession(storedUserId);
    }
  }, []);

  const createChatSession = async (userId) => {
    try {
      const res = await axios.post('http://localhost:5000/api/chat/start', {
        userId,
        message: 'Chat session started'
      });
      setChatId(res.data.chatId);
    } catch (error) {
      console.error('Failed to create chat session:', error);
    }
  };

  const handleSendMessage = async (userMessage) => {
    // 1. Add user message
    setMessages(prev => [...prev, { sender: 'user', type: 'text', content: userMessage }]);

    try {
      // 2. Send to backend with user context
      const res = await axios.post('http://localhost:5000/api/query', { 
        prompt: userMessage,
        userId: userId,
        chatId: chatId
      });
      const response = res.data;

      // 3. Add response(s)
      const newMessages = Array.isArray(response) ? response : [response];
      setMessages(prev => [...prev, ...newMessages]);

    } catch (err) {
      // 4. Fallback error message
      setMessages(prev => [...prev, {
        sender: 'agent',
        type: 'text',
        content: 'Something went wrong. Please try again.'
      }]);
    }
  };

  return (
    <div className="d-flex flex-column vh-100">
      <ChatWindow messages={messages} />
      <InputBar onSendMessage={handleSendMessage} />
    </div>
  );
}

export default MainChat;
