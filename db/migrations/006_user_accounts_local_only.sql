-- 006: user_accounts를 자체 이메일 로그인 전용 구조로 정리
-- 배경: MVP는 자체 이메일 로그인만 지원한다. 구현되지 않은 계정 연결 구조를
-- 스키마에서 제거해 실제 기능 범위와 DB 구조를 일치시킨다.
-- 발표 직전 정리. 실 DB 확인 결과 provider != 'local' 행 0건 — 데이터 손실 없음.
--
-- 변경:
--   1) 계정 연결용 UNIQUE 제거
--   2) 외부 계정 식별자 컬럼 제거
--   3) provider ENUM을 'local' 전용으로 축소 (+DEFAULT 'local')
--
-- 적용 전 데이터 검증 (운영 적용 시 필수):
--   SELECT provider, COUNT(*) FROM user_accounts GROUP BY provider;
--   → 'local' 외 행이 있으면 이 마이그레이션 적용 금지 (먼저 해당 행 처리)

ALTER TABLE user_accounts
  DROP INDEX uq_provider,
  DROP COLUMN provider_id,
  MODIFY COLUMN provider ENUM('local') NOT NULL DEFAULT 'local';
