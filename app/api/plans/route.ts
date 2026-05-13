import { NextResponse } from 'next/server'
import { getAllPlans } from '@/lib/plans'

// GET /api/plans — 구독 가격표 조회 (인증 불필요, 공개 API)
export async function GET() {
  try {
    const plans = await getAllPlans()
    return NextResponse.json({ success: true, data: plans })
  } catch (error) {
    console.error('GET /api/plans error:', error)
    return NextResponse.json(
      { success: false, error: '티어 목록 조회 실패' },
      { status: 500 }
    )
  }
}
