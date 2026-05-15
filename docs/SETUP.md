# 로컬 환경 세팅 가이드 (Windows)

---

## 1. 레포 클론 + 패키지 설치

```bash
git clone https://github.com/team-alpha-labs/parami.git
cd parami
npm install
```

---

## 2. MySQL 설치

1. https://dev.mysql.com/downloads/installer/ → **mysql-installer-community** (565MB) 다운로드
2. 설치 시:
   - Setup Type: **Full**
   - root 비밀번호 설정 (잊지 말 것!)
   - 나머지는 전부 기본값
3. MySQL Workbench도 같이 설치됨

---

## 3. DB + 스키마 생성

1. **MySQL Workbench** 실행
2. `Local instance MySQL80` 클릭 → root 비밀번호 입력
3. **File → New Query Tab**
4. 아래 SQL 붙여넣고 ⚡ 실행:
   ```sql
   CREATE DATABASE parami;
   USE parami;
   ```
5. `db/schema.sql` 내용 전체 복사 → 쿼리창에 붙여넣기 → ⚡ 실행
6. 좌측 SCHEMAS 새로고침 → `parami` 펼치면 8개 테이블 보임

> **이미 DB가 만들어진 상태로 최신 main을 받았다면 — 마이그레이션 적용 필요**
> `db/schema.sql`은 신규 셋업용. 기존 DB는 추가 변경을 `db/migrations/` 폴더의 SQL 파일들로 순서대로 적용.
>
> ```sql
> -- MySQL Workbench 또는 mysql CLI에서 순서대로 실행
> -- (이미 적용한 마이그레이션은 ALTER 에러 나므로 스킵)
> SOURCE db/migrations/001_subscriptions_add_pending_tier.sql;
> SOURCE db/migrations/002_subscriptions_status_add_expired.sql;
> ```
>
> 새 마이그레이션 파일이 추가되면 번호 순서대로 적용. 적용 이력은 팀 채팅/PR 본문에서 확인.

---

## 4. `.env.local` 작성

1. 프로젝트 루트에 `.env.local` 파일 생성
2. `.env.local.example` 내용 복사해서 채우기
3. **DB_PASSWORD는 본인 MySQL 비번** (각자 다름)
4. **나머지 키들은 팀 비공개 채팅에서 받은 값** 사용

### JWT_SECRET / SCHEDULER_SECRET 만들기 (PowerShell)

```powershell
[Convert]::ToBase64String([byte[]](1..32 | %{Get-Random -Max 256}))
```

---

## 5. 실행

```bash
npm run dev
```

http://localhost:3000 → 페이지 보이면 성공.

DB + API 확인: http://localhost:3000/api/weather/test 접속해서 JSON 응답 확인.

---

## 안 될 때

| 증상 | 해결 |
| --- | --- |
| `.env.local` 수정해도 그대로 | dev 서버 재시작 (`Ctrl+C` → `npm run dev`) |
| MySQL 연결 거부 | 작업관리자에서 `MySQL80` 서비스 실행 중인지 확인 |
| `Access denied` | DB_PASSWORD 오타 확인 |
| `mysql2` 모듈 없음 | `npm install` 다시 실행 |
| 외부 API `Unauthorized` | `docs/API.md` 참고 |
