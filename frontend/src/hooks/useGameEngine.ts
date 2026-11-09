import { useState, useEffect, useCallback, useRef } from 'react'
import type {
  GameFinishedData,
  GamePhase,
  LeaderboardData,
  QuestionData,
  QuestionRevealData,
  PlayerResult,
  Player,
  RoomInfo
} from '../types/game'
import { mockGameServer } from '../services/mockSocket'
import { liveSocketService } from '../services/liveSocket'

export type ConnectionMode = 'live' | 'mock'

export function useGameEngine() {
  const [connectionMode, setConnectionMode] = useState<ConnectionMode>('mock')
  const modeRef = useRef<ConnectionMode>('mock')

  const [phase, setPhase] = useState<GamePhase>('lobby')
  const [roomInfo, setRoomInfo] = useState<RoomInfo>(mockGameServer.roomInfo)
  const [roomPlayers, setRoomPlayers] = useState<Player[]>([...mockGameServer.players])
  const [currentPlayer, setCurrentPlayer] = useState<Player>(mockGameServer.currentPlayer)
  const [question, setQuestion] = useState<QuestionData | null>(null)
  const [timeRemaining, setTimeRemaining] = useState<number>(20)
  const [selectedOption, setSelectedOption] = useState<number | null>(null)
  const [revealData, setRevealData] = useState<QuestionRevealData | null>(null)
  const [leaderboard, setLeaderboard] = useState<LeaderboardData | null>(null)
  const [finishedData, setFinishedData] = useState<GameFinishedData | null>(null)
  const [myResult, setMyResult] = useState<PlayerResult | null>(null)
  const [myScore, setMyScore] = useState<number>(0)
  const [myStreak, setMyStreak] = useState<number>(0)
  const [errorMessage, setErrorMessage] = useState<string | null>(null)
  const [isAutoMode, setIsAutoMode] = useState<boolean>(true)

  useEffect(() => {
    const handleEvent = (source: ConnectionMode) => (event: string, data: any) => {
      if (event === 'connection:status') {
        if (data.connected) {
          modeRef.current = 'live'
          setConnectionMode('live')
          setRoomInfo({ ...liveSocketService.roomInfo })
          setCurrentPlayer({ ...liveSocketService.currentPlayer })
        } else if (modeRef.current === 'live') {
          modeRef.current = 'mock'
          setConnectionMode('mock')
          setRoomInfo({ ...mockGameServer.roomInfo })
          setRoomPlayers([...mockGameServer.players])
          setCurrentPlayer({ ...mockGameServer.currentPlayer })
        }
        return
      }

      if (source !== modeRef.current) return

      const activeEngine = source === 'live' ? liveSocketService : mockGameServer

      switch (event) {
        case 'room:created':
          setRoomInfo({ ...activeEngine.roomInfo })
          setCurrentPlayer({ ...activeEngine.currentPlayer })
          setMyScore(0)
          setMyStreak(0)
          setPhase('lobby')
          break

        case 'room:updated':
          setRoomPlayers([...data.players])
          setRoomInfo({ ...activeEngine.roomInfo })
          setCurrentPlayer({ ...activeEngine.currentPlayer })
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
          const rev: QuestionRevealData = data
          setRevealData(rev)
          const mine = rev.results.find(r => r.playerId === activeEngine.currentPlayer.id)
          if (mine) {
            setMyResult(mine)
            setMyScore(activeEngine.currentPlayer.score)
            setMyStreak(mine.streak || 0)
          }
          setPhase('reveal')
          break
        }

        case 'leaderboard:update':
          setLeaderboard(data)
          setMyScore(activeEngine.currentPlayer.score)
          setCurrentPlayer({ ...activeEngine.currentPlayer })
          setPhase('leaderboard')
          break

        case 'game:finished':
          setFinishedData(data)
          setPhase('finished')
          break

        case 'error':
          setErrorMessage(data.message)
          setTimeout(() => setErrorMessage(null), 4000)
          break

        default:
          break
      }
    }

    const unsubMock = mockGameServer.subscribe(handleEvent('mock'))
    const unsubLive = liveSocketService.subscribe(handleEvent('live'))

    // Автоматически пробуем подключиться к реальному бэкенду @eco1kd (localhost:3001)
    liveSocketService.connect(true)

    return () => {
      unsubMock()
      unsubLive()
    }
  }, [])

  const switchConnectionMode = useCallback((target: ConnectionMode) => {
    modeRef.current = target
    setConnectionMode(target)
    if (target === 'live') {
      liveSocketService.connect(true)
      setRoomInfo({ ...liveSocketService.roomInfo })
      setRoomPlayers([...liveSocketService.players])
      setCurrentPlayer({ ...liveSocketService.currentPlayer })
    } else {
      liveSocketService.disconnect()
      mockGameServer.openLobby()
      setRoomInfo({ ...mockGameServer.roomInfo })
      setRoomPlayers([...mockGameServer.players])
      setCurrentPlayer({ ...mockGameServer.currentPlayer })
      setPhase('lobby')
    }
  }, [])

  const createRoom = useCallback((opts: { topic: string; questionCount: number; difficulty: 'easy' | 'medium' | 'hard' }) => {
    if (modeRef.current === 'live') {
      liveSocketService.createRoom(opts)
    } else {
      mockGameServer.roomInfo.topic = opts.topic
      mockGameServer.roomInfo.questionCount = opts.questionCount
      mockGameServer.roomInfo.difficulty = opts.difficulty
      mockGameServer.openLobby()
      setRoomInfo({ ...mockGameServer.roomInfo })
    }
  }, [])

  const joinRoom = useCallback((opts: { code: string; nickname: string; avatar?: string }) => {
    if (modeRef.current === 'live') {
      liveSocketService.joinRoom(opts)
    } else {
      mockGameServer.currentPlayer.nickname = opts.nickname
      if (opts.avatar) mockGameServer.currentPlayer.avatar = opts.avatar
      mockGameServer.roomInfo.code = opts.code
      mockGameServer.openLobby()
    }
  }, [])

  const startLobbyGame = useCallback(() => {
    if (modeRef.current === 'live') {
      liveSocketService.startGame()
    } else {
      mockGameServer.startGame()
    }
  }, [])

  const submitAnswer = useCallback((optionIndex: number) => {
    setSelectedOption(optionIndex)
    if (modeRef.current === 'live') {
      liveSocketService.submitAnswer(optionIndex)
    } else {
      mockGameServer.submitAnswer(optionIndex)
    }
  }, [])

  const nextStep = useCallback(() => {
    if (modeRef.current === 'live') {
      liveSocketService.nextStep()
    } else {
      if (phase === 'reveal') {
        mockGameServer.showLeaderboard()
      } else {
        mockGameServer.nextStep()
      }
    }
  }, [phase])

  const restartGame = useCallback(() => {
    if (modeRef.current === 'live') {
      liveSocketService.isAutoMode = true
      setIsAutoMode(true)
      liveSocketService.createRoom({
        topic: liveSocketService.roomInfo.topic,
        questionCount: liveSocketService.roomInfo.questionCount,
        difficulty: liveSocketService.roomInfo.difficulty
      })
    } else {
      mockGameServer.isAutoMode = true
      setIsAutoMode(true)
      mockGameServer.startGame()
    }
  }, [])

  const toggleAutoMode = useCallback((active: boolean) => {
    mockGameServer.isAutoMode = active
    liveSocketService.isAutoMode = active
    setIsAutoMode(active)
  }, [])

  const setDevPhase = useCallback((targetPhase: 'lobby' | 'question' | 'waiting' | 'reveal' | 'leaderboard' | 'finished', opts?: { correct?: boolean }) => {
    modeRef.current = 'mock'
    setConnectionMode('mock')
    mockGameServer.devSetPhase(targetPhase, opts)
    if (opts?.correct !== undefined && targetPhase === 'reveal') {
      setSelectedOption(opts.correct ? mockGameServer.getCurrentQuestion().correctIndex : (mockGameServer.getCurrentQuestion().correctIndex + 1) % 4)
    }
  }, [])

  const triggerDevError = useCallback((msg: string) => {
    mockGameServer.devTriggerError(msg)
  }, [])

  const addBotPlayer = useCallback((nickname: string, avatar: string) => {
    if (modeRef.current === 'live') {
      liveSocketService.spawnLiveBot(nickname, avatar)
    } else {
      mockGameServer.addMockPlayer(nickname, avatar)
    }
  }, [])

  return {
    connectionMode,
    switchConnectionMode,
    phase,
    roomInfo,
    roomPlayers,
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
    isAutoMode,
    createRoom,
    joinRoom,
    startLobbyGame,
    submitAnswer,
    nextStep,
    restartGame,
    toggleAutoMode,
    setDevPhase,
    triggerDevError,
    addBotPlayer,
    currentPlayer
  }
}
