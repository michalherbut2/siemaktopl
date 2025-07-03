// backend/src/api/routes/users.ts
import { Router, Request, Response } from "express";
import { authenticateToken } from "../middleware/auth";
import { DatabaseManager } from "../../db/DatabaseManager";

const router = Router();

// Apply authentication middleware
router.use(authenticateToken);

// GET /users/me - Get the authenticated user's info
router.get("/me", async (req: Request, res: Response) => {
  try {
    const userId = (req as any).user.userId;
    const user = await DatabaseManager.getUser(userId);
    
    if (!user) {
      return res.status(404).json({ error: "User not found" });
    }

    // Return user info without sensitive data
    const userInfo = {
      id: user.id,
      username: user.username,
      avatar: user.avatar,
      guilds: user.guilds || [],
      createdAt: user.createdAt,
      updatedAt: user.updatedAt
    };

    res.json(userInfo);
  } catch (error) {
    console.error("Error fetching user info:", error);
    res.status(500).json({ error: "Failed to fetch user info" });
  }
});

// GET /users/me/websocket-token - Get WebSocket connection token
router.get("/me/websocket-token", async (req: Request, res: Response) => {
  try {
    const user = (req as any).user;
    
    // Return the same JWT token for WebSocket authentication
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1];
    
    res.json({ token });
  } catch (error) {
    console.error("Error generating WebSocket token:", error);
    res.status(500).json({ error: "Failed to generate WebSocket token" });
  }
});

export default router;
