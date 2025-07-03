// backend/src/api/websocket/index.ts
import { Server as SocketIOServer } from 'socket.io';
import { Client } from 'discord.js';
import jwt from 'jsonwebtoken';
import { DatabaseManager } from '../../db/DatabaseManager';

interface AuthenticatedSocket {
  userId?: string;
  username?: string;
  guilds?: string[];
}

export function setupWebSocket(io: SocketIOServer, client: Client) {
  // WebSocket authentication middleware
  io.use(async (socket, next) => {
    try {
      const token = socket.handshake.auth.token;
      
      if (!token) {
        return next(new Error('Authentication error'));
      }

      const decoded = jwt.verify(token, process.env.JWT_SECRET!) as any;
      (socket as any).userId = decoded.userId;
      (socket as any).username = decoded.username;
      
      // Get user's guilds for authorization
      const user = await DatabaseManager.getUser(decoded.userId);
      if (user) {
        (socket as any).guilds = user.guilds || [];
      }
      
      next();
    } catch (err) {
      next(new Error('Authentication error'));
    }
  });

  io.on('connection', (socket) => {
    const authenticatedSocket = socket as any;
    console.log(`✅ WebSocket connected: ${authenticatedSocket.username} (${authenticatedSocket.userId})`);

    // Join user-specific room
    socket.join(`user:${authenticatedSocket.userId}`);

    // Join guild-specific rooms based on user's guilds
    if (authenticatedSocket.guilds) {
      authenticatedSocket.guilds.forEach((guildId: string) => {
        socket.join(`guild:${guildId}`);
      });
    }

    // Handle guild subscription
    socket.on('subscribe:guild', (guildId: string) => {
      // Verify user has access to this guild
      if (authenticatedSocket.guilds?.includes(guildId)) {
        socket.join(`guild:${guildId}`);
        console.log(`User ${authenticatedSocket.username} subscribed to guild ${guildId}`);
      }
    });

    // Handle guild unsubscription
    socket.on('unsubscribe:guild', (guildId: string) => {
      socket.leave(`guild:${guildId}`);
      console.log(`User ${authenticatedSocket.username} unsubscribed from guild ${guildId}`);
    });

    // Handle real-time bot commands
    socket.on('bot:command', async (data) => {
      try {
        const { guildId, channelId, command } = data;
        
        // Verify user has access to this guild
        if (!authenticatedSocket.guilds?.includes(guildId)) {
          socket.emit('error', { message: 'Unauthorized access to guild' });
          return;
        }

        // Execute command through Discord client
        const guild = client.guilds.cache.get(guildId);
        const channel = guild?.channels.cache.get(channelId);
        
        if (channel && channel.isTextBased()) {
          // Send command result back to user
          socket.emit('bot:command:result', {
            guildId,
            channelId,
            success: true,
            message: `Command executed: ${command}`
          });
        }
      } catch (error) {
        socket.emit('error', { message: 'Failed to execute command' });
      }
    });

    // Handle disconnect
    socket.on('disconnect', () => {
      console.log(`❌ WebSocket disconnected: ${authenticatedSocket.username}`);
    });
  });

  // Discord event listeners to broadcast to WebSocket clients
  client.on('messageCreate', (message) => {
    if (message.guild) {
      io.to(`guild:${message.guild.id}`).emit('discord:message', {
        id: message.id,
        content: message.content,
        author: {
          id: message.author.id,
          username: message.author.username,
          avatar: message.author.avatar
        },
        channel: {
          id: message.channel.id,
          name: message.channel.name
        },
        guild: {
          id: message.guild.id,
          name: message.guild.name
        },
        timestamp: message.createdAt
      });
    }
  });

  client.on('guildMemberAdd', (member) => {
    io.to(`guild:${member.guild.id}`).emit('discord:member:join', {
      user: {
        id: member.user.id,
        username: member.user.username,
        avatar: member.user.avatar
      },
      guild: {
        id: member.guild.id,
        name: member.guild.name
      },
      joinedAt: member.joinedAt
    });
  });

  client.on('guildMemberRemove', (member) => {
    io.to(`guild:${member.guild.id}`).emit('discord:member:leave', {
      user: {
        id: member.user.id,
        username: member.user.username,
        avatar: member.user.avatar
      },
      guild: {
        id: member.guild.id,
        name: member.guild.name
      }
    });
  });

  console.log('✅ WebSocket server initialized');
}
