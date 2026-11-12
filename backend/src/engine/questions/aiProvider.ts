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
  maxRetries?: number
}

export class AiQuestionProvider implements QuestionProvider {
  private fallback = new FallbackQuestionProvider()
  private baseUrl: string
  private apiKey: string
  private model: string
  private timeoutMs: number
  private maxRetries: number

  constructor(cfg: AiProviderConfig = {}) {
    this.baseUrl = (cfg.baseUrl || process.env.AI_BASE_URL || 'https://syncapi.store/v1').replace(/\/+$/, '')
    this.apiKey = (cfg.apiKey || process.env.AI_API_KEY || '').trim()
    this.model = cfg.model || process.env.AI_MODEL || 'claude-sonnet-5-5'
    this.timeoutMs = cfg.timeoutMs || 60000
    this.maxRetries = cfg.maxRetries ?? 2
  }

  public setApiKey(key: string) {
    this.apiKey = key.trim()
  }

  public setModel(model: string) {
    this.model = model.trim()
  }

  private parseAndValidateQuestions(
    rawContent: string,
    count: number,
    seenTexts: Set<string>
  ): QuestionWithAnswer[] {
    const startIdx = rawContent.indexOf('[')
    const endIdx = rawContent.lastIndexOf(']')
    const cleanJson =
      startIdx !== -1 && endIdx !== -1 && endIdx > startIdx
        ? rawContent.substring(startIdx, endIdx + 1)
        : rawContent
            .replace(/^```json\s*/i, '')
            .replace(/^```\s*/i, '')
            .replace(/\s*```$/i, '')
            .trim()

    const parsed: unknown = JSON.parse(cleanJson)

    if (!Array.isArray(parsed) || parsed.length === 0) {
      throw new Error('Ответ ИИ не является непустым массивом')
    }

    const validQuestions: QuestionWithAnswer[] = []

    for (let idx = 0; idx < parsed.length; idx++) {
      const item = parsed[idx] as Record<string, unknown>
      if (!item || typeof item !== 'object') continue

      const rawText = item.text ?? item.question ?? item.title
      if (typeof rawText !== 'string' || !rawText.trim()) continue

      const qText = rawText.trim()
      const normText = qText.toLowerCase()
      if (seenTexts.has(normText)) continue

      if (!Array.isArray(item.options) || item.options.length < 4) continue
      const rawOptions = item.options.slice(0, 4).map(opt => String(opt ?? '').trim())
      if (rawOptions.some(opt => opt.length === 0)) continue

      const uniqueOpts = new Set(rawOptions.map(opt => opt.toLowerCase()))
      if (uniqueOpts.size < 4) continue

      const cIdx = item.correctIndex
      if (
        typeof cIdx !== 'number' ||
        !Number.isInteger(cIdx) ||
        cIdx < 0 ||
        cIdx > 3
      ) {
        continue
      }

      seenTexts.add(normText)

      const exp =
        typeof item.explanation === 'string' && item.explanation.trim()
          ? item.explanation.trim()
          : `Правильный ответ: «${rawOptions[cIdx]}».`

      const raw = {
        text: qText,
        options: rawOptions,
        correctIndex: cIdx,
        explanation: exp
      }

      const { options, correctIndex } = shuffleQuestionOptions(raw)

      validQuestions.push({
        questionId: `ai-${Date.now()}-${validQuestions.length + 1}-${Math.random().toString(36).substring(2, 7)}`,
        text: raw.text,
        options,
        correctIndex,
        explanation: raw.explanation,
        timeLimit: 20,
        index: validQuestions.length + 1,
        total: count
      })

      if (validQuestions.length >= count) break
    }

    return validQuestions
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

    const collectedQuestions: QuestionWithAnswer[] = []
    const seenTexts = new Set<string>()
    let lastError: unknown = null

    for (let attempt = 0; attempt <= this.maxRetries; attempt++) {
      const needed = count - collectedQuestions.length
      if (needed <= 0) break

      const userPrompt = `Сгенерируй ровно ${needed} уникальных вопросов по теме «${topic}».
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
1. Ровно 4 разных непустых варианта в "options".
2. "correctIndex" — строго целое число от 0 до 3.
3. Без повторяющихся вопросов и вариантов, один однозначно правильный ответ.
4. Поле "explanation" строго обязательно для каждого вопроса (1-2 интересных предложения, раскрывающих правильный ответ).`

      const controller = new AbortController()
      const timer = setTimeout(() => controller.abort(), this.timeoutMs)

      try {
        console.log(
          `[AiQuestionProvider] Запрос к ${this.baseUrl}/chat/completions (попытка ${attempt + 1}/${this.maxRetries + 1}, модель: ${this.model}, тема: «${topic}», нужно: ${needed})...`
        )

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
            temperature: 0.7,
            max_tokens: 3500
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

        const batch = this.parseAndValidateQuestions(rawContent, needed, seenTexts)
        if (batch.length === 0) {
          throw new Error('Ни один сгенерированный вопрос в попытке не прошёл валидацию')
        }

        collectedQuestions.push(...batch)
        if (collectedQuestions.length >= count) {
          break
        }
      } catch (err: any) {
        clearTimeout(timer)
        lastError = err
        console.warn(
          `[AiQuestionProvider] Попытка ${attempt + 1}/${this.maxRetries + 1} не удалась (${err?.message}).`
        )
      }
    }

    if (collectedQuestions.length === 0) {
      console.warn(
        `[AiQuestionProvider] Все попытки генерации через ИИ завершились ошибкой (${(lastError as Error)?.message}). Переключаемся на резервную базу...`
      )
      return this.fallback.getQuestions(params)
    }

    // Если после всех попыток ИИ вернул меньше вопросов, чем запрошено — добираем недостающие из резервного пула
    if (collectedQuestions.length < count) {
      const missingCount = count - collectedQuestions.length
      console.warn(
        `[AiQuestionProvider] Получено ${collectedQuestions.length} из ${count} вопросов от ИИ, добираем ${missingCount} из резервной базы...`
      )
      const fallbackPool = await this.fallback.getQuestions({
        ...params,
        count: count + 10
      })
      for (const fbQ of fallbackPool) {
        if (collectedQuestions.length >= count) break
        const norm = fbQ.text.trim().toLowerCase()
        if (!seenTexts.has(norm)) {
          seenTexts.add(norm)
          collectedQuestions.push(fbQ)
        }
      }
    }

    const finalQuestions = collectedQuestions.slice(0, count).map((q, idx) => ({
      ...q,
      index: idx + 1,
      total: count
    }))

    console.log(`[AiQuestionProvider] Готово ${finalQuestions.length} вопросов для игры`)
    return finalQuestions
  }
}
