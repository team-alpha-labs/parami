// trigger_logs DB 쿼리 모음
// 스케줄러가 weather_logs INSERT 후 발동된 트리거를 기록

import pool from '@/lib/db'
import { ResultSetHeader, RowDataPacket } from 'mysql2'
import type { TriggerType } from '@/lib/triggers'

// UNIQUE(trigger_type, triggered_date) 제약에 의존
// INSERT IGNORE 사용 — 중복이면 affectedRows=0, 신규면 1
// trigger_type / triggered_date는 NOT NULL이라 MySQL UNIQUE가 정상 동작
// (NULL 무시 이슈 없음)
//
// 중복(affectedRows=0)일 때도 기존 행의 id를 SELECT해 반환 — 멱등성 보장 목적.
// 이전 회차에서 trigger_logs INSERT는 성공했으나 보상 단계가 실패해 미지급으로 끝난
// 케이스에서, 다음 회차에 같은 trigger_log_id로 보상 재시도가 가능해진다.
// (reward_logs UNIQUE(user_id, trigger_log_id)가 이미 지급된 유저는 거름)
export async function insertTriggerLog(args: {
  weather_log_id: number
  trigger_type: TriggerType
  triggered_at: Date
  triggered_date: string
}): Promise<{ inserted: boolean; id: number | null }> {
  const [result] = await pool.execute<ResultSetHeader>(
    `INSERT IGNORE INTO trigger_logs
       (weather_log_id, trigger_type, triggered_at, triggered_date)
     VALUES (?, ?, ?, ?)`,
    [
      args.weather_log_id,
      args.trigger_type,
      args.triggered_at,
      args.triggered_date,
    ],
  )
  if (result.affectedRows === 0) {
    const [rows] = await pool.query<RowDataPacket[]>(
      `SELECT id FROM trigger_logs
        WHERE trigger_type = ? AND triggered_date = ?
        LIMIT 1`,
      [args.trigger_type, args.triggered_date],
    )
    return { inserted: false, id: (rows[0]?.id as number) ?? null }
  }
  return { inserted: true, id: result.insertId }
}
