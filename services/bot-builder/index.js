/**
 * Bot Builder Service
 * 
 * This service handles the creation and configuration of Telegram bots:
 * - Bot creation
 * - Bot configuration
 * - Command definition
 * - Flow management
 * - Bot templates
 */

const express = require('express');
const bodyParser = require('body-parser');
const axios = require('axios');
const dotenv = require('dotenv');

// Load environment variables
dotenv.config();

const app = express();
const PORT = process.env.BOT_BUILDER_PORT || 3002;
const DB_SERVICE = process.env.DB_SERVICE_URL || 'http://localhost:3004';
const BOT_RUNTIME_SERVICE = process.env.BOT_RUNTIME_SERVICE_URL || 'http://localhost:3003';

// Middleware
app.use(bodyParser.json());

// Request logging
app.use((req, res, next) => {
  console.log(`[Bot Builder Service] ${req.method} ${req.url}`);
  next();
});

app.get('/health', (req, res) => {
  res.status(200).json({ status: 'OK', service: 'Bot Builder Service' });
});

app.post('/test/:id', (req, res) => {
  res.status(200).json({ message: 'Bot Builder Service is running (post)' });
});

// Create a new bot
app.post('/', async (req, res) => {
  try {
    const { name, ownerId, token } = req.body;
    console.log(`[Bot Builder Service] Create bot request received for bot: ${name} by user: ${ownerId}`);

    // Validate input
    if (!name || !ownerId || !token) {
      console.log(`[Bot Builder Service] Validation failed: Missing required fields for bot: ${name} by user: ${ownerId}`);
      return res.status(400).json({ error: 'Bot name, owner ID and token are required' });
    }

    // Create a new bot with default commands
    const newBot = {
      name,
      token,
      ownerId,
      commands: [
        {
          name: 'start',
          description: 'Start the bot',
          response: `Welcome to ${name}!`
        },
        {
          name: 'help',
          description: 'Get help',
          response: `This is ${name}. Available commands: /start, /help`
        }
      ],
      flows: [],
      status: 'inactive'
    };

    // Save to the database service
    try {
      const response = await axios.post(`${DB_SERVICE}/bots`, newBot);
      const savedBot = response.data;
      res.status(201).json(savedBot);
    } catch (dbError) {
      console.error('[Bot Builder Service] Database error:', dbError);
      return res.status(500).json({ error: 'Failed to save bot to database', message: dbError.message });
    }
  } catch (error) {
    console.error('[Bot Builder Service] Create bot error:', error);
    res.status(500).json({ error: 'Failed to create bot', message: error.message });
  }
});

// Get all bots for a user
app.get('/user/:userId', async (req, res) => {
  try {
    const { userId } = req.params;

    try {
      const response = await axios.get(`${DB_SERVICE}/bots?ownerId=${userId}`);
      const bots = response.data;
      res.status(200).json({ bots });
    } catch (dbError) {
      console.error('[Bot Builder Service] Database error:', dbError);
      return res.status(500).json({ error: 'Failed to fetch bots from database', message: dbError.message });
    }
  } catch (error) {
    console.error('[Bot Builder Service] Get user bots error:', error);
    res.status(500).json({ error: 'Failed to get user bots', message: error.message });
  }
});

// Get a specific bot
app.get('/:botId', async (req, res) => {
  try {
    const { botId } = req.params;

    // Fetch bot from database service
    try {
      const response = await axios.get(`${DB_SERVICE}/bots/${botId}`);
      const bot = response.data;
      res.status(200).json(bot);
    } catch (dbError) {
      if (dbError.response && dbError.response.status === 404) {
        return res.status(404).json({ error: 'Bot not found' });
      }
      console.error('[Bot Builder Service] Database error:', dbError);
      return res.status(500).json({ error: 'Failed to fetch bot from database', message: dbError.message });
    }
  } catch (error) {
    console.error('[Bot Builder Service] Get bot error:', error);
    res.status(500).json({ error: 'Failed to get bot', message: error.message });
  }
});

// Update a bot
app.put('/:botId', async (req, res) => {
  try {
    const { botId } = req.params;
    const updates = req.body;

    // Update bot in database service
    try {
      const response = await axios.put(`${DB_SERVICE}/bots/${botId}`, updates);
      const updatedBot = response.data;
      res.status(200).json(updatedBot);
    } catch (dbError) {
      if (dbError.response && dbError.response.status === 404) {
        return res.status(404).json({ error: 'Bot not found' });
      }
      console.error('[Bot Builder Service] Database error:', dbError);
      return res.status(500).json({ error: 'Failed to update bot in database', message: dbError.message });
    }
  } catch (error) {
    console.error('[Bot Builder Service] Update bot error:', error);
    res.status(500).json({ error: 'Failed to update bot', message: error.message });
  }
});

app.post('/commands/:botId', async (req, res) => {
  try {
    console.log(`[Bot Builder Service] Add command request received: ${req.method} ${req.url}`)
    const { botId } = req.params;
    const { name, description, response } = req.body;

    if (!name || !description || !response) {
      return res.status(400).json({ error: 'Command name, description, and response are required' });
    }

    try {
      const botResponse = await axios.get(`${DB_SERVICE}/bots/${botId}`);
      const bot = botResponse.data;

      if (bot.commands && bot.commands.some(cmd => cmd.name === name)) {
        return res.status(409).json({ error: 'Command already exists' });
      }

      const newCommand = { name, description, response };
      const commands = bot.commands ? [...bot.commands, newCommand] : [newCommand];

      const updateResponse = await axios.put(`${DB_SERVICE}/bots/${botId}`, { commands });
      const updatedBot = updateResponse.data;

      res.status(201).json(newCommand);
    } catch (dbError) {
      if (dbError.response && dbError.response.status === 404) {
        return res.status(404).json({ error: 'Bot not found' });
      }
      console.error('[Bot Builder Service] Database error:', dbError);
      return res.status(500).json({ error: 'Failed to add command to bot', message: dbError.message });
    }
  } catch (error) {
    console.error('[Bot Builder Service] Add command error:', error);
    res.status(500).json({ error: 'Failed to add command', message: error.message });
  }
});

app.post('/:botId/flows', async (req, res) => {
  try {
    const { botId } = req.params;
    const { name, trigger, steps } = req.body;

    if (!name || !trigger || !steps || !Array.isArray(steps) || steps.length === 0) {
      return res.status(400).json({ error: 'Flow name, trigger, and steps are required' });
    }

    try {
      const botResponse = await axios.get(`${DB_SERVICE}/bots/${botId}`);
      const bot = botResponse.data;

      const newFlow = {
        id: `flow-${Date.now()}`,
        name,
        trigger,
        steps
      };
      const flows = bot.flows ? [...bot.flows, newFlow] : [newFlow];

      const updateResponse = await axios.put(`${DB_SERVICE}/bots/${botId}`, { flows });
      const updatedBot = updateResponse.data;

      res.status(201).json(newFlow);
    } catch (dbError) {
      if (dbError.response && dbError.response.status === 404) {
        return res.status(404).json({ error: 'Bot not found' });
      }
      console.error('[Bot Builder Service] Database error:', dbError);
      return res.status(500).json({ error: 'Failed to add flow to bot', message: dbError.message });
    }
  } catch (error) {
    console.error('[Bot Builder Service] Add flow error:', error);
    res.status(500).json({ error: 'Failed to add flow', message: error.message });
  }
});

app.post('/:botId/deploy', async (req, res) => {
  try {
    const { botId } = req.params;

    try {
      const botResponse = await axios.get(`${DB_SERVICE}/bots/${botId}`);
      const bot = botResponse.data;

      // Deploy to the Bot Runtime service
      await axios.post(`${BOT_RUNTIME_SERVICE}/deploy`, bot);

      // Update bot status in database
      const updateResponse = await axios.put(`${DB_SERVICE}/bots/${botId}`, { status: 'active' });
      const updatedBot = updateResponse.data;

      res.status(200).json({ message: 'Bot deployed successfully', bot: updatedBot });
    } catch (dbError) {
      if (dbError.response && dbError.response.status === 404) {
        return res.status(404).json({ error: 'Bot not found' });
      }
      console.error('[Bot Builder Service] Database error:', dbError);
      return res.status(500).json({ error: 'Failed to deploy bot', message: dbError.message });
    }
  } catch (error) {
    console.error('[Bot Builder Service] Deploy bot error:', error);
    res.status(500).json({ error: 'Failed to deploy bot', message: error.message });
  }
});

app.listen(PORT, () => {
  console.log(`Bot Builder Service running on port ${PORT}`);
});

module.exports = app;
