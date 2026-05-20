-- 006: user_accounts에서 OAuth(kakao/google) 흔적 제거
-- 배경: MVP는 자체 이메일 로그인만 지원. OAuth 콜백/헬퍼/UI가 모두 미구현인데
-- ENUM과 provider_id 컬럼만 남아있어 신규 합류자가 "구현된 줄 알고 헷갈리는" 이슈.
-- 발표 직전 정리. 실 DB 확인 결과 provider != 'local' 행 0건 — 데이터 손실 없음.
--
-- 변경:
--   1) uq_provider UNIQUE 제거 (provider_id 컬럼에 의존)
--   2) provider_id 컬럼 제거
--   3) provider ENUM 축소: 'local','kakao','google' → 'local' (+DEFAULT 'local')
--
-- 적용 전 데이터 검증 (운영 적용 시 필수):
--   SELECT provider, COUNT(*) FROM user_accounts GROUP BY provider;
--   → 'local' 외 행이 있으면 이 마이그레이션 적용 금지 (먼저 해당 행 처리)

ALTER TABLE user_accounts
  DROP INDEX uq_provider,
  DROP COLUMN provider_id,
  MODIFY COLUMN provider ENUM('local') NOT NULL DEFAULT 'local';
