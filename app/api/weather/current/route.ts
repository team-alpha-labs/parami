import { NextResponse } from 'next/server'
import { fetchWeatherSnapshot } from '@/lib/weather'

export async function GET() {
  try {
    const snap = await fetchWeatherSnapshot()
    return NextResponse.json({
      success: true,
      data: {
        measured_at: snap.measured_at,
        location: snap.location,
        rain_mm: snap.rain_mm,
        temp_c: snap.temp_c,
        wind_ms: snap.wind_ms,
        pty: snap.pty,
        pm25: snap.pm25,
        pm10: snap.pm10,
      },
    })
  } catch (error) {
    console.error('GET /api/weather/current error:', error)
    return NextResponse.json(
      { success: false, error: '날씨 정보를 가져올 수 없습니다.' },
      { status: 500 },
    )
  }
}
