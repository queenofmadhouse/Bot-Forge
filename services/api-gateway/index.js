/**
 * API Gateway Service
 * 
 * This service acts as the entry point for all client requests.
 * It routes requests to the appropriate microservices and handles:
 * - Authentication
 * - Request routing
 * - Response aggregation
 * - Rate limiting
 */

const express = require('express');
const cors = require('cors');
const bodyParser = require('body-parser');
const axios = require('axios');
const dotenv = require('dotenv');

// Load environment variables
dotenv.config();

const app = express();
const PORT = process.env.GATEWAY_PORT || 3000;

// Middleware
app.use(cors());
app.use(bodyParser.json());

// Request logging
app.use((req, res, next) => {
  console.log(`[API Gateway] ${req.method} ${req.url}`);
  next();
});

// Service endpoints
const USER_SERVICE = process.env.USER_SERVICE_URL;
const BOT_BUILDER_SERVICE = process.env.BOT_BUILDER_SERVICE_URL;
const BOT_RUNTIME_SERVICE = process.env.BOT_RUNTIME_SERVICE_URL;

// Health check endpoint
app.get('/health', (req, res) => {
  res.status(200).json({ status: 'OK', service: 'API Gateway' });
});

// User service routes
app.use('/api/users', async (req, res) => {
  try {
    console.log(`[API Gateway] User service request: ${req.method} ${req.url}`);
    const userServicePath = req.url;
    console.log(`[API Gateway] Forwarding to: ${USER_SERVICE}${userServicePath}`);
    const response = await axios({
      method: req.method,
      url: `${USER_SERVICE}${userServicePath}`,
      data: req.body,
      headers: req.headers
    });
    res.status(response.status).json(response.data);
  } catch (error) {
    console.error('[API Gateway] User service error:', error.message);
    res.status(error.response?.status || 500).json({
      error: 'User service error',
      message: error.response?.data || error.message
    });
  }
});

// Bot builder service routes
app.use('/api/bot-builder', async (req, res) => {
  try {
    console.log(`[API Gateway] Bot builder service request: ${req.url}`);
    const botBuilderServicePath = req.url;
    console.log(`[API Gateway] Forwarding to: ${BOT_BUILDER_SERVICE}${botBuilderServicePath}`);
    const response = await axios({
      method: req.method,
      url: `${BOT_BUILDER_SERVICE}${botBuilderServicePath}`,
      data: {
        ownerId: req.body.ownerId,
        name: req.body.name,
      },
      headers: req.headers
    });
    res.status(response.status).json(response.data);
  } catch (error) {
    console.error('[API Gateway] Bot builder service error:', error.message);
    console.error('[API Gateway] Error details:', error.response?.data || error.message);
    res.status(error.response?.status || 500).json({
      error: 'Bot builder service error',
      message: error.response?.data || error.message
    });
  }
});

// Bot runtime service routes
app.use('/api/bot-runtime', async (req, res) => {
  try {
    console.log(`[API Gateway] Bot runtime service request: ${req.url}`);
    const botRuntimeServicePath = req.url;
    console.log(`[API Gateway] Forwarding to: ${BOT_RUNTIME_SERVICE}${botRuntimeServicePath}`);
    const response = await axios({
      method: req.method,
      url: `${BOT_RUNTIME_SERVICE}${botRuntimeServicePath}`,
      data: req.body,
      headers: req.headers
    });
    res.status(response.status).json(response.data);
  } catch (error) {
    console.error('[API Gateway] Bot runtime service error:', error.message);
    res.status(error.response?.status || 500).json({
      error: 'Bot runtime service error',
      message: error.response?.data || error.message
    });
  }
});

// Start the server
app.listen(PORT, () => {
  console.log(`API Gateway running on port ${PORT}`);
});

module.exports = app;
