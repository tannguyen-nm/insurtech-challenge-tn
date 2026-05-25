import type { Request, Response, NextFunction } from 'express'
import jwt from 'jsonwebtoken'

export const JWT_SECRET = process.env.JWT_SECRET ?? 'mock-jwt-secret-do-not-use-in-prod'

declare module 'express-serve-static-core' {
  interface Request {
    apiKey?: string
  }
}

export function authMiddleware(req: Request, res: Response, next: NextFunction): void {
  const authHeader = req.headers.authorization
  if (!authHeader?.startsWith('Bearer ')) {
    res.status(401).json({ error: 'Missing Authorization header' })
    return
  }

  const token = authHeader.slice(7)
  try {
    const payload = jwt.verify(token, JWT_SECRET) as { apiKey: string }
    req.apiKey = payload.apiKey
    next()
  } catch {
    res.status(401).json({ error: 'Invalid or expired token' })
  }
}
