import type {
  GameFinishedData,
  GamePhase,
  GameStats,
  LeaderboardData,
  LeaderboardPlayer,
  Player,
  PlayerAnswerRecord,
  PlayerResult,
  QuestionData,
  QuestionRevealData,
  QuestionWithAnswer,
  RoomInfo
} from '../types/game.js'
import { calculateScore } from './scoring.js'

export type RoomEventEmitter = (
  event: string,
  payload: any,
  targetSocketId?: string
) => void

export interface CreateRoomOptions {
  code: string
  roomId: string
  topic: string
  questionCount?: number
  difficulty?: 'easy' | 'medium' | 'hard'
  hostNickname?: string
  hostSocketId?: string
}

export class Room {
  public readonly code: string
  public readonly roomId: string
  public topic: string
  public questionCount: number
  public difficulty: 'easy' | 'medium' | 'hard'
  public phase: GamePhase = 'lobby'

  public hostId: string | null = null
  private players: Map<string, Player> = new Map()
  private socketToPlayerId: Map<string, string> = new Map()

  public questions: QuestionWithAnswer[] = []
  public currentQuestionIndex = 0
  public questionStartTime = 0
  public timeLimit = 20

  private timerInterval: NodeJS.Timeout | null = null
  private answersForCurrentQuestion: Map<string, PlayerAnswerRecord> = new Map()
  private allAnswers: PlayerAnswerRecord[] = []
  private responseTimesMs: number[] = []

  private eventEmitter: RoomEventEmitter | null = null
  public onGameFinishedHook?: (room: Room, finishedData: GameFinishedData) => void | Promise<void>

  constructor(opts: CreateRoomOptions) {
    this.code = opts.code
    this.roomId = opts.roomId
    this.topic = opts.topic || 'Общие знания'
    this.questionCount = opts.questionCount || 5
    this.difficulty = opts.difficulty || 'medium'
  }

  public setEventEmitter(emitter: RoomEventEmitter): void {
    this.eventEmitter = emitter
  }

  private emit(event: string, payload: any, targetSocketId?: string): void {
    if (this.eventEmitter) {
      this.eventEmitter(event, payload, targetSocketId)
    }
  }

  public getRoomInfo(isHost = false): RoomInfo {
    return {
      code: this.code,
      roomId: this.roomId,
      topic: this.topic,
      questionCount: this.questionCount,
      difficulty: this.difficulty,
      isHost
    }
  }

  public addOrReconnectPlayer(data: {
    nickname: string
    avatar?: string
    socketId: string
    playerId?: string
    isHost?: boolean
  }): { player: Player; isReconnect: boolean } {
    if (data.playerId && this.players.has(data.playerId)) {
      const existing = this.players.get(data.playerId)!
      if (existing.socketId) {
        this.socketToPlayerId.delete(existing.socketId)
      }
      existing.socketId = data.socketId
      existing.disconnected = false
      if (data.nickname) existing.nickname = data.nickname
      if (data.avatar) existing.avatar = data.avatar
      this.socketToPlayerId.set(data.socketId, existing.id)

      this.broadcastRoomUpdated()
      return { player: existing, isReconnect: true }
    }

    for (const p of this.players.values()) {
      if (p.disconnected && p.nickname.toLowerCase() === data.nickname.trim().toLowerCase()) {
        if (p.socketId) {
          this.socketToPlayerId.delete(p.socketId)
        }
        p.socketId = data.socketId
        p.disconnected = false
        if (data.avatar) p.avatar = data.avatar
        this.socketToPlayerId.set(data.socketId, p.id)

        this.broadcastRoomUpdated()
        return { player: p, isReconnect: true }
      }
    }

    const playerId = data.playerId || `player-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`
    const isFirstPlayer = this.players.size === 0
    const isHost = data.isHost ?? isFirstPlayer

    const newPlayer: Player = {
      id: playerId,
      nickname: data.nickname.trim(),
      avatar: data.avatar || '⚡',
      score: 0,
      rank: this.players.size + 1,
      streak: 0,
      isHost,
      answered: false,
      disconnected: false,
      socketId: data.socketId
    }

    if (isHost && !this.hostId) {
      this.hostId = playerId
    }

    this.players.set(playerId, newPlayer)
    this.socketToPlayerId.set(data.socketId, playerId)

    this.broadcastRoomUpdated()
    return { player: newPlayer, isReconnect: false }
  }

  public handleDisconnect(socketId: string): Player | null {
    const playerId = this.socketToPlayerId.get(socketId)
    if (!playerId) return null

    this.socketToPlayerId.delete(socketId)
    const player = this.players.get(playerId)
    if (player) {
      player.disconnected = true
      player.socketId = undefined
      this.broadcastRoomUpdated()
      return player
    }
    return null
  }

  public getPlayerBySocketId(socketId: string): Player | undefined {
    const id = this.socketToPlayerId.get(socketId)
    return id ? this.players.get(id) : undefined
  }

  public getPlayerById(playerId: string): Player | undefined {
    return this.players.get(playerId)
  }

  public getPlayers(): Player[] {
    return Array.from(this.players.values())
  }

  public getConnectedPlayers(): Player[] {
    return Array.from(this.players.values()).filter(p => !p.disconnected)
  }

  public broadcastRoomUpdated(): void {
    const playersList = this.getPlayers()
    this.emit('room:updated', { players: playersList })
  }

  public startGame(questions: QuestionWithAnswer[]): void {
    if (this.phase !== 'lobby') {
      throw new Error(`Cannot start game from phase "${this.phase}"`)
    }
    if (questions.length === 0) {
      throw new Error('No questions provided for game')
    }

    this.questions = questions
    this.currentQuestionIndex = 0
    this.allAnswers = []
    this.responseTimesMs = []

    for (const p of this.players.values()) {
      p.score = 0
      p.streak = 0
      p.rank = 1
      p.answered = false
    }

    this.showQuestion(0)
  }

  private showQuestion(index: number): void {
    this.clearTimers()
    this.currentQuestionIndex = index
    this.phase = 'question'
    this.answersForCurrentQuestion.clear()

    for (const p of this.players.values()) {
      p.answered = false
    }

    const q = this.questions[index]
    this.timeLimit = q.timeLimit || 20
    this.questionStartTime = Date.now()

    const questionPayload: QuestionData = {
      questionId: q.questionId,
      text: q.text,
      options: q.options,
      timeLimit: this.timeLimit,
      index: q.index || index + 1,
      total: this.questions.length
    }

    this.emit('question:show', questionPayload)
    this.startServerTimer()
  }

  private startServerTimer(): void {
    this.clearTimers()
    let remaining = this.timeLimit

    this.timerInterval = setInterval(() => {
      remaining -= 1
      this.emit('timer:tick', { remaining: Math.max(0, remaining) })

      if (remaining <= 0) {
        this.clearTimers()
        this.revealCurrentQuestion()
      }
    }, 1000)
  }

  public clearTimers(): void {
    if (this.timerInterval) {
      clearInterval(this.timerInterval)
      this.timerInterval = null
    }
  }

  public submitAnswer(params: {
    playerId: string
    questionId: string
    optionIndex: number
    socketId?: string
  }): { success: boolean; error?: string } {
    if (this.phase !== 'question') {
      return { success: false, error: 'Game is not currently accepting answers' }
    }

    const currentQ = this.getCurrentQuestion()
    if (!currentQ || currentQ.questionId !== params.questionId) {
      return { success: false, error: 'Question ID mismatch or question not found' }
    }

    const player = this.players.get(params.playerId)
    if (!player) {
      return { success: false, error: 'Player not found in room' }
    }

    if (this.answersForCurrentQuestion.has(params.playerId) || player.answered) {
      return { success: false, error: 'Answer already submitted for this question' }
    }

    if (params.optionIndex < 0 || params.optionIndex > 3) {
      return { success: false, error: 'Invalid option index (must be 0-3)' }
    }

    const now = Date.now()
    const responseTimeMs = Math.max(0, now - this.questionStartTime)
    this.responseTimesMs.push(responseTimeMs)

    const remainingSec = Math.max(0, (this.questionStartTime + this.timeLimit * 1000 - now) / 1000)
    const isCorrect = params.optionIndex === currentQ.correctIndex

    const scoring = calculateScore({
      isCorrect,
      remainingTimeSec: remainingSec,
      totalTimeSec: this.timeLimit,
      currentStreak: player.streak
    })

    player.answered = true
    player.score += scoring.points
    player.streak = scoring.newStreak

    const record: PlayerAnswerRecord = {
      playerId: player.id,
      questionId: currentQ.questionId,
      optionIndex: params.optionIndex,
      correct: isCorrect,
      responseTimeMs,
      pointsAwarded: scoring.points,
      timestamp: now
    }

    this.answersForCurrentQuestion.set(player.id, record)
    this.allAnswers.push(record)

    this.emit('answer:accepted', { questionId: currentQ.questionId }, params.socketId || player.socketId)
    this.emit('room:player_answered', { playerId: player.id })

    this.checkAllAnswered()

    return { success: true }
  }

  private checkAllAnswered(): void {
    const nonHostActive = Array.from(this.players.values()).filter(p => !p.disconnected && !p.isHost)
    const activePlayers = nonHostActive.length > 0
      ? nonHostActive
      : Array.from(this.players.values()).filter(p => !p.disconnected)

    if (activePlayers.length === 0) return

    const allAnswered = activePlayers.every(p => p.answered)
    if (allAnswered) {
      this.clearTimers()
      setTimeout(() => {
        if (this.phase === 'question') {
          this.revealCurrentQuestion()
        }
      }, 350)
    }
  }

  public revealCurrentQuestion(): void {
    this.clearTimers()
    this.phase = 'reveal'

    const currentQ = this.getCurrentQuestion()
    if (!currentQ) return

    const results: PlayerResult[] = []

    for (const player of this.players.values()) {
      const ans = this.answersForCurrentQuestion.get(player.id)
      const correct = ans ? ans.correct : false
      const points = ans ? ans.pointsAwarded : 0

      if (!ans) {
        player.streak = 0
      }

      results.push({
        playerId: player.id,
        correct,
        points,
        streak: player.streak,
        rank: player.rank
      })
    }

    const revealData: QuestionRevealData = {
      questionId: currentQ.questionId,
      correctIndex: currentQ.correctIndex,
      results,
      explanation: currentQ.explanation
    }

    this.emit('question:reveal', revealData)
  }

  public showLeaderboard(): void {
    this.phase = 'leaderboard'
    const sorted = Array.from(this.players.values()).sort((a, b) => b.score - a.score)

    const leaderboardPlayers: LeaderboardPlayer[] = sorted.map((p, idx) => {
      const prev = p.rank || (idx + 1)
      p.rank = idx + 1
      return {
        id: p.id,
        nickname: p.nickname,
        score: p.score,
        rank: idx + 1,
        avatar: p.avatar,
        streak: p.streak,
        previousRank: prev
      }
    })

    const leaderboardData: LeaderboardData = {
      players: leaderboardPlayers
    }

    this.emit('leaderboard:update', leaderboardData)
  }

  public nextStep(): void {
    this.clearTimers()

    if (this.phase === 'reveal') {
      this.showLeaderboard()
      return
    }

    if (this.currentQuestionIndex + 1 < this.questions.length) {
      this.showQuestion(this.currentQuestionIndex + 1)
    } else {
      this.finishGame()
    }
  }

  public finishGame(): void {
    this.clearTimers()
    this.phase = 'finished'

    const sorted = Array.from(this.players.values()).sort((a, b) => b.score - a.score)
    const leaderboardPlayers: LeaderboardPlayer[] = sorted.map((p, idx) => ({
      id: p.id,
      nickname: p.nickname,
      score: p.score,
      rank: idx + 1,
      avatar: p.avatar,
      streak: p.streak
    }))

    const correctAnswersCount = this.allAnswers.filter(a => a.correct).length
    const avgResponseSec = this.responseTimesMs.length > 0
      ? Math.round((this.responseTimesMs.reduce((a, b) => a + b, 0) / this.responseTimesMs.length / 1000) * 10) / 10
      : 0

    let highestStreak = 0
    for (const p of this.players.values()) {
      if (p.streak > highestStreak) highestStreak = p.streak
    }

    const questionAccuracy = new Map<string, { total: number; correct: number }>()
    for (const ans of this.allAnswers) {
      const stat = questionAccuracy.get(ans.questionId) || { total: 0, correct: 0 }
      stat.total += 1
      if (ans.correct) stat.correct += 1
      questionAccuracy.set(ans.questionId, stat)
    }

    let hardestQuestionText: string | undefined
    let lowestRatio = 1.1

    for (const q of this.questions) {
      const stat = questionAccuracy.get(q.questionId)
      if (stat && stat.total > 0) {
        const ratio = stat.correct / stat.total
        if (ratio < lowestRatio) {
          lowestRatio = ratio
          hardestQuestionText = q.text
        }
      }
    }

    const stats: GameStats = {
      totalQuestions: this.questions.length,
      correctAnswersCount,
      averageResponseTimeSec: avgResponseSec,
      highestStreak,
      hardestQuestionText: hardestQuestionText || (this.questions[0]?.text ?? undefined)
    }

    const finishedData: GameFinishedData = {
      leaderboard: leaderboardPlayers,
      stats
    }

    this.emit('game:finished', finishedData)

    if (this.onGameFinishedHook) {
      try {
        this.onGameFinishedHook(this, finishedData)
      } catch (err) {
        console.error(`[Room ${this.code}] Error in onGameFinishedHook:`, err)
      }
    }
  }

  public getCurrentQuestion(): QuestionWithAnswer | undefined {
    return this.questions[this.currentQuestionIndex]
  }

  public destroy(): void {
    this.clearTimers()
    this.players.clear()
    this.socketToPlayerId.clear()
    this.answersForCurrentQuestion.clear()
    this.allAnswers = []
    this.eventEmitter = null
  }
}
