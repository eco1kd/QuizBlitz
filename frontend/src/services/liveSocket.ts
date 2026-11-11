import { io, type Socket } from 'socket.io-client'
import { getSession } from './account'
import type {
  Player,
  QuestionData,
  QuestionRevealData,
  LeaderboardData,
  GameFinishedData,
  GameError,
  RoomInfo,
} from '../types/game'
import type { GameEventListener } from './mockSocket'

const BACKEND_URL = import.meta.env.VITE_BACKEND_URL || 'http://localhost:3001'

export class LiveSocketService {
  private socket: Socket | null = null
  private connectionToken: string | undefined
  private botSockets: Socket[] = []
  private listeners: Set<GameEventListener> = new Set()
  private autoAdvanceTimer: number | null = null

  public isConnected = false
  public isAutoMode = true

  public roomInfo: RoomInfo = {
    code: '------',
    roomId: '',
    topic: 'Космос, Наука и ИИ',
    questionCount: 5,
    difficulty: 'medium',
    isHost: true,
  }

  public currentPlayer: Player = {
    id: 'player-local',
    nickname: 'karapuz1226',
    avatar: '👾',
    score: 0,
    rank: 1,
    streak: 0,
    isCurrentPlayer: true,
    answered: false,
    isHost: true,
  }

  public players: Player[] = []
  public currentQuestion: QuestionData | null = null

  public subscribe(listener: GameEventListener): () => void {
    this.listeners.add(listener)
    return () => this.listeners.delete(listener)
  }

  private emitLocal(event: string, data: any) {
    this.listeners.forEach((fn) => fn(event, data))
  }

  public connect(_autoCreateRoom = false): void {
    if (this.socket?.connected) return

    if (this.socket) {
      this.socket.disconnect()
    }

    this.connectionToken = getSession()?.token
    const socket = io(BACKEND_URL, {
      transports: ['websocket', 'polling'],
      reconnectionAttempts: 3,
      timeout: 3000,
      auth: (callback) => callback({ token: getSession()?.token }),
    })

    this.socket = socket

    socket.on('connect', () => {
      this.isConnected = true
      this.emitLocal('connection:status', { connected: true, mode: 'live' })

      // A reconnect rejoins the same room with the server-issued player ID.
      // Never silently creates a replacement room or switches to mock data.
      try {
        const saved = JSON.parse(
          sessionStorage.getItem('quizblitz.liveRoom') || 'null',
        )
        if (saved?.playerId && saved?.code) {
          this.roomInfo = saved.roomInfo
          this.currentPlayer.id = saved.playerId
          this.currentPlayer.nickname = saved.nickname
          socket.emit('room:join', {
            code: saved.code,
            nickname: saved.nickname,
            avatar: saved.avatar,
            playerId: saved.playerId,
          })
        }
      } catch {
        /* No recoverable session. */
      }
    })

    socket.on('disconnect', () => {
      this.isConnected = false
      this.emitLocal('connection:status', { connected: false, mode: 'live' })
    })

    socket.on('connect_error', () => {
      this.isConnected = false
      this.emitLocal('connection:status', { connected: false, mode: 'live' })
    })

    socket.on('room:created', (data: { code: string; roomId: string }) => {
      this.roomInfo = {
        ...this.roomInfo,
        code: data.code,
        roomId: data.roomId,
        isHost: true,
      }
      this.currentPlayer.isHost = true
      try {
        sessionStorage.setItem(
          'quizblitz.liveRoom',
          JSON.stringify({
            code: data.code,
            roomInfo: this.roomInfo,
            playerId: this.currentPlayer.id,
            nickname: this.currentPlayer.nickname,
            avatar: this.currentPlayer.avatar,
          }),
        )
      } catch {
        /* Session storage unavailable. */
      }
      this.emitLocal('room:created', data)
    })

    socket.on('room:updated', (data: { players: Player[] }) => {
      const mySocketId = socket.id
      const updatedPlayers = data.players.map((p) => {
        const isMe =
          (mySocketId && p.socketId === mySocketId) ||
          p.id === this.currentPlayer.id
        if (isMe) {
          this.currentPlayer = {
            ...p,
            isCurrentPlayer: true,
          }
          this.roomInfo.isHost = Boolean(p.isHost)
          try {
            sessionStorage.setItem(
              'quizblitz.liveRoom',
              JSON.stringify({
                code: this.roomInfo.code,
                roomInfo: this.roomInfo,
                playerId: p.id,
                nickname: p.nickname,
                avatar: p.avatar,
              }),
            )
          } catch {
            /* Session storage unavailable. */
          }
        }
        return {
          ...p,
          isCurrentPlayer: Boolean(isMe),
        }
      })

      this.players = updatedPlayers
      this.emitLocal('room:updated', { players: updatedPlayers })
    })

    socket.on('question:show', (data: QuestionData) => {
      this.clearAutoAdvance()
      this.currentQuestion = data
      this.emitLocal('question:show', data)
    })

    socket.on('timer:tick', (data: { remaining: number }) => {
      this.emitLocal('timer:tick', data)
    })

    socket.on('answer:accepted', (data: { questionId: string }) => {
      this.emitLocal('answer:accepted', data)
    })

    socket.on('room:player_answered', (data: { playerId: string }) => {
      this.emitLocal('room:player_answered', data)
    })

    socket.on('question:reveal', (data: QuestionRevealData) => {
      this.clearAutoAdvance()
      const mine = data.results.find(
        (r) => r.playerId === this.currentPlayer.id,
      )
      if (mine) {
        this.currentPlayer.score += mine.points
        this.currentPlayer.streak = mine.streak ?? 0
      }
      this.emitLocal('question:reveal', data)

      if (this.isAutoMode && this.roomInfo.isHost) {
        this.autoAdvanceTimer = setTimeout(() => {
          this.nextStep()
        }, 4500) as unknown as number
      }
    })

    socket.on('leaderboard:update', (data: LeaderboardData) => {
      this.clearAutoAdvance()
      const mine = data.players.find((p) => p.id === this.currentPlayer.id)
      if (mine) {
        this.currentPlayer.score = mine.score
        this.currentPlayer.rank = mine.rank
        this.currentPlayer.streak = mine.streak ?? 0
      }
      this.emitLocal('leaderboard:update', data)

      if (this.isAutoMode && this.roomInfo.isHost) {
        this.autoAdvanceTimer = setTimeout(() => {
          this.nextStep()
        }, 5000) as unknown as number
      }
    })

    socket.on('game:finished', (data: GameFinishedData) => {
      this.clearAutoAdvance()
      this.emitLocal('game:finished', data)
    })

    socket.on('error', (err: GameError) => {
      console.warn('[LiveSocket] Error from server:', err)
      if (err.code === 'ROOM_NOT_FOUND')
        sessionStorage.removeItem('quizblitz.liveRoom')
      this.emitLocal('error', err)
    })
  }

  private clearAutoAdvance() {
    if (this.autoAdvanceTimer) {
      clearTimeout(this.autoAdvanceTimer)
      this.autoAdvanceTimer = null
    }
  }

  public createRoom(opts: {
    topic: string
    questionCount: number
    difficulty: 'easy' | 'medium' | 'hard'
  }) {
    this.cleanupBots()
    this.roomInfo.topic = opts.topic || 'Космос, Наука и ИИ'
    this.roomInfo.questionCount = opts.questionCount || 5
    this.roomInfo.difficulty = opts.difficulty || 'medium'
    this.roomInfo.isHost = true
    this.currentPlayer.score = 0
    this.currentPlayer.streak = 0

    this.socket?.emit('room:create', {
      topic: this.roomInfo.topic,
      questionCount: this.roomInfo.questionCount,
      difficulty: this.roomInfo.difficulty,
    })
  }

  public joinRoom(opts: { code: string; nickname: string; avatar?: string }) {
    this.cleanupBots()
    const cleanCode = opts.code.replace(/\D/g, '').trim()
    this.roomInfo.code = cleanCode
    this.roomInfo.isHost = false
    this.roomInfo.topic = 'Игра с друзьями'
    this.currentPlayer.nickname = opts.nickname.trim() || 'karapuz1226'
    this.currentPlayer.avatar = opts.avatar || '👾'
    this.currentPlayer.score = 0
    this.currentPlayer.streak = 0

    this.socket?.emit('room:join', {
      code: cleanCode,
      nickname: this.currentPlayer.nickname,
      avatar: this.currentPlayer.avatar,
    })
  }

  public startGame() {
    this.socket?.emit('game:start', {})
  }

  public submitAnswer(optionIndex: number) {
    if (!this.currentQuestion) return
    this.socket?.emit('answer:submit', {
      questionId: this.currentQuestion.questionId,
      optionIndex,
    })
  }

  public nextStep() {
    this.clearAutoAdvance()
    this.socket?.emit('game:next', {})
  }

  /**
   * Создаёт реального Socket.IO бота, который подключается к бэкенду @eco1kd
   * по коду комнаты и отвечает на вопросы в реальном времени!
   */
  public spawnLiveBot(nickname: string, avatar: string) {
    if (!this.roomInfo.code || this.roomInfo.code === '------') return

    const botIndex = this.botSockets.length
    const botSocket = io(BACKEND_URL, {
      transports: ['websocket'],
      forceNew: true,
    })

    let currentQId: string | null = null
    let answeredCurrent = false

    botSocket.on('connect', () => {
      botSocket.emit('room:join', {
        code: this.roomInfo.code,
        nickname,
        avatar,
      })
    })

    botSocket.on('question:show', (q: QuestionData) => {
      currentQId = q.questionId
      answeredCurrent = false

      // Первый бот ждёт ответа хоста (чтобы сервер не закрыл вопрос раньше хоста),
      // остальные боты отвечают случайно через 2-6 секунд
      if (botIndex > 0) {
        const delay = 1800 + Math.random() * 4500
        setTimeout(() => {
          if (!answeredCurrent && currentQId === q.questionId) {
            answeredCurrent = true
            const randomOpt = Math.floor(Math.random() * 4)
            botSocket.emit('answer:submit', {
              questionId: q.questionId,
              optionIndex: randomOpt,
            })
          }
        }, delay)
      } else {
        // Страховочный таймер на случай, если хост не отвечает 15 секунд
        setTimeout(() => {
          if (!answeredCurrent && currentQId === q.questionId) {
            answeredCurrent = true
            const randomOpt = Math.floor(Math.random() * 4)
            botSocket.emit('answer:submit', {
              questionId: q.questionId,
              optionIndex: randomOpt,
            })
          }
        }, 15000)
      }
    })

    // Как только хост ответил — последний бот сразу отправляет свой ответ через 450мс
    botSocket.on('room:player_answered', (data: { playerId: string }) => {
      if (
        data.playerId === this.currentPlayer.id &&
        !answeredCurrent &&
        currentQId
      ) {
        const qId = currentQId
        setTimeout(() => {
          if (!answeredCurrent && currentQId === qId) {
            answeredCurrent = true
            const randomOpt = Math.floor(Math.random() * 4)
            botSocket.emit('answer:submit', {
              questionId: qId,
              optionIndex: randomOpt,
            })
          }
        }, 450)
      }
    })

    this.botSockets.push(botSocket)
  }

  public cleanupBots() {
    this.botSockets.forEach((s) => s.disconnect())
    this.botSockets = []
  }

  public refreshAuthentication() {
    if (this.connectionToken !== getSession()?.token) {
      this.disconnect()
      this.connect(false)
    }
  }

  public leaveRoom() {
    sessionStorage.removeItem('quizblitz.liveRoom')
    this.disconnect()
    this.roomInfo.code = '------'
    this.roomInfo.roomId = ''
    this.players = []
    this.currentQuestion = null
  }

  public disconnect() {
    this.clearAutoAdvance()
    this.cleanupBots()
    this.socket?.disconnect()
    this.socket = null
    this.isConnected = false
  }
}

export const liveSocketService = new LiveSocketService()
