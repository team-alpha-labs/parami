// 토스페이먼츠 외부 API 호출 헬퍼 모음
// confirm은 route에 인라인 (기존 코드 유지), cancel은 별도 함수로 분리
//
// Basic Auth: base64(SECRET_KEY + ":") — RFC 7617 표준
// 토스 인증 방식: 시크릿키 뒤에 ":" 붙이고 base64 인코딩 (비밀번호 비어있음)

const TOSS_CANCEL_URL_BASE = 'https://api.tosspayments.com/v1/payments'

// 토스에 결제 취소(환불) 요청
// 호출 시점: 토스 confirm 성공했으나 우리 DB 처리 실패 → 사용자 돈 보호 위해 자동 환불
// 토스 API: POST /v1/payments/{paymentKey}/cancel
//   body: { cancelReason: "취소 사유" }
//
// 성공 시: 토스가 결제 취소 처리, 사용자 카드로 환불 진행
// 실패 시 throw — 호출자(route)가 운영자 알림 처리 권장
export async function cancelTossPayment(
  paymentKey: string,
  cancelReason: string
): Promise<void> {
  const tossSecret = process.env.TOSS_SECRET_KEY
  if (!tossSecret) {
    throw new Error('TOSS_SECRET_KEY 환경변수 누락')
  }

  // Basic Auth 헤더 생성 (confirm과 동일 패턴)
  const authHeader = 'Basic ' + Buffer.from(tossSecret + ':').toString('base64')

  const res = await fetch(`${TOSS_CANCEL_URL_BASE}/${paymentKey}/cancel`, {
    method: 'POST',
    headers: {
      Authorization: authHeader,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ cancelReason }),
  })

  // 200 외 응답은 환불 실패 — 운영자 수동 처리 필요
  // (이미 환불 처리된 결제를 또 취소하면 토스가 거부, 그것도 에러로 던짐)
  if (!res.ok) {
    const errorBody = await res.json().catch(() => ({}))
    throw new Error(
      `Toss cancel API 실패: status=${res.status}, body=${JSON.stringify(errorBody)}`
    )
  }
}
