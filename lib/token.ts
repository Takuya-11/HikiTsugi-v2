import 'server-only'
import crypto from 'crypto'

export function generateShareToken(): { plainToken: string; tokenHash: string } {
  const plainToken = crypto.randomBytes(32).toString('hex')
  const tokenHash = crypto.createHash('sha256').update(plainToken).digest('hex')
  return { plainToken, tokenHash }
}

export function hashToken(plainToken: string): string {
  return crypto.createHash('sha256').update(plainToken).digest('hex')
}
