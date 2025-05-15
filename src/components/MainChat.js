import React, { useState } from 'react';
import ChatWindow from './ChatWindow';
import InputBar from './InputBar';
import axios from 'axios';

function MainChat() {
  const [messages, setMessages] = useState([]);

  const handleSendMessage = async (userMessage) => {
    // 1. Add user message
    setMessages(prev => [...prev, { sender: 'user', type: 'text', content: userMessage }]);

    try {
      // 2. Send to backend
      const res = await axios.post('http://localhost:5000/api/query', { prompt: userMessage });
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
