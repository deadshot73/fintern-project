import React, { useState, useEffect } from 'react';
import './App.css';
import Sidebar from './components/Sidebar';
import Sidepane from './components/Sidepane';
import ChatWindow from './components/ChatWindow';
import InputBar from './components/InputBar';
import Citations from './components/Citations';
import ReportModal from './components/ReportModal';
import axios from 'axios';
import { useNavigate, useParams } from 'react-router-dom';


function App() {
  const [isSidepaneOpen, setIsSidepaneOpen] = useState(true);
  const [showCitations, setShowCitations] = useState(false); // toggle this later dynamically
  const [messages, setMessages] = useState([]);
  const [isReportMode, setIsReportMode] = useState(false);
  const [selectedEntities, setSelectedEntities] = useState(new Set());
  const [showReportModal, setShowReportModal] = useState(false);
  const [pendingReportData, setPendingReportData] = useState(null);
  const [isSavingReport, setIsSavingReport] = useState(false);
  
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
          // Convert old message format to new format
          const convertedMessages = res.data.messages.map(msg => ({
            sender: msg.sender,
            type: msg.type || 'text',
            content: msg.content || msg.text || '[No content]'
          }));
          setMessages(convertedMessages);
          setChatId(chat_id);
        } catch (err) {
          console.error('Failed to load chat', err);
        }
      }
    };

    loadChat();
  }, [params]);


  // Group messages into entities (user message + following AI messages)
  const groupMessagesIntoEntities = (messages) => {
    const entities = [];
    let currentEntity = null;
    let serialNumber = 1;

    messages.forEach((msg, idx) => {
      if (msg.sender === 'user') {
        // Save previous entity if exists
        if (currentEntity) {
          entities.push(currentEntity);
        }
        // Start new entity
        currentEntity = {
          serialNumber: serialNumber++,
          userMessage: msg.content,
          aiMessages: [],
          startIndex: idx
        };
      } else if (msg.sender === 'agent' && currentEntity) {
        // Add AI message to current entity
        currentEntity.aiMessages.push({
          type: msg.type,
          content: msg.content
        });
      }
    });

    // Don't forget the last entity
    if (currentEntity) {
      entities.push(currentEntity);
    }

    return entities;
  };

  const handleEntityToggle = (serialNumber) => {
    setSelectedEntities(prev => {
      const newSet = new Set(prev);
      if (newSet.has(serialNumber)) {
        newSet.delete(serialNumber);
      } else {
        newSet.add(serialNumber);
      }
      return newSet;
    });
  };

  const handleDoneReport = async () => {
    if (selectedEntities.size === 0) {
      alert('Please select at least one entity to include in the report.');
      return;
    }

    const userId = localStorage.getItem('userId');
    if (!userId || !chatId) {
      alert('User ID or Chat ID missing. Please ensure you are logged in.');
      return;
    }

    const entities = groupMessagesIntoEntities(messages);
    const selectedEntityNumbers = Array.from(selectedEntities).sort((a, b) => a - b);
    const selectedEntitiesData = entities
      .filter(entity => selectedEntities.has(entity.serialNumber))
      .map(entity => ({
        serialNumber: entity.serialNumber,
        userMessage: entity.userMessage,
        aiMessages: entity.aiMessages
      }));

    // Store the data and show modal (summaries will be generated on save)
    setPendingReportData({
      userId,
      chatId,
      selectedEntities: selectedEntitiesData,
      selectedEntityNumbers
    });
    setShowReportModal(true);
  };

  const handleSaveReportMetadata = async ({ reportName, existingReportId }) => {
    if (!pendingReportData) {
      return;
    }

    setIsSavingReport(true);

    try {
      // Generate summaries between consecutive entities
      let summaries = [];
      if (pendingReportData.selectedEntityNumbers && pendingReportData.selectedEntityNumbers.length >= 2) {
        try {
          const summariesResponse = await axios.post('http://localhost:5000/api/generate-summaries', {
            chatId: pendingReportData.chatId,
            selectedEntityNumbers: pendingReportData.selectedEntityNumbers,
            allMessages: messages
          });
          summaries = summariesResponse.data.summaries || [];
        } catch (summaryError) {
          console.error('Error generating summaries:', summaryError);
          // Continue with save even if summaries fail
        }
      }

      // Save report metadata with summaries
      const response = await axios.post('http://localhost:5000/api/report-metadata', {
        userId: pendingReportData.userId,
        chatId: pendingReportData.chatId,
        reportName,
        selectedEntities: pendingReportData.selectedEntities,
        summaries,
        existingReportId
      });

      if (response.status === 200) {
        alert('Report saved successfully!');
        setShowReportModal(false);
        setIsReportMode(false);
        setSelectedEntities(new Set());
        setPendingReportData(null);
      }
    } catch (error) {
      console.error('Error saving report metadata:', error);
      alert('Failed to save report. Please try again.');
    } finally {
      setIsSavingReport(false);
    }
  };

  const handleSendMessage = async (userMessage) => {
    const userMsg = { sender: 'user', type: 'text', content: userMessage };

    // Add user message to UI
    setMessages(prev => [...prev, userMsg]);

    try {
      // Send to AI pipeline
      const res = await axios.post('http://localhost:5000/api/query', { prompt: userMessage });
      const response = res.data;

      // Add response(s) from AI
      const newMessages = Array.isArray(response) ? response : [response];
      setMessages(prev => [...prev, ...newMessages]);

      // Save to database if chatId exists
      if (chatId) {
        // Save user message
        await axios.post(`http://localhost:5000/api/chat/${chatId}/message`, {
          sender: 'user',
          type: 'text',
          content: userMessage
        });

        // Save AI responses
        for (const msg of newMessages) {
          await axios.post(`http://localhost:5000/api/chat/${chatId}/message`, msg);
        }
      } else {
        // Create new chat session
        const userId = localStorage.getItem('userId');
        if (userId) {
          const chatRes = await axios.post('http://localhost:5000/api/chat/start', {
            userId,
            message: userMessage
          });

          const newChatId = chatRes.data.chatId;
          setChatId(newChatId);

          // Save AI responses
          for (const msg of newMessages) {
            await axios.post(`http://localhost:5000/api/chat/${newChatId}/message`, msg);
          }

          navigate(`/chat/${newChatId}`);
        }
      }
    } catch (err) {
      console.error('Error processing message:', err);
      // Add error message
      setMessages(prev => [...prev, {
        sender: 'agent',
        type: 'text',
        content: 'Sorry, I encountered an error while processing your query. Please try again.'
      }]);
    }
  };

  return (
    <div className="container-fluid h-100">
      <div className="row h-100">
        {/* Sticky Sidepane */}
        <div className={`sticky-sidepane ${isSidepaneOpen ? "col-md-2" : "col-md-1"} bg-light p-0`}>
          {isSidepaneOpen ? (
            <Sidepane onCollapse={() => setIsSidepaneOpen(false)} />
          ) : (
            <Sidebar onExpand={() => setIsSidepaneOpen(true)} />
          )}
        </div>

        {/* Main Chat Area with offset for fixed sidepane */}
        <div className={isSidepaneOpen ? "col-md-2" : "col-md-1"}></div>
        <div className={`${showCitations ? "col-md-7" : "col-md-9"} d-flex flex-column p-0`} style={{ height: '100vh', minHeight: 0 }}>
          {/* Header with Generate Report button */}
          <div className="d-flex justify-content-between align-items-center p-2 border-bottom bg-white">
            <h5 className="m-0">Chat</h5>
            <div className="d-flex gap-2">
              {isReportMode && selectedEntities.size > 0 && (
                <button
                  className="btn btn-success btn-sm"
                  onClick={handleDoneReport}
                >
                  Done
                </button>
              )}
              <button
                className="btn btn-primary btn-sm"
                onClick={() => {
                  setIsReportMode(!isReportMode);
                  if (isReportMode) {
                    setSelectedEntities(new Set());
                  }
                }}
              >
                {isReportMode ? 'Cancel' : 'Generate Report'}
              </button>
            </div>
          </div>
          <div className="flex-grow-1 overflow-hidden">
            <ChatWindow 
              messages={messages} 
              isReportMode={isReportMode}
              selectedEntities={selectedEntities}
              onEntityToggle={handleEntityToggle}
            />
          </div>
          <InputBar onSendMessage={handleSendMessage} />
        </div>

        {showCitations && (
          <div className="col-md-3 bg-light p-3 border-start">
            <Citations onClose={() => setShowCitations(false)} />
          </div>
        )}
      </div>

      {/* Report Modal */}
      <ReportModal
        show={showReportModal}
        onHide={() => {
          if (!isSavingReport) {
            setShowReportModal(false);
            setPendingReportData(null);
          }
        }}
        onSave={handleSaveReportMetadata}
        userId={localStorage.getItem('userId')}
        chatId={chatId}
        isLoading={isSavingReport}
      />
    </div>
  );
}

export default App;