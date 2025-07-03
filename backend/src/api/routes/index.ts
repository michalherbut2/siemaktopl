// backend/src/api/routes/index.ts
import { Application } from 'express';
import { Client } from 'discord.js';
import { Server as SocketIOServer } from 'socket.io';
import authRoutes from './auth';
import guildRoutes from './guilds';
import userRoutes from './users';

export function setupRoutes(app: Application, client: Client, io?: SocketIOServer) {
  // Make client and io available to routes
  app.locals.discordClient = client;
  if (io) {
    app.locals.socketIO = io;
  }
  
  // Routes
  app.use('/auth', authRoutes);
  app.use('/api/guilds', guildRoutes);
  app.use('/api/users', userRoutes);
  
  // Health check
  app.get('/health', (req, res) => {
    res.json({ 
      status: 'OK', 
      timestamp: new Date().toISOString(),
      websocket: !!io
    });
  });
}
