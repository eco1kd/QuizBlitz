import { describe, it, expect, vi, afterEach } from 'vitest'
import { AiQuestionProvider } from '../src/engine/questions/aiProvider.js'
import { FallbackQuestionProvider } from '../src/engine/questions/provider.js'

describe('FallbackQuestionProvider & AiQuestionProvider', () => {
  afterEach(() => {
    vi.restoreAllMocks()
  })

  it('FallbackQuestionProvider returns unique shuffled questions with 4 options', async () => {
    const provider = new FallbackQuestionProvider()
    const questions = await provider.getQuestions({ topic: 'Космос', count: 5, difficulty: 'medium' })

    expect(questions.length).toBe(5)
    const texts = new Set(questions.map(q => q.text.toLowerCase()))
    expect(texts.size).toBe(5)

    for (let i = 0; i < questions.length; i++) {
      expect(questions[i].index).toBe(i + 1)
      expect(questions[i].total).toBe(5)
      expect(questions[i].options.length).toBe(4)
      expect(questions[i].correctIndex).toBeGreaterThanOrEqual(0)
      expect(questions[i].correctIndex).toBeLessThanOrEqual(3)
    }
  })

  it('AiQuestionProvider retries on failure and strictly validates correctIndex and duplicate questions', async () => {
    let callCount = 0
    vi.spyOn(globalThis, 'fetch').mockImplementation(async () => {
      callCount += 1
      if (callCount === 1) {
        return new Response('Internal Server Error', { status: 500 })
      }
      const mockPayload = {
        choices: [
          {
            message: {
              content: JSON.stringify([
                // Invalid correctIndex (out of bounds 0..3) -> should be rejected
                {
                  text: 'Битый вопрос с индексом 9',
                  options: ['A', 'B', 'C', 'D'],
                  correctIndex: 9,
                  explanation: 'Невалидный индекс'
                },
                // Duplicate options -> should be rejected
                {
                  text: 'Вопрос с одинаковыми ответами',
                  options: ['Один', 'один', 'Три', 'Четыре'],
                  correctIndex: 0
                },
                // Valid question 1
                {
                  text: 'Какая планета самая большая в Солнечной системе?',
                  options: ['Юпитер', 'Марс', 'Венера', 'Меркурий'],
                  correctIndex: 0,
                  explanation: 'Юпитер — газовый гигант.'
                },
                // Duplicate question text -> should be rejected
                {
                  text: 'какая планета самая большая в солнечной системе?',
                  options: ['Юпитер', 'Сатурн', 'Уран', 'Нептун'],
                  correctIndex: 0
                }
              ])
            }
          }
        ]
      }
      return new Response(JSON.stringify(mockPayload), {
        status: 200,
        headers: { 'Content-Type': 'application/json' }
      })
    })

    const ai = new AiQuestionProvider({
      apiKey: 'test-key',
      baseUrl: 'https://syncapi.store/v1',
      model: 'claude-sonnet-5-5',
      maxRetries: 2
    })

    const questions = await ai.getQuestions({ topic: 'Астрономия', count: 3, difficulty: 'easy' })

    // Attempt 1 failed (500), Attempt 2 returned 1 valid question, Attempt 3 returned 0 new (duplicate),
    // and remaining 2 questions were topped up from FallbackQuestionProvider!
    expect(callCount).toBeGreaterThanOrEqual(2)
    expect(questions.length).toBe(3)
    expect(questions[0].text).toBe('Какая планета самая большая в Солнечной системе?')
    expect(questions[0].options).toContain('Юпитер')
    expect(questions[0].options[questions[0].correctIndex]).toBe('Юпитер')

    const uniqueTexts = new Set(questions.map(q => q.text.toLowerCase()))
    expect(uniqueTexts.size).toBe(3)
  })
})
