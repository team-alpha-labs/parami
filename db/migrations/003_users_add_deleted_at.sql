-- 003_users_add_deleted_at.sql
-- 작성일: 2026.05.18
-- 작업자: 백1 (우석)
-- 관련 PR: feat/woosuk-soft-delete-withdraw
--
-- 변경 내용:
--   users 테이블에 deleted_at 컬럼 추가
--   회원 탈퇴 시 hard delete → soft delete + 익명화로 전환
--     · users 행: UPDATE deleted_at, email='deleted_<id>@deleted', name='(탈퇴한 회원)'
--     · subscriptions/payments/reward_logs: 그대로 보존 (회계/통계 정합)
--     · user_accounts: 삭제 (로그인 정보, 비즈니스 데이터 아님)
--   조회 함수들은 모두 WHERE deleted_at IS NULL 필터 추가
--
-- 적용 방법:
--   mysql -h <host> -u <user> -p <database> < db/migrations/003_users_add_deleted_at.sql

ALTER TABLE users
  ADD COLUMN deleted_at DATETIME NULL AFTER created_at;
