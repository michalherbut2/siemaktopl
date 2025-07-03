// Entry point for Discord bot and API

console.log("Backend starting...");
import dotenv from 'dotenv';
dotenv.config({ path: '../.env' });

import { Client, GatewayIntentBits, Partials } from 'discord.js';
import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import rateLimit from 'express-rate-limit';

import { BotManager } from './bot/BotManager';
import { DatabaseManager } from './db/DatabaseManager';
import { setupRoutes } from './api/routes';

const app = express();
const PORT = process.env.API_PORT || 3001;

// Middleware
app.use(helmet());
app.use(cors({
  origin: process.env.FRONTEND_URL || 'http://localhost:3000',
  credentials: true
}));
app.use(express.json());
app.use(rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100 // limit each IP to 100 requests per windowMs
}));

// Initialize Discord Client
const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMessages,
    GatewayIntentBits.MessageContent,
    GatewayIntentBits.GuildMembers,
    GatewayIntentBits.DirectMessages,
    GatewayIntentBits.GuildModeration
  ],
  partials: [Partials.Channel, Partials.Message]
});

async function startApplication() {
  try {
    // Initialize Database
    await DatabaseManager.initialize();
    console.log('✅ Database connected');

    // Initialize Bot
    const botManager = new BotManager(client);

    await botManager.initialize();
    console.log('✅ Bot initialized');

    // Login Bot
    await client.login(process.env.DISCORD_TOKEN);
    console.log('✅ Bot logged in');

    // Setup API Routes
    setupRoutes(app, client);

    // Start API Server
    app.listen(PORT, () => {
      console.log(`✅ API Server running on port ${PORT}`);
    });

  } catch (error) {
    console.error('❌ Failed to start application:', error);
    process.exit(1);
  }
}

startApplication();

// Graceful shutdown
process.on('SIGINT', async () => {
  console.log('🔄 Shutting down gracefully...');
  client.destroy();
  await DatabaseManager.disconnect();
  process.exit(0);
});