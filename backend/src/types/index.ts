export interface Guild {
  id: string;
  name: string;
  icon: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface GuildConfig {
  id: string;
  guildId: string;
  timeoutLogEnabled: boolean;
  timeoutLogChannelId: string | null;
  timeoutLogMessageTemplate: string;
  banLogEnabled: boolean;
  banLogChannelId: string | null;
  banLogMessageTemplate: string;
  warnLogEnabled: boolean;
  warnLogChannelId: string | null;
  warnLogMessageTemplate: string;
  welcomeEnabled: boolean;
  welcomeChannelId: string | null;
  welcomeMessageTemplate: string;
  createdAt: string;
  updatedAt: string;
  guild: Guild;
}
