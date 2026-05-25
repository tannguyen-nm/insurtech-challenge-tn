import { Router } from 'express'
import jwt from 'jsonwebtoken'
import { VALID_API_KEYS } from '../store'
import { JWT_SECRET } from '../middleware/auth'

const router = Router()

router.post('/token', (req, res) => {
  const { apiKey } = req.body as { apiKey?: string }

  if (!apiKey || !VALID_API_KEYS.has(apiKey)) {
    res.status(401).json({ error: 'Invalid API key' })
    return
  }

  const token = jwt.sign({ apiKey }, JWT_SECRET, { expiresIn: '1h' })
  res.json({ token, expiresIn: 3600 })
})

export default router
