import React from 'react'
import { motion } from 'framer-motion'
import { CheckCircle2, Users, Loader2 } from 'lucide-react'
import type { QuestionData } from '../../types/game'

interface WaitingScreenProps {
  question: QuestionData
  selectedOption: number | null
  timeRemaining: number
}

export const WaitingScreen: React.FC<WaitingScreenProps> = ({
  question,
  selectedOption,
  timeRemaining
}) => {
  const chosenText = selectedOption !== null ? question.options[selectedOption] : 'Нет ответа'

  return (
    <div
      role="status"
      aria-live="polite"
      aria-busy="true"
      aria-label="Ответ принят, ожидание остальных игроков"
      className="w-full max-w-xl mx-auto px-4 py-8 flex flex-col items-center justify-center flex-1 text-center select-none"
    >
      {/* Пульсирующий индикатор M3 Expressive */}
      <motion.div
        initial={{ scale: 0 }}
        animate={{ scale: 1 }}
        transition={{ type: 'spring', stiffness: 300, damping: 20 }}
        aria-hidden="true"
        className="relative mb-6"
      >
        <div className="w-24 h-24 sm:w-28 sm:h-28 rounded-full bg-gradient-to-tr from-purple-600 to-indigo-500 flex items-center justify-center shadow-[0_0_35px_rgba(157,134,255,0.4)]">
          <CheckCircle2 className="w-12 h-12 sm:w-14 sm:h-14 text-white stroke-[2.5]" />
        </div>
        {/* Анимированные круги-волны */}
        <motion.div
          animate={{ scale: [1, 1.4, 1.7], opacity: [0.6, 0.3, 0] }}
          transition={{ repeat: Infinity, duration: 2, ease: 'easeOut' }}
          className="absolute inset-0 rounded-full border-2 border-purple-400 pointer-events-none"
        />
      </motion.div>

      {/* Заголовок */}
      <motion.h2
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        className="text-2xl sm:text-3xl font-black text-white mb-2"
      >
        Ответ принят!
      </motion.h2>

      <motion.p
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
        className="text-gray-300 text-sm sm:text-base font-medium mb-6 max-w-sm"
      >
        Держим кулачки 🤞 Ждём остальных игроков или окончания таймера...
      </motion.p>

      {/* Карточка с выбранным ответом */}
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ delay: 0.15 }}
        aria-label={`Выбранный вариант: ${chosenText}`}
        className="w-full bg-[var(--bg-surface-container)] border border-white/10 rounded-[28px] p-4 sm:p-5 shadow-xl mb-6"
      >
        <span className="text-xs font-semibold uppercase text-purple-300 tracking-wider block mb-1">
          Твой вариант:
        </span>
        <div className="text-lg sm:text-xl font-bold text-white break-words">
          «{chosenText}»
        </div>
      </motion.div>

      {/* Статус ожидания и таймер */}
      <div className="flex items-center gap-4 bg-[var(--bg-surface-dim)] px-5 py-2.5 rounded-full border border-white/5 text-xs text-gray-400 font-semibold shadow-inner">
        <div className="flex items-center gap-1.5 text-purple-300">
          <Loader2 className="w-4 h-4 animate-spin text-purple-400" aria-hidden="true" />
          <span>Раунд завершится через {timeRemaining}s</span>
        </div>
        <span className="text-gray-600" aria-hidden="true">|</span>
        <div className="flex items-center gap-1.5 text-gray-300">
          <Users className="w-4 h-4 text-cyan-400" aria-hidden="true" />
          <span>Синхронизация</span>
        </div>
      </div>
    </div>
  )
}
