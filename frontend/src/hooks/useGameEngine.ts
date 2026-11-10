import { useState, useEffect, useCallback, useRef } from 'react'
import type {
  GameFinishedData,
  GamePhase,
  LeaderboardData,
  QuestionData,
  QuestionRevealData,
  PlayerResult,
  Player,
  RoomInfo,
} from '../types/game'
import { mockGameServer } from '../services/mockSocket'
import { liveSocketService } from '../services/liveSocket'
import type { User } from '../services/account'

export type ConnectionMode = 'live' | 'mock'
const mode: ConnectionMode =
  import.meta.env.VITE_GAME_MODE === 'live' ? 'live' : 'mock'
const service = () => (mode === 'live' ? liveSocketService : mockGameServer)
export type RoomOptions = Pick<
  RoomInfo,
  'topic' | 'questionCount' | 'difficulty'
>

export function useGameEngine() {
  const [phase, setPhase] = useState<GamePhase>('lobby')
  const [hasRoom, setHasRoom] = useState(false)
  const [connected, setConnected] = useState(mode === 'mock')
  const [roomInfo, setRoomInfo] = useState<RoomInfo>({ ...service().roomInfo })
  const [roomPlayers, setRoomPlayers] = useState<Player[]>([])
  const [currentPlayer, setCurrentPlayer] = useState<Player>({
    ...service().currentPlayer,
  })
  const [question, setQuestion] = useState<QuestionData | null>(null)
  const [timeRemaining, setTimeRemaining] = useState(20)
  const [selectedOption, setSelectedOption] = useState<number | null>(null)
  const [revealData, setRevealData] = useState<QuestionRevealData | null>(null)
  const [leaderboard, setLeaderboard] = useState<LeaderboardData | null>(null)
  const [finishedData, setFinishedData] = useState<GameFinishedData | null>(
    null,
  )
  const [myResult, setMyResult] = useState<PlayerResult | null>(null)
  const [myScore, setMyScore] = useState(0)
  const [myStreak, setMyStreak] = useState(0)
  const [errorMessage, setErrorMessage] = useState<string | null>(null)
  const pendingCancel = useRef<(() => void) | null>(null)

  useEffect(() => {
    const engine = service()
    const unsubscribe = engine.subscribe((event, data) => {
      switch (event) {
        case 'connection:status':
          setConnected(data.connected)
          break
        case 'room:created':
          setRoomInfo({ ...engine.roomInfo })
          setCurrentPlayer({ ...engine.currentPlayer })
          setHasRoom(true)
          setMyScore(0)
          setMyStreak(0)
          setPhase('lobby')
          setFinishedData(null)
          break
        case 'room:updated':
          setRoomPlayers([...data.players])
          setRoomInfo({ ...engine.roomInfo })
          setCurrentPlayer({ ...engine.currentPlayer })
          if (data.players.some((p: Player) => p.isCurrentPlayer))
            setHasRoom(true)
          break
        case 'question:show':
          setQuestion(data)
          setTimeRemaining(data.timeLimit)
          setSelectedOption(null)
          setRevealData(null)
          setMyResult(null)
          setPhase('question')
          break
        case 'timer:tick':
          setTimeRemaining(data.remaining)
          break
        case 'answer:accepted':
          setPhase('waiting')
          break
        case 'question:reveal': {
          setRevealData(data)
          const mine = (data as QuestionRevealData).results.find(
            (r) => r.playerId === engine.currentPlayer.id,
          )
          if (mine) {
            setMyResult(mine)
            setMyScore(engine.currentPlayer.score)
            setMyStreak(mine.streak || 0)
          }
          setPhase('reveal')
          break
        }
        case 'leaderboard:update':
          setLeaderboard(data)
          setMyScore(engine.currentPlayer.score)
          setCurrentPlayer({ ...engine.currentPlayer })
          setPhase('leaderboard')
          break
        case 'game:finished':
          setFinishedData(data)
          setPhase('finished')
          break
        case 'error':
          setErrorMessage(data.message)
          break
      }
    })
    if (mode === 'live') liveSocketService.connect(false)
    return () => {
      pendingCancel.current?.()
      unsubscribe()
      if (mode === 'live') liveSocketService.disconnect()
      else mockGameServer.stop()
    }
  }, [])

  const setIdentity = useCallback((user: User) => {
    const engine = service()
    engine.currentPlayer.nickname = user.nickname
    engine.currentPlayer.avatar = user.avatar
    if (mode === 'mock') engine.currentPlayer.id = user.id
    else liveSocketService.refreshAuthentication()
    setCurrentPlayer({ ...engine.currentPlayer })
  }, [])

  const roomRequest = useCallback(
    (send: () => void, creating: boolean) =>
      new Promise<void>((resolve, reject) => {
        setErrorMessage(null)
        pendingCancel.current?.()
        const timeout = setTimeout(
          () => finish(new Error('Сервер не ответил. Попробуй ещё раз.')),
          15000,
        )
        let sent = false
        const sendOnce = () => {
          if (sent) return
          sent = true
          send()
        }
        const unsubscribe = service().subscribe((event, data) => {
          if (event === 'connection:status' && data.connected) sendOnce()
          if (event === 'error') finish(new Error(data.message))
          if (creating && event === 'room:created') finish()
          if (
            !creating &&
            event === 'room:updated' &&
            data.players.some((p: Player) => p.isCurrentPlayer)
          )
            finish()
        })
        const finish = (error?: Error) => {
          clearTimeout(timeout)
          unsubscribe()
          pendingCancel.current = null
          if (error) reject(error)
          else resolve()
        }
        pendingCancel.current = () => finish(new Error('Подключение отменено.'))
        if (mode === 'mock' || liveSocketService.isConnected) sendOnce()
        else liveSocketService.connect(false)
      }),
    [],
  )

  const createRoom = useCallback(
    (opts: RoomOptions) =>
      roomRequest(() => {
        if (mode === 'live') liveSocketService.createRoom(opts)
        else {
          mockGameServer.roomInfo = {
            ...mockGameServer.roomInfo,
            ...opts,
            code: String(100000 + Math.floor(Math.random() * 900000)),
            roomId: crypto.randomUUID(),
            isHost: true,
          }
          mockGameServer.currentPlayer.isHost = true
          mockGameServer.players = [mockGameServer.currentPlayer]
          mockGameServer.openLobby()
        }
      }, true),
    [roomRequest],
  )

  const joinRoom = useCallback(
    (opts: { code: string; nickname: string; avatar?: string }) =>
      roomRequest(() => {
        if (mode === 'live') liveSocketService.joinRoom(opts)
        else if (
          opts.code !== '849215' &&
          opts.code !== mockGameServer.roomInfo.code
        )
          mockGameServer.devTriggerError(
            'Комната не найдена. В деморежиме используй код 849215.',
          )
        else {
          Object.assign(mockGameServer.currentPlayer, {
            nickname: opts.nickname,
            avatar: opts.avatar || '⚡',
            isHost: false,
          })
          Object.assign(mockGameServer.roomInfo, {
            code: opts.code,
            isHost: false,
            topic: 'Космос, Наука и ИИ',
          })
          mockGameServer.players = [
            {
              id: 'demo-host',
              nickname: 'Ведущий',
              avatar: '🪐',
              score: 0,
              isHost: true,
            },
            mockGameServer.currentPlayer,
          ]
          mockGameServer.openLobby()
        }
      }, false),
    [roomRequest],
  )

  const leaveRoom = useCallback(() => {
    pendingCancel.current?.()
    if (mode === 'live') {
      liveSocketService.leaveRoom()
      liveSocketService.connect(false)
    } else mockGameServer.stop()
    setHasRoom(false)
    setPhase('lobby')
    setQuestion(null)
    setFinishedData(null)
    setRoomPlayers([])
    setErrorMessage(null)
  }, [])
  const startLobbyGame = () => {
    setErrorMessage(null)
    if (roomInfo.isHost && connected) service().startGame()
  }
  const submitAnswer = (index: number) => {
    if (!connected) return
    setSelectedOption(index)
    service().submitAnswer(index)
  }
  const nextStep = () => {
    if (!connected || !roomInfo.isHost) return
    if (mode === 'mock' && phase === 'reveal') mockGameServer.showLeaderboard()
    else service().nextStep()
  }
  return {
    connectionMode: mode,
    connected,
    hasRoom,
    phase,
    roomInfo,
    roomPlayers,
    currentPlayer,
    question,
    timeRemaining,
    selectedOption,
    revealData,
    leaderboard,
    finishedData,
    myResult,
    myScore,
    myStreak,
    errorMessage,
    createRoom,
    joinRoom,
    startLobbyGame,
    submitAnswer,
    nextStep,
    leaveRoom,
    setIdentity,
    clearError: () => setErrorMessage(null),
    reconnect: () => liveSocketService.connect(false),
    addBotPlayer: () => {
      if (mode === 'mock')
        mockGameServer.addMockPlayer(
          `Игрок ${mockGameServer.players.length + 1}`,
          ['🦊', '🐸', '👾', '🌻'][mockGameServer.players.length % 4],
        )
    },
  }
}
export type GameEngine = ReturnType<typeof useGameEngine>
