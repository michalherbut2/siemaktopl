import { Guild, GuildAuditLogsEntry, GuildChannel } from "discord.js";
import sendEmbed from "./sendEmbed";
import { ConfigManager } from "../ConfigManager";
import { DatabaseManager } from "../../../db/DatabaseManager";

// --- Interfejsy ---
interface TimeoutData {
  guild: Guild;
  targetId: string;
  executorId: string;
  reason: string;
  expiresAt?: Date;
  channel: GuildChannel;
}

interface TimeoutAction {
  execute(data: TimeoutData): Promise<void>;
}

// --- Silnik szablonów ---
/**
 * Wypełnia szablon danymi.
 * Przykład szablonu w bazie: "Użytkownik {target} został wyciszony do {timestamp} za {reason}"
 */
function fillTemplate(template: string, vars: Record<string, string>): string {
  return template.replace(/{(\w+)}/g, (_, key) => vars[key] ?? `{${key}}`);
}

// --- Akcje ---
class AddTimeoutAction implements TimeoutAction {
  async execute(data: TimeoutData): Promise<void> {
    const { guild, targetId, executorId, reason, expiresAt, channel } = data;
    const configManager = ConfigManager.getInstance();
    const config = await configManager.get(guild);
    const rawTemplate = await configManager.getTimeoutTemplate(guild, "add");

    const vars: Record<string, string> = {
      target: `<@${targetId}>`,
      executor: `<@${executorId}>`,
      timestamp: expiresAt ? `<t:${Math.floor(expiresAt.getTime() / 1000)}:R>` : "nieokreślonego czasu",
      reason: reason,
      duration: expiresAt ? TimeoutUtils.calculateDuration(expiresAt) : "brak",
    };

    const message = fillTemplate(rawTemplate, vars);

    if (config?.timeoutLogEnabled) {
      sendEmbed(channel, { description: message, color: 0xFF0000 }); // Red
    }

    DatabaseManager.logTimeout({ guild, targetId, executorId, expiresAt, reason });
  }
}

class RemoveTimeoutAction implements TimeoutAction {
  async execute(data: TimeoutData): Promise<void> {
    const { guild, targetId, executorId, channel } = data;
    const configManager = ConfigManager.getInstance();
    const config = await configManager.get(guild);
    const rawTemplate = await configManager.getTimeoutTemplate(guild, "remove");

    const vars: Record<string, string> = {
      target: `<@${targetId}>`,
      executor: `<@${executorId}>`,
    };

    const message = fillTemplate(rawTemplate, vars);

    if (config?.timeoutLogEnabled) {
      sendEmbed(channel, { description: message, color: 0xFFFF00 }); // Yellow
    }

    DatabaseManager.removeActiveTimeout(targetId, guild.id, executorId);
  }
}

// --- Fabryka i Utils ---
class TimeoutActionFactory {
  static createAction(isAddingTimeout: boolean): TimeoutAction {
    return isAddingTimeout ? new AddTimeoutAction() : new RemoveTimeoutAction();
  }
}

class TimeoutUtils {
  static cleanReason(reason: string | null): string {
    return reason?.replace(/\s+/g, " ").trim() || "darmo";
  }

  static calculateDuration(timeoutUntil: Date): string {
    const durationMs = timeoutUntil.getTime() - Date.now();
    if (durationMs <= 0) return "0 minut";
    const minutes = Math.floor(durationMs / 60000);
    if (minutes < 60) return `${minutes} minut`;
    if (minutes < 1440) return `${Math.floor(minutes / 60)} godzin`;
    return `${Math.floor(minutes / 1440)} dni`;
  }
}

// --- Główny Handler ---
export class TimeoutHandler {
  static async handle(auditLog: GuildAuditLogsEntry, guild: Guild): Promise<void> {
    try {
      if (auditLog.changes?.[0]?.key !== "communication_disabled_until") return;

      const configManager = ConfigManager.getInstance();
      const config = await configManager.get(guild);
      if (!config?.timeoutLogEnabled || !config.timeoutLogChannelId) return;

      // Używamy fetch, bo cache może być pusty
      const channel = await guild.channels.fetch(config.timeoutLogChannelId);
      if (!channel || !channel.isTextBased()) return;

      const { executorId, targetId, changes, reason } = auditLog;
      const isAddingTimeout = !!changes[0].new;

      const timeoutData: TimeoutData = {
        guild,
        targetId: targetId || "unknown",
        executorId: executorId || "unknown",
        reason: TimeoutUtils.cleanReason(reason),
        channel: channel as GuildChannel,
      };

      if (isAddingTimeout && changes[0].new) {
        timeoutData.expiresAt = new Date(String(changes[0].new));
      }

      const action = TimeoutActionFactory.createAction(isAddingTimeout);
      await action.execute(timeoutData);
    } catch (error) {
      console.error(`Error handling timeout in ${guild.name}:`, error);
    }
  }
}

export default async (auditLog: GuildAuditLogsEntry, guild: Guild) => {
  await TimeoutHandler.handle(auditLog, guild);
};