import React, { useState, useEffect } from 'react';
import { Modal, Button, Form } from 'react-bootstrap';
import axios from 'axios';

function ReportModal({ show, onHide, onSave, userId, chatId, isLoading }) {
  const [reportName, setReportName] = useState('');
  const [addToExisting, setAddToExisting] = useState(false);
  const [existingReports, setExistingReports] = useState([]);
  const [selectedReportId, setSelectedReportId] = useState('');

  useEffect(() => {
    if (show && userId) {
      // Fetch existing reports when modal opens
      fetchExistingReports();
    }
  }, [show, userId]);

  const fetchExistingReports = async () => {
    try {
      const response = await axios.get(`http://localhost:5000/api/report-metadata/${userId}`);
      setExistingReports(response.data);
    } catch (error) {
      console.error('Error fetching existing reports:', error);
    }
  };

  const handleSave = () => {
    if (!reportName.trim()) {
      alert('Please enter a report name');
      return;
    }

    if (addToExisting && !selectedReportId) {
      alert('Please select an existing report');
      return;
    }

    onSave({
      reportName: reportName.trim(),
      existingReportId: addToExisting ? selectedReportId : null
    });
  };

  const handleClose = () => {
    if (isLoading) {
      return; // Prevent closing during loading
    }
    setReportName('');
    setAddToExisting(false);
    setSelectedReportId('');
    onHide();
  };

  return (
    <Modal show={show} onHide={isLoading ? undefined : handleClose} centered>
      <Modal.Header closeButton={!isLoading}>
        <Modal.Title>Save Report</Modal.Title>
      </Modal.Header>
      <Modal.Body>
        {isLoading ? (
          <div className="text-center py-4">
            <div className="spinner-border text-primary" role="status">
              <span className="visually-hidden">Loading...</span>
            </div>
            <p className="mt-3">Generating summaries and saving report...</p>
          </div>
        ) : (
          <Form>
            <Form.Group className="mb-3">
              <Form.Label>Report Name</Form.Label>
              <Form.Control
                type="text"
                placeholder="Enter report name"
                value={reportName}
                onChange={(e) => setReportName(e.target.value)}
                required
                disabled={isLoading}
              />
            </Form.Group>

            <Form.Group className="mb-3">
              <Form.Check
                type="checkbox"
                label="Add to existing report metadata"
                checked={addToExisting}
                onChange={(e) => setAddToExisting(e.target.checked)}
                disabled={isLoading}
              />
            </Form.Group>

            {addToExisting && (
              <Form.Group className="mb-3">
                <Form.Label>Select Existing Report</Form.Label>
                <Form.Select
                  value={selectedReportId}
                  onChange={(e) => setSelectedReportId(e.target.value)}
                  disabled={isLoading}
                >
                  <option value="">Choose a report...</option>
                  {existingReports.map((report) => (
                    <option key={report._id} value={report._id}>
                      {report.reportName} (Created: {new Date(report.createdAt).toLocaleDateString()})
                    </option>
                  ))}
                </Form.Select>
              </Form.Group>
            )}
          </Form>
        )}
      </Modal.Body>
      <Modal.Footer>
        <Button variant="secondary" onClick={handleClose} disabled={isLoading}>
          Cancel
        </Button>
        <Button variant="primary" onClick={handleSave} disabled={isLoading}>
          {isLoading ? (
            <>
              <span className="spinner-border spinner-border-sm me-2" role="status" aria-hidden="true"></span>
              Saving...
            </>
          ) : (
            'Save Report'
          )}
        </Button>
      </Modal.Footer>
    </Modal>
  );
}

export default ReportModal;

