import { useState, type FormEvent } from 'react'
import {
  ArrowLeft,
  ArrowRight,
  Check,
  Sparkles,
  Users,
  Zap,
} from 'lucide-react'
import type { RoomOptions } from '../../hooks/useGameEngine'
import { Flower } from './UI'
export function CreateGame({
  initialTopic,
  demo,
  onBack,
  onCreate,
}: {
  initialTopic: string
  demo: boolean
  onBack: () => void
  onCreate: (options: RoomOptions) => Promise<void>
}) {
  const [topic, setTopic] = useState(initialTopic)
  const [count, setCount] = useState(5)
  const [difficulty, setDifficulty] =
    useState<RoomOptions['difficulty']>('medium')
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')
  async function submit(event: FormEvent) {
    event.preventDefault()
    setError('')
    if (topic.trim().length < 2) {
      setError('Добавь тему: хотя бы два символа.')
      return
    }
    setBusy(true)
    try {
      await onCreate({ topic: topic.trim(), questionCount: count, difficulty })
    } catch (err) {
      setError((err as Error).message)
      setBusy(false)
    }
  }
  return (
    <div className="subpage">
      <button className="back-button" onClick={onBack}>
        <ArrowLeft size={18} />
        На главную
      </button>
      <div className="page-heading">
        <div>
          <p className="eyebrow">ТЫ ЗДЕСЬ ВЕДУЩИЙ</p>
          <h1>
            Твоя игра.
            <br className="mobile-break" /> Твои правила.
          </h1>
          <p className="muted">Немного настроек — и можно звать друзей.</p>
        </div>
      </div>
      <div className="create-layout">
        <form className="surface create-form" onSubmit={submit}>
          <div className="form-section">
            <span className="step-number">01</span>
            <div>
              <h2>О чём играем?</h2>
              <p>От чёрных дыр до любимого сериала.</p>
            </div>
          </div>
          <label className="field">
            Тема викторины
            <textarea
              autoFocus
              value={topic}
              onChange={(e) => setTopic(e.target.value)}
              placeholder="Например, космос и всё, что за его пределами"
              minLength={2}
              maxLength={120}
              rows={2}
              required
            />
          </label>
          <div className="suggestion-chips">
            {['Космос', 'История Рима', 'Мир Гарри Поттера', 'Музыка'].map(
              (item) => (
                <button type="button" key={item} onClick={() => setTopic(item)}>
                  {item}
                </button>
              ),
            )}
          </div>
          <div className="form-section spaced">
            <span className="step-number">02</span>
            <div>
              <h2>Как долго играем?</h2>
              <p>На каждый ответ — до 20 секунд.</p>
            </div>
          </div>
          <fieldset className="choice-field">
            <legend className="sr-only">Количество вопросов</legend>
            <div className="count-options">
              {[3, 5, 10].map((n) => (
                <button
                  type="button"
                  key={n}
                  aria-pressed={count === n}
                  onClick={() => setCount(n)}
                >
                  <strong>{n}</strong>
                  <span>вопросов</span>
                  {n === count && <Check size={16} />}
                </button>
              ))}
            </div>
          </fieldset>
          <div className="form-section spaced">
            <span className="step-number">03</span>
            <div>
              <h2>Добавим сложности?</h2>
              <p>Выбери комфортный уровень для компании.</p>
            </div>
          </div>
          <div className="difficulty-options" aria-label="Сложность">
            {(
              [
                ['easy', '🌱', 'Разминка', 'Лёгкая'],
                ['medium', '⚡', 'В самый раз', 'Средняя'],
                ['hard', '🔥', 'Вызов принят', 'Сложная'],
              ] as const
            ).map(([value, icon, title, label]) => (
              <button
                key={value}
                type="button"
                aria-pressed={difficulty === value}
                onClick={() => setDifficulty(value)}
              >
                <span>{icon}</span>
                <strong>{title}</strong>
                <small>{label}</small>
              </button>
            ))}
          </div>
          {error && (
            <p className="error-message" role="alert">
              {error}
            </p>
          )}
          <button className="button primary full create-submit" disabled={busy}>
            {busy ? 'Создаём комнату…' : 'Создать комнату'}
            <ArrowRight size={20} />
          </button>
        </form>
        <aside className="create-summary">
          <Flower>
            <Zap size={43} fill="currentColor" />
          </Flower>
          <span className="eyebrow">ХОРОШАЯ ИГРА НАЧИНАЕТСЯ С ИДЕИ</span>
          <h2>{topic.trim() || 'Здесь будет твоя тема'}</h2>
          <div className="summary-details">
            <span>
              <strong>{count}</strong> вопросов
            </span>
            <span>
              <strong>
                {difficulty === 'easy'
                  ? 'Лёгкая'
                  : difficulty === 'medium'
                    ? 'Средняя'
                    : 'Сложная'}
              </strong>{' '}
              сложность
            </span>
          </div>
          <div className="summary-note">
            <Users size={22} />
            <p>
              Комната будет твоей.
              <br />
              Пригласи друзей и начинай, когда все в сборе.
            </p>
          </div>
          <div className="notice">
            <Sparkles size={20} />
            <span>
              {demo
                ? 'В деморежиме используется готовый набор вопросов о космосе и науке. Тема и сложность применятся при подключении ИИ на сервере.'
                : 'Вопросы подготовит сервер после нажатия «Начать игру» в лобби.'}
            </span>
          </div>
        </aside>
      </div>
    </div>
  )
}
