// 서버 컴포넌트 — DB에서 직접 트리거 내역 조회
import { listAllTriggers } from '@/lib/queries/admin'
import { getServerSession } from '@/lib/auth-server'
import { redirect } from 'next/navigation'
import { AdminSidebar } from '@/components/admin-sidebar'

// 트리거 유형별 이모지 + 한글 이름
const TRIGGER_LABEL: Record<string, { emoji: string; name: string }> = {
  rain: { emoji: '🌧️', name: '비' },
  heat: { emoji: '☀️', name: '폭염' },
  cold: { emoji: '🥶', name: '한파' },
  snow: { emoji: '❄️', name: '눈' },
  dust: { emoji: '💨', name: '미세먼지' },
  good_weather: { emoji: '🌤️', name: '맑은 날' },
}

// 트리거 유형별 측정값 표시 (어떤 값이 기준인지)
function getMeasuredValue(trigger: {
  trigger_type: string
  rain_mm: number | null
  temp_c: number | null
  wind_ms: number | null
  pm25: number | null
}) {
  switch (trigger.trigger_type) {
    case 'rain': return trigger.rain_mm != null ? `${trigger.rain_mm}mm` : '—'
    case 'heat': return trigger.temp_c != null ? `${trigger.temp_c}°C` : '—'
    case 'cold': return trigger.temp_c != null ? `${trigger.temp_c}°C` : '—'
    case 'snow': return '관측'
    case 'dust': return trigger.pm25 != null ? `${trigger.pm25}㎍` : '—'
    case 'good_weather': return trigger.wind_ms != null ? `${trigger.wind_ms}m/s` : '—'
    default: return '—'
  }
}

export default async function AdminTriggersPage() {
  // 세션 확인
  const session = await getServerSession()
  if (!session) redirect('/login')
  if (session.role !== 'admin') redirect('/')

  // DB에서 트리거 내역 전체 조회
  const triggers = await listAllTriggers()

  // 통계 계산
  const totalCount = triggers.length

  return (
    <div className="flex min-h-screen bg-muted/30">
      <AdminSidebar />

      <main className="flex-1 px-8 py-8">
        {/* 페이지 제목 */}
        <h1 className="text-2xl font-bold mb-1">트리거 내역</h1>
        <p className="text-sm text-muted-foreground mb-6">
          기상 조건에 따라 발동된 트리거를 확인하세요.
        </p>

        {/* 통계 카드 */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
          {/* 총 트리거 발동 */}
          <div className="bg-white rounded-xl border px-6 py-5">
            <p className="text-sm text-muted-foreground mb-1">총 트리거 발동</p>
            <p className="text-3xl font-bold">
              {totalCount}
              <span className="text-base font-normal text-muted-foreground ml-1">회</span>
            </p>
          </div>

          {/* 영향받은 유저 — 쿼리에 없어서 추후 추가 */}
          <div className="bg-white rounded-xl border px-6 py-5">
            <p className="text-sm text-muted-foreground mb-1">영향받은 유저</p>
            <p className="text-3xl font-bold text-muted-foreground">—</p>
          </div>

          {/* 총 보상 지급액 — 쿼리에 없어서 추후 추가 */}
          <div className="bg-white rounded-xl border px-6 py-5">
            <p className="text-sm text-muted-foreground mb-1">총 보상 지급액</p>
            <p className="text-3xl font-bold text-muted-foreground">—</p>
          </div>
        </div>

        {/* 테이블 */}
        <div className="bg-white rounded-xl border overflow-hidden">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b text-muted-foreground">
                <th className="text-left px-6 py-3 font-medium">ID</th>
                <th className="text-left px-6 py-3 font-medium">트리거 유형</th>
                <th className="text-left px-6 py-3 font-medium">발동 시각</th>
                <th className="text-left px-6 py-3 font-medium">측정값</th>
              </tr>
            </thead>
            <tbody>
              {triggers.map((trigger) => {
                // 트리거 유형 라벨 가져오기
                const label = TRIGGER_LABEL[trigger.trigger_type] ?? { emoji: '❓', name: trigger.trigger_type }

                return (
                  <tr
                    key={trigger.id}
                    className="border-b last:border-0 hover:bg-muted/20 transition-colors"
                  >
                    {/* ID */}
                    <td className="px-6 py-4 text-muted-foreground">{trigger.id}</td>

                    {/* 트리거 유형 */}
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-2">
                        <span>{label.emoji}</span>
                        <span>{label.name}</span>
                      </div>
                    </td>

                    {/* 발동 시각 */}
                    <td className="px-6 py-4 text-muted-foreground">
                      {new Date(trigger.triggered_at).toLocaleString('ko-KR')}
                    </td>

                    {/* 측정값 */}
                    <td className="px-6 py-4 font-medium">
                      {getMeasuredValue(trigger)}
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>

          {/* 트리거 없을 때 빈 상태 */}
          {triggers.length === 0 && (
            <div className="text-center py-12 text-muted-foreground text-sm">
              트리거 내역이 없습니다.
            </div>
          )}
        </div>
      </main>
    </div>
  )
}