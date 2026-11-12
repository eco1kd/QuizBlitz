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
        <div className="w-24 h-24 sm:w-28 sm:h-28 rounded-full bg-gradient-to-tr from-[#6850a1] to-[#8b5cf6] flex items-center justify-center shadow-lg shadow-purple-900/15">
          <CheckCircle2 className="w-12 h-12 sm:w-14 sm:h-14 text-white stroke-[2.5]" />
        </div>
        {/* Анимированные круги-волны */}
        <motion.div
          animate={{ scale: [1, 1.4, 1.7], opacity: [0.5, 0.25, 0] }}
          transition={{ repeat: Infinity, duration: 2, ease: 'easeOut' }}
          className="absolute inset-0 rounded-full border-2 border-[#bba3df] pointer-events-none"
        />
      </motion.div>

      {/* Заголовок */}
      <motion.h2
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        className="text-2xl sm:text-3xl font-black text-[#28242d] mb-2"
      >
        Ответ принят!
      </motion.h2>

      <motion.p
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        className="text-[#3c3345] text-sm sm:text-base font-semibold mb-6 max-w-md"
      >
        Держим кулачки 🤞 Ждём остальных игроков или окончания таймера...
      </motion.p>

      {/* Карточка с выбранным ответом в стиле M3 Container */}
      <motion.div
        initial={{ opacity: 0, scale: 0.98 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.2 }}
        aria-label={`Выбранный вариант: ${chosenText}`}
        className="w-full bg-[#ede4f8] border-2 border-[#d8c8ec] rounded-[28px] p-5 sm:p-6 shadow-sm mb-6"
      >
        <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#f4eff9] text-[#51366e] text-xs font-black uppercase tracking-wider mb-2.5 border border-[#d8ccea]">
          <span>Твой выбор</span>
        </div>
        <div className="text-xl sm:text-2xl font-black text-[#1f1929] break-words">
          «{chosenText}»
        </div>
      </motion.div>

      {/* Статус ожидания и таймер в стиле Pill */}
      <div className="flex items-center gap-4 bg-[#f4eff9] px-5 py-2.5 rounded-full border border-[#d8ccea] text-xs text-[#61467f] font-semibold shadow-sm">
        <div className="flex items-center gap-1.5 text-[#6850a1]">
          <Loader2 className="w-4 h-4 animate-spin text-[#6850a1]" aria-hidden="true" />
          <span>Раунд завершится через {timeRemaining}s</span>
        </div>
        <span className="text-[#d8ccea]" aria-hidden="true">|</span>
        <div className="flex items-center gap-1.5 text-[#51366e]">
          <Users className="w-4 h-4 text-[#6850a1]" aria-hidden="true" />
          <span>Синхронизация</span>
        </div>
      </div>
    </div>
  )
}
