export type UserRow = {
  id: number
  email: string
  name: string
  role: 'user' | 'admin'
  balance: number
  created_at: Date
}

export type UserAccountRow = {
  id: number
  user_id: number
  provider: 'local' | 'kakao' | 'google'
  provider_id: string | null
  password: string | null
  created_at: Date
}
