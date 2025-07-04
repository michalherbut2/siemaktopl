import React, { useEffect, useState } from "react";
import axios from "axios";
import { Link, useParams } from "react-router-dom";
import { GuildConfig } from "../types";
import { ArrowLeftIcon } from "@heroicons/react/24/outline";

interface Channel {
  id: string;
  name: string;
  type: number;
  parentId: string,
  position: string,
}

export default function GuildPage() {
  const { guildId } = useParams<{ guildId: string }>();
  const [config, setConfig] = useState<GuildConfig | null>(null);
  const [loading, setLoading] = useState(true);
  const [channels, setChannels] = useState<Channel[]>([]);
  const [selected, setSelected] = useState<string>("");
  const [saving, setSaving] = useState(false);
  const [success, setSuccess] = useState(false);

  useEffect(() => {
    // Fetch channels for this guild from the API
    axios.get(`/api/guilds/${guildId}/channels`).then(res => {
      setChannels(res.data);
    });
  }, [guildId]);

  useEffect(() => {
    axios.get(`/api/guilds/${guildId}`)
      .then((res) => {
        setConfig(res.data);
        setLoading(false);
      })
      .catch((err) => {
        console.error("Error loading guild config:", err);
        setLoading(false);
      });
  }, [guildId]);

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>
  ) => {
    if (!config) return;
    const { name, type, value, checked } = e.target;
    setConfig({
      ...config,
      [name]: type === "checkbox" ? checked : value,
    });
  };

  const handleSave = async () => {
    setSaving(true);
    
    try {
      await axios.put(`/api/guilds/${guildId}`, config);
      alert("✅ Configuration saved!");
      setSuccess(true);
      setTimeout(() => setSuccess(false), 2000);
    } catch (error) {
      console.error("Failed to save:", error);
      alert("❌ Failed to save configuration.");
    } finally {
      setSaving(false);

    }
  };

  if (loading) return <div className="p-6 text-gray-400">Loading...</div>;
  if (!config) return <div className="p-6 text-red-400">Config not found.</div>;

  return (
    <div className="p-6 max-w-3xl mx-auto text-white">
      <Link
          to="/dashboard"
          className="inline-flex items-center space-x-2 text-discord-blurple hover:text-blue-400 transition-colors mb-4"
        >
          <ArrowLeftIcon className="h-4 w-4" />
          <span>Back to Dashboard</span>
        </Link>
      <h2 className="text-3xl font-bold mb-6 text-white">
        Settings for <span className="text-indigo-400">{config.guild.name}</span>
      </h2>

      <div className="space-y-10 bg-gray-800 p-6 rounded-2xl shadow-md border border-gray-700">
        {/** Timeout Logging */}
        <Section
          title="Timeout Logging"
          enabled={config.timeoutLogEnabled}
          onToggle={(e) => handleChange(e)}
          namePrefix="timeoutLog"
          values={{
            channelId: config.timeoutLogChannelId || "",
            messageTemplate: config.timeoutLogMessageTemplate,
          }}
          onChange={handleChange}
          channels={channels}
        />

        {/** Ban Logging */}
        <Section
          title="Ban Logging"
          enabled={config.banLogEnabled}
          onToggle={handleChange}
          namePrefix="banLog"
          values={{
            channelId: config.banLogChannelId || "",
            messageTemplate: config.banLogMessageTemplate,
          }}
          onChange={handleChange}
          channels={channels}
        />

        {/** Warn Logging */}
        <Section
          title="Warn Logging"
          enabled={config.warnLogEnabled}
          onToggle={handleChange}
          namePrefix="warnLog"
          values={{
            channelId: config.warnLogChannelId || "",
            messageTemplate: config.warnLogMessageTemplate,
          }}
          onChange={handleChange}
          channels={channels}
        />

        {/** Welcome Messages */}
        <Section
          title="Welcome Message"
          enabled={config.welcomeEnabled}
          onToggle={handleChange}
          namePrefix="welcome"
          values={{
            channelId: config.welcomeChannelId || "",
            messageTemplate: config.welcomeMessageTemplate,
          }}
          onChange={handleChange}
          channels={channels}
        />

        <div className="text-right pt-4">
          <button
            onClick={handleSave}
            className="bg-indigo-600 hover:bg-indigo-700 text-white px-6 py-2 rounded-lg transition font-medium shadow-md"
          >
            Save Settings
          </button>
        </div>
      </div>
    </div>
  );
}

type SectionProps = {
  title: string;
  enabled: boolean;
  onToggle: (e: React.ChangeEvent<HTMLInputElement>) => void;
  namePrefix: string;
  values: {
    channelId: string;
    messageTemplate: string;
  };
  onChange: (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => void;
  // onChange: (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => void;
  channels: Channel[];
};

function Section({ title, enabled, onToggle, namePrefix, values, onChange, channels }: SectionProps) {
  return (
    <fieldset>
      <legend className="text-xl font-semibold text-gray-200 mb-2">{title}</legend>
      <div className="space-y-4">
        <label className="flex items-center gap-2">
          <input
            type="checkbox"
            name={`${namePrefix}Enabled`}
            checked={enabled}
            onChange={onToggle}
            className="accent-indigo-500"
          />
          <span className="text-gray-300">Enabled</span>
        </label>

        <div>
          <label className="block text-sm text-gray-400 mb-1">Channel ID</label>
          {/* <input
            type="text"
            name={`${namePrefix}ChannelId`}
            value={values.channelId}
            onChange={onChange}
            className="w-full border border-gray-700 rounded-lg bg-gray-900 text-white px-3 py-2"
          /> */}
          {/* <select
        className="border rounded px-2 py-1"
        value={selected}
        onChange={e => setSelected(e.target.value)}
      >
        <option value="">None</option>
        {channels
          .filter(c => c.type === 0 || c.type === 5) // GUILD_TEXT or ANNOUNCEMENT
          .map(c => (
            <option key={c.id} value={c.id}>
              {c.name}
            </option>
          ))}
      </select> */}
           <select
            name={`${namePrefix}ChannelId`}
            value={values.channelId || ""}
            onChange={onChange}
            className="w-full border border-gray-700 rounded-lg bg-gray-900 text-white px-3 py-2"
          >
            <option value="">None</option>
            {channels
              .filter(c => c.type === 0 || c.type === 5) // GUILD_TEXT or ANNOUNCEMENT
              .map(c => (
                <option key={c.id} value={c.id}>
                  #{c.name}
                </option>
              ))}
          </select>
        </div>

        <div>
          <label className="block text-sm text-gray-400 mb-1">Message Template</label>
          <textarea
            name={`${namePrefix}MessageTemplate`}
            value={values.messageTemplate}
            onChange={onChange}
            rows={3}
            className="w-full border border-gray-700 rounded-lg bg-gray-900 text-white px-3 py-2"
          />
        </div>
      </div>
    </fieldset>
  );
}
