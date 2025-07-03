// frontend/src/pages/DashboardPage.tsx
import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import axios from 'axios';
import { useAuth } from '../hooks/useAuth';
import { useWebSocket } from '../hooks/useWebSocket';
import { CogIcon, UserGroupIcon, WifiIcon } from '@heroicons/react/24/outline';

interface Guild {
  id: string;
  name: string;
  icon: string | null;
  owner: boolean;
  permissions: boolean;
  memberCount?: number;
}

interface DiscordMessage {
  id: string;
  content: string;
  author: {
    id: string;
    username: string;
    avatar: string;
  };
  channel: {
    id: string;
    name: string;
  };
  guild: {
    id: string;
    name: string;
  };
  timestamp: string;
}

export default function DashboardPage() {
  const { user } = useAuth();
  const { connected, on, off } = useWebSocket();
  const [guilds, setGuilds] = useState<Guild[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [recentMessages, setRecentMessages] = useState<DiscordMessage[]>([]);
  const [notifications, setNotifications] = useState<string[]>([]);

  useEffect(() => {
    fetchGuilds();
  }, []);

  // WebSocket event listeners
  useEffect(() => {
    if (!connected) return;

    const handleDiscordMessage = (message: DiscordMessage) => {
      setRecentMessages(prev => [message, ...prev].slice(0, 10));
      
      // Add notification
      setNotifications(prev => [
        `New message in ${message.guild.name}#${message.channel.name}`,
        ...prev
      ].slice(0, 5));
    };

    const handleMemberJoin = (data: any) => {
      setNotifications(prev => [
        `${data.user.username} joined ${data.guild.name}`,
        ...prev
      ].slice(0, 5));
    };

    const handleMemberLeave = (data: any) => {
      setNotifications(prev => [
        `${data.user.username} left ${data.guild.name}`,
        ...prev
      ].slice(0, 5));
    };

    // Subscribe to events
    on('discord:message', handleDiscordMessage);
    on('discord:member:join', handleMemberJoin);
    on('discord:member:leave', handleMemberLeave);

    return () => {
      off('discord:message', handleDiscordMessage);
      off('discord:member:join', handleMemberJoin);
      off('discord:member:leave', handleMemberLeave);
    };
  }, [connected, on, off]);

  const fetchGuilds = async () => {
    try {
      const response = await axios.get('/api/guilds');
      setGuilds(response.data);
    } catch (err) {
      console.error('Error fetching guilds:', err);
      setError('Failed to load servers');
    } finally {
      setLoading(false);
    }
  };

  const clearNotifications = () => {
    setNotifications([]);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-96">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-discord-blurple"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="max-w-2xl mx-auto">
        <div className="bg-red-900/20 border border-red-500 p-6 rounded-lg">
          <h2 className="text-xl font-semibold text-red-400 mb-2">Error</h2>
          <p className="text-red-300">{error}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto">
      <div className="mb-8">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-white mb-2">
              Welcome back, {user?.username}!
            </h1>
            <p className="text-gray-400">
              Manage your Discord bot across all your servers.
            </p>
          </div>
          <div className="flex items-center space-x-2">
            <WifiIcon className={`h-5 w-5 ${connected ? 'text-green-400' : 'text-red-400'}`} />
            <span className={`text-sm ${connected ? 'text-green-400' : 'text-red-400'}`}>
              {connected ? 'Connected' : 'Disconnected'}
            </span>
          </div>
        </div>
      </div>

      {/* Real-time notifications */}
      {notifications.length > 0 && (
        <div className="bg-blue-900/20 border border-blue-500 p-4 rounded-lg mb-6">
          <div className="flex items-center justify-between mb-2">
            <h3 className="text-lg font-semibold text-blue-400">Recent Activity</h3>
            <button
              onClick={clearNotifications}
              className="text-blue-400 hover:text-blue-300 text-sm"
            >
              Clear
            </button>
          </div>
          <div className="space-y-1">
            {notifications.map((notification, index) => (
              <p key={index} className="text-blue-300 text-sm">
                • {notification}
              </p>
            ))}
          </div>
        </div>
      )}

      {guilds.length === 0 ? (
        <div className="text-center py-12">
          <UserGroupIcon className="h-16 w-16 text-gray-600 mx-auto mb-4" />
          <h3 className="text-xl font-semibold text-gray-400 mb-2">No servers found</h3>
          <p className="text-gray-500 mb-6">
            The bot isn't in any servers where you have admin permissions.
          </p>
          <a
            href={`https://discord.com/api/oauth2/authorize?client_id=${process.env.VITE_DISCORD_CLIENT_ID}&permissions=8&scope=bot%20applications.commands`}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-block bg-discord-blurple hover:bg-blue-600 text-white px-6 py-3 rounded-lg font-semibold transition-colors"
          >
            Invite Bot to Server
          </a>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Guilds Grid */}
          <div className="lg:col-span-2">
            <div className="grid md:grid-cols-2 gap-6">
              {guilds.map((guild) => (
                <div key={guild.id} className="bg-gray-800 border border-gray-700 rounded-lg p-6 hover:border-discord-blurple transition-colors">
                  <div className="flex items-center space-x-4 mb-4">
                    {guild.icon ? (
                      <img
                        src={`https://cdn.discordapp.com/icons/${guild.id}/${guild.icon}.png`}
                        alt={guild.name}
                        className="w-12 h-12 rounded-full"
                      />
                    ) : (
                      <div className="w-12 h-12 bg-discord-blurple rounded-full flex items-center justify-center">
                        <span className="text-white font-semibold">
                          {guild.name.charAt(0).toUpperCase()}
                        </span>
                      </div>
                    )}
                    <div>
                      <h3 className="text-white font-semibold">{guild.name}</h3>
                      <p className="text-gray-400 text-sm">
                        {guild.owner ? 'Owner' : 'Admin'}
                        {guild.memberCount && ` • ${guild.memberCount} members`}
                      </p>
                    </div>
                  </div>
                  
                  <Link
                    to={`/guild/${guild.id}`}
                    className="flex items-center justify-center space-x-2 w-full bg-discord-blurple hover:bg-blue-600 text-white py-2 px-4 rounded-lg transition-colors"
                  >
                    <CogIcon className="h-4 w-4" />
                    <span>Configure</span>
                  </Link>
                </div>
              ))}
            </div>
          </div>

          {/* Recent Messages Sidebar */}
          <div className="lg:col-span-1">
            <div className="bg-gray-800 border border-gray-700 rounded-lg p-6">
              <h3 className="text-lg font-semibold text-white mb-4">Recent Messages</h3>
              {recentMessages.length === 0 ? (
                <p className="text-gray-400 text-sm">No recent messages</p>
              ) : (
                <div className="space-y-3">
                  {recentMessages.map((message) => (
                    <div key={message.id} className="bg-gray-700 p-3 rounded-lg">
                      <div className="flex items-center space-x-2 mb-1">
                        <span className="text-sm font-medium text-white">
                          {message.author.username}
                        </span>
                        <span className="text-xs text-gray-400">
                          #{message.channel.name}
                        </span>
                      </div>
                      <p className="text-sm text-gray-300 truncate">
                        {message.content || '<No content>'}
                      </p>
                      <span className="text-xs text-gray-500">
                        {message.guild.name}
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
