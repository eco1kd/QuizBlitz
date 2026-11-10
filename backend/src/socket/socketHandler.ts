import type { Server, Socket } from 'socket.io'
import type {
  ClientToServerEvents,
  ServerToClientEvents,
  SocketData
} from '../types/events.js'
import { roomManager, RoomManager } from '../engine/roomManager.js'
import { getQuestionProvider } from '../engine/questions/provider.js'
import type { Room } from '../engine/room.js'

type TypedServer = Server<ClientToServerEvents, ServerToClientEvents, Record<string, never>, SocketData>
type TypedSocket = Socket<ClientToServerEvents, ServerToClientEvents, Record<string, never>, SocketData>

export function attachRoomEventEmitter(room: Room, io: TypedServer): void {
  room.setEventEmitter((event: string, payload: any, targetSocketId?: string) => {
    if (targetSocketId) {
      io.to(targetSocketId).emit(event as any, payload)
    } else {
      io.to(room.code).emit(event as any, payload)
    }
  })
}

export function registerSocketHandlers(io: TypedServer, manager: RoomManager = roomManager): void {
  io.on('connection', (socket: TypedSocket) => {
    socket.on('room:create', async (data) => {
      try {
        const topic = data.topic?.trim() || 'Общие знания'
        const count = data.questionCount || 5
        const difficulty = data.difficulty || 'medium'

        const room = manager.createRoom({
          topic,
          questionCount: count,
          difficulty
        })

        attachRoomEventEmitter(room, io)

        await socket.join(room.code)
        manager.associateSocket(socket.id, room.code)

        console.log(`[Socket] room:created -> код: ${room.code}, тема: «${topic}», вопросов: ${count}, сложность: ${difficulty}`)

        const { player } = room.addOrReconnectPlayer({
          nickname: 'Хост',
          avatar: '👑',
          socketId: socket.id,
          isHost: true
        })

        socket.data.playerId = player.id
        socket.data.roomId = room.roomId
        socket.data.isHost = true

        socket.emit('room:created', {
          code: room.code,
          roomId: room.roomId
        })
      } catch (err: any) {
        socket.emit('error', {
          code: 'ROOM_CREATE_FAILED',
          message: err?.message || 'Не удалось создать комнату'
        })
      }
    })

    socket.on('room:join', async (data) => {
      try {
        const code = (data.code || '').trim()
        const nickname = (data.nickname || '').trim()

        if (!code) {
          socket.emit('error', { code: 'INVALID_CODE', message: 'Введите код комнаты' })
          return
        }

        if (!nickname) {
          socket.emit('error', { code: 'INVALID_NICKNAME', message: 'Введите никнейм' })
          return
        }

        const room = manager.getRoomByCode(code)
        if (!room) {
          socket.emit('error', {
            code: 'ROOM_NOT_FOUND',
            message: `Комната с кодом ${code} не найдена`
          })
          return
        }

        attachRoomEventEmitter(room, io)

        await socket.join(room.code)
        manager.associateSocket(socket.id, room.code)

        const { player, isReconnect } = room.addOrReconnectPlayer({
          nickname,
          avatar: data.avatar || '👾',
          socketId: socket.id,
          playerId: data.playerId,
          isHost: false
        })

        socket.data.playerId = player.id
        socket.data.roomId = room.roomId
        socket.data.isHost = player.isHost

        if (isReconnect) {
          if (room.phase === 'question') {
            const currentQ = room.getCurrentQuestion()
            if (currentQ) {
              const remaining = Math.max(0, Math.round((room.questionStartTime + room.timeLimit * 1000 - Date.now()) / 1000))
              socket.emit('question:show', {
                questionId: currentQ.questionId,
                text: currentQ.text,
                options: currentQ.options,
                timeLimit: remaining,
                index: currentQ.index,
                total: currentQ.total
              })
            }
          } else if (room.phase === 'reveal') {
            const currentQ = room.getCurrentQuestion()
            if (currentQ) {
              socket.emit('question:reveal', {
                questionId: currentQ.questionId,
                correctIndex: currentQ.correctIndex,
                results: room.getPlayers().map(p => ({
                  playerId: p.id,
                  correct: p.answered,
                  points: 0,
                  streak: p.streak,
                  rank: p.rank
                })),
                explanation: currentQ.explanation
              })
            }
          }
        }
      } catch (err: any) {
        socket.emit('error', {
          code: 'ROOM_JOIN_FAILED',
          message: err?.message || 'Не удалось войти в комнату'
        })
      }
    })

    socket.on('game:start', async () => {
      try {
        const room = manager.getRoomBySocketId(socket.id)
        if (!room) {
          console.warn(`[Socket] game:start failed: socket ${socket.id} is NOT in any room`)
          socket.emit('error', { code: 'NOT_IN_ROOM', message: 'Вы не находитесь в комнате' })
          return
        }

        const player = room.getPlayerBySocketId(socket.id)
        if (!player || !player.isHost) {
          socket.emit('error', { code: 'NOT_HOST', message: 'Только хост может начать игру' })
          return
        }

        if (room.phase !== 'lobby') {
          socket.emit('error', { code: 'INVALID_PHASE', message: 'Игра уже запущена' })
          return
        }

        console.log(`[Socket] game:start -> комната ${room.code}: запрашиваем ${room.questionCount} вопросов (тема: «${room.topic}»)...`)
        const provider = getQuestionProvider()
        const questions = await provider.getQuestions({
          topic: room.topic,
          count: room.questionCount,
          difficulty: room.difficulty
        })

        console.log(`[Socket] game:start -> получено ${questions.length} вопросов, запускаем игру!`)
        room.startGame(questions)
      } catch (err: any) {
        console.error(`[Socket] game:start error:`, err?.message || err)
        socket.emit('error', {
          code: 'GAME_START_FAILED',
          message: err?.message || 'Ошибка запуска игры'
        })
      }
    })

    socket.on('answer:submit', (data) => {
      try {
        const room = manager.getRoomBySocketId(socket.id)
        if (!room) {
          socket.emit('error', { code: 'NOT_IN_ROOM', message: 'Вы не находитесь в комнате' })
          return
        }

        const player = room.getPlayerBySocketId(socket.id)
        if (!player) {
          socket.emit('error', { code: 'PLAYER_NOT_FOUND', message: 'Игрок не найден' })
          return
        }

        const res = room.submitAnswer({
          playerId: player.id,
          questionId: data.questionId,
          optionIndex: data.optionIndex,
          socketId: socket.id
        })

        if (!res.success) {
          socket.emit('error', {
            code: 'ANSWER_REJECTED',
            message: res.error || 'Ответ не принят'
          })
        }
      } catch (err: any) {
        socket.emit('error', {
          code: 'ANSWER_ERROR',
          message: err?.message || 'Ошибка обработки ответа'
        })
      }
    })

    socket.on('game:next', () => {
      try {
        const room = manager.getRoomBySocketId(socket.id)
        if (!room) {
          socket.emit('error', { code: 'NOT_IN_ROOM', message: 'Вы не находитесь в комнате' })
          return
        }

        const player = room.getPlayerBySocketId(socket.id)
        if (!player || !player.isHost) {
          socket.emit('error', { code: 'NOT_HOST', message: 'Только хост может переключать раунды' })
          return
        }

        room.nextStep()
      } catch (err: any) {
        socket.emit('error', {
          code: 'NEXT_STEP_FAILED',
          message: err?.message || 'Ошибка перехода к следующему шагу'
        })
      }
    })

    socket.on('disconnect', () => {
      const room = manager.getRoomBySocketId(socket.id)
      if (room) {
        room.handleDisconnect(socket.id)
      }
      manager.disassociateSocket(socket.id)
    })
  })
}
