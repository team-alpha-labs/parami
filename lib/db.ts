import mysql from 'mysql2/promise'

// Cloud Run + Cloud SQL은 Unix socket(Cloud SQL Auth Proxy)이 GCP 표준.
// DB_SOCKET_PATH 있으면 socket, 없으면 TCP host/port로 폴백 (로컬 dev).
//
// 시각 처리 (PR #19 컨벤션): 모든 DATETIME 컬럼은 UTC 저장.
// timezone: 'Z'로 고정해 환경(로컬 KST vs Cloud Run UTC)별 해석 차이 차단.

const common = {
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME,
  timezone: 'Z',
}

const pool = mysql.createPool(
  process.env.DB_SOCKET_PATH
    ? {
        socketPath: process.env.DB_SOCKET_PATH,
        ...common,
      }
    : {
        host: process.env.DB_HOST,
        port: Number(process.env.DB_PORT) || 3306,
        ...common,
      },
)

export default pool
