-- 004_create_withdrawal_logs.sql
-- 작성일: 2026.05.19
-- 작업자: 백1 (우석) — PR #74 영현 작업 보강
-- 관련 PR: feature/pih78-withdraw
--
-- 변경 내용:
--   withdrawal_logs 테이블 신규 생성
--   포인트 출금 시 users.balance 차감과 함께 INSERT (동일 트랜잭션) →
--   관리자 화면/분쟁 대응을 위한 audit log 확보
--   ※ MVP는 실제 송금(계좌이체) 미구현 — balance 차감만. 그래도 기록은 필수.
--
-- 적용 방법:
--   mysql -h <host> -u <user> -p <database> < db/migrations/004_create_withdrawal_logs.sql

CREATE TABLE withdrawal_logs (
  id           INT      NOT NULL AUTO_INCREMENT,
  user_id      INT      NOT NULL,
  amount       INT      NOT NULL,
  withdrawn_at DATETIME NOT NULL DEFAULT NOW(),
  PRIMARY KEY (id),
  KEY idx_user_withdrawn (user_id, withdrawn_at),
  FOREIGN KEY (user_id) REFERENCES users(id)
);
