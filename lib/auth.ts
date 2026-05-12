import jwt from 'jsonwebtoken'
import { NextRequest } from 'next/server'

const SECRET = process.env.JWT_SECRET!

export function signToken(payload: object): string {
  return jwt.sign(payload, SECRET, { expiresIn: '7d' })
}

export function verifyToken(token: string): jwt.JwtPayload | string {
  return jwt.verify(token, SECRET)
}

export function getSession(request: NextRequest): jwt.JwtPayload | null {
  const token = request.cookies.get('token')?.value
  if (!token) return null
  try {
    return verifyToken(token) as jwt.JwtPayload
  } catch {
    return null
  }
}
