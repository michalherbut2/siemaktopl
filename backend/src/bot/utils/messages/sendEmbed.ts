import {
  GuildMember,
  EmbedBuilder,
  AttachmentBuilder,
  BaseInteraction,
  BaseChannel,
  User,
  Channel,
  ColorResolvable,
  Message,
  InteractionResponse,
  MessageCreateOptions,
  InteractionReplyOptions,
  TextBasedChannel,
  CommandInteraction,
  ButtonInteraction,
  StringSelectMenuInteraction,
  ActionRowBuilder,
  AnyComponentBuilder,
} from "discord.js";

// Define supported color names
type ColorName = 
  | "red"
  | "yellow" 
  | "green"
  | "light green"
  | "intense green"
  | "tiktok"
  | "youtube"
  | "instagram";

// Define the options interface
interface SendEmbedOptions {
  title?: string;
  description?: string; 
  content?: string;
  image?: string | string[];
  thumbnail?: string;
  row?: ActionRowBuilder<AnyComponentBuilder>;
  footerText?: string;
  color?: ColorResolvable | ColorName;
  ephemeral?: boolean;
  followUp?: boolean;
}

// Define possible target types
type SendTarget = 
  | Channel
  | BaseChannel
  | User
  | GuildMember
  | BaseInteraction;

// Define return types
type SendEmbedResult = Promise<Message | InteractionResponse | void>;

// Color mapping
const COLOR_MAP: Record<ColorName, number> = {
  "red": 0xf60101,
  "yellow": 0xffd700,
  "green": 0x248046,
  "light green": 0x90ee90,
  "intense green": 0x41fd02,
  "tiktok": 0x00f2ea,
  "youtube": 0xdd2c28,
  "instagram": 0x794eba,
};

// Utility function to resolve color
const resolveColor = (color: ColorResolvable | ColorName): ColorResolvable => {
  if (typeof color === "string" && color in COLOR_MAP) {
    return COLOR_MAP[color as ColorName];
  }
  return color as ColorResolvable;
};

// Type guard functions
const isTextBasedChannel = (target: SendTarget): target is TextBasedChannel | BaseChannel => {
  return (target instanceof BaseChannel) && (target as any).isTextBased?.();
};

const isUser = (target: SendTarget): target is User | GuildMember => {
  return target instanceof User || target instanceof GuildMember;
};

const isInteraction = (target: SendTarget): target is CommandInteraction | ButtonInteraction | StringSelectMenuInteraction => {
  return target instanceof CommandInteraction || 
         target instanceof ButtonInteraction || 
         target instanceof StringSelectMenuInteraction;
};

// Main function
const sendEmbed = async (
  target: SendTarget,
  options: SendEmbedOptions
  // {
  //   title,
  //   description,
  //   content,
  //   image,
  //   thumbnail,
  //   row,
  //   footerText,
  //   color = 0x0099ff,
  //   ephemeral = false,
  //   followUp = false,
  // }
): SendEmbedResult => {
  const {
    title,
    description = "[błąd] pusty opis, zgłoś to do Szanownego Patryka",
    content,
    image,
    thumbnail,
    row,
    footerText,
    color = 0x0099ff,
    ephemeral = false,
    followUp = false,
  } = options;

  // Resolve color
  const resolvedColor = resolveColor(color);

  // create an embed
  const embed = new EmbedBuilder().setColor(resolvedColor).setDescription(description);
  
  if (title) embed.setTitle(title);
  if (thumbnail) embed.setThumbnail(thumbnail);
  if (footerText) embed.setFooter({ text: footerText });

  // create a message
  const message: MessageCreateOptions & InteractionReplyOptions = { embeds: [embed], ephemeral };

  if (row) message.components = [row.toJSON()];
  if (content) message.content = content;

  // handle an images
  if (image) {
    if (Array.isArray(image)) {
      image.map(i => embed.setImage(i));
      console.log(image);
    } else if (image?.startsWith("http")) {
      // Handle URL images
      embed.setImage(image);
    } else {
      // Handle local file images
      try {
        const attachment = new AttachmentBuilder(image);
        const filename = image.split("/").pop() || "image.png";
        embed.setImage(`attachment://${filename}`);
        message.files = [attachment];
      } catch (error) {
        console.error("Error creating attachment:", error);
      }
    }
  }

  // send the message
  console.log("\x1b[32m%s\x1b[0m", "Sending embed."); // green

  try {
    if (isTextBasedChannel(target) || isUser(target)) {
      // Send to channel or user
      if ('send' in target && typeof target.send === 'function') {
        return await target.send(message);
      } else {
        throw new Error("Target does not have a send method");
      }
    } else if (isInteraction(target)) {
      // follow up
      if (followUp || target.replied || target.deferred)
        return await target.followUp(message);
      // reply
      else return await target.reply(message);
    } else {
      throw new Error("Invalid target type");
    }
  } catch (error) {
    const targetName = 
      'name' in target ? target.name :
      'displayName' in target ? target.displayName :
      'user' in target ? target.user.username :
      'username' in target ? target.username :
      'Unknown';

    console.log(
      "\x1b[31m%s\x1b[0m",
      `The embed has not been sent to ${targetName}.\n${error}`
    ); // red
  }
};

export default sendEmbed;
