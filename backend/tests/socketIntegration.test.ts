import { describe, it, expect, beforeAll, afterAll } from 'vitest'
import { io as Client, type Socket as ClientSocket } from 'socket.io-client'
import { createServer, type ServerInstance } from '../src/server.js'
import type {
  ClientToServerEvents,
  ServerToClientEvents
} from '../src/types/events.js'

type TestClientSocket = ClientSocket<ServerToClientEvents, ClientToServerEvents>

describe('Socket.IO End-to-End Integration (Section 7 Contract)', () => {
  let serverInstance: ServerInstance
  let port: number
  let hostSocket: TestClientSocket
  let playerSocket: TestClientSocket

  beforeAll(async () => {
    serverInstance = createServer()
    port = await serverInstance.start(0) // Random available port
  })

  afterAll(async () => {
    if (hostSocket?.connected) hostSocket.disconnect()
    if (playerSocket?.connected) playerSocket.disconnect()
    await serverInstance.stop()
  })

  function createClient(): Promise<TestClientSocket> {
    return new Promise((resolve) => {
      const client: TestClientSocket = Client(`http://localhost:${port}`, {
        transports: ['websocket'],
        forceNew: true
      })
      client.on('connect', () => {
        resolve(client)
      })
    })
  }

  it('runs complete multiplayer round through Socket.IO events', async () => {
    hostSocket = await createClient()
    playerSocket = await createClient()

    let roomCode = ''

    // 1. Host creates room
    const createdPromise = new Promise<{ code: string; roomId: string }>((resolve) => {
      hostSocket.on('room:created', (data) => {
        resolve(data)
      })
    })

    hostSocket.emit('room:create', {
      topic: 'Космос',
      questionCount: 2,
      difficulty: 'medium'
    })

    const createdData = await createdPromise
    expect(createdData.code).toMatch(/^\d{6}$/)
    roomCode = createdData.code

    // 2. Player joins room
    const playerJoinPromise = new Promise<any>((resolve) => {
      playerSocket.on('room:updated', (data) => {
        const found = data.players.find((p: any) => p.nickname === 'PlayerAlpha')
        if (found) resolve(data)
      })
    })

    playerSocket.emit('room:join', {
      code: roomCode,
      nickname: 'PlayerAlpha',
      avatar: '🚀'
    })

    const roomUpdate = await playerJoinPromise
    expect(roomUpdate.players.length).toBe(2) // Host + PlayerAlpha

    // 3. Host starts game
    const questionPromise = new Promise<any>((resolve) => {
      playerSocket.on('question:show', (data) => {
        resolve(data)
      })
    })

    hostSocket.emit('game:start')

    const questionData = await questionPromise
    expect(questionData.questionId).toBeDefined()
    expect(questionData.options.length).toBe(4)
    expect(questionData.total).toBe(2)

    // 4. Player submits answer
    const answerAcceptedPromise = new Promise<any>((resolve) => {
      playerSocket.on('answer:accepted', (data) => {
        resolve(data)
      })
    })

    const revealPromise = new Promise<any>((resolve) => {
      playerSocket.on('question:reveal', (data) => {
        resolve(data)
      })
    })

    playerSocket.emit('answer:submit', {
      questionId: questionData.questionId,
      optionIndex: 0
    })

    const accepted = await answerAcceptedPromise
    expect(accepted.questionId).toBe(questionData.questionId)

    const reveal = await revealPromise
    expect(reveal.questionId).toBe(questionData.questionId)
    expect(reveal.correctIndex).toBeGreaterThanOrEqual(0)
    expect(reveal.results.length).toBe(2)

    // 5. Host advances to leaderboard
    const lbPromise = new Promise<any>((resolve) => {
      playerSocket.on('leaderboard:update', (data) => {
        resolve(data)
      })
    })

    hostSocket.emit('game:next')
    const lb = await lbPromise
    expect(lb.players.length).toBe(2)
  })

  it('emits error if trying to join non-existent room', async () => {
    const tempSocket = await createClient()

    const errPromise = new Promise<any>((resolve) => {
      tempSocket.on('error', (err) => {
        resolve(err)
      })
    })

    tempSocket.emit('room:join', {
      code: '999999',
      nickname: 'Stranger'
    })

    const err = await errPromise
    expect(err.code).toBe('ROOM_NOT_FOUND')

    tempSocket.disconnect()
  })
})
