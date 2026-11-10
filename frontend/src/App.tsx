import { lazy, Suspense, useEffect, useState } from 'react'
import {
  ArrowRight,
  CircleHelp,
  Home as HomeIcon,
  History,
  Plus,
  UserRound,
  X,
  Zap,
  RotateCcw,
} from 'lucide-react'
import { useGameEngine } from './hooks/useGameEngine'
import {
  AUTH_DEMO,
  authenticate,
  getSession,
  saveSession,
  recordDemoGame,
  type Session,
} from './services/account'
import { Brand, Dialog } from './components/portal/UI'
import { Home } from './components/portal/Home'
import { AuthDialog, JoinDialog } from './components/portal/AuthDialog'
import { CreateGame } from './components/portal/CreateGame'
import { RoomLobby } from './components/portal/RoomLobby'
import { Account } from './components/portal/Account'
const GameStage = lazy(() =>
  import('./components/portal/GameStage').then((module) => ({
    default: module.GameStage,
  })),
)
import './portal.css'

type Page = 'home' | 'create' | 'profile' | 'history'
const route = (): Page => {
  const value = location.hash.slice(1)
  return ['create', 'profile', 'history'].includes(value)
    ? (value as Page)
    : 'home'
}
export function App() {
  const engine = useGameEngine()
  const [page, setPage] = useState<Page>(route)
  const [session, setSession] = useState<Session | null>(getSession)
  const [authOpen, setAuthOpen] = useState(false)
  const [authIntent, setAuthIntent] = useState<Page>('home')
  const [joinOpen, setJoinOpen] = useState(
    () =>
      location.hash === '#join' ||
      new URLSearchParams(location.search).has('code'),
  )
  const [joinCode, setJoinCode] = useState(() =>
    (new URLSearchParams(location.search).get('code') || '')
      .replace(/\D/g, '')
      .slice(0, 6),
  )
  const [topic, setTopic] = useState('')
  const [helpOpen, setHelpOpen] = useState(false)
  const [leaveTarget, setLeaveTarget] = useState<Page | null>(null)
  const user = session?.user || null
  useEffect(() => {
    const sync = () => {
      setPage(route())
      if (location.hash === '#join') setJoinOpen(true)
    }
    window.addEventListener('hashchange', sync)
    return () => window.removeEventListener('hashchange', sync)
  }, [])
  useEffect(() => {
    if (user) engine.setIdentity(user)
  }, [user, engine.setIdentity])
  useEffect(() => {
    if (
      !engine.finishedData ||
      !user ||
      engine.connectionMode !== 'mock' ||
      !AUTH_DEMO
    )
      return
    const mine = engine.finishedData.leaderboard.find(
      (player) => player.id === engine.currentPlayer.id,
    )
    if (mine)
      recordDemoGame(user.id, {
        id: engine.roomInfo.roomId,
        topic: engine.roomInfo.topic,
        playedAt: new Date().toISOString(),
        score: mine.score,
        rank: mine.rank,
        players: engine.finishedData.leaderboard.length,
        questionCount: engine.finishedData.stats.totalQuestions,
      })
  }, [
    engine.finishedData,
    user,
    engine.connectionMode,
    engine.currentPlayer.id,
    engine.roomInfo.roomId,
    engine.roomInfo.topic,
  ])
  function navigate(next: Page) {
    location.hash = next
    setPage(next)
    window.scrollTo({ top: 0, behavior: 'instant' })
  }
  function nav(next: Page) {
    if (engine.hasRoom) setLeaveTarget(next)
    else navigate(next)
  }
  function create(nextTopic = '') {
    setTopic(nextTopic)
    if (engine.hasRoom) {
      setLeaveTarget('create')
      return
    }
    if (!user) {
      setAuthIntent('create')
      setAuthOpen(true)
    } else navigate('create')
  }
  function openJoin(code = '') {
    setJoinCode(code)
    setJoinOpen(true)
  }
  function acceptSession(next: Session) {
    saveSession(next)
    setSession(next)
    engine.setIdentity(next.user)
    setAuthOpen(false)
    navigate(authIntent)
  }
  async function join(code: string, nickname: string) {
    let next = session
    if (!next) {
      next = await authenticate('guest', {
        nickname,
        email: '',
        password: '',
        avatar: '⚡',
      })
      saveSession(next)
      setSession(next)
    }
    engine.setIdentity(next.user)
    await engine.joinRoom({ code, nickname, avatar: next.user.avatar })
    setJoinOpen(false)
    history.replaceState(null, '', `${location.pathname}#lobby`)
    window.scrollTo(0, 0)
  }
  function leave() {
    const next = leaveTarget || 'home'
    engine.leaveRoom()
    setLeaveTarget(null)
    navigate(next)
  }
  const gameActive = engine.hasRoom && engine.phase !== 'lobby'
  const navItems = [
    { page: 'home' as Page, icon: HomeIcon, label: 'Главная' },
    { page: 'create' as Page, icon: Plus, label: 'Создать' },
    { page: 'history' as Page, icon: History, label: 'История' },
    { page: 'profile' as Page, icon: UserRound, label: 'Профиль' },
  ]
  return (
    <div className="qb-app">
      <a className="skip-link" href="#main-content">
        К содержимому
      </a>
      <aside className="nav-rail">
        <button
          className="logo-button"
          aria-label="QuizBlitz — главная"
          onClick={() => nav('home')}
        >
          <Brand compact />
        </button>
        <nav aria-label="Главная навигация">
          {navItems.map((item) => (
            <button
              key={item.page}
              className={page === item.page && !engine.hasRoom ? 'active' : ''}
              aria-current={
                page === item.page && !engine.hasRoom ? 'page' : undefined
              }
              onClick={() =>
                item.page === 'create' ? create() : nav(item.page)
              }
            >
              <span>
                <item.icon size={23} />
              </span>
              <small>{item.label}</small>
            </button>
          ))}
        </nav>
        <button
          className="rail-help"
          onClick={() => setHelpOpen(true)}
          aria-label="Как играть"
        >
          <CircleHelp size={23} />
        </button>
        <span className="rail-footer">
          PLAY
          <br />
          YOUR WAY
        </span>
      </aside>
      <div className="app-body">
        <header className="app-header">
          <button
            className="logo-button"
            onClick={() => nav('home')}
            aria-label="QuizBlitz — главная"
          >
            <Brand />
          </button>
          <span className="header-tagline">Любопытство объединяет.</span>
          <div className="header-actions">
            <button className="header-help" onClick={() => setHelpOpen(true)}>
              <CircleHelp size={17} />
              Как играть
            </button>
            {user ? (
              <button className="user-chip" onClick={() => nav('profile')}>
                <span>{user.avatar}</span>
                <strong>{user.nickname}</strong>
              </button>
            ) : (
              <button
                className="button small outline"
                onClick={() => {
                  setAuthIntent(page)
                  setAuthOpen(true)
                }}
              >
                Войти
                <UserRound size={17} />
              </button>
            )}
          </div>
        </header>
        <main
          id="main-content"
          className={`main-content ${gameActive ? 'is-game' : ''}`}
        >
          {engine.connectionMode === 'live' && !engine.connected && (
            <div className="connection-banner" role="status">
              <span>
                Нет связи с игровым сервером. Восстанавливаем подключение…
              </span>
              <button onClick={engine.reconnect}>
                <RotateCcw size={16} />
                Повторить
              </button>
            </div>
          )}
          {engine.hasRoom && engine.errorMessage && (
            <div className="error-banner" role="alert">
              <span>{engine.errorMessage}</span>
              <button
                aria-label="Закрыть сообщение"
                onClick={engine.clearError}
              >
                <X size={18} />
              </button>
            </div>
          )}
          {gameActive ? (
            <Suspense
              fallback={
                <div className="loading-state" role="status">
                  Открываем игру…
                </div>
              }
            >
              <GameStage
                engine={engine}
                onExit={() => setLeaveTarget('home')}
                onReplay={() => {
                  setTopic(engine.roomInfo.topic)
                  engine.leaveRoom()
                  navigate('create')
                }}
              />
            </Suspense>
          ) : engine.hasRoom ? (
            <RoomLobby engine={engine} onLeave={() => setLeaveTarget('home')} />
          ) : page === 'home' ? (
            <Home onCreate={create} onJoin={openJoin} />
          ) : page === 'create' ? (
            user ? (
              <CreateGame
                initialTopic={topic}
                demo={engine.connectionMode === 'mock'}
                onBack={() => navigate('home')}
                onCreate={async (options) => {
                  await engine.createRoom(options)
                  location.hash = 'lobby'
                  window.scrollTo(0, 0)
                }}
              />
            ) : (
              <div className="surface empty-state">
                <h1>Кто сегодня ведущий?</h1>
                <p>Выбери ник, чтобы создать свою комнату.</p>
                <button
                  className="button primary"
                  onClick={() => {
                    setAuthIntent('create')
                    setAuthOpen(true)
                  }}
                >
                  Представиться
                  <ArrowRight size={18} />
                </button>
              </div>
            )
          ) : (
            <Account
              key={`${page}-${user?.id}`}
              user={user}
              historyOnly={page === 'history'}
              onLogin={() => {
                setAuthIntent(page)
                setAuthOpen(true)
              }}
              onLogout={() => {
                saveSession(null)
                engine.leaveRoom()
                setSession(null)
                navigate('home')
              }}
              onCreate={create}
            />
          )}
        </main>
        <footer className="app-footer">
          <span>
            <Zap size={14} />
            QuizBlitz · Сделано для игры вместе
          </span>
          <span>
            {engine.connectionMode === 'mock'
              ? 'Демо · без подключения к серверу'
              : AUTH_DEMO
                ? 'Игра онлайн · демо-профиль'
                : 'Всё готово к игре'}
            <span className="footer-dot" />
            RU
          </span>
        </footer>
      </div>
      {authOpen && (
        <AuthDialog
          onClose={() => setAuthOpen(false)}
          onSuccess={acceptSession}
        />
      )}
      {joinOpen && (
        <JoinDialog
          initialCode={joinCode}
          nickname={user?.nickname || ''}
          demo={engine.connectionMode === 'mock'}
          onClose={() => {
            setJoinOpen(false)
            history.replaceState(null, '', `${location.pathname}#${page}`)
          }}
          onJoin={join}
        />
      )}
      {helpOpen && (
        <Dialog
          title="Три шага до азарта"
          subtitle="Играй с друзьями, одноклассниками или всей командой."
          onClose={() => setHelpOpen(false)}
        >
          <ol className="help-list">
            <li>
              <strong>Создай свою викторину</strong>
              <p>Выбери тему, количество вопросов и сложность.</p>
            </li>
            <li>
              <strong>Собери компанию</strong>
              <p>
                Друзья вводят 6-значный код или сканируют QR. Ведущий запускает
                игру, когда все готовы.
              </p>
            </li>
            <li>
              <strong>Отвечай и поднимайся в рейтинге</strong>
              <p>
                На вопрос — 20 секунд. Чем быстрее правильный ответ, тем больше
                очков.
              </p>
            </li>
          </ol>
          <button
            className="button primary full"
            onClick={() => setHelpOpen(false)}
          >
            Всё понятно
            <ArrowRight size={18} />
          </button>
        </Dialog>
      )}
      {leaveTarget && (
        <Dialog
          title="Выйти из комнаты?"
          subtitle="Ты отключишься от этой игры. Остальные игроки останутся в комнате."
          onClose={() => setLeaveTarget(null)}
        >
          <div className="dialog-actions">
            <button
              className="button outline"
              onClick={() => setLeaveTarget(null)}
            >
              Остаться
            </button>
            <button className="button primary" onClick={leave}>
              Выйти
            </button>
          </div>
        </Dialog>
      )}
    </div>
  )
}
export default App
