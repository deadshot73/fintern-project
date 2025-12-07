import React from 'react';
import MessageWrapper from './ChatMessages/MessageWrapper';
import { useEffect, useRef } from 'react';

function ChatWindow({ messages, isReportMode = false, selectedEntities = new Set(), onEntityToggle }) {
  const chatContainerRef = useRef();

  // Group messages into entities (user message + following AI messages)
  const groupMessagesIntoEntities = (messages) => {
    const entities = [];
    let currentEntity = null;
    let serialNumber = 1;
    let currentEntityMessages = [];

    messages.forEach((msg, idx) => {
      if (msg.sender === 'user') {
        // Save previous entity if exists
        if (currentEntity) {
          entities.push({
            ...currentEntity,
            messages: currentEntityMessages
          });
        }
        // Start new entity
        currentEntity = {
          serialNumber: serialNumber++,
          userMessage: msg.content,
          aiMessages: []
        };
        currentEntityMessages = [msg];
      } else if (msg.sender === 'agent' && currentEntity) {
        // Add AI message to current entity
        currentEntity.aiMessages.push({
          type: msg.type,
          content: msg.content
        });
        currentEntityMessages.push(msg);
      }
    });

    // Don't forget the last entity
    if (currentEntity) {
      entities.push({
        ...currentEntity,
        messages: currentEntityMessages
      });
    }

    return entities;
  };

  const scrollToBottom = () => {
    if (chatContainerRef.current) {
      chatContainerRef.current.scrollTop = chatContainerRef.current.scrollHeight;
    }
  };

  useEffect(() => {
    // Scroll to bottom when new messages are added or on initial load
    if (chatContainerRef.current && messages.length > 0) {
      const isAtBottom = chatContainerRef.current.scrollTop + chatContainerRef.current.clientHeight >= chatContainerRef.current.scrollHeight - 10;
      
      if (isAtBottom) {
        chatContainerRef.current.scrollTop = chatContainerRef.current.scrollHeight;
      }
    }
  }, [messages]);

  // Scroll to bottom on initial load and when messages change
  useEffect(() => {
    if (messages.length > 0) {
      // Try immediately
      scrollToBottom();
      
      // Try after a short delay to ensure DOM is ready
      setTimeout(scrollToBottom, 50);
      
      // Try after a longer delay to ensure all content is loaded
      setTimeout(scrollToBottom, 200);
      
      // Try after images and other content are loaded
      setTimeout(scrollToBottom, 500);
      
      // Final attempt after everything should be loaded
      setTimeout(scrollToBottom, 1000);
    }
  }, [messages.length]); // Run when messages array length changes

  // Additional scroll on component mount
  useEffect(() => {
    if (messages.length > 0) {
      // Force scroll to bottom on mount
      setTimeout(scrollToBottom, 100);
      setTimeout(scrollToBottom, 300);
      setTimeout(scrollToBottom, 600);
    }
  }, []); // Empty dependency array - runs only once on mount

  useEffect(() => {
    const handleWheel = (e) => {
      const container = chatContainerRef.current;
      if (!container) return;

      const { scrollTop, scrollHeight, clientHeight } = container;
      const isAtTop = scrollTop === 0;
      const isAtBottom = scrollTop + clientHeight >= scrollHeight - 1;

      // Prevent page scroll when at top or bottom of chat
      if ((isAtTop && e.deltaY < 0) || (isAtBottom && e.deltaY > 0)) {
        e.preventDefault();
      }
    };

    const container = chatContainerRef.current;
    if (container) {
      container.addEventListener('wheel', handleWheel, { passive: false });
    }

    return () => {
      if (container) {
        container.removeEventListener('wheel', handleWheel);
      }
    };
  }, []);

  const entities = groupMessagesIntoEntities(messages);

  return (
    <div 
      ref={chatContainerRef}
      className="chat-scroll-container h-100 p-3 bg-white d-flex flex-column"
      style={{ minHeight: 0 }}
    >
      {isReportMode ? (
        // Report mode: Show entities with radio buttons
        entities.map((entity) => (
          <div 
            key={entity.serialNumber} 
            className="mb-4 border rounded p-3 position-relative"
            style={{ 
              backgroundColor: selectedEntities.has(entity.serialNumber) ? '#f0f8ff' : 'white',
              paddingRight: '50px'
            }}
          >
            {isReportMode && (
              <div 
                className="position-absolute"
                style={{ 
                  right: '15px', 
                  top: '15px',
                  zIndex: 10
                }}
              >
                <input
                  type="radio"
                  checked={selectedEntities.has(entity.serialNumber)}
                  onChange={() => onEntityToggle(entity.serialNumber)}
                  style={{ cursor: 'pointer' }}
                />
              </div>
            )}
            <div className="mb-2">
              <strong>Entity #{entity.serialNumber}</strong>
            </div>
            <div className="mb-3">
              <strong>User:</strong>
              <div className="ms-2">{entity.userMessage}</div>
            </div>
            <div>
              <strong>AI Response:</strong>
              {entity.messages.filter(m => m.sender === 'agent').map((msg, idx) => (
                <div key={idx} className="ms-2 mb-2">
                  <MessageWrapper message={msg} />
                </div>
              ))}
            </div>
          </div>
        ))
      ) : (
        // Normal mode: Show messages as usual
        messages.map((msg, idx) => (
          <div key={idx} className="mb-2">
            <MessageWrapper message={msg} />
          </div>
        ))
      )}
    </div>
  );
}

export default ChatWindow;

