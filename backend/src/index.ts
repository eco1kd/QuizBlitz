import { existsSync } from 'node:fs'
import { join } from 'node:path'
import { createServer } from './server.js'
import { setQuestionProvider } from './engine/questions/provider.js'
import { AiQuestionProvider } from './engine/questions/aiProvider.js'

export * from './types/index.js'
export * from './engine/scoring.js'
export * from './engine/room.js'
export * from './engine/roomManager.js'
export * from './engine/questions/provider.js'
export * from './engine/questions/aiProvider.js'
export * from './socket/socketHandler.js'
export * from './server.js'

// Загрузка переменных окружения из .env если файл существует
try {
  if (typeof process.loadEnvFile === 'function') {
    const envPath = join(process.cwd(), '.env')
    if (existsSync(envPath)) {
      process.loadEnvFile(envPath)
    }
  }
} catch {
  // ignore
}

// Если задан ключ ИИ — подключаем AiQuestionProvider
if (process.env.AI_API_KEY) {
  const provider = new AiQuestionProvider({
    baseUrl: process.env.AI_BASE_URL,
    apiKey: process.env.AI_API_KEY,
    model: process.env.AI_MODEL
  })
  setQuestionProvider(provider)
  console.log(`🤖 AI Question Provider активирован (${process.env.AI_MODEL || 'gpt-4o-mini'} @ ${process.env.AI_BASE_URL || 'default'})`)
} else {
  console.log('📚 Используется встроенный банк вопросов (резервный провайдер)')
}

const PORT = Number(process.env.PORT) || 3001

const server = createServer()
server.start(PORT).then((actualPort) => {
  console.log(`⚡ QuizBlitz Game Engine running on http://localhost:${actualPort}`)
})
