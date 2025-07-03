// backend/src/api/middleware/auth.ts
import { Request, Response, NextFunction } from 'express';
import jwt, { JwtPayload } from 'jsonwebtoken';

interface AuthenticatedRequest extends Request {
  user?: JwtPayload | string;
}

export function authenticateToken(req: AuthenticatedRequest, res: Response, next: NextFunction) {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  if (!token) {
    return res.status(401).json({ error: 'Access token required' });
  }

  jwt.verify(token, process.env.JWT_SECRET!, (err, user) => {
    if (err) {      
      return res.status(401).json({ error: 'Invalid token' });
    }
    req.user = user;
    next();
  });
}

// New function for WebSocket token validation
export function validateWebSocketToken(token: string): Promise<JwtPayload | null> {
  return new Promise((resolve) => {
    jwt.verify(token, process.env.JWT_SECRET!, (err, user) => {
      if (err) {
        resolve(null);
      } else {
        resolve(user as JwtPayload);
      }
    });
  });
}
