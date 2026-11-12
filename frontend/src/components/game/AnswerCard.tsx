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
    bg: 'bg-gradient-to-br from-[#e53950] to-[#c61e36]',
    border: 'border-[#b3162c]',
    shadow: 'shadow-[0_5px_0_#941324,0_10px_20px_rgba(229,57,80,0.22)]',
    icon: Triangle,
  },
  {
    // Вариант 1: Синий / Ромб
    bg: 'bg-gradient-to-br from-[#2563eb] to-[#1d4ed8]',
    border: 'border-[#1e40af]',
    shadow: 'shadow-[0_5px_0_#1e3a8a,0_10px_20px_rgba(37,99,235,0.22)]',
    icon: Diamond,
  },
  {
    // Вариант 2: Желтый / Круг
    bg: 'bg-gradient-to-br from-[#f59e0b] to-[#d97706]',
    border: 'border-[#b45309]',
    shadow: 'shadow-[0_5px_0_#92400e,0_10px_20px_rgba(245,158,11,0.22)]',
    icon: Circle,
  },
  {
    // Вариант 3: Зеленый / Квадрат
    bg: 'bg-gradient-to-br from-[#10b981] to-[#059669]',
    border: 'border-[#047857]',
    shadow: 'shadow-[0_5px_0_#065f46,0_10px_20px_rgba(16,185,129,0.22)]',
    icon: Square,
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
  let cardBg = style.bg
  let cardBorder = style.border
  let cardShadow = style.shadow
  let textColor = 'text-white'
  let containerExtra = ''

  if (isRevealMode) {
    if (isCorrect) {
      cardBg = 'bg-gradient-to-br from-[#10b981] to-[#059669]'
      cardBorder = 'border-[#047857]'
      cardShadow = 'shadow-[0_8px_25px_rgba(16,185,129,0.4)]'
      textColor = 'text-white'
      containerExtra = 'ring-4 ring-emerald-500 scale-[1.02]'
    } else if (selected && !isCorrect) {
      cardBg = 'bg-[#fee2e2]'
      cardBorder = 'border-[#fca5a5]'
      cardShadow = 'shadow-sm'
      textColor = 'text-[#991b1b]'
      containerExtra = 'ring-4 ring-rose-500'
    } else {
      cardBg = 'bg-[#f8f5fa]'
      cardBorder = 'border-[#e6dcee]'
      cardShadow = 'shadow-none'
      textColor = 'text-[#3c3546]'
      containerExtra = ''
    }
  } else if (selected) {
    containerExtra = 'ring-4 ring-[#6850a1] shadow-2xl scale-[0.98]'
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
      whileTap={!disabled && !isRevealMode ? { y: 3, scale: 0.98 } : {}}
      transition={{ type: 'spring', stiffness: 500, damping: 25 }}
      disabled={disabled}
      className={`relative w-full min-h-[76px] sm:min-h-[88px] p-3.5 sm:p-4 rounded-[26px] sm:rounded-[28px] ${textColor} flex items-center gap-3 sm:gap-4 border text-left cursor-pointer transition-all duration-200 select-none ${cardBg} ${cardBorder} ${cardShadow} ${containerExtra} ${
        disabled && !isRevealMode ? 'cursor-not-allowed opacity-90' : ''
      }`}
    >
      {/* Иконка фигуры M3 Pill */}
      <div
        aria-hidden="true"
        className={`flex-shrink-0 w-11 h-11 sm:w-13 sm:h-13 rounded-2xl flex items-center justify-center border shadow-inner ${
          isRevealMode && isCorrect
            ? 'bg-emerald-600 border-white/40 text-white'
            : isRevealMode && selected && !isCorrect
              ? 'bg-rose-600 border-white/40 text-white'
              : isRevealMode
                ? 'bg-[#ede4f8] border-[#d8cce4] text-[#6b5880]'
                : 'bg-black/20 border-white/30 backdrop-blur-sm text-white'
        }`}
      >
        {isRevealMode && isCorrect ? (
          <Check className="w-6 h-6 sm:w-7 sm:h-7 stroke-[3]" />
        ) : isRevealMode && selected && !isCorrect ? (
          <X className="w-6 h-6 sm:w-7 sm:h-7 stroke-[3]" />
        ) : (
          <IconComponent
            className={`w-5 h-5 sm:w-6 sm:h-6 ${
              isRevealMode ? 'fill-current' : 'fill-white/80'
            }`}
          />
        )}
      </div>

      {/* Текст ответа */}
      <div className="flex-1 min-w-0 pr-2">
        <span className={`text-base sm:text-lg font-bold leading-snug tracking-wide block break-words ${
          isRevealMode && !isCorrect && !selected ? '' : 'drop-shadow-sm'
        }`}>
          {text}
        </span>
      </div>

      {/* Бейдж выбора игроком */}
      {selected && !isRevealMode && (
        <motion.div
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          aria-hidden="true"
          className="flex-shrink-0 px-2.5 py-1 rounded-full bg-white text-[#3d2869] text-xs font-black uppercase tracking-wider shadow-md"
        >
          Выбор
        </motion.div>
      )}
    </motion.button>
  )
}
