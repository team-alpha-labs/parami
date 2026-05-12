import jwt from 'jsonwebtoken'

// TODO: jsonwebtoken 설치 필요 — npm install jsonwebtoken @types/jsonwebtoken
// TODO: .env.local에 JWT_SECRET 설정 필요

const SECRET = process.env.JWT_SECRET!

export function signToken(payload: object): string {
  return jwt.sign(payload, SECRET, { expiresIn: '7d' })
}

export function verifyToken(token: string): jwt.JwtPayload | string {
  return jwt.verify(token, SECRET)
}
