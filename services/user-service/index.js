/**
 * User Service
 * 
 * This service handles user-related operations:
 * - User registration
 * - Authentication
 * - Profile management
 * - User permissions
 */

const express = require('express');
const bodyParser = require('body-parser');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const axios = require('axios');
const dotenv = require('dotenv');

// Load environment variables
dotenv.config();

const app = express();
const PORT = process.env.USER_SERVICE_PORT || 3001;
const DB_SERVICE = process.env.DB_SERVICE_URL || 'http://localhost:3004';
const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key';

// Middleware
app.use(bodyParser.json());

// Simple request logging
app.use((req, res, next) => {
  console.log(`[User Service] ${req.method} ${req.url}`);
  next();
});

// Health check endpoint
app.get('/health', (req, res) => {
  res.status(200).json({ status: 'OK', service: 'User Service' });
});

// We'll use the DB service for all user operations

// Register a new user
app.post('/register', async (req, res) => {
  try {
    console.log(`[User Service] Registration request received`);
    console.log(`[User Service] Request body:`, req.body);

    const { username, email, password } = req.body;

    // Validate input
    if (!username || !email || !password) {
      console.log(`[User Service] Validation failed: Missing required fields`);
      return res.status(400).json({ error: 'All fields are required' });
    }

    // Check if user already exists by querying the database service
    try {
      const existingUsersResponse = await axios.get(`${DB_SERVICE}/users?email=${email}`);
      const existingUsers = existingUsersResponse.data;

      if (existingUsers.some(u => u.email === email || u.username === username)) {
        return res.status(409).json({ error: 'User already exists' });
      }
    } catch (error) {
      console.error('[User Service] Error checking existing user:', error);
      return res.status(500).json({ error: 'Registration failed', message: 'Error checking existing user' });
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 10);

    // Create new user
    const newUser = {
      username,
      email,
      password: hashedPassword,
      bots: []
    };

    // Save to the database service
    console.log(`[User Service] Saving user to database: ${DB_SERVICE}/users`);
    const savedUserResponse = await axios.post(`${DB_SERVICE}/users`, newUser);
    const savedUser = savedUserResponse.data;
    console.log(`[User Service] User saved successfully with ID: ${savedUser._id}`);

    // Return user without password
    const { password: _, ...userWithoutPassword } = savedUser;
    console.log(`[User Service] Registration successful for user: ${username}`);
    res.status(201).json(userWithoutPassword);
  } catch (error) {
    console.error('[User Service] Registration error:', error);
    console.error('[User Service] Error details:', error.response?.data || error.message);
    console.error('[User Service] Error status:', error.response?.status);
    res.status(500).json({ error: 'Registration failed', message: error.message });
  }
});

// Login
app.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;

    // Validate input
    if (!email || !password) {
      return res.status(400).json({ error: 'Email and password are required' });
    }

    // Find user from database service
    let user;
    try {
      const usersResponse = await axios.get(`${DB_SERVICE}/users?email=${email}`);
      const users = usersResponse.data;
      user = users.find(u => u.email === email);

      if (!user) {
        return res.status(401).json({ error: 'Invalid credentials' });
      }
    } catch (error) {
      console.error('[User Service] Error finding user:', error);
      return res.status(500).json({ error: 'Login failed', message: 'Error finding user' });
    }

    // Verify password
    const isPasswordValid = await bcrypt.compare(password, user.password);
    if (!isPasswordValid) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    // Generate JWT token
    const token = jwt.sign(
      { userId: user._id, email: user.email },
      JWT_SECRET,
      { expiresIn: '1h' }
    );

    res.status(200).json({ token, userId: user._id });
  } catch (error) {
    console.error('[User Service] Login error:', error);
    res.status(500).json({ error: 'Login failed', message: error.message });
  }
});

// Get user profile
app.get('/profile/:userId', async (req, res) => {
  try {
    const { userId } = req.params;

    // Find user from database service
    try {
      const userResponse = await axios.get(`${DB_SERVICE}/users/${userId}`);
      const user = userResponse.data;

      // Return user without password
      const { password, ...userWithoutPassword } = user;
      res.status(200).json(userWithoutPassword);
    } catch (error) {
      if (error.response && error.response.status === 404) {
        return res.status(404).json({ error: 'User not found' });
      }
      console.error('[User Service] Error fetching user profile:', error);
      return res.status(500).json({ error: 'Failed to get profile', message: 'Error fetching user profile' });
    }
  } catch (error) {
    console.error('[User Service] Get profile error:', error);
    res.status(500).json({ error: 'Failed to get profile', message: error.message });
  }
});

// Get user's bots
app.get('/:userId/bots', async (req, res) => {
  try {
    const { userId } = req.params;

    // Find user from database service
    try {
      // First, get the user to verify they exist
      const userResponse = await axios.get(`${DB_SERVICE}/users/${userId}`);
      const user = userResponse.data;

      // Then, get the bots for this user
      const botsResponse = await axios.get(`${DB_SERVICE}/bots?ownerId=${userId}`);
      const bots = botsResponse.data;

      res.status(200).json({ bots });
    } catch (error) {
      if (error.response && error.response.status === 404) {
        return res.status(404).json({ error: 'User not found' });
      }
      console.error('[User Service] Error fetching user bots:', error);
      return res.status(500).json({ error: 'Failed to get user bots', message: 'Error fetching user bots' });
    }
  } catch (error) {
    console.error('[User Service] Get user bots error:', error);
    res.status(500).json({ error: 'Failed to get user bots', message: error.message });
  }
});

// Start the server
app.listen(PORT, () => {
  console.log(`User Service running on port ${PORT}`);
});

module.exports = app;
