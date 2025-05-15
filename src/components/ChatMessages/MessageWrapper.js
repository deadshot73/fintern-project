import UserMessage from './UserMessage';
import AgentText from './AgentText';
import AgentTable from './AgentTable';
import AgentGraph from './AgentGraph';
import AgentLatex from './AgentLatex';
import React from 'react';

export default function MessageWrapper({ message }) {
  const { sender, type, content } = message || {};

  if (!message) {
    return <div className="text-muted">[No message provided]</div>;
  }

  if (sender === 'user') {
    return <UserMessage text={content || '[No content]'} />;
  }

  if (!type) {
    return <div className="text-muted">[Missing message type]</div>;
  }

  switch (type) {
    case 'text':
      return <AgentText text={content} />;
    case 'table':
      return <AgentTable data={content} />;
    case 'graph':
      return <AgentGraph chartData={content} />;
    case 'latex':
      return <AgentLatex latex={content} />;
    default:
      return <div className="text-muted">[Unknown message type]</div>;
  }
}
