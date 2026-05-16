@AGENTS.md
# CLAUDE.md

Behavioral guidelines to reduce common LLM coding mistakes.
Merged with Parami project-specific instructions.

**Tradeoff:** These guidelines bias toward caution over speed. For trivial tasks, use judgment.

---

## 1. Think Before Coding

**Don't assume. Don't hide confusion. Surface tradeoffs.**

Before implementing:

- State your assumptions explicitly. If uncertain, ask.
- If multiple interpretations exist, present them - don't pick silently.
- If a simpler approach exists, say so. Push back when warranted.
- If something is unclear, stop. Name what's confusing. Ask.

## 2. Simplicity First

**Minimum code that solves the problem. Nothing speculative.**

- No features beyond what was asked.
- No abstractions for single-use code.
- No "flexibility" or "configurability" that wasn't requested.
- No error handling for impossible scenarios.
- If you write 200 lines and it could be 50, rewrite it.

Ask yourself: "Would a senior engineer say this is overcomplicated?" If yes, simplify.

## 3. Surgical Changes

**Touch only what you must. Clean up only your own mess.**

When editing existing code:

- Don't "improve" adjacent code, comments, or formatting.
- Don't refactor things that aren't broken.
- Match existing style, even if you'd do it differently.
- If you notice unrelated dead code, mention it - don't delete it.

When your changes create orphans:

- Remove imports/variables/functions that YOUR changes made unused.
- Don't remove pre-existing dead code unless asked.

The test: Every changed line should trace directly to the user's request.

## 4. Goal-Driven Execution

**Define success criteria. Loop until verified.**

Transform tasks into verifiable goals:

- "Add validation" → "Write tests for invalid inputs, then make them pass"
- "Fix the bug" → "Write a test that reproduces it, then make it pass"
- "Refactor X" → "Ensure tests pass before and after"

For multi-step tasks, state a brief plan:

```
1. [Step] → verify: [check]
2. [Step] → verify: [check]
3. [Step] → verify: [check]
```

---

## 5. Parami Project Guidelines

### 기술 스택

| 항목 | 내용 |
| --- | --- |
| Frontend / Backend | Next.js (App Router) |
| DB | MySQL + mysql2 |
| 배포 | GCP |
| 결제 | 토스페이먼츠 단건 결제 (월 단위 구독 형태로 운영, 자동 갱신 X) |
| 로그인 | 자체 JWT (소셜 로그인은 추후 추가) |
| 스케줄러 | GCP Cloud Scheduler + Next.js API Route |
| 스타일 | Tailwind CSS |

---

### 폴더 구조

```
parami/
├── app/
│   ├── (auth)/               # 로그인 / 회원가입 페이지
│   ├── (consumer)/           # 소비자 페이지 (메인, 상품, 대시보드, 보상내역)
│   ├── (admin)/              # 관리자 페이지
│   └── api/
│       ├── auth/             # 회원가입 / 로그인 / 로그아웃
│       ├── plans/            # 티어 목록 조회
│       ├── subscriptions/    # 구독 상태 조회 / 해지 / 티어 변경
│       ├── payments/         # 결제 처리 (토스페이먼츠)
│       ├── weather/          # 현재 날씨 조회
│       ├── rewards/          # 보상 내역 조회
│       ├── scheduler/        # Cloud Scheduler 수신 엔드포인트
│       └── admin/            # 관리자 조회
├── components/               # 공통 컴포넌트
├── lib/
│   ├── db.ts                 # MySQL 연결 (mysql2/promise pool)
│   ├── auth.ts               # JWT 유틸 (sign / verify / getSession / requireUser / requireAdmin)
│   ├── oauth.ts              # 카카오 / 구글 OAuth 헬퍼 (스캐폴드, 키 설정 후 활성화)
│   ├── weather.ts            # 기상청 + 에어코리아 API 호출·파싱 (fetchWeatherSnapshot)
│   ├── conditions.ts         # 트리거 조건값 상수 (하드코딩)
│   ├── plans.ts              # 구독 가격표 DB 조회
│   ├── api.ts                # 응답 헬퍼 ok() / err()
│   └── queries/              # 테이블별 DB 쿼리 함수 분리 (users.ts 등)
├── hooks/                    # Custom Hooks
├── types/                    # TypeScript 타입 정의 (db.ts 포함)
├── db/                       # schema.sql, schema.erd.json
└── docs/                     # SETUP.md, API.md, proposal.md 등 운영 문서
```

---

### API 목록

```
[ 인증 ]  ✅ 구현됨
POST   /api/auth/signup           # 회원가입
POST   /api/auth/login            # 로그인
POST   /api/auth/logout           # 로그아웃
GET    /api/auth/me               # 내 정보 조회
PATCH  /api/auth/profile          # 내 정보 수정 (이름)
DELETE /api/auth/withdraw         # 회원 탈퇴 (cascade)

[ OAuth 콜백 ]  ⏳ 추후 (라우트 스캐폴드만 있고 키 미설정)
GET    /api/auth/kakao/callback
GET    /api/auth/google/callback

[ 결제/구독 ]
GET   /api/plans                       # 티어 목록 조회                ✅ 구현됨
POST  /api/payments/confirm            # 토스 결제 승인 + 구독 생성    ✅ 구현됨
GET   /api/payments/me                 # 내 결제 내역                  ✅ 구현됨
GET   /api/subscriptions/me            # 내 구독 상태 조회             ✅ 구현됨
PATCH /api/subscriptions/change-tier   # 티어 변경                     ✅ 구현됨
PATCH /api/subscriptions/cancel        # 구독 해지                     ✅ 구현됨

[ 날씨/보상 ]
GET /api/weather/current        # 현재 날씨 조회                       ✅ 구현됨
GET /api/rewards/me             # 내 보상 내역                         ✅ 구현됨
GET /api/rewards/summary        # 내 누적 보상 요약                    ✅ 구현됨

[ 스케줄러 ]  ✅ 구현됨
POST /api/scheduler/weather-check         # Cloud Scheduler → 날씨 수집 → 트리거 → 보상
POST /api/scheduler/expire-subscriptions  # 만료된 구독 자동 처리 (status=expired)

[ 관리자 ]
GET /api/admin/users            # 유저 목록                            ✅ 구현됨
GET /api/admin/subscriptions    # 구독 현황                            ✅ 구현됨
GET /api/admin/payments         # 결제 내역                            ✅ 구현됨
GET /api/admin/triggers         # 트리거 발동 내역                     ✅ 구현됨
GET /api/admin/rewards          # 보상 지급 내역                       ✅ 구현됨
```

---

### 역할 분담

| 담당 | 이름 | 기능 |
| --- | --- | --- |
| 백1 (팀장) | 우석 | 스케줄러 + 트리거 + 보상 지급 + 관리자 조회 API |
| 백2 | 소라 | 결제 + 구독 + 보상 조회 |
| 백3 | 영현 | 인증 (자체 + OAuth) |
| 프1 | (미정) | 소비자 페이지 전체 |
| 프2 | (미정) | 관리자 페이지 |

---

### 트리거 조건 (하드코딩, lib/conditions.ts)

```tsx
// 악조건 (연중)
export const TRIGGER_CONDITIONS = {
  rain: 3,      // 강수량 3mm 이상
  heat: 33,     // 기온 33도 이상
  cold: -12,    // 기온 -12도 이하
  dust: 50,     // PM2.5 50 이상
  // snow: 초단기실황(getUltraSrtNcst) PTY ∈ {2, 3, 6, 7} 로 판정
  // (PTY=4는 초단기예보에만 존재, 실황에는 없음)
}

// 긍정조건 good_weather (봄가을 전용)
export const GOOD_WEATHER_CONDITIONS = {
  rain_max: 1,    // 강수량 1mm 이하
  dust_max: 30,   // PM2.5 30 이하
  wind_max: 5,    // 풍속 5m/s 이하
  months: [4, 5, 6, 9, 10, 11],  // 적용 월
}

// 월 보상 캡
export const MAX_REWARD_PER_MONTH = 10
```

---

### 주요 DB 테이블 요약

```
users              # 회원 (balance 컬럼으로 포인트 관리)
user_accounts      # 로그인 방식 (local / kakao / google)
plans              # 구독 가격표 (basic / standard / premium, 가격·설명)
subscriptions      # 구독 (1인 1active, 현재 티어 및 구독 상태 관리)
payments           # 결제 내역 (toss_payment_key NULL 허용)
weather_logs       # 날씨 API 수신 기록 (매 시간 누적, 중복 체크 없음)
trigger_logs       # 트리거 발동 기록 (하루 1회 UNIQUE)
reward_logs        # 보상 지급 내역
```

**확장 예정 테이블 (MVP 제외)**

```
events             # 이벤트
predictions        # 이벤트 예측 참여
```

**핵심 제약조건**

- `trigger_logs`: UNIQUE(trigger_type, triggered_date) — 동일 조건 하루 1회
- `reward_logs`: UNIQUE(user_id, trigger_log_id) — 날씨 보상 중복 지급 방지
- 월 10회 캡: reward_year + reward_month + user_id 기준 KST
- ※ MySQL은 NULL을 UNIQUE 체크에서 무시하므로 앱 레벨 SELECT 중복 체크 필수

**확장 예정 제약조건 (MVP 제외)**

- `reward_logs`: UNIQUE(user_id, event_id) — 이벤트 보상 중복 지급 방지
- `predictions`: UNIQUE(user_id, event_id) — 중복 참여 방지

---

### 스케줄러 흐름 요약

```
Cloud Scheduler (매 시간, KST)
→ POST /api/scheduler/weather-check
→ 날씨 API 파싱 → weather_logs INSERT (매 시간 누적, 중복 체크 없음)
→ 악조건 체크 (rain / heat / cold / snow / dust)
  └ 충족 → UNIQUE(trigger_type, triggered_date) 체크
           └ 중복 → 종료
           └ 신규 → trigger_logs 저장 → 보상 지급 흐름
→ good_weather 체크 (현재 월이 [4,5,6,9,10,11]?)
  └ 해당 월 아님 → 종료
  └ 해당 월 → rain≤1 + pm25≤30 + wind≤5 동시 충족?
               └ NO → 종료
               └ YES → UNIQUE 체크 → trigger_logs 저장
                      → 유저별 월 10회 캡 체크
                      → active 구독 + 최근 결제 success 여부 체크
                      → BEGIN TRANSACTION
                          reward_logs INSERT
                          users.balance = balance + amount
                        COMMIT
                      → 실패 시 ROLLBACK
```

---

### 코딩 컨벤션

**네이밍**

- 컴포넌트: PascalCase (`RewardCard.tsx`)
- 함수 / 변수: camelCase (`getUserRewards`)
- DB 컬럼: snake_case (`reward_logs.rewarded_at`)
- 상수: UPPER_SNAKE_CASE (`MAX_REWARD_PER_MONTH`)

**파일 구조**

- API Route는 `app/api/` 아래 기능별로 분리
- 공통 컴포넌트는 `components/` 에 위치
- DB 쿼리는 `lib/` 안에 함수로 분리, API Route에서 직접 쿼리 작성 금지
- 트리거 조건값은 반드시 `lib/conditions.ts` 에서 import

**API 응답 형식 통일**

```tsx
// 성공
{ success: true, data: ... }

// 실패
{ success: false, error: "에러 메시지" }
```

**환경변수 목록** (`.env.local`)

```
# DB
DB_HOST=
DB_PORT=3306
DB_USER=
DB_PASSWORD=
DB_NAME=

# JWT
JWT_SECRET=

# 카카오 OAuth (추후 사용 — 현재 미설정)
KAKAO_CLIENT_ID=
KAKAO_CLIENT_SECRET=
KAKAO_REDIRECT_URI=http://localhost:3000/api/auth/kakao/callback

# 구글 OAuth (추후 사용 — 현재 미설정)
GOOGLE_CLIENT_ID=
GOOGLE_CLIENT_SECRET=
GOOGLE_REDIRECT_URI=http://localhost:3000/api/auth/google/callback

# 기상청 API
KMA_API_KEY=

# 에어코리아 API
AIRKOREA_API_KEY=

# 토스페이먼츠
TOSS_CLIENT_KEY=
TOSS_SECRET_KEY=

# 스케줄러 보안키
SCHEDULER_SECRET=
```

절대 커밋하지 말 것 (`.gitignore` 확인)

---

### 브랜치 전략 (GitHub Flow)

```
main        # 항상 배포 가능한 상태 유지 (직접 push 금지)
└── feature/이름-기능명   # 기능 개발 브랜치
└── fix/이름-버그명       # 버그 수정 브랜치
└── docs/이름-문서명      # 문서 작업 브랜치
```

**규칙**

- PR은 main으로 올릴 것
- 한 PR = 한 기능 (여러 기능 묶어서 올리지 말 것)
- 최소 1명 리뷰 승인 후 머지
- main 직접 push 금지

**커밋 컨벤션**

```
feat:     새로운 기능
fix:      버그 수정
docs:     문서 수정
refactor: 코드 구조 개선
style:    UI / 스타일 수정
chore:    설정 / 패키지 작업
```

---

## 6. 결과보고서 PPT 체크리스트

제출 전 아래 항목이 모두 PPT에 포함되어 있는지 확인할 것.

### 01. 프로젝트 개요 (5개 항목 필수)

- [ ]  프로젝트 주제 + 선정 배경 + 기획의도
    - 기존 유사 서비스와 차별화된 특화 포인트 명시 필수
- [ ]  프로젝트 내용
    - 구현 내용, 컨셉, 훈련 내용(커리큘럼)과의 연관성 포함
- [ ]  활용 장비 및 재료 (개발환경)
    - Next.js / MySQL / GCP / 토스페이먼츠 / 기상청 API / 에어코리아 API 등
- [ ]  프로젝트 구조 (전체 파이프라인)
    - Cloud Scheduler → API Route → 트리거 → 보상 흐름 도식화
- [ ]  활용방안 및 기대효과
    - 실무 활용 가능성, 비즈니스 관점 제시

### 02. 팀 구성 및 역할

- [ ]  팀원별 역할 및 담당 업무 명시
- [ ]  멘토 지원 내역 간략 기재

### 03. 수행 절차 및 방법

- [ ]  단계별 기간 + 활동 내용 작성
    - 사전 기획 → 화면/기능 설계 → DB 설계 → 백엔드 → 프론트엔드 → 테스트 → 배포

### 04. 수행 경과 (4개 항목)

- [ ]  요구사항 분석 + DB 설계 (ERD, 테이블 설계)
- [ ]  시스템 아키텍처 개요
- [ ]  주요 기능 구현 및 분석 (핵심 코드 포함)
- [ ]  테스트 및 개선 내용
- [ ]  시연 동영상 (5~10분, 100MB 이하)

### 05. 자체 평가 의견

- [ ]  잘한 부분 + 아쉬운 점
- [ ]  프로젝트를 통해 느낀 점 / 성과
- [ ]  완성도 자체 평가 (10점 만점)
- [ ]  추후 개선점