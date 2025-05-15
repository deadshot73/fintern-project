import React from 'react';
import { Button } from 'react-bootstrap';

function Citations({ onClose }) {
  return (
    <div className="h-100 d-flex flex-column">
      <div className="d-flex justify-content-between align-items-center mb-3">
        <h5 className="m-0">Citations</h5>
        <Button variant="outline-secondary" size="sm" onClick={onClose}>Close</Button>
      </div>
      <div className="overflow-auto">
        <p><strong>Apple 2023 Annual Report</strong></p>
        <p>Pages 44–48 discuss the financial performance in depth...</p>
      </div>
    </div>
  );
}

export default Citations;
