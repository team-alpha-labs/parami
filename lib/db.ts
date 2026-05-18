import mysql from 'mysql2/promise'

// TODO: mysql2 설치 필요 — npm install mysql2
// TODO: .env.local에 DB_HOST, DB_PORT, DB_USER, DB_PASSWORD, DB_NAME 설정 필요

// Cloud Run + Cloud SQL은 Unix socket(Cloud SQL Auth Proxy)이 GCP 표준.
// DB_SOCKET_PATH 있으면 socket, 없으면 TCP host/port로 폴백 (로컬 dev).
const pool = mysql.createPool(
  process.env.DB_SOCKET_PATH
    ? {
        socketPath: process.env.DB_SOCKET_PATH,
        user: process.env.DB_USER,
        password: process.env.DB_PASSWORD,
        database: process.env.DB_NAME,
      }
    : {
        host: process.env.DB_HOST,
        port: Number(process.env.DB_PORT) || 3306,
        user: process.env.DB_USER,
        password: process.env.DB_PASSWORD,
        database: process.env.DB_NAME,
      },
)

export default pool
