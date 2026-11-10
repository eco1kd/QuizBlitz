import type { QuestionData } from '../types/game'

export interface QuestionWithAnswer extends QuestionData {
  correctIndex: number
  explanation: string
}

export const MOCK_QUESTIONS: QuestionWithAnswer[] = [
  {
    questionId: 'q-1',
    index: 1,
    total: 5,
    timeLimit: 20,
    text: 'Какая планета Солнечной системы вращается вокруг своей оси лёжа на боку?',
    options: ['Марс', 'Уран', 'Венера', 'Нептун'],
    correctIndex: 1,
    explanation: 'Наклон оси вращения Урана составляет около 98 градусов, поэтому он буквально «катится» по своей орбите.'
  },
  {
    questionId: 'q-2',
    index: 2,
    total: 5,
    timeLimit: 20,
    text: 'Что означает буква «T» в аббревиатуре нейросетей GPT?',
    options: ['Tensor', 'Transformer', 'Training', 'Translation'],
    correctIndex: 1,
    explanation: 'GPT расшифровывается как Generative Pre-trained Transformer — архитектура, представленная Google в 2017 году.'
  },
  {
    questionId: 'q-3',
    index: 3,
    total: 5,
    timeLimit: 20,
    text: 'Какой химический элемент назван в честь злого подземного гнома из немецкого фольклора?',
    options: ['Никель', 'Кобальт', 'Висмут', 'Титан'],
    correctIndex: 1,
    explanation: 'Название Кобальт происходит от немецкого Kobold — зловредный дух или подземный гном рудокопов.'
  },
  {
    questionId: 'q-4',
    index: 4,
    total: 5,
    timeLimit: 20,
    text: 'Сколько бит информации содержится в одном байте?',
    options: ['4 бита', '8 бит', '16 бит', '32 бита'],
    correctIndex: 1,
    explanation: 'Один байт традиционно состоит из 8 бит (октета).'
  },
  {
    questionId: 'q-5',
    index: 5,
    total: 5,
    timeLimit: 20,
    text: 'Какой алгоритм сортировки в среднем имеет временную сложность O(n log n)?',
    options: ['Bubble Sort', 'Insertion Sort', 'QuickSort', 'Selection Sort'],
    correctIndex: 2,
    explanation: 'QuickSort (быстрая сортировка) имеет среднюю сложность O(n log n) и является стандартом библиотек.'
  }
]
