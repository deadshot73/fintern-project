import React, {  useEffect, useState } from 'react';
import { Button, Collapse, Card, ListGroup } from 'react-bootstrap';
import { useNavigate } from 'react-router-dom';

function Sidepane({ onCollapse }) {
  const [showReports, setShowReports] = useState(false);
  const [showChats, setShowChats] = useState(true);
  const navigate = useNavigate();
  const [isLoggedIn, setIsLoggedIn] = useState(false);

  // useEffect to check login status
  useEffect(() => {
    const loggedIn = localStorage.getItem('loggedIn') === 'true';
    setIsLoggedIn(loggedIn);
  
    const userId = localStorage.getItem('userId');
    if (loggedIn && userId) {
      fetch(`http://localhost:5000/api/chats/${userId}`)
        .then(res => res.json())
        .then(data => setChats(data))
        .catch(err => console.error('Error fetching chats', err));
    }
  }, []);
const handleLogout = () => {
  localStorage.clear();
  setIsLoggedIn(false);
  navigate('/');
};

  // Demo data
  const reports = ['Apple Q1 Report', 'Tesla FY24 Summary'];
  const [chats, setChats] = useState([]);

  return (
    <div className="p-3 d-flex flex-column h-100">
      {/* Collapse button */}
      <div className="d-flex justify-content-between align-items-center mb-3">
        <h5 className="m-0">Menu</h5>
        <Button variant="light" size="sm" onClick={onCollapse}>⨯</Button>
      </div>

      {/* Login / Signup */}
      <div className="mb-3 d-flex gap-2">
      {isLoggedIn ? (
  <Button variant="danger" size="sm" className="w-100 mb-3" onClick={handleLogout}>
    Logout
  </Button>
) : (
  <div className="mb-3 d-flex gap-2">
    <Button variant="outline-primary" size="sm" className="w-100" onClick={() => navigate('/login')}>
      Login
    </Button>
    <Button variant="outline-success" size="sm" className="w-100" onClick={() => navigate('/signup')}>
      Signup
    </Button>
  </div>
)}
      </div>

      {/* Other buttons */}
      <Button variant="outline-secondary" className="mb-2 w-100">My Account</Button>
      <Button variant="outline-secondary" className="mb-2 w-100">New Chat</Button>

      {/* My Reports Dropdown */}
      <Card className="mb-2">
        <Card.Header
          onClick={() => setShowReports(!showReports)}
          style={{ cursor: 'pointer' }}
        >
          My Reports ({reports.length})
        </Card.Header>
        <Collapse in={showReports}>
          <ListGroup variant="flush">
            {reports.map((report, idx) => (
              <ListGroup.Item key={idx}>{report}</ListGroup.Item>
            ))}
          </ListGroup>
        </Collapse>
      </Card>

      {/* Generate Report */}
      <Button variant="outline-secondary" className="mb-2 w-100">Generate Report</Button>

      {/* Recent Chats Dropdown */}
      <Card className="mb-2">
        <Card.Header
          onClick={() => setShowChats(!showChats)}
          style={{ cursor: 'pointer' }}
        >
          Recent Chats ({chats.length})
        </Card.Header>
        <Collapse in={showChats}>
          <ListGroup variant="flush">
          {chats.map((chat) => (
  <ListGroup.Item
    key={chat._id}
    action
    onClick={() => navigate(`/chat/${chat._id}`)}
  >
    {chat._id}
  </ListGroup.Item>
))}

          </ListGroup>
        </Collapse>
      </Card>

      {/* Downloads */}
      <Button variant="outline-secondary" className="w-100">Downloads</Button>
    </div>
  );
}

export default Sidepane;
