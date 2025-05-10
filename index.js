/**
 * Main entry point for the Microgram application
 * This file starts all microservices or can be used to orchestrate them
 */

const express = require('express');
const path = require('path');
const dotenv = require('dotenv');

dotenv.config();

console.log('Starting Microgram - Interactive Telegram Bot Builder Platform');
console.log('To start individual services, use the following commands:');
console.log('- npm run gateway: API Gateway Service');
console.log('- npm run user-service: User Management Service');
console.log('- npm run bot-builder: Bot Builder Service');
console.log('- npm run bot-runtime: Bot Runtime Service');
console.log('- npm run db-service: Database Service');
console.log('- npm run client: React Client (Development)');
console.log('- npm run client-build: Build React Client');
console.log('- npm run dev-full: Run Backend and React Client concurrently');

// Create main app
const app = express();
const PORT = process.env.PORT0;

// Determine if we're in production
const isProduction = process.env.NODE_ENV === 'production';

// Serve static files
if (isProduction) {
  // In production, serve the React build files
  app.use(express.static(path.join(__dirname, 'client/build')));
} else {
  // In development, serve the public directory
  app.use(express.static(path.join(__dirname, 'public')));
}

// API routes should be handled by the API Gateway
// This is just a fallback for direct access to the main server
const axios = require('axios');

// Forward API requests to the API Gateway
app.use('/api', async (req, res) => {
  try {
    console.log(`[Main Server] Forwarding API request: ${req.method} ${req.url}`);
    const apiPath = req.url;
    const gatewayPort = process.env.GATEWAY_PORT || 3000;
    const pathWithoutApiPrefix = apiPath.replace(/^\/api/, '');
    const apiGatewayUrl = `http://localhost:${gatewayPort}${pathWithoutApiPrefix}`;
    console.log(`[Main Server] Original path: ${apiPath}`);
    console.log(`[Main Server] Path without /api prefix: ${pathWithoutApiPrefix}`);
    console.log(`[Main Server] Forwarding to: ${apiGatewayUrl}`);

    const response = await axios({
      method: req.method,
      url: apiGatewayUrl,
      data: req.body,
      headers: req.headers
    });

    res.status(response.status).json(response.data);
  } catch (error) {
    console.error('[Main Server] API Gateway error:', error.message);
    res.status(error.response?.status || 500).json({
      error: 'API Gateway error',
      message: error.response?.data || error.message
    });
  }
});

// Main route
app.get('*', (req, res) => {
  if (isProduction) {
    res.sendFile(path.join(__dirname, 'client/build', 'index.html'));
  } else {
    res.sendFile(path.join(__dirname, 'public', 'index.html'));
  }
});

// Start the main server
app.listen(PORT, () => {
  console.log(`Main application running on port ${PORT}`);
  console.log(`Visit http://localhost:${PORT} to access the web interface`);
});

if (process.env.NODE_ENV === 'development') {
  try {
    require('./services/api-gateway/index.js');
    require('./services/user-service/index.js');
    require('./services/bot-builder/index.js');
    require('./services/bot-runtime/index.js');
    require('./services/db-service/index.js');
    console.log('All services started in development mode');
  } catch (error) {
    console.error('Failed to start services:', error);
  }
} else {
  console.log('In production mode, please start each service separately');
}
