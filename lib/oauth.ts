import { NextResponse } from 'next/server'
import { signToken } from '@/lib/auth'
import {
  createSocialUser,
  findAccountByProvider,
  findUserByEmail,
  findUserById,
  linkSocialAccount,
} from '@/lib/queries/users'

export type OAuthProvider = 'kakao' | 'google'

export type SocialProfile = {
  providerId: string
  email: string
  name: string
}

export async function loginOrCreateSocialUser(provider: OAuthProvider, profile: SocialProfile) {
  const existingAccount = await findAccountByProvider(provider, profile.providerId)
  if (existingAccount) {
    const user = await findUserById(existingAccount.user_id)
    if (!user) throw new Error('계정은 있으나 연결된 유저가 없습니다.')
    return user
  }

  const sameEmailUser = await findUserByEmail(profile.email)
  if (sameEmailUser) {
    await linkSocialAccount(sameEmailUser.id, provider, profile.providerId)
    return sameEmailUser
  }

  const newUserId = await createSocialUser(profile.email, profile.name, provider, profile.providerId)
  return {
    id: newUserId,
    email: profile.email,
    name: profile.name,
    role: 'user' as const,
    balance: 0,
    created_at: new Date(),
  }
}

export function buildAuthRedirect(redirectTo: string, token: string) {
  const res = NextResponse.redirect(redirectTo)
  res.cookies.set('token', token, {
    httpOnly: true,
    sameSite: 'lax',
    secure: process.env.NODE_ENV === 'production',
    path: '/',
    maxAge: 60 * 60 * 24 * 7,
  })
  return res
}

export function makeSessionRedirect(userId: number, role: 'user' | 'admin', redirectTo: string) {
  const token = signToken({ uid: userId, role })
  return buildAuthRedirect(redirectTo, token)
}
