import React, { useState, useEffect } from 'react';
import { Container, Row, Col, Card, Alert } from 'react-bootstrap';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { useAuth } from '../services/AuthContext';

const MyBots = () => {
  const [bots, setBots] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  
  const { currentUser } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    // Redirect if not logged in
    if (!currentUser) {
      navigate('/login');
      return;
    }
    
    // Fetch user's bots
    const fetchBots = async () => {
      try {
        const response = await axios.get(`/api/bot-builder/user/${currentUser.id}`, {
          headers: {
            'Authorization': `Bearer ${localStorage.getItem('token')}`
          }
        });
        
        setBots(response.data.bots);
        setLoading(false);
      } catch (error) {
        console.error('Error fetching bots:', error);
        setError('Failed to load your bots. Please try again.');
        setLoading(false);
      }
    };
    
    fetchBots();
  }, [currentUser, navigate]);

  const handleBotClick = (botId) => {
    navigate(`/bot/${botId}`);
  };

  if (loading) {
    return <Container><p className="text-center">Loading...</p></Container>;
  }

  return (
    <Container>
      <h2 className="mb-4">My Bots</h2>
      {error && <Alert variant="danger">{error}</Alert>}
      
      <Row>
        {bots.length === 0 ? (
          <Col>
            <p>You don't have any bots yet. <a href="/create-bot">Create one!</a></p>
          </Col>
        ) : (
          bots.map(bot => (
            <Col md={4} key={bot.id}>
              <Card className="bot-card mb-4" onClick={() => handleBotClick(bot.id)}>
                <Card.Header className="d-flex justify-content-between align-items-center">
                  <h5 className="mb-0">{bot.name}</h5>
                  <span className={`bot-status ${bot.status}`}>{bot.status}</span>
                </Card.Header>
                <Card.Body>
                  <p>Commands: {bot.commands.length}</p>
                  <p>Flows: {bot.flows ? bot.flows.length : 0}</p>
                </Card.Body>
              </Card>
            </Col>
          ))
        )}
      </Row>
    </Container>
  );
};

export default MyBots;
