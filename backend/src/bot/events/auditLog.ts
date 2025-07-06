import { AuditLogEvent, Events, Guild, GuildAuditLogsEntry } from "discord.js";

import logTimeout from "../utils/messages/logTimeout";
import logBan from "../utils/messages/logBan";
import { BotEvent } from "../../types/bot";
import { ConfigManager } from "../utils/ConfigManager";

const event: BotEvent = {
  name: Events.GuildAuditLogEntryCreate,
  async execute(auditLog: GuildAuditLogsEntry, guild: Guild) {
    const configManager = ConfigManager.getInstance();
    const config = await configManager.get(guild);
    // console.log("config?.timeoutLogEnabled", config?.timeoutLogEnabled);
    
    switch (auditLog.action) {
      case AuditLogEvent.MemberBanAdd:
        if (config?.banLogEnabled) logBan(auditLog, guild);
        break;

      case AuditLogEvent.MemberUpdate:
        console.log("timeout:",auditLog);
        
        logTimeout(auditLog, guild);
        break;

      default:
        break;
    }
  },
};

export default event;
