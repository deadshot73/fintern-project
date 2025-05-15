import React, { useState, useEffect } from 'react';
import './App.css';
import Sidebar from './components/Sidebar';
import Sidepane from './components/Sidepane';
import ChatWindow from './components/ChatWindow';
import InputBar from './components/InputBar';
import Citations from './components/Citations';
import axios from 'axios';
import { useNavigate, useParams } from 'react-router-dom';


function App() {
  const [isSidepaneOpen, setIsSidepaneOpen] = useState(true);
  const [showCitations, setShowCitations] = useState(false); // toggle this later dynamically
  const [messages, setMessages] = useState([
    { sender: 'user', type: 'text', content: 'Show me Apple revenue' },
    { sender: 'agent', type: 'text', content: 'Apple’s revenue for 2023 is $394.3B' },
    { sender: 'agent', type: 'latex', content: 'R = \\sum_{i=1}^n P_i \\cdot Q_i' },
    { sender: 'agent', type: 'table', content: [{ Year: 2022, Revenue: 300 }, { Year: 2023, Revenue: 394 }] },
  ]);
  
const [chatId, setChatId] = useState(null);
const navigate = useNavigate();
// eslint-disable-next-line
const params = useParams();
useEffect(() => {
  const loadChat = async () => {
    const { chat_id } = params;
    if (chat_id) {
      try {
        const res = await axios.get(`http://localhost:5000/api/chat/${chat_id}`);
        setMessages(res.data.messages);
        setChatId(chat_id);
      } catch (err) {
        console.error('Failed to load chat', err);
      }
    }
  };

  loadChat();
}, [params]);


const handleSendMessage = async (userMessage) => {
  const userMsg = { sender: 'user', text: userMessage };
  const botMsg = { sender: 'bot', text: `You said: ${userMessage}` };

  // Add user message to UI
  setMessages(prev => [...prev, userMsg]);

  if (!chatId) {
    const userId = localStorage.getItem('userId');
    try {
      const res = await axios.post('http://localhost:5000/api/chat/start', {
        userId,
        message: userMessage
      });

      const newChatId = res.data.chatId;
      setChatId(newChatId);

      // Save bot message after chatId is available
      setTimeout(async () => {
        setMessages(prev => [...prev, botMsg]);
        await axios.post(`http://localhost:5000/api/chat/${newChatId}/message`, botMsg);
        navigate(`/chat/${newChatId}`); // Navigate at the end
      }, 500);
    } catch (err) {
      console.error('Error creating chat session:', err);
    }
  } else {
    await axios.post(`http://localhost:5000/api/chat/${chatId}/message`, userMsg);

    setTimeout(async () => {
      setMessages(prev => [...prev, botMsg]);
      await axios.post(`http://localhost:5000/api/chat/${chatId}/message`, botMsg);
    }, 500);
  }
};





  return (
    <div className="container-fluid">
      <div className="row vh-100">
        <div className={isSidepaneOpen ? "col-md-2 bg-light p-0" : "col-md-1 bg-light p-0"}>
          {isSidepaneOpen ? (
            <Sidepane onCollapse={() => setIsSidepaneOpen(false)} />
          ) : (
            <Sidebar onExpand={() => setIsSidepaneOpen(true)} />
          )}
        </div>

        <div className={showCitations ? "col-md-7 d-flex flex-column p-0" : "col-md-9 d-flex flex-column p-0"}>
          <ChatWindow messages={messages} />
          <InputBar onSendMessage={handleSendMessage} />
        </div>

        {showCitations && (
          <div className="col-md-3 bg-light p-3 border-start">
            <Citations onClose={() => setShowCitations(false)} />
          </div>
        )}
      </div>
    </div>
  );
}

export default App;