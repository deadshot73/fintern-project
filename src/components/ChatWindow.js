import React from 'react';
import MessageWrapper from './ChatMessages/MessageWrapper';
import { useEffect, useRef } from 'react';

function ChatWindow({ messages }) {
  const endRef = useRef();

  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  return (
    <div className="flex-grow-1 overflow-auto p-3 bg-white border-bottom d-flex flex-column">
      {messages.map((msg, idx) => (
        <div key={idx} className="mb-2">
          <MessageWrapper message={msg} />
        </div>
      ))}
      <div ref={endRef} />
    </div>
  );
}

export default ChatWindow;

