import React from 'react';
import { Container, Row, Col, Card } from 'react-bootstrap';
import { Link } from 'react-router-dom';
import { useAuth } from '../services/AuthContext';

const Home = () => {
  const { currentUser } = useAuth();

  return (
    <Container>
      <div className="jumbotron">
        <h1 className="display-4">Welcome to Microgram!</h1>
        <p className="lead">Build your own Telegram bots without coding.</p>
        <hr className="my-4" />
        <p>Create interactive bots, define commands, and design conversation flows with our easy-to-use interface.</p>
        {currentUser ? (
          <Link to="/my-bots" className="btn btn-primary btn-lg">My Bots</Link>
        ) : (
          <Link to="/register" className="btn btn-primary btn-lg">Get Started</Link>
        )}
      </div>
      
      <Row className="mt-5">
        <Col md={4}>
          <Card className="mb-4">
            <Card.Body>
              <Card.Title>Easy to Use</Card.Title>
              <Card.Text>No coding required. Build bots using our intuitive interface.</Card.Text>
            </Card.Body>
          </Card>
        </Col>
        <Col md={4}>
          <Card className="mb-4">
            <Card.Body>
              <Card.Title>Interactive Flows</Card.Title>
              <Card.Text>Create complex conversation flows with buttons and menus.</Card.Text>
            </Card.Body>
          </Card>
        </Col>
        <Col md={4}>
          <Card className="mb-4">
            <Card.Body>
              <Card.Title>Deploy Instantly</Card.Title>
              <Card.Text>Deploy your bot to Telegram with just one click.</Card.Text>
            </Card.Body>
          </Card>
        </Col>
      </Row>
    </Container>
  );
};

export default Home;
