// frontend/src/pages/DashboardPage.tsx
import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import axios from 'axios';
import { useAuth } from '../hooks/useAuth';
import { CogIcon, UserGroupIcon } from '@heroicons/react/24/outline';

interface Guild {
  id: string;
  name: string;
  icon: string | null;
  owner: boolean;
  permissions: boolean;
}

export default function DashboardPage() {
  const { user } = useAuth();
  const [guilds, setGuilds] = useState<Guild[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchGuilds();
  }, []);

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
        <h1 className="text-3xl font-bold text-white mb-2">
          Welcome back, {user?.username}!
        </h1>
        <p className="text-gray-400">
          Manage your Discord bot across all your servers.
        </p>
      </div>

      {guilds.length === 0 ? (
        <div className="text-center py-12">
          <UserGroupIcon className="h-16 w-16 text-gray-600 mx-auto mb-4" />
          <h3 className="text-xl font-semibold text-gray-400 mb-2">No servers found</h3>
          <p className="text-gray-500 mb-6">
            The bot isn't in any servers where you have admin permissions.
          </p>
          <a
            href={`https://discord.com/api/oauth2/authorize?client_id=${process.env.DISCORD_CLIENT_ID}&permissions=8&scope=bot%20applications.commands`}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-block bg-discord-blurple hover:bg-blue-600 text-white px-6 py-3 rounded-lg font-semibold transition-colors"
          >
            Invite Bot to Server  
          </a>
        </div>
      ) : (
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
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
      )}
    </div>
  );
}