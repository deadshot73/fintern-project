import React from 'react';
import { Button, OverlayTrigger, Tooltip } from 'react-bootstrap';
import { useNavigate } from 'react-router-dom';

function Sidebar({ onExpand }) {
  const navigate = useNavigate();
  
  const navItems = [
    { key: 'expand', label: 'Expand', symbol: '≡', onClick: onExpand },
    { key: 'account', label: 'Account', symbol: '👤' },
    { key: 'newChat', label: 'New Chat', symbol: '💬' },
    { key: 'reports', label: 'Reports', symbol: '📄', onClick: () => navigate('/reports') },
    { key: 'genReport', label: 'Generate', symbol: '📝' },
    { key: 'chats', label: 'Chats', symbol: '🕘' },
    { key: 'downloads', label: 'Downloads', symbol: '⬇️' },
  ];

  return (
    <div className="d-flex flex-column align-items-center justify-content-start h-100 py-3 bg-light border-end gap-3">
      {navItems.map(({ key, label, symbol, onClick }) => (
        <OverlayTrigger key={key} placement="right" overlay={<Tooltip>{label}</Tooltip>}>
          <Button
            variant="light"
            size="sm"
            onClick={onClick || (() => {})}
            className="rounded-circle text-center"
            style={{ width: '36px', height: '36px' }}
          >
            {symbol}
          </Button>
        </OverlayTrigger>
      ))}
    </div>
  );
}

export default Sidebar;
