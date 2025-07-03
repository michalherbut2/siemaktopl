import { Router, Request, Response } from "express";

const router = Router();

// GET /users/me - Get the authenticated user's info (placeholder)
router.get("/me", async (req: Request, res: Response) => {
  // TODO: Implement authentication and fetch user info from DB or session
  return res.json({ message: "User info endpoint (to be implemented)" });
});

export default router;
