import { AuditLogEvent, Events, Guild, GuildAuditLogsEntry } from "discord.js";

import logTimeout from "../utils/messages/logTimeout";
import logBan from "../utils/messages/logBan";
import { BotEvent } from "../../types/bot";

const event: BotEvent = {
  name: Events.GuildAuditLogEntryCreate,
  async execute(auditLog: GuildAuditLogsEntry, guild: Guild) {
    console.log("dupa");
    
    switch (auditLog.action) {
      case AuditLogEvent.MemberBanAdd:
        logBan(auditLog, guild);
        break;

      case AuditLogEvent.MemberUpdate:
        logTimeout(auditLog, guild);
        break;

      default:
        break;
    }
  },
};

export default event;