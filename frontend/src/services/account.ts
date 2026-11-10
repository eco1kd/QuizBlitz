/** REST adapter. Response shapes are documented in INTEGRATION.md. */
export interface User {
  id: string
  nickname: string
  avatar: string
  email?: string
  isGuest: boolean
}
export interface Session {
  user: User
  token?: string
}
export interface HistoryGame {
  id: string
  topic: string
  playedAt: string
  score: number
  rank: number
  players: number
  questionCount: number
}
export const AUTH_DEMO = import.meta.env.VITE_AUTH_MODE !== 'live'
const API_URL = (import.meta.env.VITE_API_URL || '').replace(/\/$/, '')
const sessionKey = `quizblitz.session.${AUTH_DEMO ? 'demo' : 'live'}`

export function readStored<T>(
  key: string,
  fallback: T,
  storage: Storage = localStorage,
): T {
  try {
    return JSON.parse(storage.getItem(key) || 'null') ?? fallback
  } catch {
    return fallback
  }
}
export function writeStored(
  key: string,
  value: unknown,
  storage: Storage = localStorage,
) {
  try {
    storage.setItem(key, JSON.stringify(value))
  } catch {
    /* Private browsing: keep the current in-memory session. */
  }
}
export function getSession(): Session | null {
  return readStored(sessionKey, null, sessionStorage)
}
export function saveSession(session: Session | null) {
  writeStored(sessionKey, session, sessionStorage)
}

async function request<T>(path: string, data?: unknown): Promise<T> {
  const controller = new AbortController()
  const timeout = setTimeout(() => controller.abort(), 12000)
  try {
    const response = await fetch(`${API_URL}/api${path}`, {
      method: data === undefined ? 'GET' : 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...(getSession()?.token
          ? { Authorization: `Bearer ${getSession()!.token}` }
          : {}),
      },
      body: data === undefined ? undefined : JSON.stringify(data),
      signal: controller.signal,
    })
    const body = await response.json().catch(() => null)
    if (!response.ok)
      throw new Error(
        body?.message ||
          body?.detail ||
          (response.status === 401
            ? 'Сессия истекла. Войди ещё раз.'
            : 'Сервис пока недоступен. Попробуй ещё раз.'),
      )
    if (body === null) throw new Error('Сервер вернул неожиданный ответ.')
    return body as T
  } catch (error) {
    if (
      error instanceof TypeError ||
      (error instanceof DOMException && error.name === 'AbortError')
    )
      throw new Error(
        'Не удалось связаться с сервером. Проверь подключение и попробуй снова.',
      )
    throw error
  } finally {
    clearTimeout(timeout)
  }
}

export async function authenticate(
  mode: 'guest' | 'login' | 'register',
  values: { nickname: string; email: string; password: string; avatar: string },
): Promise<Session> {
  if (AUTH_DEMO) {
    // Intentionally no password persistence or simulated security: this is a UI demo.
    await new Promise((resolve) => setTimeout(resolve, 350))
    return {
      user: {
        id: `demo-${(values.email || values.nickname).toLowerCase()}`,
        nickname: values.nickname || values.email.split('@')[0],
        email: mode === 'guest' ? undefined : values.email,
        avatar: values.avatar,
        isGuest: mode === 'guest',
      },
    }
  }
  const payload =
    mode === 'guest'
      ? { nickname: values.nickname }
      : mode === 'login'
        ? { email: values.email, password: values.password }
        : {
            nickname: values.nickname,
            email: values.email,
            password: values.password,
          }
  const result = await request<Session>(`/auth/${mode}`, payload)
  if (!result.user?.id || !result.user?.nickname || !result.token)
    throw new Error('Неполный ответ авторизации. Проверь контракт API.')
  return {
    ...result,
    user: { ...result.user, avatar: result.user.avatar || values.avatar },
  }
}
export async function fetchProfile(): Promise<User> {
  if (AUTH_DEMO) {
    const user = getSession()?.user
    if (!user) throw new Error('Сначала войди в профиль.')
    return user
  }
  const user = await request<User>('/me')
  if (!user.id || !user.nickname) throw new Error('Неверный формат профиля.')
  return user
}
export async function fetchHistory(userId: string): Promise<HistoryGame[]> {
  if (AUTH_DEMO) return readStored(`quizblitz.history.${userId}`, [])
  const result = await request<HistoryGame[]>('/games/history')
  if (!Array.isArray(result)) throw new Error('Неверный формат истории игр.')
  return result
}
export function recordDemoGame(userId: string, game: HistoryGame) {
  const key = `quizblitz.history.${userId}`
  const history = readStored<HistoryGame[]>(key, [])
  if (!history.some((item) => item.id === game.id))
    writeStored(key, [game, ...history].slice(0, 50))
}
