-- PARAMI 날씨 기반 자동 보상 플랫폼 DB 스키마
-- 작성일: 2026.05.11

CREATE TABLE users (
  id         INT          NOT NULL AUTO_INCREMENT,
  email      VARCHAR(100) NOT NULL,
  name       VARCHAR(50)  NOT NULL,
  role       ENUM('user','admin') NOT NULL DEFAULT 'user',
  balance    INT          NOT NULL DEFAULT 0,
  created_at DATETIME     NOT NULL DEFAULT NOW(),
  -- soft delete: 탈퇴 시 deleted_at = UTC_TIMESTAMP() + email/name 익명화
  -- 모든 조회 함수는 WHERE deleted_at IS NULL 필터 필수
  deleted_at DATETIME     NULL,
  PRIMARY KEY (id),
  UNIQUE KEY uq_email (email)
);

CREATE TABLE user_accounts (
  id          INT          NOT NULL AUTO_INCREMENT,
  user_id     INT          NOT NULL,
  -- MVP는 자체 이메일 로그인만 지원
  provider    ENUM('local') NOT NULL DEFAULT 'local',
  password    VARCHAR(255) NULL,
  created_at  DATETIME     NOT NULL DEFAULT NOW(),
  PRIMARY KEY (id),
  FOREIGN KEY (user_id) REFERENCES users(id)
);

-- plans: 구독 가격표 (basic/standard/premium 3티어)
-- subscriptions.tier ENUM과 동일 값 사용해 일관성 유지
CREATE TABLE plans (
  id          INT          NOT NULL AUTO_INCREMENT,
  tier        ENUM('basic','standard','premium') NOT NULL,
  name        VARCHAR(50)  NOT NULL,
  price       INT          NOT NULL,
  description VARCHAR(255) NULL,
  PRIMARY KEY (id),
  UNIQUE KEY uq_tier (tier)
);

INSERT INTO plans (tier, name, price, description) VALUES
  ('basic',    '베이직',    7400,  '월 9,000원 보상금'),
  ('standard', '스탠다드',  12700, '월 16,000원 보상금'),
  ('premium',  '프리미엄',  20600, '월 26,000원 보상금');

CREATE TABLE subscriptions (
  id              INT      NOT NULL AUTO_INCREMENT,
  user_id         INT      NOT NULL,
  tier            ENUM('basic','standard','premium') NOT NULL,
  -- expired: next_billing_at 지나도 결제 안 한 경우 스케줄러가 자동 전환
  -- cancelled: 사용자 본인 의지로 해지
  status          ENUM('active','cancelled','expired') NOT NULL DEFAULT 'active',
  next_billing_at DATETIME NULL,
  started_at      DATETIME NOT NULL DEFAULT NOW(),
  cancelled_at    DATETIME NULL,
  -- pending_tier: 티어 변경 요청 시 예약된 새 티어 저장
  -- 다음 결제(/api/payments/confirm) 시점에 tier로 적용 + pending_tier는 NULL로 리셋
  pending_tier    ENUM('basic','standard','premium') NULL,
  PRIMARY KEY (id),
  FOREIGN KEY (user_id) REFERENCES users(id)
);

CREATE TABLE payments (
  id               INT          NOT NULL AUTO_INCREMENT,
  user_id          INT          NOT NULL,
  subscription_id  INT          NOT NULL,
  amount           INT          NOT NULL,
  method           VARCHAR(50)  NOT NULL DEFAULT 'toss',
  status           ENUM('success','fail','cancelled') NOT NULL,
  toss_order_id    VARCHAR(100) NOT NULL,
  toss_payment_key VARCHAR(200) NULL,
  billing_year     SMALLINT     NULL,
  billing_month    TINYINT      NULL,
  paid_at          DATETIME     NOT NULL DEFAULT NOW(),
  PRIMARY KEY (id),
  UNIQUE KEY uq_toss_order (toss_order_id),
  FOREIGN KEY (user_id) REFERENCES users(id),
  FOREIGN KEY (subscription_id) REFERENCES subscriptions(id)
);

CREATE TABLE weather_logs (
  id          INT          NOT NULL AUTO_INCREMENT,
  measured_at DATETIME     NOT NULL,
  location    VARCHAR(50)  NOT NULL DEFAULT 'seoul',
  rain_mm     FLOAT        NULL,
  temp_c      FLOAT        NULL,
  wind_ms     FLOAT        NULL,
  snow        TINYINT(1)   NULL,
  pm25        FLOAT        NULL,
  pm10        FLOAT        NULL,
  source      VARCHAR(50)  NOT NULL DEFAULT 'kma',
  raw_payload JSON         NULL,
  PRIMARY KEY (id),
  KEY idx_measured_at (measured_at),
  KEY idx_location_measured_at (location, measured_at)
);

CREATE TABLE trigger_logs (
  id              INT      NOT NULL AUTO_INCREMENT,
  weather_log_id  INT      NOT NULL,
  trigger_type    ENUM('rain','heat','cold','snow','dust','good_weather') NOT NULL,
  triggered_at    DATETIME NOT NULL,
  triggered_date  DATE     NOT NULL,
  PRIMARY KEY (id),
  UNIQUE KEY uq_trigger_date (trigger_type, triggered_date),
  FOREIGN KEY (weather_log_id) REFERENCES weather_logs(id)
);

CREATE TABLE reward_logs (
  id             INT      NOT NULL AUTO_INCREMENT,
  user_id        INT      NOT NULL,
  trigger_log_id INT      NOT NULL,
  amount         INT      NOT NULL,
  tier_at_reward ENUM('basic','standard','premium') NOT NULL,
  reward_year    SMALLINT NOT NULL,
  reward_month   TINYINT  NOT NULL,
  rewarded_at    DATETIME NOT NULL DEFAULT NOW(),
  PRIMARY KEY (id),
  UNIQUE KEY uq_user_trigger (user_id, trigger_log_id),
  KEY idx_user_reward_month (user_id, reward_year, reward_month),
  FOREIGN KEY (user_id) REFERENCES users(id),
  FOREIGN KEY (trigger_log_id) REFERENCES trigger_logs(id)
);

-- 포인트 출금 audit log
-- MVP는 실제 송금 미구현 — users.balance 차감과 함께 기록만 남김 (관리자 조회용)
CREATE TABLE withdrawal_logs (
  id           INT      NOT NULL AUTO_INCREMENT,
  user_id      INT      NOT NULL,
  amount       INT      NOT NULL,
  withdrawn_at DATETIME NOT NULL DEFAULT NOW(),
  PRIMARY KEY (id),
  KEY idx_user_withdrawn (user_id, withdrawn_at),
  FOREIGN KEY (user_id) REFERENCES users(id)
);
