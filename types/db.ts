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

export type SubscriptionRow = {
  id: number
  user_id: number
  tier: 'basic' | 'standard' | 'premium'
  status: 'active' | 'cancelled' | 'expired'
  next_billing_at: Date | null
  started_at: Date
  cancelled_at: Date | null
  pending_tier: 'basic' | 'standard' | 'premium' | null
}

export type PaymentRow = {
  id: number
  user_id: number
  subscription_id: number
  amount: number
  method: string
  status: 'success' | 'fail' | 'cancelled'
  toss_order_id: string
  toss_payment_key: string | null
  billing_year: number | null
  billing_month: number | null
  paid_at: Date
}

export type TriggerType =
  | 'rain'
  | 'heat'
  | 'cold'
  | 'snow'
  | 'dust'
  | 'good_weather'

export type RewardRow = {
  id: number
  user_id: number
  trigger_log_id: number
  trigger_type: TriggerType
  amount: number
  tier_at_reward: 'basic' | 'standard' | 'premium'
  reward_year: number
  reward_month: number
  rewarded_at: Date
}
