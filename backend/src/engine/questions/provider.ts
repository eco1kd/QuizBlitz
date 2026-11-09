import { readFile } from 'node:fs/promises'
import { fileURLToPath } from 'node:url'
import { dirname, join } from 'node:path'
import type { QuestionWithAnswer } from '../../types/game.js'
import { DEFAULT_FALLBACK_QUESTIONS, type FallbackQuestionItem } from './fallbackQuestions.js'

export interface QuestionProvider {
  getQuestions(params: {
    topic: string
    count: number
    difficulty?: 'easy' | 'medium' | 'hard'
  }): Promise<QuestionWithAnswer[]>
}

interface RawQuestion {
  topic?: string
  text: string
  options: string[]
  correctIndex: number
  explanation?: string
}

const __filename = fileURLToPath(import.meta.url)
const __dirname = dirname(__filename)

/**
 * Shuffles options of a question and recalculates correctIndex.
 * Fulfills rule from Section 9: "Перемешивать варианты ответов на бэке"
 */
export function shuffleQuestionOptions(q: RawQuestion): {
  options: [string, string, string, string]
  correctIndex: number
} {
  const indexed = q.options.map((opt, i) => ({ opt, isCorrect: i === q.correctIndex }))

  // Fisher-Yates shuffle
  for (let i = indexed.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1))
    const temp = indexed[i]
    indexed[i] = indexed[j]
    indexed[j] = temp
  }

  const shuffledOptions: [string, string, string, string] = [
    indexed[0].opt,
    indexed[1].opt,
    indexed[2].opt,
    indexed[3].opt
  ]
  const newCorrectIndex = indexed.findIndex(item => item.isCorrect)

  return {
    options: shuffledOptions,
    correctIndex: newCorrectIndex >= 0 ? newCorrectIndex : 0
  }
}

export class FallbackQuestionProvider implements QuestionProvider {
  private cachedQuestions: RawQuestion[] | null = null

  private async loadQuestions(): Promise<RawQuestion[]> {
    if (this.cachedQuestions) {
      return this.cachedQuestions
    }
    try {
      const candidates = [
        join(__dirname, 'fallback.json'),
        join(__dirname, '../../src/engine/questions/fallback.json')
      ]
      for (const p of candidates) {
        try {
          const raw = await readFile(p, 'utf-8')
          this.cachedQuestions = JSON.parse(raw) as RawQuestion[]
          return this.cachedQuestions
        } catch {
          // try next candidate
        }
      }
      this.cachedQuestions = DEFAULT_FALLBACK_QUESTIONS
      return this.cachedQuestions
    } catch {
      this.cachedQuestions = DEFAULT_FALLBACK_QUESTIONS
      return this.cachedQuestions
    }
  }

  async getQuestions(params: {
    topic: string
    count: number
    difficulty?: 'easy' | 'medium' | 'hard'
  }): Promise<QuestionWithAnswer[]> {
    const all = await this.loadQuestions()
    const count = Math.max(1, params.count || 5)

    // Filter by topic if possible (case-insensitive substring)
    const normalizedTopic = (params.topic || '').trim().toLowerCase()
    let pool = all.filter(q => (q.topic || '').toLowerCase().includes(normalizedTopic))

    if (pool.length < count) {
      // Augment from general pool
      const remaining = all.filter(q => !pool.includes(q))
      pool = [...pool, ...remaining]
    }

    if (pool.length === 0) {
      pool = all
    }

    // Shuffle pool to pick random subset
    const shuffledPool = [...pool].sort(() => Math.random() - 0.5)
    const selected = shuffledPool.slice(0, count)

    // Repeat if pool was smaller than requested count
    while (selected.length < count) {
      selected.push(all[selected.length % all.length])
    }

    return selected.map((raw, idx) => {
      const { options, correctIndex } = shuffleQuestionOptions(raw)
      return {
        questionId: `q-${Date.now()}-${idx + 1}-${Math.random().toString(36).substring(2, 7)}`,
        text: raw.text,
        options,
        correctIndex,
        explanation: raw.explanation || '',
        timeLimit: 20, // standard 20s as per contract
        index: idx + 1,
        total: count
      }
    })
  }
}

let activeProvider: QuestionProvider = new FallbackQuestionProvider()

export function setQuestionProvider(provider: QuestionProvider): void {
  activeProvider = provider
}

export function getQuestionProvider(): QuestionProvider {
  return activeProvider
}
