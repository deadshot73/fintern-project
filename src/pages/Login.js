import React, { useState } from 'react';
import { Form, Button, Alert, Card } from 'react-bootstrap';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';

function Login() {
  const [form, setForm] = useState({ email: '', password: '' });
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const navigate = useNavigate();

  const handleChange = e => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleSubmit = async e => {
    e.preventDefault();
    try {
      const res = await axios.post('http://localhost:5000/api/login', form);
      
      // ✅ Store login info
      localStorage.setItem('loggedIn', 'true');
      localStorage.setItem('email', res.data.email);
      localStorage.setItem('userId', res.data.userId);
  
      // ✅ Redirect to home page
      navigate('/');
  
      // ✅ Update success message (optional)
      setSuccess(res.data.message);
      setError('');
    } catch (err) {
      setError(err.response?.data?.error || 'Login failed');
      setSuccess('');
    }
  };

  return (
    <div className="d-flex justify-content-center align-items-center vh-100">
      <Card className="p-4" style={{ width: '400px' }}>
        <h3 className="mb-3 text-center">Log In</h3>
        {error && <Alert variant="danger">{error}</Alert>}
        {success && <Alert variant="success">{success}</Alert>}

        <Form onSubmit={handleSubmit}>
          <Form.Group className="mb-3">
            <Form.Label>Email</Form.Label>
            <Form.Control type="email" name="email" onChange={handleChange} required />
          </Form.Group>

          <Form.Group className="mb-3">
            <Form.Label>Password</Form.Label>
            <Form.Control type="password" name="password" onChange={handleChange} required />
          </Form.Group>

          <Button type="submit" variant="primary" className="w-100">Login</Button>
        </Form>
      </Card>
    </div>
  );
}

export default Login;
