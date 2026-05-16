// DB sanity check — schema.sql / 마이그레이션과 실제 DB 동기화 확인
// 실행: npm run check-db
// .env.local의 DB_* 환경변수로 접속, SELECT만 수행 (읽기 전용)
//
// 출력:
//   - 8개 테이블 존재 여부
//   - subscriptions의 pending_tier / status ENUM 마이그레이션 반영 여부
//   - plans 시드 3행 여부
//   - 테이블별 row 수
//   - admin 계정 존재 여부

import mysql from 'mysql2/promise'
import { readFileSync } from 'node:fs'

const envText = readFileSync('.env.local', 'utf8')
const env = Object.fromEntries(
  envText
    .split('\n')
    .map((l) => l.trim())
    .filter((l) => l && !l.startsWith('#'))
    .map((l) => {
      const i = l.indexOf('=')
      return [l.slice(0, i), l.slice(i + 1).replace(/^["']|["']$/g, '')]
    }),
)

const pool = await mysql.createPool({
  host: env.DB_HOST,
  port: Number(env.DB_PORT || 3306),
  user: env.DB_USER,
  password: env.DB_PASSWORD,
  database: env.DB_NAME,
})

const EXPECTED_TABLES = [
  'users',
  'user_accounts',
  'plans',
  'subscriptions',
  'payments',
  'weather_logs',
  'trigger_logs',
  'reward_logs',
]

async function main() {
  // 1) 테이블 목록
  const [tables] = await pool.query('SHOW TABLES')
  const tableNames = tables.map((r) => Object.values(r)[0])
  console.log('=== TABLES ===')
  for (const t of EXPECTED_TABLES) {
    console.log(`  ${tableNames.includes(t) ? 'OK' : 'MISSING'}: ${t}`)
  }
  const extras = tableNames.filter((t) => !EXPECTED_TABLES.includes(t))
  if (extras.length) console.log('  EXTRA:', extras.join(', '))

  // 2) subscriptions 컬럼/ENUM 검증 (마이그레이션 001/002 반영 여부)
  console.log('\n=== subscriptions schema ===')
  const [cols] = await pool.query('SHOW COLUMNS FROM subscriptions')
  const hasPending = cols.find((c) => c.Field === 'pending_tier')
  const statusCol = cols.find((c) => c.Field === 'status')
  console.log(`  pending_tier 컬럼: ${hasPending ? 'OK (' + hasPending.Type + ')' : 'MISSING (mig 001 미적용)'}`)
  console.log(`  status ENUM: ${statusCol?.Type}`)
  console.log(
    `  → expired 포함: ${statusCol?.Type?.includes('expired') ? 'OK' : 'MISSING (mig 002 미적용)'}`,
  )

  // 3) plans 시드 데이터
  console.log('\n=== plans seed ===')
  const [plans] = await pool.query('SELECT tier, name, price FROM plans ORDER BY price')
  for (const p of plans) console.log(`  ${p.tier.padEnd(9)} ${p.name} - ${p.price}원`)
  if (plans.length !== 3) console.log(`  ⚠️ 예상 3행, 실제 ${plans.length}행`)

  // 4) 데이터 카운트
  console.log('\n=== row counts ===')
  for (const t of EXPECTED_TABLES) {
    if (!tableNames.includes(t)) continue
    const [r] = await pool.query(`SELECT COUNT(*) AS c FROM \`${t}\``)
    console.log(`  ${t.padEnd(15)} ${r[0].c}`)
  }

  // 5) admin 계정 존재 여부
  console.log('\n=== admin accounts ===')
  const [admins] = await pool.query(
    "SELECT id, email, name FROM users WHERE role='admin'",
  )
  if (admins.length === 0) console.log('  ⚠️ admin 계정 없음')
  else for (const a of admins) console.log(`  id=${a.id} ${a.email} (${a.name})`)
}

main()
  .catch((e) => {
    console.error('ERROR:', e.message)
    process.exit(1)
  })
  .finally(() => pool.end())
