-- 002_subscriptions_status_add_expired.sql
-- 작성일: 2026.05.15
-- 작업자: 백2 (소라)
-- 관련 PR: feature/sorah-payments-writes (PR-2)
--
-- 변경 내용:
--   subscriptions.status ENUM에 'expired' 값 추가
--   - cancelled: 사용자 본인 의지로 해지
--   - expired: next_billing_at 지나도 결제 안 한 경우 스케줄러가 자동 전환
--   (POST /api/scheduler/expire-subscriptions가 매일 호출되어 처리)
--
-- 적용 방법:
--   mysql -u <user> -p <database> < db/migrations/002_subscriptions_status_add_expired.sql
--   또는 MySQL Workbench에서 파일 내용 실행

ALTER TABLE subscriptions
  MODIFY COLUMN status ENUM('active','cancelled','expired') NOT NULL DEFAULT 'active';
