// 프론트엔드 공용 API 클라이언트
//
// 백엔드 응답 envelope를 자동으로 풀어 data만 반환:
//   { success: true,  data: ... }   → data 반환
//   { success: false, error: "..." } → ApiError throw (status 코드 포함)
//
// 사용 예:
//   const me = await api.get<Me>('/api/auth/me')
//   await api.post('/api/auth/logout')
//   await api.patch<Subscription>('/api/subscriptions/change-tier', { newTier: 'premium' })
//
// 쿠키는 same-origin이라 자동 전송됨 (별도 credentials 설정 불요)

export class ApiError extends Error {
  constructor(public status: number, message: string) {
    super(message)
    this.name = 'ApiError'
  }
}

type ApiEnvelope<T> =
  | { success: true; data: T }
  | { success: false; error: string }

async function request<T>(method: string, url: string, body?: unknown): Promise<T> {
  const headers: Record<string, string> = {}
  if (body !== undefined) headers['Content-Type'] = 'application/json'

  const res = await fetch(url, {
    method,
    headers,
    body: body !== undefined ? JSON.stringify(body) : undefined,
  })

  const json = (await res.json().catch(() => null)) as ApiEnvelope<T> | null

  if (!res.ok || !json || !json.success) {
    const msg = json && !json.success ? json.error : `요청 실패 (${res.status})`
    throw new ApiError(res.status, msg)
  }

  return json.data
}

export const api = {
  get: <T>(url: string) => request<T>('GET', url),
  post: <T>(url: string, body?: unknown) => request<T>('POST', url, body),
  put: <T>(url: string, body?: unknown) => request<T>('PUT', url, body),
  patch: <T>(url: string, body?: unknown) => request<T>('PATCH', url, body),
  delete: <T>(url: string) => request<T>('DELETE', url),
}
