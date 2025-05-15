import React, { useState } from 'react';
import { Form, Button, InputGroup } from 'react-bootstrap';

function InputBar({ onSendMessage }) {
  const [input, setInput] = useState('');

  const handleSend = () => {
    if (input.trim() !== '') {
      onSendMessage(input.trim());
      setInput('');
    }
  };

  const handleKeyPress = e => {
    if (e.key === 'Enter') {
      e.preventDefault();
      handleSend();
    }
  };

  return (
    <div className="p-3 bg-light border-top">
      <InputGroup>
        <Form.Control
          type="text"
          placeholder="Type your message..."
          value={input}
          onChange={e => setInput(e.target.value)}
          onKeyDown={handleKeyPress}
        />
        <Button variant="primary" onClick={handleSend}>
          Send
        </Button>
      </InputGroup>
    </div>
  );
}

export default InputBar;
