// weather_logs DB 쿼리 모음
// 스케줄러가 매 시간 외부 API에서 받은 날씨 데이터를 저장

import pool from '@/lib/db'
import { ResultSetHeader } from 'mysql2'
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
