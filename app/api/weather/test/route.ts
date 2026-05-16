import { NextResponse } from 'next/server'

// 개발 전용 진단 엔드포인트
// 인증 없이 외부 기상 API(KMA, 에어코리아)를 호출하므로 운영에서 노출되면
// API 할당량 소진 가능 → production에선 404 처리하고 개발 환경에서만 동작
export async function GET() {
  if (process.env.NODE_ENV === 'production') {
    return NextResponse.json(
      { success: false, error: '운영 환경에서는 제공되지 않습니다.' },
      { status: 404 },
    )
  }

  const kmaKey = process.env.KMA_API_KEY
  const airKey = process.env.AIRKOREA_API_KEY

  if (!kmaKey || !airKey) {
    return NextResponse.json({
      success: false,
      error: '.env.local에 KMA_API_KEY 또는 AIRKOREA_API_KEY 누락',
    })
  }

  const now = new Date()
  const yyyy = now.getFullYear()
  const mm = String(now.getMonth() + 1).padStart(2, '0')
  const dd = String(now.getDate()).padStart(2, '0')
  const hh = String(now.getHours() === 0 ? 23 : now.getHours() - 1).padStart(2, '0')
  const baseDate = `${yyyy}${mm}${dd}`
  const baseTime = `${hh}00`

  // 공공 API 키에 +, /, = 가 포함될 수 있어 URLSearchParams로 안전하게 인코딩
  const kmaUrl =
    'https://apihub.kma.go.kr/api/typ02/openApi/VilageFcstInfoService_2.0/getUltraSrtNcst?' +
    new URLSearchParams({
      authKey: kmaKey,
      numOfRows: '10',
      pageNo: '1',
      base_date: baseDate,
      base_time: baseTime,
      nx: '60',
      ny: '127',
      dataType: 'JSON',
    }).toString()

  const airUrl =
    'https://apis.data.go.kr/B552584/ArpltnInforInqireSvc/getCtprvnRltmMesureDnsty?' +
    new URLSearchParams({
      serviceKey: normalizeServiceKey(airKey),
      returnType: 'json',
      numOfRows: '10',
      pageNo: '1',
      sidoName: '서울',
      ver: '1.0',
    }).toString()

  try {
    const [kmaRes, airRes] = await Promise.all([
      fetch(kmaUrl).then((r) => r.text()),
      fetch(airUrl).then((r) => r.text()),
    ])

    return NextResponse.json({
      success: true,
      baseDate,
      baseTime,
      kma: safeParse(kmaRes),
      air: safeParse(airRes),
    })
  } catch (e) {
    return NextResponse.json({ success: false, error: String(e) })
  }
}

function safeParse(s: string) {
  try {
    return JSON.parse(s)
  } catch {
    return s
  }
}

function normalizeServiceKey(key: string): string {
  try {
    return key.includes('%') ? decodeURIComponent(key) : key
  } catch {
    return key
  }
}
