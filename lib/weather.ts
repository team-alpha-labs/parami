// 기상청(초단기실황) + 에어코리아(시도별 측정) API를 호출해서 현재 날씨 한 묶음으로 반환
// 사용처: GET /api/weather/current, POST /api/scheduler/weather-check

import { SNOW_PTY_CODES } from '@/lib/conditions'

const KMA_BASE = 'https://apihub.kma.go.kr/api/typ02/openApi/VilageFcstInfoService_2.0/getUltraSrtNcst'
const AIR_BASE = 'https://apis.data.go.kr/B552584/ArpltnInforInqireSvc/getCtprvnRltmMesureDnsty'

const SEOUL = { nx: 60, ny: 127, sido: '서울' } as const

export type WeatherSnapshot = {
  measured_at: Date
  location: string
  rain_mm: number | null
  temp_c: number | null
  wind_ms: number | null
  pty: number | null
  snow: boolean
  pm25: number | null
  pm10: number | null
  raw_kma: unknown
  raw_air: unknown
}

export async function fetchWeatherSnapshot(): Promise<WeatherSnapshot> {
  const kmaKey = process.env.KMA_API_KEY
  const airKey = process.env.AIRKOREA_API_KEY
  if (!kmaKey) throw new Error('KMA_API_KEY missing')
  if (!airKey) throw new Error('AIRKOREA_API_KEY missing')

  // 기상청 API는 KST 기준이라 서버 로컬 타임존이 UTC(GCP 기본값)여도 동작해야 함
  const { measured_at, base_date, base_time } = kstPreviousHour(new Date())

  // 공공 API 키에 +, /, = 가 포함될 수 있어 URLSearchParams로 안전하게 인코딩
  const kmaUrl = `${KMA_BASE}?${new URLSearchParams({
    authKey: kmaKey,
    numOfRows: '10',
    pageNo: '1',
    base_date,
    base_time,
    nx: String(SEOUL.nx),
    ny: String(SEOUL.ny),
    dataType: 'JSON',
  })}`

  const airUrl = `${AIR_BASE}?${new URLSearchParams({
    serviceKey: airKey,
    returnType: 'json',
    numOfRows: '100',
    pageNo: '1',
    sidoName: SEOUL.sido,
    ver: '1.0',
  })}`

  const [rawKma, rawAir] = await Promise.all([fetchJson(kmaUrl), fetchJson(airUrl)])
  const kma = parseKma(rawKma)
  const air = parseAir(rawAir)

  return {
    measured_at,
    location: 'seoul',
    rain_mm: kma.rain_mm,
    temp_c: kma.temp_c,
    wind_ms: kma.wind_ms,
    pty: kma.pty,
    snow: kma.pty !== null && SNOW_PTY_CODES.includes(kma.pty),
    pm25: air.pm25,
    pm10: air.pm10,
    raw_kma: rawKma,
    raw_air: rawAir,
  }
}

const FETCH_TIMEOUT_MS = 5000
const FETCH_RETRIES = 1
const FETCH_RETRY_DELAY_MS = 500

// 외부 API 호출에 timeout + 1회 재시도 부여
// Cloud Scheduler는 5xx 시 자동 재호출하지만, 단일 호출이 무한 hang하는 케이스는 여기서 차단
async function fetchJson(url: string): Promise<unknown> {
  let lastError: unknown
  for (let attempt = 0; attempt <= FETCH_RETRIES; attempt++) {
    const controller = new AbortController()
    const timer = setTimeout(() => controller.abort(), FETCH_TIMEOUT_MS)
    try {
      const res = await fetch(url, { signal: controller.signal })
      const text = await res.text()
      if (!res.ok) throw new Error(`HTTP ${res.status}: ${text.slice(0, 200)}`)
      try {
        return JSON.parse(text)
      } catch {
        throw new Error(`Invalid JSON response: ${text.slice(0, 200)}`)
      }
    } catch (e) {
      lastError = e
      if (attempt < FETCH_RETRIES) {
        await new Promise((r) => setTimeout(r, FETCH_RETRY_DELAY_MS))
      }
    } finally {
      clearTimeout(timer)
    }
  }
  throw lastError
}

// 공공 API는 HTTP 200으로 와도 응답 header.resultCode가 '00'이 아니면 실패
// 키 만료/할당량 초과 등을 잡아서 null INSERT 방지
function assertOkResponse(raw: unknown, source: string): void {
  const r = raw as {
    response?: { header?: { resultCode?: string; resultMsg?: string } }
  }
  const code = r?.response?.header?.resultCode
  if (code !== '00') {
    const msg = r?.response?.header?.resultMsg ?? 'unknown'
    throw new Error(`${source} resultCode=${code ?? 'missing'} (${msg})`)
  }
}

// 서버 타임존과 무관하게 KST 기준 정시 1시간 이전을 계산
// (한국은 DST 없음 → UTC+9 고정 오프셋)
function kstPreviousHour(now: Date): {
  measured_at: Date
  base_date: string
  base_time: string
} {
  const KST_OFFSET_MS = 9 * 60 * 60 * 1000
  const kst = new Date(now.getTime() + KST_OFFSET_MS)
  kst.setUTCMinutes(0, 0, 0)
  kst.setUTCHours(kst.getUTCHours() - 1)

  const yyyy = kst.getUTCFullYear()
  const mm = String(kst.getUTCMonth() + 1).padStart(2, '0')
  const dd = String(kst.getUTCDate()).padStart(2, '0')
  const hh = String(kst.getUTCHours()).padStart(2, '0')

  return {
    measured_at: new Date(kst.getTime() - KST_OFFSET_MS),
    base_date: `${yyyy}${mm}${dd}`,
    base_time: `${hh}00`,
  }
}

type KmaItem = { category: string; obsrValue: string }

function parseKma(raw: unknown): {
  rain_mm: number | null
  temp_c: number | null
  wind_ms: number | null
  pty: number | null
} {
  assertOkResponse(raw, 'KMA')
  const items = extractKmaItems(raw)
  const byCategory = new Map<string, number>()
  for (const it of items) {
    const v = Number(it.obsrValue)
    if (!Number.isNaN(v)) byCategory.set(it.category, v)
  }
  return {
    rain_mm: byCategory.get('RN1') ?? null,
    temp_c: byCategory.get('T1H') ?? null,
    wind_ms: byCategory.get('WSD') ?? null,
    pty: byCategory.get('PTY') ?? null,
  }
}

function extractKmaItems(raw: unknown): KmaItem[] {
  const r = raw as { response?: { body?: { items?: { item?: KmaItem[] } } } }
  const arr = r?.response?.body?.items?.item
  if (!Array.isArray(arr) || arr.length === 0) {
    throw new Error('KMA response has no items')
  }
  return arr
}

type AirItem = { pm25Value?: string; pm10Value?: string; dataTime?: string }

function parseAir(raw: unknown): { pm25: number | null; pm10: number | null } {
  assertOkResponse(raw, 'AirKorea')
  const items = extractAirItems(raw)

  // 측정소별로 dataTime이 다를 수 있어 가장 최신 시각의 측정값만 평균
  const latest = items
    .map((i) => i.dataTime)
    .filter((t): t is string => !!t)
    .sort()
    .at(-1)
  const filtered = latest ? items.filter((i) => i.dataTime === latest) : items

  return {
    pm25: averageNumeric(filtered.map((i) => i.pm25Value)),
    pm10: averageNumeric(filtered.map((i) => i.pm10Value)),
  }
}

function extractAirItems(raw: unknown): AirItem[] {
  const r = raw as { response?: { body?: { items?: AirItem[] } } }
  const arr = r?.response?.body?.items
  if (!Array.isArray(arr) || arr.length === 0) {
    throw new Error('AirKorea response has no items')
  }
  return arr
}

function averageNumeric(values: Array<string | undefined>): number | null {
  const nums = values
    .map((v) => Number(v))
    .filter((v) => !Number.isNaN(v))
  if (nums.length === 0) return null
  return nums.reduce((a, b) => a + b, 0) / nums.length
}
