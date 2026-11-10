import type {
  GameFinishedData,
  GameStats,
  LeaderboardData,
  LeaderboardPlayer,
  Player,
  PlayerResult,
  QuestionData,
  QuestionRevealData,
  RoomInfo,
} from '../types/game'
import { MOCK_QUESTIONS, type QuestionWithAnswer } from './mockQuestions'

export type GameEventListener = (event: string, data: any) => void

export class MockGameServer {
  private listeners: Set<GameEventListener> = new Set()
  private questions: QuestionWithAnswer[] = MOCK_QUESTIONS
  private currentQuestionIdx = 0
  private timerInterval: number | null = null
  private autoAdvanceTimer: number | null = null
  private botTimers: number[] = []

  public roomInfo: RoomInfo = {
    code: '849215',
    roomId: 'room-beta-42',
    topic: 'Космос, Наука и ИИ',
    questionCount: 5,
    difficulty: 'medium',
    isHost: true,
  }

  public currentPlayer: Player = {
    id: 'player-karapuz',
    nickname: 'karapuz1226',
    avatar: '👾',
    score: 0,
    rank: 1,
    streak: 0,
    isCurrentPlayer: true,
    answered: false,
    isHost: true,
  }

  public players: Player[] = [
    this.currentPlayer,
    {
      id: 'player-nonwire',
      nickname: 'Nonwire',
      avatar: '⚡',
      score: 0,
      rank: 2,
      streak: 0,
      answered: false,
    },
    {
      id: 'player-eco1kd',
      nickname: 'eco1kd',
      avatar: '🚀',
      score: 0,
      rank: 3,
      streak: 0,
      answered: false,
    },
    {
      id: 'player-raikuchan',
      nickname: 'raikuchan',
      avatar: '🐱',
      score: 0,
      rank: 4,
      streak: 0,
      answered: false,
    },
    {
      id: 'player-neo',
      nickname: 'cyber_neo',
      avatar: '🤖',
      score: 0,
      rank: 5,
      streak: 0,
      answered: false,
    },
  ]

  public timeRemaining = 20
  public questionStartTime = 0
  public isAutoMode = true
  public selectedOption: number | null = null
  public lastResults: PlayerResult[] = []

  // Статистика сессии игрока
  public stats: GameStats = {
    totalQuestions: 5,
    correctAnswersCount: 0,
    averageResponseTimeSec: 0,
    highestStreak: 0,
    hardestQuestionText:
      'Какая планета Солнечной системы вращается вокруг своей оси лёжа на боку?',
  }

  private responseTimes: number[] = []

  public subscribe(listener: GameEventListener): () => void {
    this.listeners.add(listener)
    return () => this.listeners.delete(listener)
  }

  private emit(event: string, data: any) {
    this.listeners.forEach((fn) => fn(event, data))
  }

  public getCurrentQuestion(): QuestionWithAnswer {
    return this.questions[this.currentQuestionIdx]
  }

  public openLobby() {
    this.clearTimers()
    this.resetPlayers()
    this.emit('room:created', {
      code: this.roomInfo.code,
      roomId: this.roomInfo.roomId,
    })
    this.emit('room:updated', { players: this.players })
  }

  public addMockPlayer(nickname: string, avatar: string) {
    const newPlayer: Player = {
      id: `player-${Date.now()}`,
      nickname,
      avatar,
      score: 0,
      streak: 0,
      answered: false,
    }
    this.players.push(newPlayer)
    this.emit('room:updated', { players: [...this.players] })
  }

  public stop() {
    this.clearTimers()
  }

  public startGame() {
    this.questions = Array.from(
      { length: this.roomInfo.questionCount },
      (_, index) => ({
        ...MOCK_QUESTIONS[index % MOCK_QUESTIONS.length],
        questionId: `demo-q-${index}`,
        index: index + 1,
        total: this.roomInfo.questionCount,
      }),
    )
    this.currentQuestionIdx = 0
    this.resetPlayers()
    this.responseTimes = []
    this.stats.correctAnswersCount = 0
    this.stats.highestStreak = 0
    this.stats.totalQuestions = this.questions.length
    this.showCurrentQuestion()
  }

  private resetPlayers() {
    this.players.forEach((p) => {
      p.score = 0
      p.streak = 0
      p.rank = 1
      p.answered = false
    })
    this.currentPlayer.score = 0
    this.currentPlayer.streak = 0
    this.currentPlayer.rank = 1
  }

  public showCurrentQuestion() {
    this.clearTimers()
    const q = this.questions[this.currentQuestionIdx]
    this.timeRemaining = q.timeLimit
    this.questionStartTime = Date.now()
    this.selectedOption = null
    this.players.forEach((p) => (p.answered = false))

    const questionPayload: QuestionData = {
      questionId: q.questionId,
      text: q.text,
      options: q.options,
      timeLimit: q.timeLimit,
      index: q.index,
      total: q.total,
    }

    this.emit('question:show', questionPayload)

    if (this.isAutoMode) {
      this.startCountdown()
      this.simulateBotsAnswering()
    }
  }

  private startCountdown() {
    this.timerInterval = window.setInterval(() => {
      this.timeRemaining -= 1
      this.emit('timer:tick', { remaining: this.timeRemaining })

      if (this.timeRemaining <= 0) {
        this.clearTimers()
        this.revealCurrentQuestion()
      }
    }, 1000)
  }

  private clearTimers() {
    this.botTimers.forEach(clearTimeout)
    this.botTimers = []
    if (this.timerInterval) {
      clearInterval(this.timerInterval)
      this.timerInterval = null
    }
    if (this.autoAdvanceTimer) {
      clearTimeout(this.autoAdvanceTimer)
      this.autoAdvanceTimer = null
    }
  }

  public submitAnswer(optionIndex: number) {
    if (this.selectedOption !== null) return
    this.selectedOption = optionIndex
    this.currentPlayer.answered = true

    const elapsedSeconds = (Date.now() - this.questionStartTime) / 1000
    this.responseTimes.push(elapsedSeconds)

    this.emit('answer:accepted', {
      questionId: this.getCurrentQuestion().questionId,
    })

    const allAnswered = this.players.every((p) => p.answered)
    if (allAnswered && this.isAutoMode) {
      this.clearTimers()
      this.autoAdvanceTimer = window.setTimeout(() => {
        this.revealCurrentQuestion()
      }, 1000)
    }
  }

  private simulateBotsAnswering() {
    this.players
      .filter((p) => !p.isCurrentPlayer)
      .forEach((bot) => {
        const delay = 2000 + Math.random() * 8000
        this.botTimers.push(
          window.setTimeout(() => {
            if (this.timeRemaining > 0 && !bot.answered) {
              bot.answered = true
              this.emit('room:player_answered', { playerId: bot.id })
            }
          }, delay),
        )
      })
  }

  public revealCurrentQuestion() {
    this.clearTimers()
    const q = this.getCurrentQuestion()
    const results: PlayerResult[] = []

    this.players.forEach((player) => {
      let isCorrect = false
      let points = 0

      if (player.isCurrentPlayer) {
        isCorrect = this.selectedOption === q.correctIndex
      } else {
        isCorrect = Math.random() < 0.72
      }

      if (isCorrect) {
        player.streak = (player.streak || 0) + 1
        const streakMultiplier =
          player.streak >= 5 ? 1.5 : player.streak >= 3 ? 1.2 : 1.0
        const ratio = Math.max(0.15, this.timeRemaining / q.timeLimit)
        points = Math.round(1000 * ratio * streakMultiplier)
        player.score += points

        if (player.isCurrentPlayer) {
          this.stats.correctAnswersCount += 1
          if (player.streak > this.stats.highestStreak) {
            this.stats.highestStreak = player.streak
          }
        }
      } else {
        player.streak = 0
        points = 0
      }

      results.push({
        playerId: player.id,
        correct: isCorrect,
        points,
        streak: player.streak,
      })
    })

    this.lastResults = results

    const revealData: QuestionRevealData = {
      questionId: q.questionId,
      correctIndex: q.correctIndex,
      results,
      explanation: q.explanation,
    }

    this.emit('question:reveal', revealData)

    if (this.isAutoMode) {
      this.autoAdvanceTimer = window.setTimeout(() => {
        this.showLeaderboard()
      }, 4500)
    }
  }

  public showLeaderboard() {
    this.clearTimers()
    const sorted = [...this.players].sort((a, b) => b.score - a.score)
    const leaderboardPlayers: LeaderboardPlayer[] = sorted.map((p, idx) => {
      const prev = p.rank || idx + 1
      p.rank = idx + 1
      return {
        id: p.id,
        nickname: p.nickname,
        score: p.score,
        rank: idx + 1,
        avatar: p.avatar,
        streak: p.streak,
        previousRank: prev,
      }
    })

    const leaderboardData: LeaderboardData = {
      players: leaderboardPlayers,
    }

    this.emit('leaderboard:update', leaderboardData)

    if (this.isAutoMode) {
      this.autoAdvanceTimer = window.setTimeout(() => {
        this.nextStep()
      }, 5000)
    }
  }

  public nextStep() {
    this.clearTimers()
    if (this.currentQuestionIdx + 1 < this.questions.length) {
      this.currentQuestionIdx += 1
      this.showCurrentQuestion()
    } else {
      this.finishGame()
    }
  }

  public finishGame() {
    this.clearTimers()
    const sorted = [...this.players].sort((a, b) => b.score - a.score)
    const leaderboardPlayers: LeaderboardPlayer[] = sorted.map((p, idx) => ({
      id: p.id,
      nickname: p.nickname,
      score: p.score,
      rank: idx + 1,
      avatar: p.avatar,
      streak: p.streak,
    }))

    const avgTime = this.responseTimes.length
      ? Math.round(
          (this.responseTimes.reduce((a, b) => a + b, 0) /
            this.responseTimes.length) *
            10,
        ) / 10
      : 0
    this.stats.averageResponseTimeSec = avgTime

    const finishedData: GameFinishedData = {
      leaderboard: leaderboardPlayers,
      stats: this.stats,
    }

    this.emit('game:finished', finishedData)
  }

  public devSetPhase(
    phase:
      'lobby' | 'question' | 'waiting' | 'reveal' | 'leaderboard' | 'finished',
    opts?: { correct?: boolean },
  ) {
    this.clearTimers()
    this.isAutoMode = false

    if (phase === 'lobby') {
      this.openLobby()
    } else if (phase === 'question') {
      this.showCurrentQuestion()
    } else if (phase === 'waiting') {
      this.selectedOption = 1
      this.currentPlayer.answered = true
      this.emit('answer:accepted', {
        questionId: this.getCurrentQuestion().questionId,
      })
    } else if (phase === 'reveal') {
      if (opts?.correct !== undefined) {
        this.selectedOption = opts.correct
          ? this.getCurrentQuestion().correctIndex
          : (this.getCurrentQuestion().correctIndex + 1) % 4
      } else {
        this.selectedOption = this.getCurrentQuestion().correctIndex
      }
      this.revealCurrentQuestion()
    } else if (phase === 'leaderboard') {
      this.showLeaderboard()
    } else if (phase === 'finished') {
      this.finishGame()
    }
  }

  public devTriggerError(msg: string) {
    this.emit('error', { code: 'DEV_SIMULATED_ERROR', message: msg })
  }
}

export const mockGameServer = new MockGameServer()
