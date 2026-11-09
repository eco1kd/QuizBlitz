import { describe, it, expect } from 'vitest'
import { calculateScore, getStreakMultiplier } from '../src/engine/scoring.js'

describe('Scoring Engine (Section 7)', () => {
  it('calculates correct multiplier based on streak', () => {
    expect(getStreakMultiplier(0)).toBe(1.0)
    expect(getStreakMultiplier(1)).toBe(1.0)
    expect(getStreakMultiplier(2)).toBe(1.0)
    expect(getStreakMultiplier(3)).toBe(1.2)
    expect(getStreakMultiplier(4)).toBe(1.2)
    expect(getStreakMultiplier(5)).toBe(1.5)
    expect(getStreakMultiplier(10)).toBe(1.5)
  })

  it('awards 0 points and resets streak on incorrect answer', () => {
    const res = calculateScore({
      isCorrect: false,
      remainingTimeSec: 15,
      totalTimeSec: 20,
      currentStreak: 4
    })
    expect(res.points).toBe(0)
    expect(res.newStreak).toBe(0)
    expect(res.streakMultiplier).toBe(1.0)
  })

  it('calculates points proportional to remaining time for correct answer', () => {
    // 20s remaining of 20s = 1000 * (20/20) * 1.0 = 1000
    const instant = calculateScore({
      isCorrect: true,
      remainingTimeSec: 20,
      totalTimeSec: 20,
      currentStreak: 0
    })
    expect(instant.points).toBe(1000)
    expect(instant.newStreak).toBe(1)

    // 10s remaining of 20s = 1000 * 0.5 * 1.0 = 500
    const halfTime = calculateScore({
      isCorrect: true,
      remainingTimeSec: 10,
      totalTimeSec: 20,
      currentStreak: 1
    })
    expect(halfTime.points).toBe(500)
    expect(halfTime.newStreak).toBe(2)
  })

  it('applies streak bonus correctly at 3 and 5 in a row', () => {
    // Streak reaches 3: x1.2
    // 10s of 20s = 500 * 1.2 = 600
    const streak3 = calculateScore({
      isCorrect: true,
      remainingTimeSec: 10,
      totalTimeSec: 20,
      currentStreak: 2 // will become 3
    })
    expect(streak3.newStreak).toBe(3)
    expect(streak3.streakMultiplier).toBe(1.2)
    expect(streak3.points).toBe(600)

    // Streak reaches 5: x1.5
    // 20s of 20s = 1000 * 1.5 = 1500
    const streak5 = calculateScore({
      isCorrect: true,
      remainingTimeSec: 20,
      totalTimeSec: 20,
      currentStreak: 4 // will become 5
    })
    expect(streak5.newStreak).toBe(5)
    expect(streak5.streakMultiplier).toBe(1.5)
    expect(streak5.points).toBe(1500)
  })

  it('clamps minimal points to floor so last-second answer still gets some points', () => {
    const lastSecond = calculateScore({
      isCorrect: true,
      remainingTimeSec: 0,
      totalTimeSec: 20,
      currentStreak: 0
    })
    expect(lastSecond.points).toBe(100) // minimum floor 0.1 * 1000
    expect(lastSecond.newStreak).toBe(1)
  })
})
