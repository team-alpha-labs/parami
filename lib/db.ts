import mysql from 'mysql2/promise'

// TODO: mysql2 설치 필요 — npm install mysql2
// TODO: .env.local에 DB_HOST, DB_PORT, DB_USER, DB_PASSWORD, DB_NAME 설정 필요

const pool = mysql.createPool({
  host: process.env.DB_HOST,
  port: Number(process.env.DB_PORT) || 3306,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME,
  // PR #19 컨벤션: 모든 DATETIME 컬럼은 UTC로 저장.
  // mysql2가 환경(로컬 KST vs Cloud Run UTC)별로 다르게 해석하지 않도록 UTC 고정.
  timezone: 'Z',
})

export default pool
