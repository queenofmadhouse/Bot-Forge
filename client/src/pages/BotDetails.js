import React, { useState, useEffect } from 'react';
import { Container, Row, Col, Card, Button, ListGroup, Modal, Form, Alert } from 'react-bootstrap';
import { useParams, useNavigate } from 'react-router-dom';
import axios from 'axios';
import { useAuth } from '../services/AuthContext';

const BotDetails = () => {
  const { botId } = useParams();
  const [bot, setBot] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  
  // Command modal state
  const [showCommandModal, setShowCommandModal] = useState(false);
  const [commandName, setCommandName] = useState('');
  const [commandDescription, setCommandDescription] = useState('');
  const [commandResponse, setCommandResponse] = useState('');
  const [commandError, setCommandError] = useState('');
  const [commandLoading, setCommandLoading] = useState(false);
  
  const { currentUser } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    // Redirect if not logged in
    if (!currentUser) {
      navigate('/login');
      return;
    }
    
    // Fetch bot details
    const fetchBotDetails = async () => {
      try {
        const response = await axios.get(`/api/bot-builder/${botId}`, {
          headers: {
            'Authorization': `Bearer ${localStorage.getItem('token')}`
          }
        });
        
        setBot(response.data);
        setLoading(false);
      } catch (error) {
        console.error('Error fetching bot details:', error);
        setError('Failed to load bot details. Please try again.');
        setLoading(false);
      }
    };
    
    fetchBotDetails();
  }, [botId, currentUser, navigate]);

  // Handle command modal
  const handleCloseCommandModal = () => {
    setShowCommandModal(false);
    setCommandName('');
    setCommandDescription('');
    setCommandResponse('');
    setCommandError('');
  };
  
  const handleShowCommandModal = () => setShowCommandModal(true);
  
  // Add command
  const handleAddCommand = async () => {
    if (!commandName || !commandDescription || !commandResponse) {
      setCommandError('All fields are required');
      return;
    }
    
    try {
      setCommandError('');
      setCommandLoading(true);
      
      const response = await axios.post(`/api/bot-builder/${botId}/commands`, {
        name: commandName,
        description: commandDescription,
        response: commandResponse
      }, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });
      
      // Update bot state with a new command
      setBot({
        ...bot,
        commands: [...bot.commands, response.data]
      });
      
      handleCloseCommandModal();
    } catch (error) {
      console.error('Add command error:', error);
      setCommandError('Failed to add command. Please try again.');
    } finally {
      setCommandLoading(false);
    }
  };
  
  // Deploy bot
  const handleDeployBot = async () => {
    try {
      const response = await axios.post(`/api/bot-builder/${botId}/deploy`, {}, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });
      
      // Update bot state with deployed status
      setBot(response.data.bot);
      alert('Bot deployed successfully!');
    } catch (error) {
      console.error('Deploy bot error:', error);
      alert('Failed to deploy bot. Please try again.');
    }
  };

  if (loading) {
    return <Container><p className="text-center">Loading...</p></Container>;
  }

  if (!bot) {
    return (
      <Container>
        <Alert variant="danger">Bot not found or you don't have permission to view it.</Alert>
      </Container>
    );
  }

  return (
    <Container>
      <h2 className="mb-4">{bot.name}</h2>
      <Row>
        <Col md={6}>
          <Card className="mb-3">
            <Card.Header>
              <h5>Commands</h5>
            </Card.Header>
            <Card.Body>
              <ListGroup id="commandsList">
                {bot.commands.length === 0 ? (
                  <ListGroup.Item>No commands yet</ListGroup.Item>
                ) : (
                  bot.commands.map((command, index) => (
                    <ListGroup.Item key={index} className="command-item">
                      <h6>/{command.name}</h6>
                      <p><small>{command.description}</small></p>
                      <p>Response: "{command.response}"</p>
                    </ListGroup.Item>
                  ))
                )}
              </ListGroup>
              <Button variant="primary" size="sm" className="mt-3" onClick={handleShowCommandModal}>
                Add Command
              </Button>
            </Card.Body>
          </Card>
        </Col>
        <Col md={6}>
          <Card className="mb-3">
            <Card.Header>
              <h5>Flows</h5>
            </Card.Header>
            <Card.Body>
              <ListGroup id="flowsList">
                {!bot.flows || bot.flows.length === 0 ? (
                  <ListGroup.Item>No flows yet</ListGroup.Item>
                ) : (
                  bot.flows.map((flow, index) => (
                    <ListGroup.Item key={index} className="flow-item">
                      <h6>{flow.name}</h6>
                      <p><small>Trigger: {flow.trigger}</small></p>
                      <p>Steps: {flow.steps.length}</p>
                    </ListGroup.Item>
                  ))
                )}
              </ListGroup>
              <Button variant="primary" size="sm" className="mt-3">
                Add Flow
              </Button>
            </Card.Body>
          </Card>
        </Col>
      </Row>
      <Button variant="success" className="mt-3" onClick={handleDeployBot}>
        Deploy Bot
      </Button>

      {/* Add Command Modal */}
      <Modal show={showCommandModal} onHide={handleCloseCommandModal}>
        <Modal.Header closeButton>
          <Modal.Title>Add Command</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          {commandError && <Alert variant="danger">{commandError}</Alert>}
          <Form>
            <Form.Group className="mb-3" controlId="commandName">
              <Form.Label>Command Name</Form.Label>
              <Form.Control 
                type="text" 
                value={commandName}
                onChange={(e) => setCommandName(e.target.value)}
                required 
              />
            </Form.Group>
            <Form.Group className="mb-3" controlId="commandDescription">
              <Form.Label>Description</Form.Label>
              <Form.Control 
                type="text" 
                value={commandDescription}
                onChange={(e) => setCommandDescription(e.target.value)}
                required 
              />
            </Form.Group>
            <Form.Group className="mb-3" controlId="commandResponse">
              <Form.Label>Response</Form.Label>
              <Form.Control 
                as="textarea" 
                rows={3} 
                value={commandResponse}
                onChange={(e) => setCommandResponse(e.target.value)}
                required 
              />
            </Form.Group>
          </Form>
        </Modal.Body>
        <Modal.Footer>
          <Button variant="secondary" onClick={handleCloseCommandModal}>
            Cancel
          </Button>
          <Button variant="primary" onClick={handleAddCommand} disabled={commandLoading}>
            {commandLoading ? 'Saving...' : 'Save'}
          </Button>
        </Modal.Footer>
      </Modal>
    </Container>
  );
};

export default BotDetails;
