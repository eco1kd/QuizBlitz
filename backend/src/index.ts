import { createServer } from './server.js'

export * from './types/index.js'
export * from './engine/scoring.js'
export * from './engine/room.js'
export * from './engine/roomManager.js'
export * from './engine/questions/provider.js'
export * from './socket/socketHandler.js'
export * from './server.js'

const PORT = Number(process.env.PORT) || 3001

const server = createServer()
server.start(PORT).then((actualPort) => {
  console.log(`⚡ QuizBlitz Game Engine running on http://localhost:${actualPort}`)
})
