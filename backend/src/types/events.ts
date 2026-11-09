import type {
  GameFinishedData,
  GameError,
  LeaderboardData,
  Player,
  QuestionData,
  QuestionRevealData
} from './game.js'

export interface ClientToServerEvents {
  'room:create': (data: {
    topic: string
    questionCount?: number
    difficulty?: 'easy' | 'medium' | 'hard'
  }) => void
  'room:join': (data: {
    code: string
    nickname: string
    avatar?: string
    playerId?: string
  }) => void
  'game:start': (data?: Record<string, never>) => void
  'answer:submit': (data: {
    questionId: string
    optionIndex: number
  }) => void
  'game:next': (data?: Record<string, never>) => void
}

export interface ServerToClientEvents {
  'room:created': (data: { code: string; roomId: string }) => void
  'room:updated': (data: { players: Player[] }) => void
  'question:show': (data: QuestionData) => void
  'timer:tick': (data: { remaining: number }) => void
  'answer:accepted': (data: { questionId: string }) => void
  'room:player_answered': (data: { playerId: string }) => void
  'question:reveal': (data: QuestionRevealData) => void
  'leaderboard:update': (data: LeaderboardData) => void
  'game:finished': (data: GameFinishedData) => void
  'error': (data: GameError) => void
}

export interface SocketData {
  playerId?: string
  roomId?: string
  isHost?: boolean
}
