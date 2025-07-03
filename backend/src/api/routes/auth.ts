// backend/src/api/routes/auth.ts
import { Router } from 'express';
import axios from 'axios';
import jwt from 'jsonwebtoken';
import { DatabaseManager } from '../../db/DatabaseManager';

const router = Router();

router.post('/discord', async (req, res) => {
  try {
    const { code } = req.body;
    console.log("code", code);
    
    if (!code) {
      return res.status(400).json({ error: 'Authorization code required' });
    }
    console.log("redirect_uri", process.env.DISCORD_REDIRECT_URI);
    
    // Exchange code for token
    const tokenResponse = await axios.post('https://discord.com/api/oauth2/token', {
      client_id: process.env.DISCORD_CLIENT_ID,
      client_secret: process.env.DISCORD_CLIENT_SECRET,
      grant_type: 'authorization_code',
      code: code,
      redirect_uri: process.env.DISCORD_REDIRECT_URI,
      scope: 'identify guilds',
    }, {
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' }
    });
    // console.log("token", tokenResponse.data);
    
    const { access_token, refresh_token } = tokenResponse.data;

    // Get user info
    const userResponse = await axios.get('https://discord.com/api/users/@me', {
      headers: { Authorization: `Bearer ${access_token}` }
    });

    const userData = userResponse.data;
    // console.log("user", userData);
    
    // Save/update user in database
    await DatabaseManager.createOrUpdateUser({
      id: userData.id,
      username: userData.username,
      avatar: userData.avatar,
      accessToken: access_token,
      refreshToken: refresh_token
    });

    // Create JWT token
    const token = jwt.sign(
      { userId: userData.id, username: userData.username },
      process.env.JWT_SECRET!,
      { expiresIn: '7d' }
    );

    res.json({
      token,
      user: {
        id: userData.id,
        username: userData.username,
        avatar: userData.avatar
      }
    });

  } catch (error: any) {
    console.error('Discord OAuth error:', error.response?.data || error.message);
    res.status(500).json({ error: 'Authentication failed' });
  }
});

export default router;