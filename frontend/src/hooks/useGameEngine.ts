import { useState, useEffect, useCallback } from 'react'
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

export function useGameEngine() {
  const [phase, setPhase] = useState<GamePhase>('lobby')
  const [roomInfo] = useState<RoomInfo>(mockGameServer.roomInfo)
  const [roomPlayers, setRoomPlayers] = useState<Player[]>([...mockGameServer.players])
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
    const unsubscribe = mockGameServer.subscribe((event, data) => {
      switch (event) {
        case 'room:created':
          setPhase('lobby')
          break

        case 'room:updated':
          setRoomPlayers([...data.players])
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
          const mine = rev.results.find(r => r.playerId === mockGameServer.currentPlayer.id)
          if (mine) {
            setMyResult(mine)
            setMyScore(mockGameServer.currentPlayer.score)
            setMyStreak(mine.streak || 0)
          }
          setPhase('reveal')
          break
        }

        case 'leaderboard:update':
          setLeaderboard(data)
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
    })

    return () => {
      unsubscribe()
    }
  }, [])

  const startLobbyGame = useCallback(() => {
    mockGameServer.startGame()
  }, [])

  const submitAnswer = useCallback((optionIndex: number) => {
    setSelectedOption(optionIndex)
    mockGameServer.submitAnswer(optionIndex)
  }, [])

  const restartGame = useCallback(() => {
    mockGameServer.isAutoMode = true
    setIsAutoMode(true)
    mockGameServer.startGame()
  }, [])

  const toggleAutoMode = useCallback((active: boolean) => {
    mockGameServer.isAutoMode = active
    setIsAutoMode(active)
  }, [])

  const setDevPhase = useCallback((targetPhase: 'lobby' | 'question' | 'waiting' | 'reveal' | 'leaderboard' | 'finished', opts?: { correct?: boolean }) => {
    mockGameServer.devSetPhase(targetPhase, opts)
    if (opts?.correct !== undefined && targetPhase === 'reveal') {
      setSelectedOption(opts.correct ? mockGameServer.getCurrentQuestion().correctIndex : (mockGameServer.getCurrentQuestion().correctIndex + 1) % 4)
    }
  }, [])

  const triggerDevError = useCallback((msg: string) => {
    mockGameServer.devTriggerError(msg)
  }, [])

  const addBotPlayer = useCallback((nickname: string, avatar: string) => {
    mockGameServer.addMockPlayer(nickname, avatar)
  }, [])

  return {
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
    startLobbyGame,
    submitAnswer,
    restartGame,
    toggleAutoMode,
    setDevPhase,
    triggerDevError,
    addBotPlayer,
    currentPlayer: mockGameServer.currentPlayer
  }
}
