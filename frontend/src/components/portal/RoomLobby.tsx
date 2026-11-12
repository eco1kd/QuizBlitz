import { useEffect, useState } from 'react'
import { QRCodeSVG } from 'qrcode.react'
import {
  ArrowLeft,
  Check,
  Copy,
  Crown,
  Link,
  Play,
  Plus,
  Users,
  Wifi,
  Sparkles,
} from 'lucide-react'
import type { GameEngine } from '../../hooks/useGameEngine'
import { formatQuestionCount } from '../../services/account'
export function RoomLobby({
  engine,
  onLeave,
}: {
  engine: GameEngine
  onLeave: () => void
}) {
  const {
    roomInfo: room,
    roomPlayers: players,
    connected,
    connectionMode,
  } = engine
  const [copied, setCopied] = useState('')
  const [copyError, setCopyError] = useState('')
  const [starting, setStarting] = useState(false)
  const [startError, setStartError] = useState('')
  const url = `${location.origin}${location.pathname}?code=${room.code}#join`
  useEffect(() => {
    if (engine.errorMessage || !connected) setStarting(false)
  }, [engine.errorMessage, connected])
  useEffect(() => {
    if (!starting) return
    const timer = setTimeout(() => {
      setStarting(false)
      setStartError('Подготовка затянулась. Попробуй начать ещё раз.')
    }, 30000)
    return () => clearTimeout(timer)
  }, [starting])
  useEffect(() => {
    if (!copied) return
    const timer = setTimeout(() => setCopied(''), 2500)
    return () => clearTimeout(timer)
  }, [copied])
  async function copy(text: string, key: string) {
    try {
      await navigator.clipboard.writeText(text)
      setCopied(key)
      setCopyError('')
    } catch {
      setCopyError(
        'Не удалось скопировать автоматически. Выдели код или ссылку ниже.',
      )
      setCopied('')
    }
  }
  return (
    <div className="subpage">
      <button className="back-button" onClick={onLeave}>
        <ArrowLeft size={18} />
        Выйти из комнаты
      </button>
      <div className="page-heading">
        <div>
          <p className="eyebrow">ЛУЧШИЕ ИГРЫ — В ХОРОШЕЙ КОМПАНИИ</p>
          <h1>Все в сборе<span className="purple">?</span></h1>
          <p className="muted">
            {room.isHost
              ? 'Поделись кодом и подожди остальных.'
              : 'Ты в игре! Ведущий скоро запустит первый раунд.'}
          </p>
        </div>
        <span className={`pill ${connected ? 'online-pill' : 'offline-pill'}`}>
          <Wifi size={16} />
          {connected ? 'Комната открыта' : 'Восстанавливаем связь'}
        </span>
      </div>
      <div className="lobby-layout">
        <div className="lobby-main">
          <section className="room-topic">
            <span className="pill">
              <Sparkles size={15} />
              {room.isHost ? 'Твоя викторина' : 'Ты в комнате'}
            </span>
            <h2>{room.topic}</h2>
            {room.isHost && (
              <div className="room-tags">
                <span>{formatQuestionCount(room.questionCount)}</span>
                <span>
                  {room.difficulty === 'easy'
                    ? 'Лёгкая'
                    : room.difficulty === 'hard'
                      ? 'Сложная'
                      : 'Средняя'}{' '}
                  сложность
                </span>
                <span>20 сек / ответ</span>
              </div>
            )}
            <span className="room-decor" aria-hidden="true">
              ✳
            </span>
          </section>
          <section className="surface players-panel">
            <div className="section-heading">
              <h2>
                <Users size={21} />
                Игроки <span className="count-badge">{players.length}</span>
              </h2>
              {connectionMode === 'mock' && room.isHost && (
                <button className="text-button" onClick={engine.addBotPlayer}>
                  <Plus size={16} />
                  Демо-игрок
                </button>
              )}
            </div>
            <div className="players-grid">
              {players.map((player) => (
                <div
                  key={player.id}
                  className={`player-tile ${player.isCurrentPlayer ? 'is-me' : ''}`}
                >
                  <span className="player-avatar">{player.avatar || '⚡'}</span>
                  <div>
                    <strong>{player.nickname}</strong>
                    <span>
                      {player.isHost ? (
                        <>
                          <Crown size={12} />
                          Ведущий
                        </>
                      ) : player.disconnected ? (
                        'Переподключается…'
                      ) : (
                        'Готов к игре'
                      )}
                      {player.isCurrentPlayer ? ' · ты' : ''}
                    </span>
                  </div>
                  <span
                    className={`player-dot ${player.disconnected ? 'disconnected' : ''}`}
                  />
                </div>
              ))}
              <div className="player-tile player-placeholder">
                <span className="player-avatar">
                  <Plus size={24} />
                </span>
                <span>Место для друга</span>
              </div>
            </div>
            <p className="form-note">
              Список обновляется автоматически.{' '}
              {connectionMode === 'mock'
                ? 'Сейчас показаны демо-участники.'
                : 'Можно присоединиться с телефона.'}
            </p>
          </section>
          {room.isHost ? (
            <button
              className="button primary full start-button"
              disabled={!connected || starting || players.length === 0}
              onClick={() => {
                setStarting(true)
                setStartError('')
                engine.startLobbyGame()
              }}
            >
              {starting ? (
                <>
                  <Sparkles className="spin" size={22} />
                  Готовим вопросы…
                </>
              ) : (
                <>
                  <Play size={22} fill="currentColor" />
                  Начать игру
                  <ArrowLeft className="flip" size={22} />
                </>
              )}
            </button>
          ) : (
            <div className="waiting-host">
              <span className="status-dot" />
              Ждём, когда ведущий начнёт игру
            </div>
          )}
          {startError && (
            <p role="alert" className="error-message">
              {startError}
            </p>
          )}
        </div>
        <aside className="invite-panel">
          <span className="eyebrow">ПРИГЛАШЕНИЕ НА БАТТЛ</span>
          <h2>Вход по коду</h2>
          <button
            className="room-code"
            aria-label={`Скопировать код ${room.code}`}
            onClick={() => copy(room.code, 'code')}
          >
            {room.code.slice(0, 3)} {room.code.slice(3)}
            {copied === 'code' ? <Check size={21} /> : <Copy size={21} />}
          </button>
          <div className="qr-frame">
            <QRCodeSVG
              value={url}
              size={184}
              level="M"
              marginSize={3}
              title="QR-код для входа в комнату"
            />
          </div>
          <p>
            Наведи камеру телефона.
            <br />
            Или просто отправь ссылку.
          </p>
          <button
            className="button outline full"
            onClick={() => copy(url, 'link')}
          >
            {copied === 'link' ? <Check size={18} /> : <Link size={18} />}{' '}
            {copied === 'link' ? 'Ссылка скопирована' : 'Скопировать ссылку'}
          </button>
          <div role="status" className="copy-status">
            {copied === 'code' ? 'Код скопирован!' : copyError}
          </div>
          {copyError && (
            <input
              className="share-url"
              aria-label="Ссылка приглашения"
              value={url}
              readOnly
              onFocus={(e) => e.target.select()}
            />
          )}
          {connectionMode === 'mock' && (
            <p className="form-note">
              Демо работает в этой вкладке. Для общей комнаты на разных
              устройствах нужен игровой сервер.
            </p>
          )}
        </aside>
      </div>
    </div>
  )
}
