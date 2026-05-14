import pool from '@/lib/db'
import { ResultSetHeader, RowDataPacket } from 'mysql2'
import { UserAccountRow, UserRow } from '@/types/db'

export async function findUserByEmail(email: string): Promise<UserRow | null> {
  const [rows] = await pool.query<RowDataPacket[]>(
    'SELECT id, email, name, role, balance, created_at FROM users WHERE email = ? LIMIT 1',
    [email],
  )
  return (rows[0] as UserRow) ?? null
}

export async function findUserById(id: number): Promise<UserRow | null> {
  const [rows] = await pool.query<RowDataPacket[]>(
    'SELECT id, email, name, role, balance, created_at FROM users WHERE id = ? LIMIT 1',
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

export async function deleteUserCascade(id: number): Promise<void> {
  const conn = await pool.getConnection()
  try {
    await conn.beginTransaction()
    await conn.query('DELETE FROM reward_logs WHERE user_id = ?', [id])
    await conn.query('DELETE FROM payments WHERE user_id = ?', [id])
    await conn.query('DELETE FROM subscriptions WHERE user_id = ?', [id])
    await conn.query('DELETE FROM user_accounts WHERE user_id = ?', [id])
    await conn.query('DELETE FROM users WHERE id = ?', [id])
    await conn.commit()
  } catch (e) {
    await conn.rollback()
    throw e
  } finally {
    conn.release()
  }
}
