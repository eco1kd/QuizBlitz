import React from 'react'
import { motion } from 'framer-motion'
import { Flame, Trophy, Clock, Sparkles } from 'lucide-react'

interface GameHeaderProps {
  currentIndex: number
  totalQuestions: number
  score: number
  streak: number
  timeRemaining: number
  timeLimit: number
  showTimer?: boolean
}

export const GameHeader: React.FC<GameHeaderProps> = ({
  currentIndex,
  totalQuestions,
  score,
  streak,
  timeRemaining,
  timeLimit,
  showTimer = true
}) => {
  const isUrgent = timeRemaining <= 5 && timeRemaining > 0
  const progressRatio = Math.max(0, Math.min(1, timeRemaining / (timeLimit || 20)))

  return (
    <header className="w-full max-w-3xl mx-auto px-4 pt-3 pb-2 select-none">
      {/* Верхний ряд бейджей в стиле M3 Expressive Pill */}
      <div className="flex items-center justify-between gap-2 mb-3">
        {/* Номер вопроса */}
        <div className="flex items-center gap-1.5 px-3.5 py-1.5 bg-[#202330] rounded-full border border-white/10 shadow-sm">
          <Sparkles className="w-4 h-4 text-[#9d86ff]" />
          <span className="text-xs font-semibold tracking-wide text-gray-300">
            Вопрос <span className="text-white font-bold">{currentIndex}</span> из {totalQuestions}
          </span>
        </div>

        {/* Счёт и Стрик */}
        <div className="flex items-center gap-2">
          {streak >= 2 && (
            <motion.div
              initial={{ scale: 0.8, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              className="flex items-center gap-1 px-3 py-1 bg-amber-500/20 border border-amber-500/40 rounded-full"
            >
              <Flame className="w-4 h-4 text-amber-400 animate-pulse" />
              <span className="text-xs font-bold text-amber-300">x{streak >= 5 ? '1.5' : '1.2'}</span>
            </motion.div>
          )}

          <div className="flex items-center gap-1.5 px-3.5 py-1.5 bg-[#292d3e] rounded-full border border-purple-500/30 shadow-md">
            <Trophy className="w-4 h-4 text-yellow-400" />
            <span className="text-xs font-bold text-white tracking-wider">
              {score.toLocaleString()} <span className="text-[10px] text-purple-300 uppercase">pts</span>
            </span>
          </div>
        </div>
      </div>

      {/* Выразительный M3 таймер */}
      {showTimer && (
        <div className="relative w-full">
          <div className="flex items-center justify-between text-xs font-bold mb-1.5 px-1">
            <span className="flex items-center gap-1 text-gray-400">
              <Clock className="w-3.5 h-3.5" />
              Таймер
            </span>
            <motion.span
              animate={isUrgent ? { scale: [1, 1.25, 1], color: ['#ef4444', '#f87171', '#ef4444'] } : {}}
              transition={{ repeat: Infinity, duration: 0.6 }}
              className={`font-mono text-sm font-extrabold ${
                isUrgent ? 'text-red-500 drop-shadow-[0_0_8px_rgba(239,68,68,0.7)]' : 'text-purple-300'
              }`}
            >
              {timeRemaining}s
            </motion.span>
          </div>

          {/* Индикатор полосы таймера с пружинным переходом */}
          <div className="w-full h-3 bg-[#181a24] rounded-full overflow-hidden p-0.5 border border-white/10 shadow-inner">
            <motion.div
              className={`h-full rounded-full transition-colors duration-300 ${
                isUrgent
                  ? 'bg-gradient-to-r from-orange-500 to-red-600 shadow-[0_0_12px_rgba(239,68,68,0.8)]'
                  : 'bg-gradient-to-r from-purple-500 via-indigo-500 to-cyan-400'
              }`}
              initial={false}
              animate={{ width: `${progressRatio * 100}%` }}
              transition={{ ease: 'linear', duration: 0.3 }}
            />
          </div>
        </div>
      )}
    </header>
  )
}
