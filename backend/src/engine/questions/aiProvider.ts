import type { QuestionWithAnswer } from '../../types/game.js'
import {
  type QuestionProvider,
  FallbackQuestionProvider,
  shuffleQuestionOptions
} from './provider.js'

export interface AiProviderConfig {
  baseUrl?: string
  apiKey?: string
  model?: string
  timeoutMs?: number
}

interface GeneratedItem {
  text: string
  options: string[]
  correctIndex: number
  explanation?: string
}

export class AiQuestionProvider implements QuestionProvider {
  private fallback = new FallbackQuestionProvider()
  private baseUrl: string
  private apiKey: string
  private model: string
  private timeoutMs: number

  constructor(cfg: AiProviderConfig = {}) {
    this.baseUrl = (cfg.baseUrl || process.env.AI_BASE_URL || 'https://anymodel.ghostly.su/v1').replace(/\/+$/, '')
    this.apiKey = (cfg.apiKey || process.env.AI_API_KEY || '').trim()
    this.model = cfg.model || process.env.AI_MODEL || 'gpt-4o-mini'
    this.timeoutMs = cfg.timeoutMs || 15000
  }

  public setApiKey(key: string) {
    this.apiKey = key.trim()
  }

  public setModel(model: string) {
    this.model = model.trim()
  }

  async getQuestions(params: {
    topic: string
    count: number
    difficulty?: 'easy' | 'medium' | 'hard'
  }): Promise<QuestionWithAnswer[]> {
    const count = Math.max(1, params.count || 5)
    const topic = params.topic?.trim() || 'Общие знания'
    const difficulty = params.difficulty || 'medium'

    if (!this.apiKey) {
      console.warn('[AiQuestionProvider] AI_API_KEY не задан, используем резервную базу вопросов')
      return this.fallback.getQuestions(params)
    }

    const systemPrompt =
      'Ты — генератор вопросов для интеллектуальной викторины QuizBlitz в формате Kahoot. Твоя цель — генерировать увлекательные, точные вопросы с ровно 4 вариантами ответов.'

    const userPrompt = `Сгенерируй ровно ${count} вопросов по теме «${topic}».
Сложность: ${difficulty}.
Язык: русский.

Верни СТРОГО валидный JSON-массив без какого-либо дополнительного текста, без markdown (\`\`\`json):
[
  {
    "text": "Текст вопроса",
    "options": ["Вариант 1", "Вариант 2", "Вариант 3", "Вариант 4"],
    "correctIndex": 0,
    "explanation": "Краткое интересное пояснение правильного ответа (1-2 предложения)"
  }
]

Требования:
1. Ровно 4 варианта в "options".
2. "correctIndex" — число от 0 до 3.
3. Без повторяющихся вариантов, один однозначно правильный ответ.`

    try {
      console.log(`[AiQuestionProvider] Запрос к ${this.baseUrl}/chat/completions (модель: ${this.model}, тема: «${topic}»)...`)
      const controller = new AbortController()
      const timer = setTimeout(() => controller.abort(), this.timeoutMs)

      const res = await fetch(`${this.baseUrl}/chat/completions`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${this.apiKey}`
        },
        body: JSON.stringify({
          model: this.model,
          messages: [
            { role: 'system', content: systemPrompt },
            { role: 'user', content: userPrompt }
          ],
          temperature: 0.7
        }),
        signal: controller.signal
      })

      clearTimeout(timer)

      if (!res.ok) {
        const errBody = await res.text().catch(() => '')
        throw new Error(`API returned status ${res.status}: ${errBody}`)
      }

      const data: any = await res.json()
      const rawContent: string = data.choices?.[0]?.message?.content?.trim() || ''

      const startIdx = rawContent.indexOf('[')
      const endIdx = rawContent.lastIndexOf(']')
      const cleanJson = (startIdx !== -1 && endIdx !== -1 && endIdx > startIdx)
        ? rawContent.substring(startIdx, endIdx + 1)
        : rawContent
            .replace(/^```json\s*/i, '')
            .replace(/^```\s*/i, '')
            .replace(/\s*```$/i, '')
            .trim()

      const parsed: any[] = JSON.parse(cleanJson)

      if (!Array.isArray(parsed) || parsed.length === 0) {
        throw new Error('Ответ ИИ не является непустым массивом')
      }

      const validQuestions: QuestionWithAnswer[] = []

      for (let idx = 0; idx < parsed.length; idx++) {
        const item = parsed[idx]
        const qText = item.text || item.question || item.title
        if (!qText || !Array.isArray(item.options) || item.options.length < 4) {
          continue
        }

        const raw = {
          text: String(qText),
          options: item.options.slice(0, 4).map(String),
          correctIndex: typeof item.correctIndex === 'number' && item.correctIndex >= 0 && item.correctIndex <= 3 ? item.correctIndex : 0,
          explanation: item.explanation || ''
        }

        const { options, correctIndex } = shuffleQuestionOptions(raw)

        validQuestions.push({
          questionId: `ai-${Date.now()}-${idx + 1}-${Math.random().toString(36).substring(2, 7)}`,
          text: raw.text,
          options,
          correctIndex,
          explanation: raw.explanation,
          timeLimit: 20,
          index: idx + 1,
          total: count
        })

        if (validQuestions.length >= count) break
      }

      if (validQuestions.length === 0) {
        throw new Error('Ни один сгенерированный вопрос не прошёл валидацию')
      }

      console.log(`[AiQuestionProvider] Успешно сгенерировано ${validQuestions.length} вопросов от ИИ`)
      return validQuestions
    } catch (err: any) {
      console.warn(`[AiQuestionProvider] Ошибка при генерации через ИИ (${err?.message}). Переключаемся на резервную базу...`)
      return this.fallback.getQuestions(params)
    }
  }
}
