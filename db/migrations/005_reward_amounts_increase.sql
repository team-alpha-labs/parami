-- 005_reward_amounts_increase.sql
-- 작성일: 2026.05.19
-- 작업자: 백1 (우석)
-- 관련 PR: feat/woosuk-reward-amount-increase
--
-- 변경 내용:
--   회당 보상금 인상 정책 — 과거 지급분까지 소급 적용 (backfill)
--     basic    800  → 900
--     standard 1400 → 1600
--     premium  2300 → 2600
--   월 캡(10회)·구독료(plans.price)는 그대로 유지.
--
--   1) plans.description 갱신 — 월 보상금 표시 (8,000/14,000/23,000 → 9,000/16,000/26,000)
--   2) reward_logs.amount를 tier_at_reward 기준으로 일괄 갱신
--   3) users.balance 재계산 = SUM(reward_logs.amount) - SUM(withdrawal_logs.amount)
--
-- ⚠️ 적용 전 백업 권장:
--   mysqldump -h <host> -u <user> -p <db> users reward_logs withdrawal_logs plans \
--     > backup_before_005.sql
--
-- 적용 방법:
--   mysql -h <host> -u <user> -p <database> < db/migrations/005_reward_amounts_increase.sql
--
-- 검증 (적용 후):
--   SELECT id, email, balance FROM users WHERE balance < 0;
--     → 결과 비어 있으면 정상. 행 있으면 마이너스 잔액 케이스 별도 결정 필요.

START TRANSACTION;

-- 1) plans description 갱신
UPDATE plans SET description = '월 9,000원 보상금'  WHERE tier = 'basic';
UPDATE plans SET description = '월 16,000원 보상금' WHERE tier = 'standard';
UPDATE plans SET description = '월 26,000원 보상금' WHERE tier = 'premium';

-- 2) 과거 reward_logs 일괄 갱신 (backfill)
--    tier_at_reward는 지급 당시 스냅샷이므로 이걸 기준으로 재계산해야 정합
UPDATE reward_logs SET amount = CASE tier_at_reward
  WHEN 'basic'    THEN 900
  WHEN 'standard' THEN 1600
  WHEN 'premium'  THEN 2600
END;

-- 3) users.balance 재계산
--    출금 이력이 있는 유저 포함 — reward 합계에서 withdrawal 합계 차감
UPDATE users u
SET balance = (
  SELECT COALESCE(SUM(amount), 0) FROM reward_logs WHERE user_id = u.id
) - (
  SELECT COALESCE(SUM(amount), 0) FROM withdrawal_logs WHERE user_id = u.id
);

COMMIT;
