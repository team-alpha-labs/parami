// weather_logs DB 쿼리 모음
// 스케줄러가 매 시간 외부 API에서 받은 날씨 데이터를 저장

import pool from '@/lib/db'
import { ResultSetHeader, RowDataPacket } from 'mysql2'
import type { WeatherSnapshot } from '@/lib/weather'

// 외부 API에서 받은 WeatherSnapshot을 weather_logs에 INSERT
// raw_payload는 원본 응답 JSON 그대로 보존 (사후 감사·재계산용)
// snow는 schema가 TINYINT(1)이라 boolean을 1/0으로 변환
export async function insertWeatherLog(snap: WeatherSnapshot): Promise<number> {
  const [result] = await pool.execute<ResultSetHeader>(
    `INSERT INTO weather_logs
       (measured_at, location, rain_mm, temp_c, wind_ms, snow, pm25, pm10, source, raw_payload)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    [
      snap.measured_at,
      snap.location,
      snap.rain_mm,
      snap.temp_c,
      snap.wind_ms,
      snap.snow ? 1 : 0,
      snap.pm25,
      snap.pm10,
      'kma+airkorea',
      JSON.stringify({ kma: snap.raw_kma, air: snap.raw_air }),
    ],
  )
  return result.insertId
}

// 특정 KST 날짜의 일 누적 강수량(mm) 합산
// 기상청 RN1은 시간당 값이라 "오늘 비 왔는지"는 SUM 필요
// triggered_date: 'YYYY-MM-DD' (KST 기준, lib/triggers.ts toKstDateString과 동일 포맷)
// MySQL 서버 timezone 무관하게 KST로 변환 후 DATE 비교 (CONVERT_TZ)
//
// dedupe: weather_logs는 (location, measured_at) UNIQUE가 없어 스케줄러 재시도/수동 호출로
// 같은 시간대가 2회 INSERT될 수 있음. 단순 SUM이면 같은 시간 강수량이 중복 합산돼
// 실제 비 안 와도 트리거 발동 가능 (돈 나가는 이슈).
// 같은 measured_at은 MAX 1개만 카운트하도록 GROUP BY로 dedupe한 뒤 SUM.
export async function getTodayRainTotal(triggered_date: string): Promise<number> {
  const [rows] = await pool.query<RowDataPacket[]>(
    `SELECT COALESCE(SUM(rain_mm), 0) AS total FROM (
       SELECT measured_at, MAX(rain_mm) AS rain_mm
       FROM weather_logs
       WHERE DATE(CONVERT_TZ(measured_at, '+00:00', '+09:00')) = ?
       GROUP BY measured_at
     ) t`,
    [triggered_date],
  )
  return Number(rows[0].total)
}
