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

      // Fetch reports
      fetch(`http://localhost:5000/api/report-metadata/${userId}`)
        .then(res => res.json())
        .then(data => setReports(data))
        .catch(err => console.error('Error fetching reports', err));
    }
  }, []);
  const handleLogout = () => {
    localStorage.clear();
    setIsLoggedIn(false);
    navigate('/');
  };

  const handleNewChat = async () => {
    const userId = localStorage.getItem('userId');
    if (userId) {
      try {
        const response = await fetch('http://localhost:5000/api/chat/new', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ userId })
        });
        
        if (response.ok) {
          const data = await response.json();
          // Refresh the chat list
          const chatsResponse = await fetch(`http://localhost:5000/api/chats/${userId}`);
          if (chatsResponse.ok) {
            const chatsData = await chatsResponse.json();
            setChats(chatsData);
          }
          // Navigate to the new chat
          navigate(`/chat/${data.chatId}`);
        } else {
          console.error('Failed to create new chat');
        }
      } catch (error) {
        console.error('Error creating new chat:', error);
      }
    } else {
      // If not logged in, just navigate to home
      navigate('/');
    }
  };

  const [reports, setReports] = useState([]);
  const [chats, setChats] = useState([]);

  return (
    <div className="p-3 d-flex flex-column h-100 overflow-auto">
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
      <Button variant="outline-secondary" className="mb-2 w-100" onClick={handleNewChat}>New Chat</Button>

      {/* My Reports Dropdown */}
      <Card className="mb-2">
        <Card.Header
          onClick={() => {
            setShowReports(!showReports);
            if (!showReports) {
              navigate('/reports');
            }
          }}
          style={{ cursor: 'pointer' }}
        >
          My Reports ({reports.length})
        </Card.Header>
        <Collapse in={showReports}>
          <ListGroup variant="flush">
            {reports.length === 0 ? (
              <ListGroup.Item className="text-muted">No reports yet</ListGroup.Item>
            ) : (
              reports.map((report) => (
                <ListGroup.Item
                  key={report._id}
                  action
                  onClick={() => navigate('/reports')}
                >
                  <div className="fw-bold">{report.reportName}</div>
                  <small className="text-muted">
                    {new Date(report.createdAt).toLocaleDateString()}
                  </small>
                </ListGroup.Item>
              ))
            )}
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
          className="d-flex justify-content-between align-items-center"
        >
          <span>Recent Chats ({chats.length})</span>
          <Button 
            variant="outline-secondary" 
            size="sm" 
            onClick={(e) => {
              e.stopPropagation();
              const userId = localStorage.getItem('userId');
              if (userId) {
                fetch(`http://localhost:5000/api/chats/${userId}`)
                  .then(res => res.json())
                  .then(data => setChats(data))
                  .catch(err => console.error('Error refreshing chats', err));
              }
            }}
          >
            ↻
          </Button>
        </Card.Header>
        <Collapse in={showChats}>
          <ListGroup variant="flush">
          {chats.map((chat) => {
            // Get the first user message as the chat title
            const firstUserMessage = chat.messages.find(msg => msg.sender === 'user');
            const title = firstUserMessage ? 
              (firstUserMessage.content.length > 30 ? 
                firstUserMessage.content.substring(0, 30) + '...' : 
                firstUserMessage.content) : 
              'New Chat';
            
            // Format the date
            const date = new Date(chat.createdAt).toLocaleDateString();
            
            const handleDeleteChat = async (e) => {
              e.stopPropagation(); // Prevent navigation when clicking delete
              if (window.confirm('Are you sure you want to delete this chat?')) {
                try {
                  const response = await fetch(`http://localhost:5000/api/chat/${chat._id}`, {
                    method: 'DELETE',
                  });
                  
                  if (response.ok) {
                    // Remove the chat from the local state
                    setChats(chats.filter(c => c._id !== chat._id));
                  } else {
                    console.error('Failed to delete chat');
                  }
                } catch (error) {
                  console.error('Error deleting chat:', error);
                }
              }
            };
            
            return (
              <ListGroup.Item
                key={chat._id}
                action
                onClick={() => navigate(`/chat/${chat._id}`)}
                className="d-flex justify-content-between align-items-start"
              >
                <div className="flex-grow-1">
                  <div className="fw-bold">{title}</div>
                  <small className="text-muted">{date}</small>
                </div>
                <Button
                  variant="outline-danger"
                  size="sm"
                  onClick={handleDeleteChat}
                  className="ms-2"
                  title="Delete chat"
                >
                  ×
                </Button>
              </ListGroup.Item>
            );
          })}

          </ListGroup>
        </Collapse>
      </Card>

      {/* Downloads */}
      <Button variant="outline-secondary" className="w-100">Downloads</Button>
    </div>
  );
}

export default Sidepane;
