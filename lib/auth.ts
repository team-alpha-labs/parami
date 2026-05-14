import jwt from 'jsonwebtoken'
import { NextRequest } from 'next/server'

const SECRET = process.env.JWT_SECRET!

export function signToken(payload: object): string {
  return jwt.sign(payload, SECRET, { expiresIn: '7d' })
}

export function verifyToken(token: string): jwt.JwtPayload | string {
  return jwt.verify(token, SECRET)
}

export type Session = jwt.JwtPayload & { uid: number; role: 'user' | 'admin' }

export function getSession(request: NextRequest): Session | null {
  const token = request.cookies.get('token')?.value
  if (!token) return null
  try {
    const payload = verifyToken(token) as jwt.JwtPayload
    if (typeof payload === 'string' || typeof payload.uid !== 'number') return null
    return payload as Session
  } catch {
    return null
  }
}

export function requireUser(request: NextRequest): Session | null {
  return getSession(request)
}
