export type Tier = 'basic' | 'standard' | 'premium'

export const PLANS: Record<Tier, { tier: Tier; price: number; reward: number; label: string }> = {
  basic:    { tier: 'basic',    price: 7400,  reward: 800,  label: 'Basic' },
  standard: { tier: 'standard', price: 12700, reward: 1400, label: 'Standard' },
  premium:  { tier: 'premium',  price: 20600, reward: 2300, label: 'Premium' },
}

export function isTier(value: unknown): value is Tier {
  return value === 'basic' || value === 'standard' || value === 'premium'
}
