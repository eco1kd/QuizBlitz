/**
 * Scoring calculation based on section 7 of quizblitz-project.md:
 *
 * очки = 1000 * (оставшееся_время / общее_время)   // если ответ верный
 * очки = 0                                          // если неверный
 * + бонус за серию: x1.0 / x1.2 / x1.5 при 0 / 3 / 5 верных подряд
 */

export interface ScoreCalculationInput {
  isCorrect: boolean
  remainingTimeSec: number
  totalTimeSec: number
  currentStreak: number
}

export interface ScoreCalculationResult {
  points: number
  newStreak: number
  streakMultiplier: number
}

export function getStreakMultiplier(streak: number): number {
  if (streak >= 5) return 1.5
  if (streak >= 3) return 1.2
  return 1.0
}

export function calculateScore(input: ScoreCalculationInput): ScoreCalculationResult {
  const { isCorrect, remainingTimeSec, totalTimeSec, currentStreak } = input

  if (!isCorrect) {
    return {
      points: 0,
      newStreak: 0,
      streakMultiplier: 1.0
    }
  }

  const newStreak = (currentStreak || 0) + 1
  const streakMultiplier = getStreakMultiplier(newStreak)

  // Clamp ratio between 0 and 1. If answered with some time left, give at least a small floor (e.g. 0.1) so late answers still reward points.
  const rawRatio = totalTimeSec > 0 ? remainingTimeSec / totalTimeSec : 0
  const ratio = Math.max(0.1, Math.min(1.0, rawRatio))

  const points = Math.round(1000 * ratio * streakMultiplier)

  return {
    points,
    newStreak,
    streakMultiplier
  }
}
