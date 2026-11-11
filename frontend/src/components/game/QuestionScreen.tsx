import React from 'react'
import { motion } from 'framer-motion'
import type { QuestionData } from '../../types/game'
import { AnswerCard } from './AnswerCard'
import { HelpCircle } from 'lucide-react'

interface QuestionScreenProps {
  question: QuestionData
  selectedOption: number | null
  onSelectOption: (index: number) => void
  disabled?: boolean
}

export const QuestionScreen: React.FC<QuestionScreenProps> = ({
  question,
  selectedOption,
  onSelectOption,
  disabled = false
}) => {
  return (
    <section
      role="region"
      aria-labelledby="current-question-heading"
      className="w-full max-w-3xl mx-auto px-4 py-2 flex flex-col justify-between flex-1"
    >
      {/* Карточка вопроса M3 Expressive Card */}
      <motion.div
        initial={{ opacity: 0, y: 15 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.35, ease: 'easeOut' }}
        className="relative bg-[var(--bg-surface-container)] border border-white/10 rounded-[32px] p-5 sm:p-7 shadow-2xl mb-4 sm:mb-6 overflow-hidden"
      >
        {/* Фоновые декоративные блики M3 Expressive */}
        <div
          aria-hidden="true"
          className="absolute -top-12 -right-12 w-36 h-36 bg-purple-600/15 rounded-full blur-2xl pointer-events-none"
        />
        <div
          aria-hidden="true"
          className="absolute -bottom-12 -left-12 w-36 h-36 bg-blue-600/15 rounded-full blur-2xl pointer-events-none"
        />

        <div className="relative z-10 flex items-start gap-3">
          <div
            aria-hidden="true"
            className="hidden sm:flex flex-shrink-0 w-9 h-9 rounded-2xl bg-purple-500/20 items-center justify-center text-purple-300 mt-0.5"
          >
            <HelpCircle className="w-5 h-5" />
          </div>
          <div className="flex-1">
            <h2
              id="current-question-heading"
              className="text-xl sm:text-2xl md:text-3xl font-extrabold text-white leading-tight sm:leading-snug tracking-tight"
            >
              {question.text}
            </h2>
          </div>
        </div>
      </motion.div>

      {/* Сетка из 4 вариантов ответов */}
      <motion.div
        role="group"
        aria-label="Варианты ответа"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ staggerChildren: 0.08, delayChildren: 0.1 }}
        className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4 flex-1 items-stretch"
      >
        {question.options.map((optionText, idx) => (
          <AnswerCard
            key={idx}
            index={idx}
            text={optionText}
            selected={selectedOption === idx}
            disabled={disabled || selectedOption !== null}
            onClick={() => onSelectOption(idx)}
          />
        ))}
      </motion.div>

      {/* Подсказка снизу */}
      <div className="mt-4 text-center" role="status" aria-live="polite">
        <span className="text-xs text-gray-400 font-medium">
          {selectedOption === null
            ? '⚡ Чем быстрее правильный ответ, тем больше очков!'
            : '✓ Ответ зафиксирован, ожидаем завершения раунда'}
        </span>
      </div>
    </section>
  )
}
