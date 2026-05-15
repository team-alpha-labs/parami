-- 001_subscriptions_add_pending_tier.sql
-- 작성일: 2026.05.14
-- 작업자: 백2 (소라)
-- 관련 PR: feature/sorah-payments-writes (PR-2)
--
-- 변경 내용:
--   subscriptions 테이블에 pending_tier 컬럼 추가
--   티어 변경 요청 시 즉시 적용 X, 다음 결제 시점에 반영하기 위함
--   (PATCH /api/subscriptions/change-tier에서 저장 →
--    POST /api/payments/confirm 시 tier로 적용 + NULL로 리셋)
--
-- 적용 방법:
--   mysql -u <user> -p <database> < db/migrations/001_subscriptions_add_pending_tier.sql
--   또는 MySQL Workbench에서 파일 내용 실행

ALTER TABLE subscriptions
  ADD COLUMN pending_tier ENUM('basic','standard','premium') NULL AFTER cancelled_at;
