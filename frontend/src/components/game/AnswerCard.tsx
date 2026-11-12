import React from 'react'
import { motion } from 'framer-motion'
import { Triangle, Diamond, Circle, Square, Check, X } from 'lucide-react'
import { sounds } from '../../services/soundEffects'

export interface AnswerCardProps {
  index: number // 0..3
  text: string
  selected?: boolean
  isCorrect?: boolean | null // null = not reveal yet, true = correct answer, false = wrong answer
  disabled?: boolean
  onClick?: () => void
}

const OPTION_STYLES = [
  {
    // Вариант 0: Красный / Треугольник
    bg: 'bg-gradient-to-br from-[var(--option-red-start)] to-[var(--option-red-end)]',
    border: 'border-red-400/30',
    icon: Triangle,
    ring: 'ring-red-400',
    shadow: 'shadow-red-900/30'
  },
  {
    // Вариант 1: Синий / Ромб
    bg: 'bg-gradient-to-br from-[var(--option-blue-start)] to-[var(--option-blue-end)]',
    border: 'border-blue-400/30',
    icon: Diamond,
    ring: 'ring-blue-400',
    shadow: 'shadow-blue-900/30'
  },
  {
    // Вариант 2: Желтый / Круг
    bg: 'bg-gradient-to-br from-[var(--option-amber-start)] to-[var(--option-amber-end)]',
    border: 'border-amber-400/30',
    icon: Circle,
    ring: 'ring-amber-400',
    shadow: 'shadow-amber-900/30'
  },
  {
    // Вариант 3: Зеленый / Квадрат
    bg: 'bg-gradient-to-br from-[var(--option-emerald-start)] to-[var(--option-emerald-end)]',
    border: 'border-emerald-400/30',
    icon: Square,
    ring: 'ring-emerald-400',
    shadow: 'shadow-emerald-900/30'
  }
]

export const AnswerCard: React.FC<AnswerCardProps> = ({
  index,
  text,
  selected = false,
  isCorrect = null,
  disabled = false,
  onClick
}) => {
  const style = OPTION_STYLES[index % 4]
  const IconComponent = style.icon

  // Поведение подсветки при показе результатов
  const isRevealMode = isCorrect !== null
  let containerExtra = ''
  let opacity = 1

  if (isRevealMode) {
    if (isCorrect) {
      containerExtra = 'ring-4 ring-emerald-400 shadow-[0_0_25px_rgba(16,185,129,0.7)] scale-[1.02]'
    } else if (selected && !isCorrect) {
      containerExtra = 'ring-4 ring-rose-500 opacity-60'
    } else {
      opacity = 0.35
    }
  } else if (selected) {
    containerExtra = 'ring-4 ring-white shadow-2xl scale-[0.98]'
  }

  const handleClick = () => {
    if (disabled || isRevealMode) return
    sounds.playClick()
    onClick?.()
  }

  const statusSuffix = isRevealMode
    ? isCorrect
      ? ' — верный ответ'
      : selected
        ? ' — ваш ответ (неверно)'
        : ''
    : selected
      ? ' — выбрано'
      : ''

  return (
    <motion.button
      type="button"
      onClick={handleClick}
      aria-label={`Вариант ${index + 1}: ${text}${statusSuffix}`}
      aria-pressed={selected}
      aria-disabled={disabled || isRevealMode}
      whileHover={!disabled && !isRevealMode ? { y: -2, scale: 1.01 } : {}}
      whileTap={!disabled && !isRevealMode ? { scale: 0.94 } : {}}
      transition={{ type: 'spring', stiffness: 500, damping: 25 }}
      style={{ opacity }}
      disabled={disabled}
      className={`relative w-full min-h-[76px] sm:min-h-[88px] p-3.5 sm:p-4 rounded-[26px] sm:rounded-[28px] text-white flex items-center gap-3 sm:gap-4 border text-left cursor-pointer transition-all duration-200 select-none shadow-lg active:brightness-110 ${style.bg} ${style.border} ${style.shadow} ${containerExtra} ${
        disabled && !isRevealMode ? 'cursor-not-allowed opacity-90' : ''
      }`}
    >
      {/* Иконка фигуры M3 Pill */}
      <div
        aria-hidden="true"
        className="flex-shrink-0 w-11 h-11 sm:w-13 sm:h-13 rounded-2xl bg-black/25 backdrop-blur-sm flex items-center justify-center border border-white/20 shadow-inner"
      >
        {isRevealMode && isCorrect ? (
          <Check className="w-6 h-6 sm:w-7 sm:h-7 text-white stroke-[3]" />
        ) : isRevealMode && selected && !isCorrect ? (
          <X className="w-6 h-6 sm:w-7 sm:h-7 text-white stroke-[3]" />
        ) : (
          <IconComponent className="w-5 h-5 sm:w-6 sm:h-6 text-white fill-white/80" />
        )}
      </div>

      {/* Текст ответа */}
      <div className="flex-1 min-w-0 pr-2">
        <span className="text-base sm:text-lg font-bold leading-snug tracking-wide block break-words drop-shadow-sm">
          {text}
        </span>
      </div>

      {/* Бейдж выбора игроком */}
      {selected && !isRevealMode && (
        <motion.div
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          aria-hidden="true"
          className="flex-shrink-0 px-2.5 py-1 rounded-full bg-white text-gray-900 text-xs font-black uppercase tracking-wider shadow-md"
        >
          Выбор
        </motion.div>
      )}
    </motion.button>
  )
}
