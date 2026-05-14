import { NextRequest, NextResponse } from 'next/server'
import { loginOrCreateSocialUser, makeSessionRedirect } from '@/lib/oauth'

const KAKAO_TOKEN_URL = 'https://kauth.kakao.com/oauth/token'
const KAKAO_USERINFO_URL = 'https://kapi.kakao.com/v2/user/me'

export async function GET(request: NextRequest) {
  const code = request.nextUrl.searchParams.get('code')
  const errorParam = request.nextUrl.searchParams.get('error')
  const home = new URL('/', request.url).toString()

  if (errorParam) return NextResponse.redirect(`${home}?auth_error=kakao_${errorParam}`)
  if (!code) return NextResponse.redirect(`${home}?auth_error=missing_code`)

  const clientId = process.env.KAKAO_CLIENT_ID
  const clientSecret = process.env.KAKAO_CLIENT_SECRET
  const redirectUri = process.env.KAKAO_REDIRECT_URI
  if (!clientId || !redirectUri) {
    return NextResponse.redirect(`${home}?auth_error=kakao_not_configured`)
  }

  const tokenBody = new URLSearchParams({
    grant_type: 'authorization_code',
    client_id: clientId,
    redirect_uri: redirectUri,
    code,
  })
  if (clientSecret) tokenBody.set('client_secret', clientSecret)

  const tokenRes = await fetch(KAKAO_TOKEN_URL, {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: tokenBody,
  })
  if (!tokenRes.ok) return NextResponse.redirect(`${home}?auth_error=kakao_token`)
  const tokenJson = (await tokenRes.json()) as { access_token?: string }
  if (!tokenJson.access_token) return NextResponse.redirect(`${home}?auth_error=kakao_token`)

  const userRes = await fetch(KAKAO_USERINFO_URL, {
    headers: { Authorization: `Bearer ${tokenJson.access_token}` },
  })
  if (!userRes.ok) return NextResponse.redirect(`${home}?auth_error=kakao_userinfo`)
  const userJson = (await userRes.json()) as {
    id?: number
    kakao_account?: { email?: string; profile?: { nickname?: string } }
  }
  const providerId = userJson.id?.toString()
  const email = userJson.kakao_account?.email
  const name = userJson.kakao_account?.profile?.nickname ?? '카카오사용자'
  if (!providerId || !email) {
    return NextResponse.redirect(`${home}?auth_error=kakao_email_required`)
  }

  const user = await loginOrCreateSocialUser('kakao', { providerId, email, name })
  return makeSessionRedirect(user.id, user.role, home)
}
