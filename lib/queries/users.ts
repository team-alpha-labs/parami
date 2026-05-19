import pool from '@/lib/db'
import { ResultSetHeader, RowDataPacket } from 'mysql2'
import { UserAccountRow, UserRow } from '@/types/db'

// 탈퇴 회원(deleted_at IS NOT NULL)은 인증/조회에서 보이지 않게 한다.
// 결제·보상·구독 행은 그대로 보존되어 admin 통계엔 잡힘.

export async function findUserByEmail(email: string): Promise<UserRow | null> {
  const [rows] = await pool.query<RowDataPacket[]>(
    'SELECT id, email, name, role, balance, created_at FROM users WHERE email = ? AND deleted_at IS NULL LIMIT 1',
    [email],
  )
  return (rows[0] as UserRow) ?? null
}

export async function findUserById(id: number): Promise<UserRow | null> {
  const [rows] = await pool.query<RowDataPacket[]>(
    'SELECT id, email, name, role, balance, created_at FROM users WHERE id = ? AND deleted_at IS NULL LIMIT 1',
    [id],
  )
  return (rows[0] as UserRow) ?? null
}

export async function findLocalAccountByUserId(userId: number): Promise<UserAccountRow | null> {
  const [rows] = await pool.query<RowDataPacket[]>(
    "SELECT id, user_id, provider, provider_id, password, created_at FROM user_accounts WHERE user_id = ? AND provider = 'local' LIMIT 1",
    [userId],
  )
  return (rows[0] as UserAccountRow) ?? null
}

export async function findAccountByProvider(
  provider: 'kakao' | 'google',
  providerId: string,
): Promise<UserAccountRow | null> {
  const [rows] = await pool.query<RowDataPacket[]>(
    'SELECT id, user_id, provider, provider_id, password, created_at FROM user_accounts WHERE provider = ? AND provider_id = ? LIMIT 1',
    [provider, providerId],
  )
  return (rows[0] as UserAccountRow) ?? null
}

export async function createLocalUser(email: string, name: string, passwordHash: string): Promise<number> {
  const conn = await pool.getConnection()
  try {
    await conn.beginTransaction()
    const [userResult] = await conn.query<ResultSetHeader>(
      'INSERT INTO users (email, name) VALUES (?, ?)',
      [email, name],
    )
    const userId = userResult.insertId
    await conn.query(
      "INSERT INTO user_accounts (user_id, provider, password) VALUES (?, 'local', ?)",
      [userId, passwordHash],
    )
    await conn.commit()
    return userId
  } catch (e) {
    await conn.rollback()
    throw e
  } finally {
    conn.release()
  }
}

export async function createSocialUser(
  email: string,
  name: string,
  provider: 'kakao' | 'google',
  providerId: string,
): Promise<number> {
  const conn = await pool.getConnection()
  try {
    await conn.beginTransaction()
    const [userResult] = await conn.query<ResultSetHeader>(
      'INSERT INTO users (email, name) VALUES (?, ?)',
      [email, name],
    )
    const userId = userResult.insertId
    await conn.query(
      'INSERT INTO user_accounts (user_id, provider, provider_id) VALUES (?, ?, ?)',
      [userId, provider, providerId],
    )
    await conn.commit()
    return userId
  } catch (e) {
    await conn.rollback()
    throw e
  } finally {
    conn.release()
  }
}

export async function linkSocialAccount(
  userId: number,
  provider: 'kakao' | 'google',
  providerId: string,
): Promise<void> {
  await pool.query(
    'INSERT INTO user_accounts (user_id, provider, provider_id) VALUES (?, ?, ?)',
    [userId, provider, providerId],
  )
}

export async function updateUserName(id: number, name: string): Promise<void> {
  await pool.query('UPDATE users SET name = ? WHERE id = ?', [name, id])
}

// 회원 탈퇴 — soft delete + 익명화
//   1) active 구독 있으면 cancelled로 전환 (cancelled_at = NOW)
//   2) users 행은 보존, deleted_at + email/name 익명화
//      - email 'deleted_<id>@deleted'로 → UNIQUE 충돌 회피 + 원래 이메일로 재가입 가능
//      - name '(탈퇴한 회원)' → 관리자 화면 표시용
//   3) user_accounts 삭제 (로그인 정보, 비즈니스 데이터 아님)
//   payments/reward_logs/subscriptions는 보존 — 회계·운영 통계 정합 유지
export async function softDeleteUser(id: number): Promise<void> {
  const conn = await pool.getConnection()
  try {
    await conn.beginTransaction()

    // 1) active 구독 해지 처리 (없으면 noop)
    await conn.query(
      `UPDATE subscriptions
         SET status = 'cancelled',
             cancelled_at = UTC_TIMESTAMP()
       WHERE user_id = ? AND status = 'active' AND cancelled_at IS NULL`,
      [id],
    )

    // 2) users 익명화 + deleted_at 기록
    await conn.query(
      `UPDATE users
         SET deleted_at = UTC_TIMESTAMP(),
             email = CONCAT('deleted_', id, '@deleted'),
             name = '(탈퇴한 회원)'
       WHERE id = ?`,
      [id],
    )

    // 3) 로그인 자격 제거
    await conn.query('DELETE FROM user_accounts WHERE user_id = ?', [id])

    await conn.commit()
  } catch (e) {
    await conn.rollback()
    throw e
  } finally {
    conn.release()
  }
}

// 포인트 출금 최소 금액 (KRW)
export const MIN_WITHDRAW_AMOUNT = 50000

// 포인트 출금 — balance에서 MIN_WITHDRAW_AMOUNT 차감 + withdrawal_logs INSERT.
// MVP는 실제 송금(계좌이체) 미구현 — balance 차감만. audit log는 관리자 조회/분쟁 대응용.
//
// 한 트랜잭션 안에서:
//   1) UPDATE users: balance >= 5만원일 때만 차감 (조건부 UPDATE로 atomic, 음수 잔액 불가)
//      affectedRows=0 → 잔액부족 또는 탈퇴회원 → rollback + ok:false
//   2) INSERT withdrawal_logs: 차감 성공 케이스만 기록
//   3) SELECT balance: 같은 트랜잭션 안이라 일관된 post-차감 값 반환
export async function withdrawPoints(
  userId: number,
): Promise<
  | { ok: true; balance: number; withdrawalId: number }
  | { ok: false }
> {
  const conn = await pool.getConnection()
  try {
    await conn.beginTransaction()

    const [updateResult] = await conn.query<ResultSetHeader>(
      'UPDATE users SET balance = balance - ? WHERE id = ? AND deleted_at IS NULL AND balance >= ?',
      [MIN_WITHDRAW_AMOUNT, userId, MIN_WITHDRAW_AMOUNT],
    )
    if (updateResult.affectedRows === 0) {
      await conn.rollback()
      return { ok: false }
    }

    const [insertResult] = await conn.query<ResultSetHeader>(
      'INSERT INTO withdrawal_logs (user_id, amount) VALUES (?, ?)',
      [userId, MIN_WITHDRAW_AMOUNT],
    )

    const [rows] = await conn.query<RowDataPacket[]>(
      'SELECT balance FROM users WHERE id = ?',
      [userId],
    )

    await conn.commit()
    return {
      ok: true,
      balance: (rows[0] as { balance: number }).balance,
      withdrawalId: insertResult.insertId,
    }
  } catch (e) {
    await conn.rollback()
    throw e
  } finally {
    conn.release()
  }
}
