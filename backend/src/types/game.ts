/**
 * QuizBlitz Core Game Types
 * Matches the specification in quizblitz-project.md (Sections 6, 7 & 8)
 */

export type GamePhase =
  | 'lobby'
  | 'question'
  | 'waiting'
  | 'reveal'
  | 'leaderboard'
  | 'finished'

export interface Player {
  id: string
  nickname: string
  avatar?: string
  score: number
  rank?: number
  streak: number
  isHost: boolean
  answered: boolean
  disconnected?: boolean
  socketId?: string
}

export interface PlayerResult {
  playerId: string
  correct: boolean
  points: number
  streak: number
  rank?: number
}

export interface QuestionData {
  questionId: string
  text: string
  options: [string, string, string, string] // Exactly 4 options
  timeLimit: number // seconds (default 20)
  index: number // 1-based (e.g. 1 of 5)
  total: number // total questions
}

export interface QuestionWithAnswer extends QuestionData {
  correctIndex: number // 0, 1, 2, 3
  explanation?: string
}

export interface QuestionRevealData {
  questionId: string
  correctIndex: number
  results: PlayerResult[]
  explanation?: string
}

export interface LeaderboardPlayer {
  id: string
  nickname: string
  score: number
  rank: number
  avatar?: string
  streak: number
  previousRank?: number
}

export interface LeaderboardData {
  players: LeaderboardPlayer[]
}

export interface GameStats {
  totalQuestions: number
  correctAnswersCount: number
  playerCorrectCounts?: Record<string, number>
  averageResponseTimeSec: number
  highestStreak: number
  hardestQuestionText?: string
}

export interface GameFinishedData {
  leaderboard: LeaderboardPlayer[]
  stats: GameStats
}

export interface GameError {
  code: string
  message: string
}

export interface RoomInfo {
  code: string
  roomId: string
  topic: string
  questionCount: number
  difficulty: 'easy' | 'medium' | 'hard'
  isHost: boolean
}

export interface PlayerAnswerRecord {
  playerId: string
  questionId: string
  optionIndex: number
  correct: boolean
  responseTimeMs: number
  pointsAwarded: number
  timestamp: number
}
