import { useState, type FormEvent } from 'react'
import { ArrowRight, Eye, EyeOff, Sparkles } from 'lucide-react'
import { authenticate, AUTH_DEMO, type Session } from '../../services/account'
import { Dialog } from './UI'
const avatars = ['⚡', '🪐', '🦊', '🐸', '👾', '🌻']
export function AuthDialog({
  onClose,
  onSuccess,
}: {
  onClose: () => void
  onSuccess: (session: Session) => void
}) {
  const [mode, setMode] = useState<'guest' | 'login' | 'register'>('guest')
  const [nickname, setNickname] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [avatar, setAvatar] = useState('⚡')
  const [visible, setVisible] = useState(false)
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')
  async function submit(event: FormEvent) {
    event.preventDefault()
    setError('')
    if (mode !== 'login' && nickname.trim().length < 2) {
      setError('Ник должен содержать от 2 до 20 символов.')
      return
    }
    setBusy(true)
    try {
      onSuccess(
        await authenticate(mode, {
          nickname: nickname.trim(),
          email: email.trim(),
          password,
          avatar,
        }),
      )
    } catch (err) {
      setError((err as Error).message)
    } finally {
      setBusy(false)
    }
  }
  return (
    <Dialog
      title={
        mode === 'guest'
          ? 'Как тебя представить?'
          : mode === 'login'
            ? 'С возвращением!'
            : 'Давай знакомиться'
      }
      subtitle="До первой игры — всего один шаг."
      onClose={onClose}
    >
      <div className="segmented auth-tabs" aria-label="Способ входа">
        {(
          [
            ['guest', 'Быстрый вход'],
            ['login', 'Войти'],
            ['register', 'Регистрация'],
          ] as const
        ).map(([value, label]) => (
          <button
            key={value}
            type="button"
            aria-pressed={mode === value}
            onClick={() => {
              setMode(value)
              setError('')
            }}
          >
            {label}
          </button>
        ))}
      </div>
      <form onSubmit={submit} className="form-stack">
        {mode !== 'login' && (
          <>
            <fieldset className="avatar-picker">
              <legend>Выбери своего персонажа</legend>
              {avatars.map((item) => (
                <button
                  key={item}
                  type="button"
                  aria-label={`Аватар ${item}`}
                  aria-pressed={item === avatar}
                  onClick={() => setAvatar(item)}
                >
                  {item}
                </button>
              ))}
            </fieldset>
            <label className="field">
              Твой ник
              <input
                autoFocus
                value={nickname}
                onChange={(e) => setNickname(e.target.value)}
                placeholder="Например, Nonwire"
                autoComplete="nickname"
                minLength={2}
                maxLength={20}
                required
              />
            </label>
          </>
        )}
        {mode !== 'guest' && (
          <>
            <label className="field">
              Почта
              <input
                autoFocus={mode === 'login'}
                type="email"
                autoComplete="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="you@example.com"
                maxLength={254}
                required
              />
            </label>
            <label className="field">
              Пароль
              <span className="password-field">
                <input
                  type={visible ? 'text' : 'password'}
                  autoComplete={
                    mode === 'login' ? 'current-password' : 'new-password'
                  }
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  minLength={8}
                  maxLength={128}
                  placeholder="Не меньше 8 символов"
                  required
                />
                <button
                  type="button"
                  className="icon-button"
                  aria-label={visible ? 'Скрыть пароль' : 'Показать пароль'}
                  onClick={() => setVisible(!visible)}
                >
                  {visible ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              </span>
            </label>
          </>
        )}
        {error && (
          <p className="error-message" role="alert">
            {error}
          </p>
        )}
        <button className="button primary full" disabled={busy}>
          {busy
            ? 'Минуточку…'
            : mode === 'guest'
              ? 'Поехали!'
              : mode === 'login'
                ? 'Войти в аккаунт'
                : 'Создать аккаунт'}
          <ArrowRight size={20} />
        </button>
        <p className="form-note">
          {AUTH_DEMO
            ? 'Демо авторизации: данные остаются в этой вкладке. Настоящий аккаунт не создаётся; пароль не сохраняется.'
            : mode === 'guest'
              ? 'Без пароля и лишних формальностей. Просто играй.'
              : 'Твой профиль и результаты будут всегда под рукой.'}
        </p>
      </form>
    </Dialog>
  )
}
export function JoinDialog({
  initialCode,
  onClose,
  onJoin,
  demo,
  nickname: defaultName,
}: {
  initialCode: string
  nickname: string
  demo: boolean
  onClose: () => void
  onJoin: (code: string, nickname: string) => Promise<void>
}) {
  const [code, setCode] = useState(initialCode)
  const [nickname, setNickname] = useState(defaultName)
  const [error, setError] = useState('')
  const [busy, setBusy] = useState(false)
  async function submit(event: FormEvent) {
    event.preventDefault()
    setError('')
    if (!/^\d{6}$/.test(code)) {
      setError('Код комнаты — это 6 цифр.')
      return
    }
    if (nickname.trim().length < 2) {
      setError('Введи ник: от 2 до 20 символов.')
      return
    }
    setBusy(true)
    try {
      await onJoin(code, nickname.trim())
    } catch (err) {
      setError((err as Error).message)
    } finally {
      setBusy(false)
    }
  }
  return (
    <Dialog
      title="Тебя уже ждут"
      subtitle="Введи код от ведущего и присоединяйся к игре."
      onClose={onClose}
    >
      <form className="form-stack" onSubmit={submit}>
        <label className="field">
          Код комнаты
          <input
            autoFocus
            className="code-input"
            inputMode="numeric"
            autoComplete="off"
            value={code}
            onChange={(e) =>
              setCode(e.target.value.replace(/\D/g, '').slice(0, 6))
            }
            placeholder="000 000"
            pattern="[0-9]{6}"
            maxLength={6}
            required
          />
        </label>
        <label className="field">
          Твой ник
          <input
            value={nickname}
            onChange={(e) => setNickname(e.target.value)}
            placeholder="Как тебя зовут в игре?"
            autoComplete="nickname"
            minLength={2}
            maxLength={20}
            required
          />
        </label>
        {error && (
          <p role="alert" className="error-message">
            {error}
          </p>
        )}
        <button disabled={busy} className="button primary full">
          {busy ? 'Подключаемся…' : 'Войти в игру'}
          <ArrowRight size={20} />
        </button>
        {demo && (
          <div className="notice">
            <Sparkles size={18} />
            <span>
              Это локальное демо. Попробуй код{' '}
              <button
                type="button"
                className="text-button"
                onClick={() => setCode('849215')}
              >
                849215
              </button>
              . Игроки с других устройств появятся после подключения сервера.
            </span>
          </div>
        )}
      </form>
    </Dialog>
  )
}
