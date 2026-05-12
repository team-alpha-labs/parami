-- TRIGR 날씨 기반 자동 보상 플랫폼 DB 스키마
-- 작성일: 2026.05.11

CREATE TABLE users (
  id         INT          NOT NULL AUTO_INCREMENT,
  email      VARCHAR(100) NOT NULL,
  name       VARCHAR(50)  NOT NULL,
  role       ENUM('user','admin') NOT NULL DEFAULT 'user',
  balance    INT          NOT NULL DEFAULT 0,
  created_at DATETIME     NOT NULL DEFAULT NOW(),
  PRIMARY KEY (id),
  UNIQUE KEY uq_email (email)
);

CREATE TABLE user_accounts (
  id          INT          NOT NULL AUTO_INCREMENT,
  user_id     INT          NOT NULL,
  provider    ENUM('local','kakao','google') NOT NULL,
  provider_id VARCHAR(100) NULL,
  password    VARCHAR(255) NULL,
  created_at  DATETIME     NOT NULL DEFAULT NOW(),
  PRIMARY KEY (id),
  UNIQUE KEY uq_provider (provider, provider_id),
  FOREIGN KEY (user_id) REFERENCES users(id)
);

CREATE TABLE subscriptions (
  id              INT      NOT NULL AUTO_INCREMENT,
  user_id         INT      NOT NULL,
  tier            ENUM('basic','standard','premium') NOT NULL,
  status          ENUM('active','cancelled') NOT NULL DEFAULT 'active',
  next_billing_at DATETIME NULL,
  started_at      DATETIME NOT NULL DEFAULT NOW(),
  cancelled_at    DATETIME NULL,
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
