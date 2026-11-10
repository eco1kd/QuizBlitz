import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { Room } from '../src/engine/room.js'
import type { QuestionWithAnswer } from '../src/types/game.js'

describe('Room Game Lifecycle & Engine', () => {
  const sampleQuestions: QuestionWithAnswer[] = [
    {
      questionId: 'q-1',
      text: 'Сколько планет в Солнечной системе?',
      options: ['7', '8', '9', '10'],
      correctIndex: 1, // '8'
      explanation: 'В Солнечной системе 8 признанных планет.',
      timeLimit: 20,
      index: 1,
      total: 2
    },
    {
      questionId: 'q-2',
      text: 'Столица Италии?',
      options: ['Милан', 'Рим', 'Неаполь', 'Венеция'],
      correctIndex: 1, // 'Рим'
      explanation: 'Рим является столицей Италии.',
      timeLimit: 20,
      index: 2,
      total: 2
    }
  ]

  let room: Room
  const emittedEvents: { event: string; payload: any; targetSocketId?: string }[] = []

  beforeEach(() => {
    vi.useFakeTimers()
    emittedEvents.length = 0

    room = new Room({
      code: '123456',
      roomId: 'room-test-1',
      topic: 'Общие знания',
      questionCount: 2
    })

    room.setEventEmitter((event, payload, targetSocketId) => {
      emittedEvents.push({ event, payload, targetSocketId })
    })
  })

  afterEach(() => {
    room.destroy()
    vi.useRealTimers()
  })

  it('adds host and players correctly', () => {
    const hostRes = room.addOrReconnectPlayer({
      nickname: 'HostUser',
      socketId: 'sock-host',
      isHost: true
    })
    expect(hostRes.player.isHost).toBe(true)
    expect(hostRes.isReconnect).toBe(false)
    expect(room.hostId).toBe(hostRes.player.id)

    const playerRes = room.addOrReconnectPlayer({
      nickname: 'PlayerOne',
      socketId: 'sock-p1'
    })
    expect(playerRes.player.isHost).toBe(false)
    expect(room.getPlayers().length).toBe(2)

    const roomUpdated = emittedEvents.filter(e => e.event === 'room:updated')
    expect(roomUpdated.length).toBe(2)
  })

  it('supports reconnection and restores score/streak', () => {
    const { player } = room.addOrReconnectPlayer({
      nickname: 'Eco',
      socketId: 'sock-1',
      playerId: 'eco-id'
    })

    player.score = 850
    player.streak = 2

    // Disconnect
    room.handleDisconnect('sock-1')
    expect(player.disconnected).toBe(true)

    // Reconnect with same playerId
    const reconnected = room.addOrReconnectPlayer({
      nickname: 'Eco',
      socketId: 'sock-2-new',
      playerId: 'eco-id'
    })

    expect(reconnected.isReconnect).toBe(true)
    expect(reconnected.player.id).toBe('eco-id')
    expect(reconnected.player.score).toBe(850)
    expect(reconnected.player.streak).toBe(2)
    expect(reconnected.player.disconnected).toBe(false)
    expect(room.getPlayerBySocketId('sock-2-new')?.id).toBe('eco-id')
  })

  it('runs full game flow: start -> answer -> reveal -> leaderboard -> next -> finish', () => {
    const host = room.addOrReconnectPlayer({ nickname: 'Host', socketId: 's-host', isHost: true }).player
    const p1 = room.addOrReconnectPlayer({ nickname: 'Alice', socketId: 's-p1' }).player
    const p2 = room.addOrReconnectPlayer({ nickname: 'Bob', socketId: 's-p2' }).player

    // Start game
    room.startGame(sampleQuestions)
    expect(room.phase).toBe('question')

    const questionShow = emittedEvents.find(e => e.event === 'question:show')
    expect(questionShow).toBeDefined()
    expect(questionShow?.payload.questionId).toBe('q-1')

    // Submit answers: Alice correct (opt 1), Bob incorrect (opt 0)
    const p1Answer = room.submitAnswer({
      playerId: p1.id,
      questionId: 'q-1',
      optionIndex: 1,
      socketId: 's-p1'
    })
    expect(p1Answer.success).toBe(true)

    const p2Answer = room.submitAnswer({
      playerId: p2.id,
      questionId: 'q-1',
      optionIndex: 0,
      socketId: 's-p2'
    })
    expect(p2Answer.success).toBe(true)

    // Fast-forward fake timer for auto-reveal when all answered
    vi.advanceTimersByTime(400)

    expect(room.phase).toBe('reveal')
    const revealEvent = emittedEvents.find(e => e.event === 'question:reveal')
    expect(revealEvent).toBeDefined()
    expect(revealEvent?.payload.correctIndex).toBe(1)

    const aliceResult = revealEvent?.payload.results.find((r: any) => r.playerId === p1.id)
    const bobResult = revealEvent?.payload.results.find((r: any) => r.playerId === p2.id)

    expect(aliceResult.correct).toBe(true)
    expect(aliceResult.points).toBeGreaterThan(0)
    expect(aliceResult.streak).toBe(1)

    expect(bobResult.correct).toBe(false)
    expect(bobResult.points).toBe(0)
    expect(bobResult.streak).toBe(0)

    // Host calls nextStep -> transition to leaderboard
    room.nextStep()
    expect(room.phase).toBe('leaderboard')
    const lbEvent = emittedEvents.find(e => e.event === 'leaderboard:update')
    expect(lbEvent).toBeDefined()
    expect(lbEvent?.payload.players[0].id).toBe(p1.id) // Alice is #1

    // Advance to Question 2
    room.nextStep()
    expect(room.phase).toBe('question')
    expect(room.currentQuestionIndex).toBe(1)

    // Alice answers correct again
    room.submitAnswer({ playerId: p1.id, questionId: 'q-2', optionIndex: 1 })
    // Bob answers correct
    room.submitAnswer({ playerId: p2.id, questionId: 'q-2', optionIndex: 1 })

    vi.advanceTimersByTime(400)
    expect(room.phase).toBe('reveal')

    // Next step -> leaderboard
    room.nextStep()
    expect(room.phase).toBe('leaderboard')

    // Next step -> finish game (since question 2 was the last question)
    room.nextStep()
    expect(room.phase).toBe('finished')

    const finishEvent = emittedEvents.find(e => e.event === 'game:finished')
    expect(finishEvent).toBeDefined()
    expect(finishEvent?.payload.leaderboard.length).toBe(3)
    expect(finishEvent?.payload.stats.totalQuestions).toBe(2)
    expect(finishEvent?.payload.stats.correctAnswersCount).toBe(3) // Alice: 2, Bob: 1
    expect(finishEvent?.payload.stats.highestStreak).toBe(2) // Alice streak 2
  })

  it('rejects duplicate answer submissions for same question', () => {
    room.addOrReconnectPlayer({ nickname: 'Alice', socketId: 's-p1', playerId: 'p1' })
    room.startGame(sampleQuestions)

    const first = room.submitAnswer({ playerId: 'p1', questionId: 'q-1', optionIndex: 1 })
    expect(first.success).toBe(true)

    const second = room.submitAnswer({ playerId: 'p1', questionId: 'q-1', optionIndex: 2 })
    expect(second.success).toBe(false)
    expect(second.error).toContain('already submitted')
  })
})
