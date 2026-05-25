import type { Request, Response, NextFunction } from 'express'
import { consumeForce503 } from '../store'

export function maybe503(req: Request, res: Response, next: NextFunction): void {
  // Forced 503 (for integration tests)
  if (!req.path.startsWith('/__test') && consumeForce503()) {
    res.status(503).json({ error: 'Service Unavailable' })
    return
  }
  // Random 10% 503
  if (Math.random() < 0.1) {
    res.status(503).json({ error: 'Service Unavailable' })
    return
  }
  next()
}

export function randomDelay(_req: Request, _res: Response, next: NextFunction): void {
  setTimeout(next, Math.floor(Math.random() * 300) + 200)
}
