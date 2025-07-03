// frontend/src/pages/GuildPage.tsx
import React, { useState, useEffect } from "react";
import { useParams, Link } from "react-router-dom";
import axios from "axios";
import { useWebSocket } from "../hooks/useWebSocket";
import { ArrowLeftIcon, WifiIcon } from "@heroicons/react/24/outline";

interface Command {
  id: number;
  guildId: string;
  createdAt: string;
  updatedAt: string;
  name: string;
  enabled: boolean;
  category: string | null;
  cooldown: number | null;
  permissions: string | null;
  userId: string;
}

interface CustomCommand {
  id: number;
  guildId: string;
  name: string;
  response: string;
  createdAt: string;
  updatedAt: string;
  createdBy: string;
}

interface ChannelConfig {
  id: number;
  guildId: string;
  channelId: string;
  configType: string;
  value: string;
  createdAt: string;
  updatedAt: string;
}

interface GuildSettings {
  id: string;
  name: string;
  icon: string | null;
  prefix: string;
  enabled: boolean;
  welcomeEnabled: boolean;
  welcomeChannelId: string | null;
  welcomeMessage: string | null;
  analyticsEnabled: boolean;
  createdAt: string;
  updatedAt: string;
  commands: Command[];
  customCommands: CustomCommand[];
  channelConfigs: ChannelConfig[];
}

interface BotStatus {
  online: boolean;
  guilds: number;
  users: number;
  uptime: number;
  ping: number;
}

export default function GuildPage() {
  const { guildId } = useParams<{ guildId: string }>();
  const { connected, on, off, subscribeToGuild, unsubscribeFromGuild } = useWebSocket();
  const [settings, setSettings] = useState<GuildSettings | null>(null);
  const [botStatus, setBotStatus] = useState<BotStatus | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [liveActivity, setLiveActivity] = useState<string[]>([]);

  useEffect(() => {
    if (guildId) {
      fetchGuildData();
      fetchBotStatus();
      
      // Subscribe to guild events
      if (connected) {
        subscribeToGuild(guildId);
      }
    }

    return () => {
      if (guildId && connected) {
        unsubscribeFromGuild(guildId);
      }
    };
  }, [guildId, connected]);

  // WebSocket event listeners
  useEffect(() => {
    if (!connected || !guildId) return;

    const handleSettingsUpdate = (data: any) => {
      if (data.guildId === guildId) {
        setSettings(data.settings);
        setLiveActivity(prev => [
          `Settings updated by ${data.updatedBy}`,
          ...prev
        ].slice(0, 5));
      }
    };

    const handleCommandCreated = (data: any) => {
      if (data.guildId === guildId) {
        setSettings(prev => prev ? {
          ...prev,
          customCommands: [...prev.customCommands, data.command]
        } : null);
        setLiveActivity(prev => [
          `Custom command "${data.command.name}" created`,
          ...prev
        ].slice(0, 5));
      }
    };

    const handleDiscordMessage = (message: any) => {
      if (message.guild.id === guildId) {
        setLiveActivity(prev => [
          `Message from ${message.author.username} in #${message.channel.name}`,
          ...prev
        ].slice(0, 5));
      }
    };

    // Subscribe to events
    on('guild:settings:updated', handleSettingsUpdate);
    on('guild:command:created', handleCommandCreated);
    on('discord:message', handleDiscordMessage);

    return () => {
      off('guild:settings:updated', handleSettingsUpdate);
      off('guild:command:created', handleCommandCreated);
      off('discord:message', handleDiscordMessage);
    };
  }, [connected, guildId, on, off]);

  const fetchGuildData = async () => {
    try {
      const response = await axios.get<GuildSettings>(`/api/guilds/${guildId}`);
      setSettings(response.data);
      setError(null);
    } catch (err) {
      console.error("Error fetching guild settings:", err);
      setError("Failed to load server settings");
    } finally {
      setLoading(false);
    }
  };

  const fetchBotStatus = async () => {
    try {
      const response = await axios.get<BotStatus>("/api/guilds/bot/status");
      setBotStatus(response.data);
    } catch (err) {
      console.error("Error fetching bot status:", err);
    }
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!settings) return;

    setSaving(true);
    setError(null);
    setSuccess(false);

    try {
      const response = await axios.put<GuildSettings>(`/api/guilds/${guildId}`, {
        prefix: settings.prefix,
        enabled: settings.enabled,
        welcomeEnabled: settings.welcomeEnabled,
        welcomeChannelId: settings.welcomeChannelId,
        welcomeMessage: settings.welcomeMessage,
        analyticsEnabled: settings.analyticsEnabled,
      });

      setSettings(response.data);
      setSuccess(true);
      setTimeout(() => setSuccess(false), 3000);
    } catch (err) {
      console.error("Error saving settings:", err);
      setError("Failed to save settings");
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-96">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-discord-blurple"></div>
      </div>
    );
  }

  if (error && !settings) {
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
      <div className="mb-6">
        <Link
          to="/dashboard"
          className="inline-flex items-center space-x-2 text-discord-blurple hover:text-blue-400 transition-colors mb-4"
        >
          <ArrowLeftIcon className="h-4 w-4" />
          <span>Back to Dashboard</span>
        </Link>

        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-white mb-2">Server Configuration</h1>
            <p className="text-gray-400">Configure bot settings for {settings?.name}</p>
          </div>
          <div className="flex items-center space-x-2">
            <WifiIcon className={`h-5 w-5 ${connected ? 'text-green-400' : 'text-red-400'}`} />
            <span className={`text-sm ${connected ? 'text-green-400' : 'text-red-400'}`}>
              {connected ? 'Live' : 'Offline'}
            </span>
          </div>
        </div>
      </div>

      {/* Live Activity */}
      {liveActivity.length > 0 && (
        <div className="bg-green-900/20 border border-green-500 p-4 rounded-lg mb-6">
          <h3 className="text-lg font-semibold text-green-400 mb-2">Live Activity</h3>
          <div className="space-y-1">
            {liveActivity.map((activity, index) => (
              <p key={index} className="text-green-300 text-sm">
                • {activity}
              </p>
            ))}
          </div>
        </div>
      )}

      {success && (
        <div className="bg-green-900/20 border border-green-500 p-4 rounded-lg mb-6">
          <p className="text-green-300">Settings saved successfully!</p>
        </div>
      )}

      {error && (
        <div className="bg-red-900/20 border border-red-500 p-4 rounded-lg mb-6">
          <p className="text-red-300">{error}</p>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main Settings Form */}
        <div className="lg:col-span-2">
          <form onSubmit={handleSave} className="bg-gray-800 border border-gray-700 rounded-lg p-6 space-y-6">
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">Bot Status</label>
              <div className="flex items-center space-x-3">
                <input
                  type="checkbox"
                  id="enabled"
                  checked={settings?.enabled || false}
                  onChange={(e) => setSettings(prev => prev ? { ...prev, enabled: e.target.checked } : null)}
                  className="w-4 h-4 text-discord-blurple bg-gray-700 border-gray-600 rounded focus:ring-discord-blurple focus:ring-2"
                />
                <label htmlFor="enabled" className="text-gray-300">
                  Enable bot in this server
                </label>
              </div>
            </div>

            <div>
              <label htmlFor="prefix" className="block text-sm font-medium text-gray-300 mb-2">Command Prefix</label>
              <input
                type="text"
                id="prefix"
                value={settings?.prefix || ""}
                onChange={(e) => setSettings(prev => prev ? { ...prev, prefix: e.target.value } : null)}
                className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:border-discord-blurple focus:ring-1 focus:ring-discord-blurple"
                placeholder="!"
                maxLength={3}
              />
              <p className="text-sm text-gray-400 mt-1">The prefix used for text commands (e.g., !help)</p>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">Welcome Messages</label>
              <div className="flex items-center space-x-3 mb-2">
                <input
                  type="checkbox"
                  id="welcomeEnabled"
                  checked={settings?.welcomeEnabled || false}
                  onChange={(e) => setSettings(prev => prev ? { ...prev, welcomeEnabled: e.target.checked } : null)}
                  className="w-4 h-4 text-discord-blurple bg-gray-700 border-gray-600 rounded focus:ring-discord-blurple focus:ring-2"
                />
                <label htmlFor="welcomeEnabled" className="text-gray-300">
                  Enable welcome messages
                </label>
              </div>
              {settings?.welcomeEnabled && (
                <>
                  <input
                    type="text"
                    id="welcomeChannelId"
                    value={settings.welcomeChannelId || ""}
                    onChange={(e) => setSettings(prev => prev ? { ...prev, welcomeChannelId: e.target.value } : null)}
                    placeholder="Welcome Channel ID"
                    className="w-full px-3 py-2 mb-2 bg-gray-700 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:border-discord-blurple focus:ring-1 focus:ring-discord-blurple"
                  />
                  <textarea
                    id="welcomeMessage"
                    value={settings.welcomeMessage || ""}
                    onChange={(e) => setSettings(prev => prev ? { ...prev, welcomeMessage: e.target.value } : null)}
                    placeholder="Welcome message content"
                    rows={3}
                    className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:border-discord-blurple focus:ring-1 focus:ring-discord-blurple"
                  />
                </>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">Analytics</label>
              <div className="flex items-center space-x-3">
                <input
                  type="checkbox"
                  id="analyticsEnabled"
                  checked={settings?.analyticsEnabled || false}
                  onChange={(e) => setSettings(prev => prev ? { ...prev, analyticsEnabled: e.target.checked } : null)}
                  className="w-4 h-4 text-discord-blurple bg-gray-700 border-gray-600 rounded focus:ring-discord-blurple focus:ring-2"
                />
                <label htmlFor="analyticsEnabled" className="text-gray-300">
                  Enable analytics
                </label>
              </div>
            </div>

            <div className="flex justify-end mt-8">
              <button
                type="submit"
                disabled={saving}
                className="bg-discord-blurple hover:bg-blue-600 disabled:bg-gray-600 text-white px-6 py-2 rounded-lg font-semibold transition-colors flex items-center space-x-2"
              >
                {saving ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                    <span>Saving...</span>
                  </>
                ) : (
                  <span>Save Settings</span>
                )}
              </button>
            </div>
          </form>
        </div>

        {/* Sidebar with Bot Status and Commands */}
        <div className="space-y-6">
          {/* Bot Status */}
          {botStatus && (
            <div className="bg-gray-800 border border-gray-700 rounded-lg p-4">
              <h3 className="text-lg font-semibold text-white mb-3">Bot Status</h3>
              <div className="space-y-2">
                <div className="flex justify-between">
                  <span className="text-gray-400">Status:</span>
                  <span className={`font-medium ${botStatus.online ? 'text-green-400' : 'text-red-400'}`}>
                    {botStatus.online ? 'Online' : 'Offline'}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-400">Guilds:</span>
                  <span className="text-white">{botStatus.guilds}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-400">Users:</span>
                  <span className="text-white">{botStatus.users}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-400">Uptime:</span>
                  <span className="text-white">{Math.floor(botStatus.uptime / 1000 / 60)} min</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-400">Ping:</span>
                  <span className="text-white">{botStatus.ping}ms</span>
                </div>
              </div>
            </div>
          )}

          {/* Commands Overview */}
          <div className="bg-gray-800 border border-gray-700 rounded-lg p-4">
            <h3 className="text-lg font-semibold text-white mb-3">Commands Overview</h3>
            <div className="space-y-2">
              <div className="flex justify-between">
                <span className="text-gray-400">Total Commands:</span>
                <span className="text-white">{settings?.commands?.length || 0}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-400">Custom Commands:</span>
                <span className="text-white">{settings?.customCommands?.length || 0}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-400">Channel Configs:</span>
                <span className="text-white">{settings?.channelConfigs?.length || 0}</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Detailed Commands Information */}
      <div className="mt-10 grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-gray-800 border border-gray-700 rounded-lg p-6">
          <h2 className="text-xl font-semibold text-white mb-4">Commands ({settings?.commands?.length || 0})</h2>
          <div className="max-h-64 overflow-y-auto">
            {settings?.commands?.length ? (
              <ul className="space-y-2">
                {settings.commands.map((cmd) => (
                  <li key={cmd.id} className="flex items-center justify-between p-2 bg-gray-700 rounded">
                    <span className="text-gray-300">{cmd.name}</span>
                    <span className={`text-xs px-2 py-1 rounded ${
                      cmd.enabled ? 'bg-green-600 text-green-100' : 'bg-red-600 text-red-100'
                    }`}>
                      {cmd.enabled ? 'Enabled' : 'Disabled'}
                    </span>
                  </li>
                ))}
              </ul>
            ) : (
              <p className="text-gray-400">No commands configured</p>
            )}
          </div>
        </div>

        <div className="bg-gray-800 border border-gray-700 rounded-lg p-6">
          <h2 className="text-xl font-semibold text-white mb-4">Custom Commands ({settings?.customCommands?.length || 0})</h2>
          <div className="max-h-64 overflow-y-auto">
            {settings?.customCommands?.length ? (
              <ul className="space-y-2">
                {settings.customCommands.map((cmd) => (
                  <li key={cmd.id} className="p-2 bg-gray-700 rounded">
                    <div className="text-gray-300 font-medium">{cmd.name}</div>
                    <div className="text-xs text-gray-400">Created by {cmd.createdBy}</div>
                  </li>
                ))}
              </ul>
            ) : (
              <p className="text-gray-400">No custom commands</p>
            )}
          </div>
        </div>

        <div className="bg-gray-800 border border-gray-700 rounded-lg p-6">
          <h2 className="text-xl font-semibold text-white mb-4">Channel Configs ({settings?.channelConfigs?.length || 0})</h2>
          <div className="max-h-64 overflow-y-auto">
            {settings?.channelConfigs?.length ? (
              <ul className="space-y-2">
                {settings.channelConfigs.map((cfg) => (
                  <li key={cfg.id} className="p-2 bg-gray-700 rounded">
                    <div className="text-gray-300 font-medium">{cfg.configType}</div>
                    <div className="text-xs text-gray-400">Channel: {cfg.channelId}</div>
                    <div className="text-xs text-gray-400">Value: {cfg.value}</div>
                  </li>
                ))}
              </ul>
            ) : (
              <p className="text-gray-400">No channel configurations</p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
