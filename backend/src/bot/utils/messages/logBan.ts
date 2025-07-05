import {
  createCanvas,
  loadImage,
  Canvas,
  CanvasRenderingContext2D,
} from "@napi-rs/canvas";
import {
  AttachmentBuilder,
  Guild,
  GuildAuditLogsEntry,
  GuildBasedChannel,
  PartialUser,
  User,
} from "discord.js";

import { request } from "undici";

declare module "@napi-rs/canvas" {
  interface CanvasRenderingContext2D {
    drawImage(image: Image, dx: number, dy: number, dw: number, dh: number): void;
  }
}

// Types and interfaces
interface BanAuditLog {
  executor: User | PartialUser;
  target: User;
  reason: string | null;
}

interface CanvasConfig {
  width: number;
  height: number;
  backgroundColor: string;
  rectangleColor: string;
  horizontalPadding: number;
  verticalPadding: number;
  roundSize: number;
}

interface TextConfig {
  header: {
    font: string;
    color: string;
    size: number;
  };
  username: {
    color: string;
    maxSize: number;
    minSize: number;
  };
  reason: {
    font: string;
    color: string;
    size: number;
  };
  moderator: {
    font: string;
    color: string;
    size: number;
  };
}

interface AvatarConfig {
  radius: number;
  size: number;
  position: {
    x: number;
    y: number;
  };
}

// Configuration objects
const DEFAULT_CANVAS_CONFIG: CanvasConfig = {
  width: 890,
  height: 500,
  backgroundColor: "#2d2d2d",
  rectangleColor: "#121212",
  horizontalPadding: 33,
  verticalPadding: 52,
  roundSize: 15,
} as const;

const DEFAULT_TEXT_CONFIG: TextConfig = {
  header: {
    font: "Bold 46px Arial",
    color: "#ffffff",
    size: 46,
  },
  username: {
    color: "#ffffff",
    maxSize: 70,
    minSize: 20,
  },
  reason: {
    font: "27px Arial",
    color: "#aaa",
    size: 27,
  },
  moderator: {
    font: "italic bold 18px Arial",
    color: "#fff",
    size: 18,
  },
} as const;

const DEFAULT_AVATAR_CONFIG: AvatarConfig = {
  radius: 60,
  size: 120,
  position: {
    x: 0, // Will be calculated
    y: 0, // Will be calculated
  },
} as const;

// Error classes
class BanNotificationError extends Error {
  constructor(message: string, public readonly cause?: Error) {
    super(message);
    this.name = "BanNotificationError";
  }
}

class ChannelNotFoundError extends BanNotificationError {
  constructor() {
    super("Ban notification channel not found");
  }
}

class AvatarLoadError extends BanNotificationError {
  constructor(cause?: Error) {
    super("Failed to load user avatar", cause);
  }
}

// Utility functions
const createRoundedRectangle = (
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  width: number,
  height: number,
  radius: number
): void => {
  ctx.beginPath();
  ctx.roundRect(x, y, width, height, [radius, radius, radius, radius]);
  ctx.fill();
};

const calculateOptimalFontSize = (
  canvas: Canvas,
  text: string,
  maxWidth: number,
  maxSize: number,
  minSize: number
): string => {
  const ctx = canvas.getContext("2d");
  let fontSize = maxSize;

  do {
    fontSize -= 10;
    ctx.font = `bold ${fontSize}px Arial`;
  } while (ctx.measureText(text).width > maxWidth && fontSize > minSize);

  return ctx.font;
};

const loadUserAvatar = async (user: User): Promise<Buffer> => {
  try {
    const { body } = await request(user.displayAvatarURL({ extension: "jpg" }));
    const arrayBuffer = await body.arrayBuffer();
    return Buffer.from(arrayBuffer);
  } catch (error) {
    throw new AvatarLoadError(error as Error);
  }
};

const drawCircularAvatar = async (
  ctx: CanvasRenderingContext2D,
  avatarBuffer: Buffer,
  config: AvatarConfig
): Promise<void> => {
  const { radius, size, position } = config;

  ctx.save();
  ctx.beginPath();
  ctx.arc(position.x, position.y, radius, 0, Math.PI * 2, true);
  ctx.closePath();
  ctx.clip();

  const avatar = await loadImage(avatarBuffer);
  ctx.drawImage(
    avatar,
    position.x - size / 2,
    position.y - size / 2,
    size,
    size
  );

  ctx.restore();
};

// Main canvas builder class
class BanNotificationCanvas {
  private canvas: Canvas;
  private ctx: CanvasRenderingContext2D;
  private config: CanvasConfig;
  private textConfig: TextConfig;
  private avatarConfig: AvatarConfig;

  constructor(
    canvasConfig: Partial<CanvasConfig> = {},
    textConfig: Partial<TextConfig> = {},
    avatarConfig: Partial<AvatarConfig> = {}
  ) {
    this.config = { ...DEFAULT_CANVAS_CONFIG, ...canvasConfig };
    this.textConfig = { ...DEFAULT_TEXT_CONFIG, ...textConfig };
    this.avatarConfig = {
      ...DEFAULT_AVATAR_CONFIG,
      ...avatarConfig,
      position: {
        x: this.config.width / 2 - 110,
        y: 220,
      },
    };

    this.canvas = createCanvas(this.config.width, this.config.height);
    this.ctx = this.canvas.getContext("2d");
  }

  private drawBackground(): void {
    const {
      backgroundColor,
      rectangleColor,
      horizontalPadding,
      verticalPadding,
      roundSize,
    } = this.config;

    // Background
    this.ctx.fillStyle = backgroundColor;
    this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);

    // Main rectangle
    this.ctx.fillStyle = rectangleColor;
    createRoundedRectangle(
      this.ctx,
      horizontalPadding,
      verticalPadding,
      this.canvas.width - horizontalPadding * 2,
      this.canvas.height - verticalPadding * 2,
      roundSize
    );
  }

  private drawHeader(): void {
    const { header } = this.textConfig;

    this.ctx.font = header.font;
    this.ctx.fillStyle = header.color;
    this.ctx.textAlign = "center";
    this.ctx.fillText(
      "Zbanowano nowego użytkownika",
      this.canvas.width / 2,
      120
    );
  }

  private async drawAvatar(user: User): Promise<void> {
    try {
      const avatarBuffer = await loadUserAvatar(user);
      const avatar = await loadImage(avatarBuffer);

      this.ctx.save();
      this.ctx.beginPath();
      this.ctx.arc(
        this.avatarConfig.position.x,
        this.avatarConfig.position.y,
        this.avatarConfig.radius,
        0,
        Math.PI * 2,
        true
      );
      this.ctx.closePath();
      this.ctx.clip();
      this.ctx.drawImage(
        avatar,
        this.avatarConfig.position.x - this.avatarConfig.size / 2,
        this.avatarConfig.position.y - this.avatarConfig.size / 2,
        this.avatarConfig.size,
        this.avatarConfig.size
      );
      this.ctx.restore();
    } catch (error) {
      throw new AvatarLoadError(error as Error);
    }
  }

  private drawUsername(user: User): void {
    const { username } = this.textConfig;

    this.ctx.font = calculateOptimalFontSize(
      this.canvas,
      user.tag,
      this.canvas.width / 2 - 100,
      username.maxSize,
      username.minSize
    );
    this.ctx.fillStyle = username.color;
    this.ctx.textAlign = "left";
    this.ctx.fillText(
      user.tag,
      this.canvas.width / 2 - 20,
      this.canvas.height / 2 - 10
    );
  }

  private drawReason(reason: string | null): void {
    const { reason: reasonConfig } = this.textConfig;

    this.ctx.font = reasonConfig.font;
    this.ctx.fillStyle = reasonConfig.color;
    this.ctx.textAlign = "center";
    this.ctx.fillText(reason || "Za darmo", this.canvas.width / 2, 340);
  }

  private drawModerator(executor: User | PartialUser): void {
    const { moderator } = this.textConfig;

    this.ctx.font = moderator.font;
    this.ctx.fillStyle = moderator.color;
    this.ctx.textAlign = "center";
    this.ctx.fillText(`Przez: ${executor.tag}`, this.canvas.width / 2, 410);
  }

  public async build(auditLog: BanAuditLog): Promise<Buffer> {
    try {
      this.drawBackground();
      this.drawHeader();
      await this.drawAvatar(auditLog.target);
      this.drawUsername(auditLog.target);
      this.drawReason(auditLog.reason);
      this.drawModerator(auditLog.executor);

      return this.canvas.toBuffer("image/png");
    } catch (error) {
      throw new BanNotificationError(
        "Failed to build ban notification canvas",
        error as Error
      );
    }
  }
}

// Channel finder utility
class ChannelFinder {
  static findBanChannel(guild: Guild): GuildBasedChannel | null {
    return (
      guild.channels.cache.find(
        ch => ch.name.includes("bany") || ch.name.includes("ban")
      ) || null
    );
  }
}

// Main service class
class BanNotificationService {
  private canvasBuilder: BanNotificationCanvas;

  constructor(
    canvasConfig?: Partial<CanvasConfig>,
    textConfig?: Partial<TextConfig>,
    avatarConfig?: Partial<AvatarConfig>
  ) {
    this.canvasBuilder = new BanNotificationCanvas(
      canvasConfig,
      textConfig,
      avatarConfig
    );
  }

  public async sendBanNotification(
    auditLog: GuildAuditLogsEntry,
    guild: Guild
  ): Promise<void> {
    try {
      // Validate audit log
      if (!auditLog.executor || !auditLog.target) {
        throw new BanNotificationError("Invalid audit log data");
      }

      // Find notification channel
      const channel = ChannelFinder.findBanChannel(guild);
      if (!channel || !channel.isTextBased()) {
        throw new ChannelNotFoundError();
      }

      // Create ban audit log object
      const banAuditLog: BanAuditLog = {
        executor: auditLog.executor,
        target: auditLog.target as User,
        reason: auditLog.reason,
      };

      // Generate canvas
      const canvasBuffer = await this.canvasBuilder.build(banAuditLog);

      // Create attachment
      const attachment = new AttachmentBuilder(canvasBuffer, {
        name: "ban-notification.png",
      });

      // Send notification
      await channel.send({ files: [attachment] });
    } catch (error) {
      if (error instanceof BanNotificationError) {
        throw error;
      }
      throw new BanNotificationError(
        "Failed to send ban notification",
        error as Error
      );
    }
  }
}

// Factory function for backward compatibility
export const createBanNotificationService = (
  canvasConfig?: Partial<CanvasConfig>,
  textConfig?: Partial<TextConfig>,
  avatarConfig?: Partial<AvatarConfig>
): BanNotificationService => {
  return new BanNotificationService(canvasConfig, textConfig, avatarConfig);
};

// Main export function (backward compatible)
export default async (
  auditLog: GuildAuditLogsEntry,
  guild: Guild
): Promise<void> => {
  const service = createBanNotificationService();
  await service.sendBanNotification(auditLog, guild);
};

// Named exports for advanced usage
export {
  BanNotificationService,
  BanNotificationCanvas,
  ChannelFinder,
  BanNotificationError,
  ChannelNotFoundError,
  AvatarLoadError,
  type BanAuditLog,
  type CanvasConfig,
  type TextConfig,
  type AvatarConfig,
};

// module.exports = async (auditLog, guild) => {
//   // Define your variables.
//   const {executor, target, reason } = auditLog;

//   const canvas = createCanvas(890, 500);
//   const ctx = canvas.getContext("2d");

//   const backgroundColor = "#2d2d2d";
//   const rectangleColor = "#121212";

//   const horizontalPadding = 33;
//   const verticalPadding = 52;
//   const roundSize = 15;

//   // Tło
//   ctx.fillStyle = backgroundColor;
//   ctx.fillRect(0, 0, canvas.width, canvas.height);

//   ctx.fillStyle = rectangleColor;
//   ctx.beginPath();
//   ctx.roundRect(
//     horizontalPadding,
//     verticalPadding,
//     canvas.width - horizontalPadding * 2,
//     canvas.height - verticalPadding * 2,
//     [roundSize, roundSize, roundSize, roundSize]
//   );
//   ctx.fill();

//   // Header
//   ctx.font = "Bold 46px Arial";
//   ctx.fillStyle = "#ffffff";
//   ctx.textAlign = "center";
//   ctx.fillText("Zbanowano nowego użytkownika", canvas.width / 2, 120);

//   // Avatar użytkownika
//   const { body } = await request(target.displayAvatarURL({ extension: 'jpg' }));
// 	const avatar = await loadImage(await body.arrayBuffer());

//   ctx.save();
//   ctx.beginPath();
//   ctx.arc(canvas.width / 2 - 110, 220, 60, 0, Math.PI * 2, true);
//   ctx.closePath();
//   ctx.clip();
//   ctx.drawImage(avatar, canvas.width / 2 - 170, 160, 120, 120);
//   ctx.restore();

//   // Nazwa użytkownika
//   ctx.font = applyText(canvas, target.tag);
//   ctx.fillStyle = "#ffffff";
//   ctx.textAlign = "left";
//   ctx.fillText(target.tag, canvas.width / 2 - 20, canvas.height / 2 - 10);

//   // Ban reason
//   ctx.font = "27px Arial";
//   ctx.fillStyle = "#aaa";
//   ctx.textAlign = "center";
//   ctx.fillText(reason || "Za darmo", canvas.width / 2, 340);

//   // Moderator
//   ctx.font = "italic bold 18px Arial";
//   ctx.fillStyle = "#fff";
//   ctx.textAlign = "center";
//   ctx.fillText("Przez: " + executor.tag, canvas.width / 2, 410);

//   const attachment = new AttachmentBuilder(canvas.toBuffer("image/png"), {
//     name: "ban-image.png",
//   });

//   const channel = guild.channels.cache.find(ch => ch.name.includes("bany"));
//   if (channel) {
//     await channel.send({ files: [attachment] });
//   }

// };

// const applyText = (canvas, text) => {
// 	const ctx = canvas.getContext('2d');

// 	// Declare a base size of the font
// 	let fontSize = 70;

// 	do {
// 		// Assign the font to the ctx and decrement it so it can be measured again
// 		ctx.font = `bold ${fontSize -= 10}px Arial`;
// 		// Compare pixel width of the text to the canvas minus the approximate avatar size
// 	} while (ctx.measureText(text).width > canvas.width/2 - 100);

// 	// Return the result to use in the actual canvas
// 	return ctx.font;
// };
