import React, { useEffect } from 'react'
import { motion } from 'framer-motion'
import { Check, X, Flame, Lightbulb, ArrowRight } from 'lucide-react'
import type { PlayerResult, QuestionData, QuestionRevealData } from '../../types/game'
import { AnswerCard } from './AnswerCard'
import { sounds } from '../../services/soundEffects'

interface RevealScreenProps {
  question: QuestionData
  revealData: QuestionRevealData
  myResult: PlayerResult | null
  selectedOption: number | null
  isHost?: boolean
  onNext?: () => void
}

export const RevealScreen: React.FC<RevealScreenProps> = ({
  question,
  revealData,
  myResult,
  selectedOption,
  isHost = false,
  onNext
}) => {
  const isCorrect = myResult?.correct ?? false
  const points = myResult?.points ?? 0
  const streak = myResult?.streak ?? 0
  const explanationText =
    revealData.explanation?.trim() ||
    `Правильный ответ: «${question.options[revealData.correctIndex]}».`

  useEffect(() => {
    if (isCorrect) {
      sounds.playCorrect()
    } else {
      sounds.playWrong()
    }
  }, [isCorrect])

  return (
    <section
      role="region"
      aria-label="Результаты раунда"
      className="w-full max-w-3xl mx-auto px-2 py-2 flex flex-col justify-between flex-1 select-none"
    >
      {/* Эмоциональный баннер результата раунда в стиле сайта */}
      <motion.div
        role="status"
        aria-live="assertive"
        initial={{ scale: 0.92, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ type: 'spring', stiffness: 350, damping: 22 }}
        className={`relative w-full rounded-[28px] p-4 sm:p-6 mb-4 text-center overflow-hidden border shadow-sm ${
          isCorrect
            ? 'bg-[#e8f8f0] border-[#a3e9c4] text-[#065f46]'
            : 'bg-[#fef2f2] border-[#fecaca] text-[#991b1b]'
        }`}
      >
        <div className="flex flex-col items-center gap-1.5">
          <div className="flex items-center gap-2.5">
            {isCorrect ? (
              <div
                aria-hidden="true"
                className="w-8 h-8 rounded-full bg-emerald-500 flex items-center justify-center text-white shadow-sm"
              >
                <Check className="w-5 h-5 stroke-[3]" />
              </div>
            ) : (
              <div
                aria-hidden="true"
                className="w-8 h-8 rounded-full bg-rose-500 flex items-center justify-center text-white shadow-sm"
              >
                <X className="w-5 h-5 stroke-[3]" />
              </div>
            )}
            <h3 className="text-xl sm:text-2xl font-black">
              {isCorrect ? 'Великолепно! Верный ответ' : 'Увы, неверно!'}
            </h3>
          </div>

          {/* Начисленные очки */}
          <div className="flex items-center gap-2 mt-1">
            <span
              className={`text-2xl sm:text-3xl font-black ${
                isCorrect ? 'text-emerald-700' : 'text-gray-500'
              }`}
            >
              +{points} <span className="text-sm uppercase tracking-wider font-extrabold">очков</span>
            </span>

            {streak >= 2 && isCorrect && (
              <div className="flex items-center gap-1 px-3 py-1 bg-amber-100 border border-amber-300 rounded-full shadow-sm">
                <Flame className="w-4 h-4 text-amber-500" aria-hidden="true" />
                <span className="text-xs font-bold text-amber-900">Серия {streak}!</span>
              </div>
            )}
          </div>
        </div>
      </motion.div>

      {/* 4 карточки с подсветкой правильного */}
      <div
        role="group"
        aria-label="Разбор вариантов ответа"
        className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4 mb-4"
      >
        {question.options.map((optText, idx) => (
          <AnswerCard
            key={idx}
            index={idx}
            text={optText}
            selected={selectedOption === idx}
            isCorrect={idx === revealData.correctIndex}
            disabled={true}
          />
        ))}
      </div>

      {/* Блок с пояснением от ИИ в теплом стиле M3 */}
      {explanationText && (
        <motion.div
          role="note"
          aria-label="Пояснение к ответу"
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="bg-[#fdfbf6] border border-[#f3ead3] rounded-[24px] p-3.5 sm:p-4 text-left shadow-sm flex items-start gap-3 mb-3"
        >
          <div
            aria-hidden="true"
            className="flex-shrink-0 w-8 h-8 rounded-xl bg-amber-100 text-amber-700 flex items-center justify-center mt-0.5"
          >
            <Lightbulb className="w-4 h-4" />
          </div>
          <div>
            <span className="text-xs font-bold text-amber-800 block mb-0.5 uppercase tracking-wide">
              Пояснение ИИ:
            </span>
            <p className="text-xs sm:text-sm text-[#3c3021] leading-relaxed">
              {explanationText}
            </p>
          </div>
        </motion.div>
      )}

      {/* Кнопка перехода к таблице лидеров */}
      <div className="mt-2 flex items-center justify-center">
        {isHost && onNext ? (
          <motion.button
            type="button"
            aria-label="Перейти к таблице лидеров"
            onClick={() => {
              sounds.playClick()
              onNext()
            }}
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.96 }}
            className="px-7 py-3.5 rounded-full bg-[#6850a1] hover:bg-[#5b438f] text-white font-extrabold text-sm shadow-md shadow-purple-900/15 flex items-center gap-2 cursor-pointer transition"
          >
            <span>К таблице лидеров</span>
            <ArrowRight className="w-4 h-4" aria-hidden="true" />
          </motion.button>
        ) : (
          <span role="status" aria-live="polite" className="text-xs text-[#6850a1] font-semibold animate-pulse">
            Переходим к таблице лидеров...
          </span>
        )}
      </div>
    </section>
  )
}
