import { NextRequest, NextResponse } from 'next/server'
import { loginOrCreateSocialUser, makeSessionRedirect } from '@/lib/oauth'

const GOOGLE_TOKEN_URL = 'https://oauth2.googleapis.com/token'
const GOOGLE_USERINFO_URL = 'https://www.googleapis.com/oauth2/v2/userinfo'

export async function GET(request: NextRequest) {
  const code = request.nextUrl.searchParams.get('code')
  const errorParam = request.nextUrl.searchParams.get('error')
  const home = new URL('/', request.url).toString()

  if (errorParam) return NextResponse.redirect(`${home}?auth_error=google_${errorParam}`)
  if (!code) return NextResponse.redirect(`${home}?auth_error=missing_code`)

  const clientId = process.env.GOOGLE_CLIENT_ID
  const clientSecret = process.env.GOOGLE_CLIENT_SECRET
  const redirectUri = process.env.GOOGLE_REDIRECT_URI
  if (!clientId || !clientSecret || !redirectUri) {
    return NextResponse.redirect(`${home}?auth_error=google_not_configured`)
  }

  const tokenRes = await fetch(GOOGLE_TOKEN_URL, {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({
      grant_type: 'authorization_code',
      client_id: clientId,
      client_secret: clientSecret,
      redirect_uri: redirectUri,
      code,
    }),
  })
  if (!tokenRes.ok) return NextResponse.redirect(`${home}?auth_error=google_token`)
  const tokenJson = (await tokenRes.json()) as { access_token?: string }
  if (!tokenJson.access_token) return NextResponse.redirect(`${home}?auth_error=google_token`)

  const userRes = await fetch(GOOGLE_USERINFO_URL, {
    headers: { Authorization: `Bearer ${tokenJson.access_token}` },
  })
  if (!userRes.ok) return NextResponse.redirect(`${home}?auth_error=google_userinfo`)
  const userJson = (await userRes.json()) as { id?: string; email?: string; name?: string }
  const providerId = userJson.id
  const email = userJson.email
  const name = userJson.name ?? '구글사용자'
  if (!providerId || !email) {
    return NextResponse.redirect(`${home}?auth_error=google_email_required`)
  }

  const user = await loginOrCreateSocialUser('google', { providerId, email, name })
  return makeSessionRedirect(user.id, user.role, home)
}
