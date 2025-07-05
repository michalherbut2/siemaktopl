import React, { useEffect, useRef, useState } from "react";
import axios from "axios";
import { Link, useParams } from "react-router-dom";
import { GuildConfig } from "../types";
import { ArrowLeftIcon } from "@heroicons/react/24/outline";
import { SingleTemplateSection } from "../components/SingleTemplateSection";
import { DualTemplateSection } from "../components/DualTemplateSection";

interface Channel {
  id: string;
  name: string;
  type: number;
  parentId: string;
  position: string;
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
    axios
      .get(`/api/guilds/${guildId}`)
      .then(res => {
        setConfig(res.data);
        setLoading(false);
      })
      .catch(err => {
        console.error("Error loading guild config:", err);
        setLoading(false);
      });
  }, [guildId]);

  const handleChange = (
    e: React.ChangeEvent<
      HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement
    >
  ) => {
    if (!config) return;
    // const { name, type, value, checked } = e.target;
    const { name, type, value } = e.target;
    const checked =
      e.target instanceof HTMLInputElement ? e.target.checked : false;
    const newValue = type === "checkbox" ? checked : value;

    // setConfig({
    //   ...config,
    //   [name]: newValue,
    // });

    setConfig(prev => ({
      ...prev!,
      [name]: newValue,
    }));
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
    <div className="p-6 max-w-5xl mx-auto text-white">
      <Link
        to="/dashboard"
        className="inline-flex items-center space-x-2 text-discord-blurple hover:text-blue-400 transition-colors mb-4"
      >
        <ArrowLeftIcon className="h-4 w-4" />
        <span>Back to Dashboard</span>
      </Link>
      <h2 className="text-3xl font-bold mb-6 text-white">
        Settings for{" "}
        <span className="text-indigo-400">{config.guild.name}</span>
      </h2>

      <div className="space-y-10 bg-gray-800 p-6 rounded-2xl shadow-md border border-gray-700">
        {/** Timeout Logging */}
        <DualTemplateSection
          title="Timeout Logging"
          enabled={config.timeoutLogEnabled}
          // enabled={config.banLogEnabled}
          onToggle={handleChange}
          namePrefix="timeoutLog"
          values={{
            channelId: config.timeoutLogChannelId || "",
            addTemplate: config.timeoutLogAddTemplate,
            removeTemplate: config.timeoutLogRemoveTemplate,
          }}
          onChange={handleChange}
          channels={channels}
        />
      {/* </div>
      <div className="space-y-10 bg-gray-800 p-6 rounded-2xl shadow-md border border-gray-700"> */}
        {/** Ban Logging */}
        {/* <DualTemplateSection
          title="Ban Logging"
          enabled={config.banLogEnabled}
          onToggle={handleChange}
          namePrefix="banLog"
          values={{
            channelId: config.banLogChannelId || "",
            addTemplate: config.banLogAddTemplate,
            removeTemplate: config.banLogRemoveTemplate,
          }}
          onChange={handleChange}
          channels={channels}
        /> */}
        <SingleTemplateSection
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
        {/* <Section
          title="Warn Logging"
          enabled={config.warnLogEnabled}
          onToggle={handleChange}
          namePrefix="warnLog"
          values={{
            channelId: config.warnLogChannelId || "",
            addTemplate: config.warnLogMessageTemplate,
            removeTemplate: config.warnLogMessageTemplate,
          }}
          onChange={handleChange}
          channels={channels}
        /> */}

        {/** Welcome Messages */}
        <SingleTemplateSection
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
