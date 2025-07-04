// backend/src/api/routes/guilds.ts
import { Router } from "express";
import { authenticateToken } from "../middleware/auth";
import { DatabaseManager } from "../../db/DatabaseManager";
import { Guild } from "discord.js";
import { checkGuildPermissions } from "../middleware/checkGuildPermisions";
import { ConfigManager } from "../../bot/utils/ConfigManager";

const router = Router();

router.use(authenticateToken);

// Get all guilds for user
router.get("/", async (req, res) => {
  try {
    const client = req.app.locals.discordClient;
    const userId = (req as any).user.userId;

    // Get user's guilds from Discord API
    const user = await DatabaseManager.getUser(userId);
    if (!user?.accessToken) {
      return res
        .status(401)
        .json({ error: "User not authenticated with Discord" });
    }

    // For simplicity, get guilds from bot's cache where user has admin permissions
    const botGuilds = client.guilds.cache
      .filter((guild: Guild) =>
        guild.members.cache.get(userId)?.permissions.has("Administrator") || guild.ownerId === userId
      )
      .map((guild: Guild) => ({
        id: guild.id,
        name: guild.name,
        icon: guild.icon,
        memberCount: guild.memberCount,
        owner: guild.ownerId === userId,
        permissions:
          guild.members.cache.get(userId)?.permissions.has("Administrator") ||
          false,
      }));

    res.json(botGuilds);
  } catch (error) {
    console.error("Error fetching guilds:", error);
    res.status(500).json({ error: "Failed to fetch guilds" });
  }
});

// Get specific guild settings
router.get("/:guildId", checkGuildPermissions, async (req, res) => {
  try {
    const { guildId } = req.params;
    const client = req.app.locals.discordClient;
    const guild = client.guilds.cache.get(guildId);

    if (!guild) {
      return res.status(404).json({ error: "Guild not found" });
    }

    let guildSettings = await DatabaseManager.getGuildConfig(guild);
    // console.log("guildSettings", guildSettings);
    
    // let guildSettings = await DatabaseManager.getGuild(guildId);
    // // console.log("guildSettings", guildSettings);

    // if (!guildSettings) {
    //   guildSettings = await DatabaseManager.createDefaultGuild({
    //     id: guildId,
    //     name: guild.name,
    //     icon: guild.icon,
    //   });
    //   console.log("Created default guildSettings", guildSettings);
    // }

    // res.json(guildSettings);
    res.json(guildSettings);
  } catch (error) {
    console.error("Error fetching guild:", error);
    res.status(500).json({ error: "Failed to fetch guild settings" });
  }
});

// Update guild settings
router.put("/:guildId", checkGuildPermissions, async (req, res) => {
  try {
    const { guildId } = req.params;
    console.log(req.params);
    
    const client = req.app.locals.discordClient;
    const guild = client.guilds.cache.get(guildId);

    // const { prefix, enabled, timeoutLogChannelId } = req.body;
    const updateData = req.body;

    // const updatedGuild = await DatabaseManager.updateGuild(guildId, {
    //   prefix,
    //   enabled,
    //   timeoutLogChannelId,
    // });
    // const updatedGuild = await DatabaseManager.updateGuild(guildId, updateData);
    const updatedGuild = await DatabaseManager.upsertGuildConfig(guild, updateData);

    // 🔄 Update bot's config cache
    const configManager = ConfigManager.getInstance();
    configManager.set(guildId, updatedGuild); // or updateCache(updatedConfig)

    res.json(updatedGuild);
  } catch (error) {
    console.error("Error updating guild:", error);
    res.status(500).json({ error: "Failed to update guild settings" });
  }
});

// Get guild channels
router.get("/:guildId/channels", checkGuildPermissions, async (req, res) => {
  try {
    const client = req.app.locals.discordClient;
    const { guildId } = req.params;
    const guild = client.guilds.cache.get(guildId);

    if (!guild) return res.status(404).json({ error: "Guild not found" });

    await guild.channels.fetch();
    const channels = guild.channels.cache
      .filter((c: any) => c.type === 0 || c.type === 5) // GUILD_TEXT or ANNOUNCEMENT
      .map((c: any) => ({
        id: c.id,
        name: c.name,
        type: c.type,
        parentId: c.parentId,
        position: c.position,
      }))
      .sort((a: any, b: any) => a.position - b.position);

    res.json(channels);
  } catch (error) {
    console.error("Error fetching channels:", error);
    res.status(500).json({ error: "Failed to fetch channels" });
  }
});

// Get guild roles
router.get("/:guildId/roles", checkGuildPermissions, async (req, res) => {
  try {
    const client = req.app.locals.discordClient;
    const { guildId } = req.params;
    const guild = client.guilds.cache.get(guildId);

    if (!guild) return res.status(404).json({ error: "Guild not found" });

    const roles = guild.roles.cache
      .filter((r: any) => r.name !== "@everyone")
      .map((r: any) => ({
        id: r.id,
        name: r.name,
        color: r.color,
        position: r.position,
        permissions: r.permissions.toArray(),
      }))
      .sort((a: any, b: any) => b.position - a.position);

    res.json(roles);
  } catch (error) {
    console.error("Error fetching roles:", error);
    res.status(500).json({ error: "Failed to fetch roles" });
  }
});

// // Commands management
// router.get("/:guildId/commands", checkGuildPermissions, async (req, res) => {
//   try {
//     const { guildId } = req.params;
//     // const commands = await DatabaseManager.getGuildCommands(guildId);
//     const commands = await DatabaseManager.getGuildCommands(guildId);
//     res.json(commands);
//   } catch (error) {
//     console.error("Error fetching commands:", error);
//     res.status(500).json({ error: "Failed to fetch commands" });
//   }
// });

// router.put("/:guildId/commands/:commandId", checkGuildPermissions, async (req, res) => {
//   try {
//     const { guildId, commandId } = req.params;
//     const updateData = req.body;

//     const updatedCommand = await DatabaseManager.updateCommand(
//       parseInt(commandId),
//       updateData
//     );
//     res.json(updatedCommand);
//   } catch (error) {
//     console.error("Error updating command:", error);
//     res.status(500).json({ error: "Failed to update command" });
//   }
// });

export default router;
