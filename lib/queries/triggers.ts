// trigger_logs DB 쿼리 모음
// 스케줄러가 weather_logs INSERT 후 발동된 트리거를 기록

import pool from '@/lib/db'
import { ResultSetHeader } from 'mysql2'
import type { TriggerType } from '@/lib/triggers'

// UNIQUE(trigger_type, triggered_date) 제약에 의존
// INSERT IGNORE 사용 — 중복이면 affectedRows=0, 신규면 1
// trigger_type / triggered_date는 NOT NULL이라 MySQL UNIQUE가 정상 동작
// (NULL 무시 이슈 없음)
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
    return { inserted: false, id: null }
  }
  return { inserted: true, id: result.insertId }
}
