import http from 'node:http'
import express, { type Express, type Request, type Response } from 'express'
import cors from 'cors'
import { Server } from 'socket.io'
import type {
  ClientToServerEvents,
  ServerToClientEvents,
  SocketData
} from './types/events.js'
import { registerSocketHandlers } from './socket/socketHandler.js'
import { roomManager } from './engine/roomManager.js'

export interface ServerInstance {
  app: Express
  httpServer: http.Server
  io: Server<ClientToServerEvents, ServerToClientEvents, Record<string, never>, SocketData>
  start: (port?: number) => Promise<number>
  stop: () => Promise<void>
}

export function createServer(): ServerInstance {
  const app: Express = express()

  app.use(cors({
    origin: '*',
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS']
  }))
  app.use(express.json())

  app.get('/health', (_req: Request, res: Response) => {
    res.json({
      status: 'ok',
      service: 'QuizBlitz Game Engine',
      activeRooms: roomManager.getActiveRoomCount(),
      timestamp: new Date().toISOString()
    })
  })

  app.get('/api/health', (_req: Request, res: Response) => {
    res.json({
      status: 'ok',
      service: 'QuizBlitz Backend',
      rooms: roomManager.getActiveRoomCount()
    })
  })

  const httpServer = http.createServer(app)

  const io = new Server<ClientToServerEvents, ServerToClientEvents, Record<string, never>, SocketData>(
    httpServer,
    {
      cors: {
        origin: '*',
        methods: ['GET', 'POST']
      },
      pingTimeout: 20000,
      pingInterval: 10000
    }
  )

  registerSocketHandlers(io, roomManager)

  const start = (port = Number(process.env.PORT) || 3001): Promise<number> => {
    return new Promise((resolve) => {
      httpServer.listen(port, () => {
        const address = httpServer.address()
        const actualPort = typeof address === 'object' && address ? address.port : port
        resolve(actualPort)
      })
    })
  }

  const stop = (): Promise<void> => {
    return new Promise((resolve, reject) => {
      roomManager.clear()
      io.close(() => {
        if (httpServer.listening) {
          httpServer.close((httpErr) => {
            if (httpErr) return reject(httpErr)
            resolve()
          })
        } else {
          resolve()
        }
      })
    })
  }

  return {
    app,
    httpServer,
    io,
    start,
    stop
  }
}
