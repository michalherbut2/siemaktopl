import { Request, Response, NextFunction } from "express";
import { PermissionsBitField } from "discord.js";
import { JwtPayload } from 'jsonwebtoken';

interface AuthenticatedRequest extends Request {
  user?: JwtPayload | string;
}

export async function checkGuildPermissions(req: AuthenticatedRequest, res: Response, next: NextFunction) {
  const { guildId } = req.params;
  const client = req.app.locals.discordClient;
  const userId = (req as any).user?.userId; // zakładam, że masz usera w `req.user` po auth
  
  if (!userId) {
    return res.status(401).json({ error: "Unauthorized" });
  }

  const guild = client.guilds.cache.get(guildId);
  if (!guild) {
    return res.status(404).json({ error: "Guild not found" });
  }

  try {
    const member = await guild.members.fetch(userId);

    const hasPermission =
      member.permissions.has(PermissionsBitField.Flags.Administrator) ||
      guild.ownerId === userId;

    if (!hasPermission) {
      return res.status(403).json({ error: "Insufficient permissions" });
    }

    // pozwalamy dalej
    next();
  } catch (err) {
    console.error("Permission check error:", err);
    return res.status(403).json({ error: "Permission check failed" });
  }
}
