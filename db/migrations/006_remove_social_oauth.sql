-- 006_remove_social_oauth.sql
-- 작성일: 2026.05.20
-- 작업자: 백3 (영현)
--
-- 변경 내용:
--   카카오/구글 소셜 로그인 미지원 결정 → user_accounts에서 OAuth 관련 컬럼/ENUM 정리
--   1) UNIQUE KEY uq_provider (provider, provider_id) 제거 (provider_id 삭제 전제)
--   2) provider_id 컬럼 드롭 (local 계정은 사용 안 함)
--   3) provider ENUM 좁히기: ('local','kakao','google') → ('local')
--
-- 사전 조건:
--   user_accounts 테이블에 provider='kakao' 또는 'google' 행이 없어야 함.
--   (운영 DB 확인: 2026-05-20 시점 9건 모두 'local')
--
-- 적용 방법:
--   mysql -h <host> -u <user> -p <database> < db/migrations/006_remove_social_oauth.sql

ALTER TABLE user_accounts
  DROP INDEX uq_provider,
  DROP COLUMN provider_id,
  MODIFY COLUMN provider ENUM('local') NOT NULL;
