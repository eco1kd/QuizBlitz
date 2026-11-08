import React from 'react'
import { motion } from 'framer-motion'
import { Check, X, Flame, Lightbulb } from 'lucide-react'
import type { PlayerResult, QuestionData, QuestionRevealData } from '../../types/game'
import { AnswerCard } from './AnswerCard'

interface RevealScreenProps {
  question: QuestionData
  revealData: QuestionRevealData
  myResult: PlayerResult | null
  selectedOption: number | null
}

export const RevealScreen: React.FC<RevealScreenProps> = ({
  question,
  revealData,
  myResult,
  selectedOption
}) => {
  const isCorrect = myResult?.correct ?? false
  const points = myResult?.points ?? 0
  const streak = myResult?.streak ?? 0

  return (
    <div className="w-full max-w-3xl mx-auto px-4 py-3 flex flex-col justify-between flex-1 select-none">
      {/* Эмоциональный баннер результата раунда M3 Expressive */}
      <motion.div
        initial={{ scale: 0.9, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ type: 'spring', stiffness: 350, damping: 22 }}
        className={`relative w-full rounded-[30px] p-4 sm:p-6 mb-4 text-center overflow-hidden border shadow-xl ${
          isCorrect
            ? 'bg-gradient-to-r from-emerald-950/80 via-emerald-900/60 to-[#182a22] border-emerald-500/40 shadow-emerald-950/50'
            : 'bg-gradient-to-r from-rose-950/80 via-rose-900/60 to-[#2a181c] border-rose-500/40 shadow-rose-950/50'
        }`}
      >
        <div className="flex flex-col items-center gap-1.5">
          <div className="flex items-center gap-2">
            {isCorrect ? (
              <div className="w-8 h-8 rounded-full bg-emerald-500 flex items-center justify-center text-white shadow-lg shadow-emerald-500/50">
                <Check className="w-5 h-5 stroke-[3]" />
              </div>
            ) : (
              <div className="w-8 h-8 rounded-full bg-rose-500 flex items-center justify-center text-white shadow-lg shadow-rose-500/50">
                <X className="w-5 h-5 stroke-[3]" />
              </div>
            )}
            <h3 className="text-xl sm:text-2xl font-black text-white">
              {isCorrect ? 'Великолепно! Верный ответ' : 'Увы, неверно!'}
            </h3>
          </div>

          {/* Начисленные очки */}
          <div className="flex items-center gap-2 mt-1">
            <span
              className={`text-2xl sm:text-3xl font-black ${
                isCorrect ? 'text-emerald-400 drop-shadow-[0_0_12px_rgba(52,211,153,0.5)]' : 'text-gray-400'
              }`}
            >
              +{points} <span className="text-sm uppercase tracking-wider">очков</span>
            </span>

            {streak >= 2 && isCorrect && (
              <div className="flex items-center gap-1 px-3 py-1 bg-amber-500/20 border border-amber-500/50 rounded-full">
                <Flame className="w-4 h-4 text-amber-400" />
                <span className="text-xs font-bold text-amber-300">Серия {streak}!</span>
              </div>
            )}
          </div>
        </div>
      </motion.div>

      {/* 4 карточки с подсветкой правильного */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4 mb-4">
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

      {/* Блок с пояснением от ИИ (если есть) */}
      {revealData.explanation && (
        <motion.div
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="bg-[#202330] border border-white/10 rounded-[24px] p-3.5 sm:p-4 text-left shadow-md flex items-start gap-3"
        >
          <div className="flex-shrink-0 w-8 h-8 rounded-xl bg-amber-500/20 text-amber-400 flex items-center justify-center mt-0.5">
            <Lightbulb className="w-4 h-4" />
          </div>
          <div>
            <span className="text-xs font-bold text-amber-400 block mb-0.5 uppercase tracking-wide">
              Пояснение ИИ:
            </span>
            <p className="text-xs sm:text-sm text-gray-300 leading-relaxed">
              {revealData.explanation}
            </p>
          </div>
        </motion.div>
      )}

      {/* Сообщение о переходе к лидерборду */}
      <div className="mt-3 text-center">
        <span className="text-xs text-purple-300 font-semibold animate-pulse">
          Переходим к таблице лидеров...
        </span>
      </div>
    </div>
  )
}
