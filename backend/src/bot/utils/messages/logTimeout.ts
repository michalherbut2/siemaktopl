import { Guild, GuildAuditLogsEntry, GuildChannel } from "discord.js";

import sendEmbed from "./sendEmbed";
import { ConfigManager } from "../ConfigManager";
import { DatabaseManager } from "../../../db/DatabaseManager";

// Strategy Pattern for different timeout actions
interface TimeoutAction {
  execute(data: TimeoutData): Promise<void>;
}

interface TimeoutData {
  guild: Guild;
  targetId: string;
  executorId: string;
  reason: string;
  expiresAt?: Date;
  channel: GuildChannel;
}
interface AddTimeoutData {
  guild: Guild;
  targetId: string;
  executorId: string;
  reason: string;
  expiresAt: Date;
  channel: GuildChannel;
}
interface RemoveTimeoutData {
  guild: Guild;
  targetId: string;
  executorId: string;
  channel: GuildChannel;
}

function convertTemplate(template: string): string {
  return template
    .replace(/{target}/g, "<@{targetId}>")
    .replace(/{executor}/g, "<@{executorId}>")
    .replace(/{timestamp}/g, "<t:{timestamp}:R>")
    .replace(/{reason}/g, "{reason}")
    .replace(/{duration}/g, "${duration}");
}

function fillTemplate(template: string, vars: Record<string, string>) {
  return template.replace(/{(\w+)}/g, (_, key) => vars[key] ?? `{${key}}`);
}

class AddTimeoutAction implements TimeoutAction {
  async execute(data: AddTimeoutData): Promise<void> {
    const {
      guild,
      targetId,
      executorId,
      reason,
      expiresAt,
      channel,
    } = data;

    const configManager = ConfigManager.getInstance();
    const config = await configManager.get(guild);
    const rawTemplate = await configManager.getTimeoutTemplate(guild, "add");
    const template = convertTemplate(rawTemplate);

    const timestamp = expiresAt
      ? String(Math.floor(expiresAt.getTime() / 1000))
      : "";
    // const message = `<@${targetId}> w końcu **dostał przerwę** od <@${executorId}> na <t:${timestamp}:R> za **${reason}**.`;
    const message = fillTemplate(template, {
      targetId: targetId || "unknown",
      executorId: executorId || "unknown",
      timestamp,
      reason,
    });

    if (config?.timeoutLogEnabled)
      sendEmbed(channel, { description: message, color: "red" });
    // saveTimeout(guild.id, targetId, executorId, reason, duration || "", "add");

    const logData = { guild, targetId, executorId, expiresAt, reason};

    DatabaseManager.logTimeout(logData);
  }
}

class RemoveTimeoutAction implements TimeoutAction {
  async execute(data: RemoveTimeoutData): Promise<void> {
    const { guild, targetId, executorId, channel } = data;

    const configManager = ConfigManager.getInstance();
    const config = await configManager.get(guild);
    const rawTemplate = await configManager.getTimeoutTemplate(guild, "remove");
    const template = convertTemplate(rawTemplate);

    // const message = `niestety <@${executorId}>, jak zbój, zasłużonej **pozbawił przerwy** Czcigodnego <@${targetId}>.`;
    const message = fillTemplate(template, {
      targetId: targetId || "unknown",
      executorId: executorId || "unknown",
    });

    if (config?.timeoutLogEnabled)
      sendEmbed(channel, { description: message, color: "yellow" });
    // saveTimeout(guild.id, targetId, executorId, "", "", "remove");
  //   const logData = { guildId: guild.id, targetUserId: targetId || "", moderatorUserId:executorId, };

  //   guildId: string;
  //   targetUserId: string;
  //   moderatorUserId: string;
  //   durationSeconds: number;
  //   reason?: string;
  //   metadata?: any;
  // }
  DatabaseManager.removeActiveTimeout(targetId, guild.id, executorId);
  }
}

// Factory Pattern for creating timeout actions
class TimeoutActionFactory {
  static createAction(isAddingTimeout: boolean): TimeoutAction {
    return isAddingTimeout ? new AddTimeoutAction() : new RemoveTimeoutAction();
  }
}

// Utility class for timeout operations
class TimeoutUtils {
  static cleanReason(reason: string | null): string {
    if (!reason) return "darmo";
    return reason.replace(/\s+/g, " ").trim() || "darmo";
  }

  static calculateDuration(timeoutUntil: Date): string {
    const now = new Date();
    const durationMs = timeoutUntil.getTime() - now.getTime();

    if (durationMs <= 0) return "0 minut";

    const minutes = Math.floor(durationMs / 60000);

    if (minutes < 60) {
      return `${minutes} minut`;
    } else if (minutes < 1440) {
      return `${Math.floor(minutes / 60)} godzin`;
    } else {
      return `${Math.floor(minutes / 1440)} dni`;
    }
  }

  static findLogChannel(guild: Guild, channelId: string): GuildChannel | null {
    return guild.channels.cache.find(
      ch => ch.id === channelId
    ) as GuildChannel | null;
  }
}

// Main timeout handler class
class TimeoutHandler {
  static async handle(
    auditLog: GuildAuditLogsEntry,
    guild: Guild
  ): Promise<void> {
    try {
      // Early validation
      if (!TimeoutHandler.isTimeoutChange(auditLog)) {
        return;
      }

      const configManager = ConfigManager.getInstance();
      const config = await configManager.get(guild);
      const channelId = config?.timeoutLogChannelId || "";
      const channel = TimeoutUtils.findLogChannel(guild, channelId);

      if (!config?.timeoutLogEnabled) {
        return console.warn(`Timeout logging is disabled for guild ${guild.id}`)
      }

      if (!channel) {
        console.warn(`No log channel found for guild ${guild.name}`);
        return;
      }

      const { id, executorId, targetId, changes, reason } = auditLog;
      const change = changes[0];

      // Determine if adding or removing timeout
      const isAddingTimeout = !!change.new;
      const cleanReason = TimeoutUtils.cleanReason(reason);
      // Prepare timeout data
      const timeoutData: TimeoutData = {
        guild,
        targetId:targetId||"",
        executorId:executorId||"",
        reason: cleanReason,
        channel,
      };

      // Add duration and timestamp for timeout additions
      if (isAddingTimeout && change.new) {
        const expiresAt = new Date(String(change.new));
        timeoutData.expiresAt = expiresAt;
      }

      // Execute appropriate action using Strategy + Factory patterns
      const action = TimeoutActionFactory.createAction(isAddingTimeout);
      await action.execute(timeoutData);
    } catch (error) {
      console.error("Error handling timeout:", error);
      // Could implement proper error reporting here
    }
  }

  private static isTimeoutChange(auditLog: GuildAuditLogsEntry): boolean {
    return auditLog.changes?.[0]?.key === "communication_disabled_until";
  }
}

// // Alternative: More functional approach
// export const handleTimeoutFunctional = async (
//   auditLog: GuildAuditLogsEntry,
//   guild: Guild,
//   client: any
// ): Promise<void> => {
//   // Validation pipeline
//   const validationPipeline = [
//     () => auditLog.changes?.[0]?.key === "communication_disabled_until",
//     () => TimeoutUtils.findLogChannel(guild) !== null
//   ];

//   if (!validationPipeline.every(check => check())) {
//     return;
//   }

//   const { executorId, targetId, changes, reason } = auditLog;
//   const change = changes[0];
//   const isAddingTimeout = !!change.new;
//   const channel = TimeoutUtils.findLogChannel(guild)!;

//   // Data transformation pipeline
//   const baseData = {
//     guild,
//     targetId,
//     executorId,
//     reason: TimeoutUtils.cleanReason(reason),
//     channel
//   };

//   const timeoutData = isAddingTimeout && change.new
//     ? {
//         ...baseData,
//         timeoutUntil: new Date(change.new),
//         duration: TimeoutUtils.calculateDuration(new Date(change.new))
//       }
//     : baseData;

//   // Action execution
//   const action = TimeoutActionFactory.createAction(isAddingTimeout);
//   await action.execute(timeoutData);
// };

const handleTimeoutWithErrorBoundary = async (
  auditLog: GuildAuditLogsEntry,
  guild: Guild
): Promise<void> => {
  try {
    await TimeoutHandler.handle(auditLog, guild);
  } catch (error) {
    console.error(`Failed to handle timeout for guild ${guild.id}:`, error);
    // You could also send this to a monitoring service
  }
};

export default handleTimeoutWithErrorBoundary;

// module.exports = async (auditLog: GuildAuditLogsEntry, guild: Guild, client:any ) => {
//   // const config = client.config.get(guild.id);
//   // const logChannel = await client.channels.cache.get(config.kanal_do_kar);

//   // Define your variables.
//   const { executorId, targetId, changes, reason } = auditLog;

//   // Check only for timeout users.
//   // if (changes[0]?.key !== "communication_disabled_until") return;
//   const isTimeout = changes[0]?.key === "communication_disabled_until"
//   if (!isTimeout) return;

//   const isAddingTimeout = !!changes[0].new;

//   // remove extra spaces between words
//   const cleanReason = reason?.replace(/\s+/g, ' ').trim();

//   // create a messages
//   if (!changes[0].new) return;
//   const addTimeoutMessage = `<@${targetId}> w końcu **dostał przerwę** od <@${executorId}> na <t:${Math.floor(
//     new Date(changes[0].new).getTime() / 1000
//   )}:R> za **${cleanReason?.trim() ?? "darmo"}**.`;

//   const removeTimeoutMessage = `niestety <@${executorId}>, jak zbój, zasłużonej **pozbawił przerwy** Czcigodnego <@${targetId}>.`;

//   // choose the message
//   // const description = changes[0].new ? addTimeoutMessage : removeTimeoutMessage;
//   // const color = changes[0].new ? "red" : "yellow";

//   // Determine if this is adding or removing a timeout
//   const action = isAddingTimeout ? "add" : "remove";
//   console.log(action);

//   // Get duration (for adding timeout)
//   let duration = "";
//   if (isAddingTimeout && changes[0].new) {
//     // Calculate duration from the timestamp
//     const timeoutUntil = new Date(changes[0].new);
//     const now = new Date();
//     const durationMs = timeoutUntil.getTime() - now.getTime();

//     // Convert to human-readable format
//     const minutes = Math.floor(durationMs / 60000);
//     if (minutes < 60) {
//       duration = `${minutes} minut`;
//     } else if (minutes < 1440) {
//       duration = `${Math.floor(minutes / 60)} godzin`;
//     } else {
//       duration = `${Math.floor(minutes / 1440)} dni`;
//     }
//   }

//   const options = {
//     true: { description: addTimeoutMessage, color: "red" },
//     false: { description: removeTimeoutMessage, color: "yellow" },
//   };

//   // const { description, color } = options[changes[0].new];

//   const channel = guild.channels.cache.find(ch => ch.name.includes("bany"));

//   await saveTimeout(guild.id, targetId, executorId, cleanReason, duration, action);

//   // console.log(changes[0].new);

//   // console.log(options[!!changes[0].new]);

//   // Now you can log the output!
//   // sendEmbed(channel, { description, color });
//   sendEmbed(channel, options[isAddingTimeout]);
// };
