import React, { useEffect, useState } from 'react'
import { motion } from 'framer-motion'
import { Flame, Trophy, Clock, Sparkles, Volume2, VolumeX } from 'lucide-react'
import { sounds } from '../../services/soundEffects'

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
  const [isMuted, setIsMuted] = useState(sounds.isMuted)
  const isUrgent = timeRemaining <= 5 && timeRemaining > 0
  const maxTime = timeLimit || 20
  const progressRatio = Math.max(0, Math.min(1, timeRemaining / maxTime))

  // Звук тиканья таймера
  useEffect(() => {
    if (showTimer && timeRemaining <= 5 && timeRemaining > 0) {
      sounds.playTimerTick(true)
    }
  }, [timeRemaining, showTimer])

  const toggleSound = () => {
    const muted = sounds.toggleMute()
    setIsMuted(muted)
  }

  return (
    <header
      role="banner"
      aria-label="Игровая панель"
      className="w-full max-w-3xl mx-auto px-2 pt-2 pb-3 select-none"
    >
      {/* Верхний ряд бейджей в стиле M3 Expressive Pill */}
      <div className="flex items-center justify-between gap-2 mb-3">
        {/* Номер вопроса */}
        <div
          aria-label={`Вопрос ${currentIndex} из ${totalQuestions}`}
          className="flex items-center gap-1.5 px-3.5 py-1.5 bg-[#f4eff9] rounded-full border border-[#d8ccea] shadow-sm"
        >
          <Sparkles className="w-4 h-4 text-[#6850a1]" aria-hidden="true" />
          <span className="text-xs font-semibold tracking-wide text-[#51366e]">
            Вопрос <span className="text-[#28242d] font-bold">{currentIndex}</span> из {totalQuestions}
          </span>
        </div>

        {/* Счёт, Стрик и Звук */}
        <div className="flex items-center gap-2">
          {streak >= 2 && (
            <motion.div
              initial={{ scale: 0.8, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              role="status"
              aria-label={`Серия ответов: множитель x${streak >= 5 ? '1.5' : '1.2'}`}
              className="flex items-center gap-1 px-3 py-1 bg-amber-50 border border-amber-300 rounded-full shadow-sm"
            >
              <Flame className="w-4 h-4 text-amber-500 animate-pulse" aria-hidden="true" />
              <span className="text-xs font-bold text-amber-800">x{streak >= 5 ? '1.5' : '1.2'}</span>
            </motion.div>
          )}

          <div
            role="status"
            aria-label={`Текущий счёт: ${score} очков`}
            className="flex items-center gap-1.5 px-3.5 py-1.5 bg-[#ede4f8] rounded-full border border-[#d5c4f2] shadow-sm"
          >
            <Trophy className="w-4 h-4 text-amber-500" aria-hidden="true" />
            <span className="text-xs font-bold text-[#3d2869] tracking-wider">
              {score.toLocaleString()} <span className="text-[10px] text-[#6850a1] uppercase font-bold">pts</span>
            </span>
          </div>

          {/* Кнопка переключения звука */}
          <button
            type="button"
            onClick={toggleSound}
            aria-label={isMuted ? 'Включить звук' : 'Выключить звук'}
            aria-pressed={isMuted}
            className="w-8 h-8 rounded-full bg-[#f4eff9] border border-[#d8ccea] flex items-center justify-center text-[#6850a1] hover:bg-[#ede4f8] hover:text-[#4c3260] transition"
          >
            {isMuted ? (
              <VolumeX className="w-4 h-4 text-gray-400" aria-hidden="true" />
            ) : (
              <Volume2 className="w-4 h-4 text-[#6850a1]" aria-hidden="true" />
            )}
          </button>
        </div>
      </div>

      {/* Выразительный M3 таймер */}
      {showTimer && (
        <div className="relative w-full">
          <div className="flex items-center justify-between text-xs font-bold mb-1.5 px-1">
            <span className="flex items-center gap-1.5 text-[#746e7a]">
              <Clock className="w-3.5 h-3.5 text-[#6850a1]" aria-hidden="true" />
              Таймер
            </span>
            <motion.span
              role="timer"
              aria-live="off"
              aria-label={`Осталось ${timeRemaining} секунд`}
              animate={isUrgent ? { scale: [1, 1.25, 1], color: ['#ef4444', '#f87171', '#ef4444'] } : {}}
              transition={{ repeat: Infinity, duration: 0.6 }}
              className={`font-mono text-sm font-extrabold ${
                isUrgent ? 'text-red-500 drop-shadow-sm' : 'text-[#6850a1]'
              }`}
            >
              {timeRemaining}s
            </motion.span>
          </div>

          {/* Индикатор полосы таймера с пружинным переходом */}
          <div
            role="progressbar"
            aria-label="Оставшееся время на ответ"
            aria-valuenow={timeRemaining}
            aria-valuemin={0}
            aria-valuemax={maxTime}
            className="w-full h-3 bg-[#ede7f4] rounded-full overflow-hidden p-0.5 border border-[#e4daeb] shadow-inner"
          >
            <motion.div
              className={`h-full rounded-full transition-colors duration-300 ${
                isUrgent
                  ? 'bg-gradient-to-r from-orange-500 to-red-600 shadow-[0_0_10px_rgba(239,68,68,0.5)]'
                  : 'bg-gradient-to-r from-[#6850a1] via-[#8b5cf6] to-[#38bdf8]'
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
