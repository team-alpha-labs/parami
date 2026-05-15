// 구독 플랜(티어) 정보 DB 조회 함수 모음
// plans 테이블 = basic/standard/premium 3개 행 (db/schema.sql 참고)

import pool from '@/lib/db'
import { RowDataPacket } from 'mysql2'

export interface Plan {
  id: number
  tier: 'basic' | 'standard' | 'premium'
  name: string
  price: number
  description: string | null
}

// 전체 플랜을 가격 오름차순으로 조회
export async function getAllPlans(): Promise<Plan[]> {
  const [rows] = await pool.query<(Plan & RowDataPacket)[]>(
    'SELECT id, tier, name, price, description FROM plans ORDER BY price ASC'
  )
  return rows
}

// 특정 티어의 플랜 1건 조회 (없으면 null)
// 결제 검증용 — 클라이언트가 보낸 amount가 DB 가격과 일치하는지 대조할 때 사용
export async function findPlanByTier(
  tier: 'basic' | 'standard' | 'premium'
): Promise<Plan | null> {
  const [rows] = await pool.query<(Plan & RowDataPacket)[]>(
    'SELECT id, tier, name, price, description FROM plans WHERE tier = ? LIMIT 1',
    [tier]
  )
  return rows[0] ?? null
}
