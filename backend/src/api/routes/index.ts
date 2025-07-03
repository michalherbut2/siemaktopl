// backend/src/api/routes/index.ts
import { Application } from 'express';
import { Client } from 'discord.js';
import authRoutes from './auth';
import guildRoutes from './guilds';
import userRoutes from './users';

export function setupRoutes(app: Application, client: Client) {
  // Make client available to routes
  app.locals.discordClient = client;
  
  // Routes
  app.use('/auth', authRoutes);
  app.use('/api/guilds', guildRoutes);
  app.use('/api/user', userRoutes);
  
  // Health check
  app.get('/health', (req, res) => {
    res.json({ status: 'OK', timestamp: new Date().toISOString() });
  });
}