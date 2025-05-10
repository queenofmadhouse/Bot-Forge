import React, { useState } from 'react';
import { Container, Form, Button, Alert } from 'react-bootstrap';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../services/AuthContext';

const CreateBot = () => {
  const [botName, setBotName] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const { currentUser, createBot } = useAuth();
  const navigate = useNavigate();

  // Redirect if not logged in
  React.useEffect(() => {
    if (!currentUser) {
      navigate('/login');
    }
  }, [currentUser, navigate]);

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!botName.trim()) {
      setError('Bot name is required');
      return;
    }

    try {
      setError('');
      setLoading(true);

      const response = await createBot(botName);

      // Navigate to the new bot's details page
      navigate(`/bot/${response.data._id}`);
    } catch (error) {
      console.error('Create bot error:', error);
      setError('Failed to create bot. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  if (!currentUser) {
    return null; // Don't render anything while redirecting
  }

  return (
    <Container>
      <h2 className="text-center mb-4">Create a New Bot</h2>
      {error && <Alert variant="danger">{error}</Alert>}
      <Form onSubmit={handleSubmit}>
        <Form.Group className="mb-3" controlId="formBotName">
          <Form.Label>Bot Name</Form.Label>
          <Form.Control 
            type="text" 
            value={botName}
            onChange={(e) => setBotName(e.target.value)}
            required 
          />
        </Form.Group>

        <Button variant="primary" type="submit" disabled={loading}>
          {loading ? 'Creating...' : 'Create Bot'}
        </Button>
      </Form>
    </Container>
  );
};

export default CreateBot;
