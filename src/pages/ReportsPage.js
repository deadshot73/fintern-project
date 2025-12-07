import React, { useState, useEffect } from 'react';
import { Container, Row, Col, Card, ListGroup, Button, Accordion } from 'react-bootstrap';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import Sidebar from '../components/Sidebar';
import Sidepane from '../components/Sidepane';

function ReportsPage() {
  const [reports, setReports] = useState([]);
  const [selectedReport, setSelectedReport] = useState(null);
  const [isSidepaneOpen, setIsSidepaneOpen] = useState(true);
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    const loggedIn = localStorage.getItem('loggedIn') === 'true';
    setIsLoggedIn(loggedIn);

    if (loggedIn) {
      fetchReports();
    }
  }, []);

  const fetchReports = async () => {
    const userId = localStorage.getItem('userId');
    if (!userId) return;

    try {
      const response = await axios.get(`http://localhost:5000/api/report-metadata/${userId}`);
      setReports(response.data);
    } catch (error) {
      console.error('Error fetching reports:', error);
    }
  };

  const handleReportClick = (report) => {
    setSelectedReport(report);
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

        {/* Offset for sidepane */}
        <div className={isSidepaneOpen ? "col-md-2" : "col-md-1"}></div>

        {/* Main Content */}
        <div className={`${isSidepaneOpen ? "col-md-8" : "col-md-9"} d-flex flex-column p-0`} style={{ height: '100vh', minHeight: 0 }}>
          <div className="p-3 border-bottom bg-white">
            <h4 className="m-0">My Reports</h4>
          </div>

          <div className="flex-grow-1 overflow-auto p-3">
            {!isLoggedIn ? (
              <div className="text-center py-5">
                <p>Please log in to view your reports.</p>
                <Button onClick={() => navigate('/login')}>Login</Button>
              </div>
            ) : reports.length === 0 ? (
              <div className="text-center py-5">
                <p>No reports found. Create a report from a chat session.</p>
              </div>
            ) : (
              <Row>
                <Col md={4}>
                  <Card>
                    <Card.Header>
                      <h5 className="m-0">Reports List</h5>
                    </Card.Header>
                    <ListGroup variant="flush">
                      {reports.map((report) => (
                        <ListGroup.Item
                          key={report._id}
                          action
                          active={selectedReport?._id === report._id}
                          onClick={() => handleReportClick(report)}
                          style={{ cursor: 'pointer' }}
                        >
                          <div className="fw-bold">{report.reportName}</div>
                          <small className="text-muted">
                            Created: {new Date(report.createdAt).toLocaleDateString()}
                          </small>
                          {report.updatedAt && report.updatedAt !== report.createdAt && (
                            <div>
                              <small className="text-muted">
                                Updated: {new Date(report.updatedAt).toLocaleDateString()}
                              </small>
                            </div>
                          )}
                        </ListGroup.Item>
                      ))}
                    </ListGroup>
                  </Card>
                </Col>

                <Col md={8}>
                  {selectedReport ? (
                    <Card>
                      <Card.Header>
                        <div className="d-flex justify-content-between align-items-center">
                          <h5 className="m-0">{selectedReport.reportName}</h5>
                          <Button
                            variant="outline-secondary"
                            size="sm"
                            onClick={() => setSelectedReport(null)}
                          >
                            Close
                          </Button>
                        </div>
                      </Card.Header>
                      <Card.Body>
                        <div className="mb-4">
                          <h6>Report Information</h6>
                          <p><strong>Created:</strong> {new Date(selectedReport.createdAt).toLocaleString()}</p>
                          {selectedReport.updatedAt && selectedReport.updatedAt !== selectedReport.createdAt && (
                            <p><strong>Updated:</strong> {new Date(selectedReport.updatedAt).toLocaleString()}</p>
                          )}
                          <p><strong>Number of Entities:</strong> {selectedReport.selectedEntities?.length || 0}</p>
                          <p><strong>Number of Summaries:</strong> {selectedReport.summaries?.length || 0}</p>
                        </div>

                        <Accordion defaultActiveKey="0">
                          <Accordion.Item eventKey="0">
                            <Accordion.Header>
                              Selected Entities ({selectedReport.selectedEntities?.length || 0})
                            </Accordion.Header>
                            <Accordion.Body>
                              {selectedReport.selectedEntities && selectedReport.selectedEntities.length > 0 ? (
                                <div>
                                  {selectedReport.selectedEntities.map((entity, idx) => (
                                    <Card key={idx} className="mb-3">
                                      <Card.Header>
                                        <strong>Entity #{entity.serialNumber}</strong>
                                      </Card.Header>
                                      <Card.Body>
                                        <div className="mb-2">
                                          <strong>User Message:</strong>
                                          <div className="ms-2 p-2 bg-light rounded">{entity.userMessage}</div>
                                        </div>
                                        <div>
                                          <strong>AI Messages ({entity.aiMessages?.length || 0}):</strong>
                                          {entity.aiMessages && entity.aiMessages.length > 0 ? (
                                            <div className="ms-2 mt-2">
                                              {entity.aiMessages.map((aiMsg, aiIdx) => (
                                                <Card key={aiIdx} className="mb-2">
                                                  <Card.Header>
                                                    <strong>Type:</strong> {aiMsg.type}
                                                  </Card.Header>
                                                  <Card.Body>
                                                    <pre style={{ whiteSpace: 'pre-wrap', maxHeight: '300px', overflow: 'auto' }}>
                                                      {typeof aiMsg.content === 'object' 
                                                        ? JSON.stringify(aiMsg.content, null, 2)
                                                        : aiMsg.content}
                                                    </pre>
                                                  </Card.Body>
                                                </Card>
                                              ))}
                                            </div>
                                          ) : (
                                            <div className="ms-2 text-muted">No AI messages</div>
                                          )}
                                        </div>
                                      </Card.Body>
                                    </Card>
                                  ))}
                                </div>
                              ) : (
                                <p className="text-muted">No entities selected</p>
                              )}
                            </Accordion.Body>
                          </Accordion.Item>

                          <Accordion.Item eventKey="1">
                            <Accordion.Header>
                              Summaries ({selectedReport.summaries?.length || 0})
                            </Accordion.Header>
                            <Accordion.Body>
                              {selectedReport.summaries && selectedReport.summaries.length > 0 ? (
                                <div>
                                  {selectedReport.summaries.map((summary, idx) => (
                                    <Card key={idx} className="mb-3">
                                      <Card.Header>
                                        <strong>{summary.name}</strong> (Entity {summary.startEntity} to {summary.endEntity})
                                      </Card.Header>
                                      <Card.Body>
                                        <p style={{ whiteSpace: 'pre-wrap' }}>{summary.content}</p>
                                        <small className="text-muted">
                                          Created: {new Date(summary.createdAt).toLocaleString()}
                                        </small>
                                      </Card.Body>
                                    </Card>
                                  ))}
                                </div>
                              ) : (
                                <p className="text-muted">No summaries generated</p>
                              )}
                            </Accordion.Body>
                          </Accordion.Item>

                          <Accordion.Item eventKey="2">
                            <Accordion.Header>
                              Raw Metadata (JSON)
                            </Accordion.Header>
                            <Accordion.Body>
                              <pre style={{ whiteSpace: 'pre-wrap', maxHeight: '500px', overflow: 'auto', fontSize: '12px' }}>
                                {JSON.stringify(selectedReport, null, 2)}
                              </pre>
                            </Accordion.Body>
                          </Accordion.Item>
                        </Accordion>
                      </Card.Body>
                    </Card>
                  ) : (
                    <Card>
                      <Card.Body className="text-center py-5">
                        <p className="text-muted">Select a report from the list to view its details</p>
                      </Card.Body>
                    </Card>
                  )}
                </Col>
              </Row>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

export default ReportsPage;

