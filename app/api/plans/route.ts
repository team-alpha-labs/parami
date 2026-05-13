import { ok } from '@/lib/api'
import { PLANS } from '@/lib/plans'

export async function GET() {
  return ok(Object.values(PLANS))
}
