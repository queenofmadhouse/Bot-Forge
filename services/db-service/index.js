/**
 * Database Service
 * 
 * This service handles data persistence for the application:
 * - User data storage
 * - Bot configurations storage
 * - Bot runtime data storage
 * - Analytics data storage
 */

const express = require('express');
const bodyParser = require('body-parser');
const mongoose = require('mongoose');
const dotenv = require('dotenv');

// Load environment variables
dotenv.config();

// Import models
const { User, Bot, BotRuntimeData, Analytics } = require('./models');

const app = express();
const PORT = process.env.DB_SERVICE_PORT || 3004;
const MONGO_URI = process.env.MONGO_URI || 'mongodb://localhost:27017/microgram';

// Middleware
app.use(bodyParser.json());

// Simple request logging
app.use((req, res, next) => {
  console.log(`[DB Service] ${req.method} ${req.url}`);
  next();
});

// Health check endpoint
app.get('/health', (req, res) => {
  res.status(200).json({ 
    status: 'OK', 
    service: 'Database Service',
    database: mongoose.connection.readyState === 1 ? 'connected' : 'disconnected'
  });
});

// Connect to MongoDB
console.log(`[DB Service] Attempting to connect to MongoDB at: ${MONGO_URI}`);
mongoose.connect(MONGO_URI, {
  useNewUrlParser: true,
  useUnifiedTopology: true,
  serverSelectionTimeoutMS: 30000,
  socketTimeoutMS: 45000,
  connectTimeoutMS: 30000,
  heartbeatFrequencyMS: 10000,
  retryWrites: true,
  retryReads: true
})
.then(() => {
  console.log(`[DB Service] Successfully connected to MongoDB at: ${MONGO_URI}`);
  console.log(`[DB Service] MongoDB connection state: ${mongoose.connection.readyState}`);
})
.catch(err => {
  console.error('[DB Service] MongoDB connection error:', err);
  console.error('[DB Service] Error name:', err.name);
  console.error('[DB Service] Error message:', err.message);
  console.error('[DB Service] Stack trace:', err.stack);
});

mongoose.connection.on('error', (err) => {
  console.error('[DB Service] MongoDB connection error event:', err);
  console.error('[DB Service] Error name:', err.name);
  console.error('[DB Service] Error message:', err.message);
  console.error('[DB Service] Stack trace:', err.stack);
});

mongoose.connection.on('disconnected', () => {
  console.log('[DB Service] MongoDB disconnected. Attempting to reconnect...');
  setTimeout(() => {
    mongoose.connect(MONGO_URI, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
      serverSelectionTimeoutMS: 30000,
      socketTimeoutMS: 45000,
      connectTimeoutMS: 30000,
      heartbeatFrequencyMS: 10000,
      retryWrites: true,
      retryReads: true
    }).catch(err => {
      console.error('[DB Service] MongoDB reconnection error:', err);
    });
  }, 5000); // Wait 5 seconds before attempting to reconnect
});

mongoose.connection.on('reconnected', () => {
  console.log('[DB Service] MongoDB reconnected successfully');
});


// Define routes for users
app.get('/users', async (req, res) => {
  try {
    // Check if MongoDB is connected
    if (mongoose.connection.readyState !== 1) {
      console.error('[DB Service] MongoDB not connected. Current state:', mongoose.connection.readyState);
      return res.status(500).json({ error: 'Database connection not established' });
    }

    // Check if email query parameter is provided
    const { email } = req.query;
    let query = {};

    if (email) {
      console.log(`[DB Service] Searching for user with email: ${email}`);
      query.email = email;
    }

    const users = await User.find(query);
    console.log(`[DB Service] Found ${users.length} users matching query`);
    res.status(200).json(users);
  } catch (err) {
    console.error('[DB Service] Error fetching users:', err);
    console.error('[DB Service] Error name:', err.name);
    console.error('[DB Service] Error message:', err.message);
    console.error('[DB Service] Stack trace:', err.stack);
    res.status(500).json({ error: 'Server error' });
  }
});

app.get('/users/:id', async (req, res) => {
  try {
    // Check if MongoDB is connected
    if (mongoose.connection.readyState !== 1) {
      console.error('[DB Service] MongoDB not connected. Current state:', mongoose.connection.readyState);
      return res.status(500).json({ error: 'Database connection not established' });
    }

    console.log(`[DB Service] Searching for user with ID: ${req.params.id}`);
    const user = await User.findById(req.params.id);

    if (!user) {
      console.log(`[DB Service] User with ID ${req.params.id} not found`);
      return res.status(404).json({ error: 'User not found' });
    }

    console.log(`[DB Service] Found user with ID: ${req.params.id}`);
    res.status(200).json(user);
  } catch (err) {
    console.error('[DB Service] Error fetching user:', err);
    console.error('[DB Service] Error name:', err.name);
    console.error('[DB Service] Error message:', err.message);
    console.error('[DB Service] Stack trace:', err.stack);
    res.status(500).json({ error: 'Server error' });
  }
});

app.post('/users', async (req, res) => {
  try {
    // Check if MongoDB is connected
    if (mongoose.connection.readyState !== 1) {
      console.error('[DB Service] MongoDB not connected. Current state:', mongoose.connection.readyState);
      return res.status(500).json({ error: 'Database connection not established' });
    }

    console.log(`[DB Service] Creating new user with data:`, req.body);

    // Validate required fields
    if (!req.body.username || !req.body.email || !req.body.password) {
      console.error('[DB Service] Missing required fields for user creation');
      return res.status(400).json({ error: 'Username, email, and password are required' });
    }

    const newUser = new User(req.body);
    console.log(`[DB Service] User model created, saving to database...`);

    await newUser.save();
    console.log(`[DB Service] User saved successfully with ID: ${newUser._id}`);
    res.status(201).json(newUser);
  } catch (err) {
    console.error('[DB Service] Error creating user:', err);
    console.error('[DB Service] Error name:', err.name);
    console.error('[DB Service] Error message:', err.message);
    console.error('[DB Service] Stack trace:', err.stack);

    if (err.code === 11000) {
      console.error('[DB Service] Duplicate key error - user already exists');
      return res.status(409).json({ error: 'User with this email or username already exists' });
    }

    res.status(400).json({ error: err.message });
  }
});

app.put('/users/:id', async (req, res) => {
  try {
    // Check if MongoDB is connected
    if (mongoose.connection.readyState !== 1) {
      console.error('[DB Service] MongoDB not connected. Current state:', mongoose.connection.readyState);
      return res.status(500).json({ error: 'Database connection not established' });
    }

    console.log(`[DB Service] Updating user with ID: ${req.params.id}`);
    console.log(`[DB Service] Update data:`, req.body);

    const user = await User.findByIdAndUpdate(
      req.params.id,
      { ...req.body },
      { new: true, runValidators: true }
    );

    if (!user) {
      console.log(`[DB Service] User with ID ${req.params.id} not found for update`);
      return res.status(404).json({ error: 'User not found' });
    }

    console.log(`[DB Service] User with ID ${req.params.id} updated successfully`);
    res.status(200).json(user);
  } catch (err) {
    console.error('[DB Service] Error updating user:', err);
    console.error('[DB Service] Error name:', err.name);
    console.error('[DB Service] Error message:', err.message);
    console.error('[DB Service] Stack trace:', err.stack);

    if (err.code === 11000) {
      console.error('[DB Service] Duplicate key error during update');
      return res.status(409).json({ error: 'User with this email or username already exists' });
    }

    res.status(400).json({ error: err.message });
  }
});

app.delete('/users/:id', async (req, res) => {
  try {
    // Check if MongoDB is connected
    if (mongoose.connection.readyState !== 1) {
      console.error('[DB Service] MongoDB not connected. Current state:', mongoose.connection.readyState);
      return res.status(500).json({ error: 'Database connection not established' });
    }

    console.log(`[DB Service] Deleting user with ID: ${req.params.id}`);

    const user = await User.findByIdAndDelete(req.params.id);

    if (!user) {
      console.log(`[DB Service] User with ID ${req.params.id} not found for deletion`);
      return res.status(404).json({ error: 'User not found' });
    }

    console.log(`[DB Service] User with ID ${req.params.id} deleted successfully`);
    res.status(204).send();
  } catch (err) {
    console.error('[DB Service] Error deleting user:', err);
    console.error('[DB Service] Error name:', err.name);
    console.error('[DB Service] Error message:', err.message);
    console.error('[DB Service] Stack trace:', err.stack);
    res.status(500).json({ error: 'Server error' });
  }
});

// Define routes for bots
app.get('/bots', async (req, res) => {
  try {
    // Filter by owner if provided
    const { ownerId } = req.query;
    let query = {};

    if (ownerId) {
      query.ownerId = ownerId;
    }

    const bots = await Bot.find(query);
    res.status(200).json(bots);
  } catch (err) {
    console.error('Error fetching bots:', err);
    res.status(500).json({ error: 'Server error' });
  }
});

app.get('/bots/:id', async (req, res) => {
  try {
    const bot = await Bot.findById(req.params.id);
    if (!bot) {
      return res.status(404).json({ error: 'Bot not found' });
    }
    res.status(200).json(bot);
  } catch (err) {
    console.error('Error fetching bot:', err);
    res.status(500).json({ error: 'Server error' });
  }
});

app.post('/bots', async (req, res) => {
  try {
    const newBot = new Bot(req.body);
    await newBot.save();

    // If the bot has an owner, add it to the user's bots array
    if (newBot.ownerId) {
      await User.findByIdAndUpdate(
        newBot.ownerId,
        { $push: { bots: newBot._id } }
      );
    }

    res.status(201).json(newBot);
  } catch (err) {
    console.error('Error creating bot:', err);
    res.status(400).json({ error: err.message });
  }
});

app.put('/bots/:id', async (req, res) => {
  try {
    const bot = await Bot.findByIdAndUpdate(
      req.params.id,
      { ...req.body },
      { new: true, runValidators: true }
    );

    if (!bot) {
      return res.status(404).json({ error: 'Bot not found' });
    }

    res.status(200).json(bot);
  } catch (err) {
    console.error('Error updating bot:', err);
    res.status(400).json({ error: err.message });
  }
});

app.delete('/bots/:id', async (req, res) => {
  try {
    const bot = await Bot.findById(req.params.id);

    if (!bot) {
      return res.status(404).json({ error: 'Bot not found' });
    }

    // Remove the bot from the owner's bots array
    if (bot.ownerId) {
      await User.findByIdAndUpdate(
        bot.ownerId,
        { $pull: { bots: bot._id } }
      );
    }

    await Bot.findByIdAndDelete(req.params.id);
    res.status(204).send();
  } catch (err) {
    console.error('Error deleting bot:', err);
    res.status(500).json({ error: 'Server error' });
  }
});

// Define routes for bot runtime data
app.get('/runtime/:botId/users/:userId', async (req, res) => {
  try {
    const { botId, userId } = req.params;
    const runtimeData = await BotRuntimeData.findOne({ botId, userId });

    if (!runtimeData) {
      return res.status(404).json({ error: 'Runtime data not found' });
    }

    res.status(200).json(runtimeData);
  } catch (err) {
    console.error('Error fetching runtime data:', err);
    res.status(500).json({ error: 'Server error' });
  }
});

app.post('/runtime/:botId/users/:userId', async (req, res) => {
  try {
    const { botId, userId } = req.params;

    // Update with upsert (create if not exists)
    const runtimeData = await BotRuntimeData.findOneAndUpdate(
      { botId, userId },
      { 
        ...req.body,
        lastInteraction: new Date() 
      },
      { 
        new: true,
        upsert: true,
        setDefaultsOnInsert: true,
        runValidators: true
      }
    );

    const statusCode = runtimeData.isNew ? 201 : 200;
    res.status(statusCode).json(runtimeData);
  } catch (err) {
    console.error('Error updating runtime data:', err);
    res.status(400).json({ error: err.message });
  }
});

// Define routes for analytics
app.get('/analytics/bots/:botId', async (req, res) => {
  try {
    const { botId } = req.params;
    const { startDate, endDate } = req.query;

    let query = { botId };

    if (startDate || endDate) {
      query.date = {};

      if (startDate) {
        query.date.$gte = new Date(startDate);
      }

      if (endDate) {
        query.date.$lte = new Date(endDate);
      }
    }

    const analytics = await Analytics.find(query).sort({ date: -1 });
    res.status(200).json(analytics);
  } catch (err) {
    console.error('Error fetching analytics:', err);
    res.status(500).json({ error: 'Server error' });
  }
});

app.post('/analytics/bots/:botId', async (req, res) => {
  try {
    const { botId } = req.params;

    const newAnalytics = new Analytics({
      botId,
      ...req.body,
      date: req.body.date ? new Date(req.body.date) : new Date()
    });

    await newAnalytics.save();
    res.status(201).json(newAnalytics);
  } catch (err) {
    console.error('Error creating analytics:', err);
    res.status(400).json({ error: err.message });
  }
});

// Start the server
app.listen(PORT, () => {
  console.log(`Database Service running on port ${PORT}`);
});

module.exports = app;
