import { useEffect, useState } from 'react'
import {
  ArrowRight,
  History,
  LogOut,
  Trophy,
  Zap,
  RotateCcw,
} from 'lucide-react'
import {
  AUTH_DEMO,
  fetchHistory,
  fetchProfile,
  type HistoryGame,
  type User,
} from '../../services/account'
import { Flower } from './UI'
export function Account({
  user,
  historyOnly,
  onLogin,
  onLogout,
  onCreate,
}: {
  user: User | null
  historyOnly: boolean
  onLogin: () => void
  onLogout: () => void
  onCreate: () => void
}) {
  const [games, setGames] = useState<HistoryGame[]>([])
  const [profile, setProfile] = useState(user)
  const [loading, setLoading] = useState(Boolean(user))
  const [error, setError] = useState('')
  const [retry, setRetry] = useState(0)
  useEffect(() => {
    if (!user) return
    let active = true
    setLoading(true)
    setError('')
    Promise.all([fetchProfile(), fetchHistory(user.id)])
      .then(([nextProfile, history]) => {
        if (active) {
          setProfile(nextProfile)
          setGames(history)
        }
      })
      .catch((err) => {
        if (active) setError(err.message)
      })
      .finally(() => {
        if (active) setLoading(false)
      })
    return () => {
      active = false
    }
  }, [user, retry])
  const score = games.reduce((total, game) => total + game.score, 0)
  return (
    <div className="subpage account-page">
      <div className="page-heading">
        <div>
          <p className="eyebrow">У КАЖДОГО ЗНАТОКА СВОЯ ИСТОРИЯ</p>
          <h1>{historyOnly ? 'Было круто.' : 'Твой уголок.'}</h1>
          <p className="muted">
            {historyOnly
              ? 'Твои игры, маленькие победы и большие камбэки.'
              : 'Знакомые темы. Новые рекорды. Всё здесь.'}
          </p>
        </div>
      </div>
      {!user ? (
        <div className="surface empty-state">
          <Flower>
            <Trophy size={40} />
          </Flower>
          <h2>Начнём твою историю?</h2>
          <p>Войди, чтобы видеть свой профиль и результаты игр.</p>
          <button className="button primary" onClick={onLogin}>
            Войти в профиль
            <ArrowRight size={18} />
          </button>
        </div>
      ) : (
        <>
          {!historyOnly && (
            <section className="profile-card">
              <span className="profile-avatar">
                {profile?.avatar || user.avatar}
              </span>
              <div>
                <span className="eyebrow">
                  {AUTH_DEMO
                    ? 'ДЕМО-ПРОФИЛЬ'
                    : user.isGuest
                      ? 'ГОСТЕВОЙ ПРОФИЛЬ'
                      : 'ТВОЙ ПРОФИЛЬ'}
                </span>
                <h2>{profile?.nickname || user.nickname}</h2>
                <p>{profile?.email || 'В игре главное — любопытство'}</p>
              </div>
              <button className="button outline" onClick={onLogout}>
                <LogOut size={17} />
                Выйти
              </button>
            </section>
          )}
          {loading ? (
            <div className="surface loading-state" role="status">
              <span className="loading-shape" />
              Загружаем твои результаты…
            </div>
          ) : error ? (
            <div className="surface empty-state">
              <p className="error-message" role="alert">
                {error}
              </p>
              <button
                className="button outline"
                onClick={() => setRetry(retry + 1)}
              >
                <RotateCcw size={18} />
                Повторить
              </button>
            </div>
          ) : (
            <>
              {!historyOnly && (
                <div className="stat-grid">
                  <div>
                    <span>
                      <History size={18} />
                      Сыграно игр
                    </span>
                    <strong>{games.length}</strong>
                  </div>
                  <div>
                    <span>
                      <Trophy size={18} />
                      Первых мест
                    </span>
                    <strong>
                      {games.filter((game) => game.rank === 1).length}
                    </strong>
                  </div>
                  <div>
                    <span>
                      <Zap size={18} />
                      Всего очков
                    </span>
                    <strong>{score.toLocaleString('ru-RU')}</strong>
                  </div>
                </div>
              )}
              <section className="surface history-panel">
                <div className="section-heading">
                  <h2>История игр</h2>
                  <span className="pill">
                    {AUTH_DEMO ? 'Локальные демо-игры' : 'Твои результаты'}
                  </span>
                </div>
                {games.length === 0 ? (
                  <div className="empty-state">
                    <span className="empty-icon">
                      <History size={34} />
                    </span>
                    <h2>Первая игра ещё впереди</h2>
                    <p>
                      Заверши викторину — и здесь появятся тема,
                      <br />
                      место в рейтинге и заработанные очки.
                    </p>
                    <button className="button primary" onClick={onCreate}>
                      Создать первую игру
                      <ArrowRight size={18} />
                    </button>
                  </div>
                ) : (
                  <div className="history-list">
                    {games.map((game) => (
                      <article key={game.id} className="history-row">
                        <span className="history-medal">
                          {game.rank === 1 ? '🏆' : '⚡'}
                        </span>
                        <div>
                          <h3>{game.topic}</h3>
                          <p>
                            {new Intl.DateTimeFormat('ru-RU', {
                              day: 'numeric',
                              month: 'long',
                              timeZone: 'Asia/Almaty',
                            }).format(new Date(game.playedAt))}{' '}
                            · {game.questionCount} вопросов
                          </p>
                        </div>
                        <span className="history-rank">
                          {game.rank} <small>/ {game.players} место</small>
                        </span>
                        <strong>
                          {game.score.toLocaleString('ru-RU')}{' '}
                          <small>очков</small>
                        </strong>
                      </article>
                    ))}
                  </div>
                )}
              </section>
            </>
          )}
        </>
      )}
    </div>
  )
}
