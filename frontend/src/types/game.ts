/**
 * QuizBlitz Types & Event Contracts
 * Соответствует спецификации quizblitz-project.md (Разделы 6 и 7)
 */

export interface Player {
  id: string
  nickname: string
  avatar?: string
  score: number
  rank?: number
  streak?: number
  isCurrentPlayer?: boolean
  answered?: boolean
  isHost?: boolean
}

export interface PlayerResult {
  playerId: string
  correct: boolean
  points: number
  streak?: number
  rank?: number
}

export interface QuestionData {
  questionId: string
  text: string
  options: [string, string, string, string] // ровно 4 варианта
  timeLimit: number // в секундах, обычно 20
  index: number // 1-based (например 1 из 5)
  total: number // всего вопросов
}

export interface QuestionRevealData {
  questionId: string
  correctIndex: number // 0, 1, 2, 3
  results: PlayerResult[]
  explanation?: string
}

export interface LeaderboardPlayer {
  id: string
  nickname: string
  score: number
  rank: number
  avatar?: string
  streak?: number
  previousRank?: number
}

export interface LeaderboardData {
  players: LeaderboardPlayer[]
}

export interface GameStats {
  totalQuestions: number
  correctAnswersCount: number
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

/**
 * Стадии игрового экрана
 */
export type GamePhase =
  | 'lobby' // экран лобби ожидания игроков
  | 'idle' // ожидание старта
  | 'question' // показан вопрос, идет таймер, выбор ответа
  | 'waiting' // ответ выбран игроком, ожидание других игроков / таймера
  | 'reveal' // показ правильного ответа и начисленных очков
  | 'leaderboard' // турнирная таблица между вопросами
  | 'finished' // подиум топ-3 и финальная статистика
