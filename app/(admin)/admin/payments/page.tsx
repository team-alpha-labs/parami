// 서버 컴포넌트 — DB에서 직접 결제 내역 조회
import { listAllPayments } from '@/lib/queries/admin'
import { getServerSession } from '@/lib/auth-server'
import { redirect } from 'next/navigation'
import { AdminSidebar } from '@/components/admin-sidebar'

export default async function AdminPaymentsPage() {
  // 세션 확인 — 없으면 로그인 페이지로
  const session = await getServerSession()
  if (!session) redirect('/login')

  // 관리자 권한 확인 — 아니면 홈으로
  if (session.role !== 'admin') redirect('/')

  // DB에서 결제 내역 전체 조회
  const payments = await listAllPayments()

  // 통계 계산
  const totalCount = payments.length
  const totalAmount = payments
    .filter((p) => p.status === 'success') // 성공한 결제만 합산
    .reduce((sum, p) => sum + p.amount, 0)
  const avgAmount = totalCount > 0 ? Math.round(totalAmount / totalCount) : 0

  return (
    // 전체 레이아웃: 사이드바 + 본문
    <div className="flex min-h-screen bg-muted/30">
      <AdminSidebar />

      {/* 본문 영역 */}
      <main className="flex-1 px-8 py-8">
        {/* 페이지 제목 */}
        <h1 className="text-2xl font-bold mb-1">결제 내역</h1>
        <p className="text-sm text-muted-foreground mb-6">
          유저의 결제 내역과 매출을 확인하세요.
        </p>

        {/* 통계 카드 3개 */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
          {/* 총 결제 건수 */}
          <div className="bg-white rounded-xl border px-6 py-5">
            <p className="text-sm text-muted-foreground mb-1">총 결제 건수</p>
            <p className="text-3xl font-bold">
              {totalCount}
              <span className="text-base font-normal text-muted-foreground ml-1">건</span>
            </p>
          </div>

          {/* 총 매출 */}
          <div className="bg-white rounded-xl border px-6 py-5">
            <p className="text-sm text-muted-foreground mb-1">총 매출</p>
            <p className="text-3xl font-bold">
              {totalAmount.toLocaleString()}
              <span className="text-base font-normal text-muted-foreground ml-1">원</span>
            </p>
          </div>

          {/* 평균 결제액 */}
          <div className="bg-white rounded-xl border px-6 py-5">
            <p className="text-sm text-muted-foreground mb-1">평균 결제액</p>
            <p className="text-3xl font-bold">
              {avgAmount.toLocaleString()}
              <span className="text-base font-normal text-muted-foreground ml-1">원</span>
            </p>
          </div>
        </div>

        {/* 테이블 */}
        <div className="bg-white rounded-xl border overflow-hidden">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b text-muted-foreground">
                <th className="text-left px-6 py-3 font-medium">ID</th>
                <th className="text-left px-6 py-3 font-medium">유저</th>
                <th className="text-left px-6 py-3 font-medium">결제액</th>
                <th className="text-left px-6 py-3 font-medium">결제수단</th>
                <th className="text-left px-6 py-3 font-medium">결제일시</th>
                <th className="text-left px-6 py-3 font-medium">상태</th>
              </tr>
            </thead>
            <tbody>
              {payments.map((payment) => (
                <tr
                  key={payment.id}
                  className="border-b last:border-0 hover:bg-muted/20 transition-colors"
                >
                  {/* ID */}
                  <td className="px-6 py-4 text-muted-foreground">{payment.id}</td>

                  {/* 유저 이름 + 이메일 */}
                  <td className="px-6 py-4">
                    <div className="flex flex-col">
                      <span className="font-medium">{payment.user_name}</span>
                      <span className="text-xs text-muted-foreground">{payment.user_email}</span>
                    </div>
                  </td>

                  {/* 결제액 */}
                  <td className="px-6 py-4 font-medium text-primary">
                    {payment.amount.toLocaleString()}원
                  </td>

                  {/* 결제수단 */}
                  <td className="px-6 py-4 text-muted-foreground">{payment.method}</td>

                  {/* 결제일시 */}
                  <td className="px-6 py-4 text-muted-foreground">
                    {new Date(payment.paid_at).toLocaleString('ko-KR')}
                  </td>

                  {/* 상태 배지 */}
                  <td className="px-6 py-4">
                    <span
                      className={`px-2 py-1 rounded-full text-xs font-medium
                        ${payment.status === 'success'
                          ? 'bg-green-100 text-green-700'
                          : payment.status === 'fail'
                          ? 'bg-red-100 text-red-700'
                          : 'bg-gray-100 text-gray-600'
                        }`}
                    >
                      {payment.status === 'success' ? '완료' : payment.status === 'fail' ? '실패' : '취소'}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>

          {/* 결제 없을 때 빈 상태 */}
          {payments.length === 0 && (
            <div className="text-center py-12 text-muted-foreground text-sm">
              결제 내역이 없습니다.
            </div>
          )}
        </div>
      </main>
    </div>
  )
}