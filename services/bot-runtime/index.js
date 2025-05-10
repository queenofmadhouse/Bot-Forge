/**
 * Bot Runtime Service
 * 
 * This service handles the execution of Telegram bots:
 * - Bot deployment
 * - Telegram API integration
 * - Message handling
 * - Command execution
 * - Flow execution
 */

const express = require('express');
const bodyParser = require('body-parser');
const { Telegraf } = require('telegraf');
const axios = require('axios');
const dotenv = require('dotenv');

dotenv.config();

const app = express();
const PORT = process.env.BOT_RUNTIME_PORT || 3003;
const DB_SERVICE = process.env.DB_SERVICE_URL || 'http://localhost:3004';

app.use(bodyParser.json());

app.use((req, res, next) => {
  console.log(`[Bot Runtime Service] ${req.method} ${req.url}`);
  next();
});

app.get('/health', (req, res) => {
  res.status(200).json({ status: 'OK', service: 'Bot Runtime Service' });
});

const activeBots = new Map();

const createBotInstance = (botConfig) => {
  try {
    console.log(`Creating bot instance for ${botConfig.name}`);

    const telegrafBot = new Telegraf(botConfig.token);

    const bot = {
      id: botConfig._id || botConfig.id,
      name: botConfig.name,
      commands: botConfig.commands,
      flows: botConfig.flows,
      telegraf: telegrafBot,

      start: () => {
        console.log(`Bot ${botConfig.name} started`);

        // Register commands
        if (botConfig.commands && botConfig.commands.length > 0) {
          botConfig.commands.forEach(cmd => {
            telegrafBot.command(cmd.name, (ctx) => {
              ctx.reply(cmd.response);
            });
          });
        }

        // Start the bot
        telegrafBot.launch().then(() => {
          console.log(`Bot ${botConfig.name} is running`);
        }).catch(err => {
          console.error(`Error launching bot ${botConfig.name}:`, err);
        });

        return true;
      },

      stop: () => {
        console.log(`Bot ${botConfig.name} stopped`);
        telegrafBot.stop();
        return true;
      },

      // Command handler for simulation
      handleCommand: (command, args) => {
        const cmd = botConfig.commands.find(c => c.name === command);
        if (cmd) {
          return cmd.response;
        }
        return `Command /${command} not found`;
      },

      // Flow handler for simulation
      handleFlow: (flowId, input) => {
        const flow = botConfig.flows.find(f => f.id === flowId);
        if (!flow) {
          return { error: 'Flow not found' };
        }

        // Find the current step (in a real app, we would track user state)
        const step = flow.steps[0];

        return {
          message: step.message,
          options: step.options
        };
      }
    };

    return bot;
  } catch (error) {
    console.error(`Error creating bot instance for ${botConfig.name}:`, error);
    return null;
  }
};

app.post('/deploy', async (req, res) => {
  try {
    const botConfig = req.body;

    if (!botConfig || !botConfig.id || !botConfig.name) {
      return res.status(400).json({ error: 'Invalid bot configuration' });
    }

    if (activeBots.has(botConfig.id)) {

      const existingBot = activeBots.get(botConfig.id);
      existingBot.stop();
      activeBots.delete(botConfig.id);
    }

    const bot = createBotInstance(botConfig);
    if (!bot) {
      return res.status(500).json({ error: 'Failed to create bot instance' });
    }

    bot.start();
    activeBots.set(botConfig.id, bot);

    res.status(200).json({ message: 'Bot deployed successfully', botId: botConfig.id });
  } catch (error) {
    console.error('[Bot Runtime Service] Deploy bot error:', error);
    res.status(500).json({ error: 'Failed to deploy bot', message: error.message });
  }
});

app.post('/undeploy/:botId', async (req, res) => {
  try {
    const { botId } = req.params;

    if (!activeBots.has(botId)) {
      return res.status(404).json({ error: 'Bot not deployed' });
    }

    const bot = activeBots.get(botId);
    bot.stop();
    activeBots.delete(botId);

    res.status(200).json({ message: 'Bot undeployed successfully' });
  } catch (error) {
    console.error('[Bot Runtime Service] Undeploy bot error:', error);
    res.status(500).json({ error: 'Failed to undeploy bot', message: error.message });
  }
});

app.get('/deployed', async (req, res) => {
  try {
    const deployedBots = Array.from(activeBots.keys()).map(botId => {
      const bot = activeBots.get(botId);
      return {
        id: bot.id,
        name: bot.name
      };
    });

    res.status(200).json({ bots: deployedBots });
  } catch (error) {
    console.error('[Bot Runtime Service] Get deployed bots error:', error);
    res.status(500).json({ error: 'Failed to get deployed bots', message: error.message });
  }
});

// Simulate sending a command to a bot (for testing)
app.post('/simulate/:botId/command', async (req, res) => {
  try {
    const { botId } = req.params;
    const { command, args } = req.body;

    if (!activeBots.has(botId)) {
      return res.status(404).json({ error: 'Bot not deployed' });
    }

    // Handle the command
    const bot = activeBots.get(botId);
    const response = bot.handleCommand(command, args);

    res.status(200).json({ response });
  } catch (error) {
    console.error('[Bot Runtime Service] Simulate command error:', error);
    res.status(500).json({ error: 'Failed to simulate command', message: error.message });
  }
});

// Simulate starting a flow (for testing)
app.post('/simulate/:botId/flow', async (req, res) => {
  try {
    const { botId } = req.params;
    const { flowId, input } = req.body;

    if (!activeBots.has(botId)) {
      return res.status(404).json({ error: 'Bot not deployed' });
    }

    const bot = activeBots.get(botId);
    const response = bot.handleFlow(flowId, input);

    res.status(200).json(response);
  } catch (error) {
    console.error('[Bot Runtime Service] Simulate flow error:', error);
    res.status(500).json({ error: 'Failed to simulate flow', message: error.message });
  }
});

const deployActiveBots = async () => {
  try {
    console.log('Fetching active bots from database...');

    try {
      const response = await axios.get(`${DB_SERVICE}/bots?status=active`);
      const activeBotConfigs = response.data;

      console.log(`Found ${activeBotConfigs.length} active bots in the database`);

      for (const botConfig of activeBotConfigs) {
        const bot = createBotInstance(botConfig);
        if (bot) {
          bot.start();
          activeBots.set(botConfig._id, bot);
          console.log(`Deployed bot: ${botConfig.name}`);
        }
      }
    } catch (dbError) {
      console.error('Error fetching bots from database:', dbError);
    }
  } catch (error) {
    console.error('Error deploying demo bots:', error);
  }
};

// Start the server
app.listen(PORT, () => {
  console.log(`Bot Runtime Service running on port ${PORT}`);
  deployActiveBots();
});

module.exports = app;
