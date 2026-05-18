// 공통 푸터 — 모든 페이지 하단에 동일하게 표시
// 약관/정책 링크는 페이지 미구현으로 임시 제거 (해당 페이지 작성 시 다시 추가)
// 디자인: 좌측 사업자 정보, 우측 Parami 로고

import Link from 'next/link'

export function Footer() {
  return (
    <footer className="border-t bg-muted/30">
      <div className="mx-auto max-w-7xl px-6 py-8">
        <div className="flex flex-col gap-6 sm:flex-row sm:items-start sm:justify-between">
          <div className="space-y-0.5 text-xs text-muted-foreground">
            <p>상호: Parami | 대표: 정우석 | 사업자등록번호: 000-00-00000</p>
            <p>통신판매업 신고번호: 제 0000-서울중구-0000 호</p>
            <p>보험대리점 등록번호: 제 0000-000 호 | 주소: 서울특별시 중구 중림동 441</p>
            <p>고객센터: support@parami.kr | 운영: 평일 09:00~18:00</p>
          </div>
          <Link href="/" className="flex shrink-0 items-center gap-2">
            <span className="text-lg font-bold text-primary">Parami</span>
          </Link>
        </div>
      </div>
    </footer>
  )
}
