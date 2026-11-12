import React from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Trophy, TrendingUp, TrendingDown, Minus, Flame, ArrowRight } from 'lucide-react'
import type { LeaderboardData } from '../../types/game'
import { sounds } from '../../services/soundEffects'

interface LeaderboardScreenProps {
  leaderboard: LeaderboardData
  currentPlayerId: string
  isHost?: boolean
  isLastQuestion?: boolean
  onNext?: () => void
}

export const LeaderboardScreen: React.FC<LeaderboardScreenProps> = ({
  leaderboard,
  currentPlayerId,
  isHost = false,
  isLastQuestion = false,
  onNext
}) => {
  return (
    <section
      role="region"
      aria-label="Таблица лидеров"
      className="w-full max-w-2xl mx-auto px-2 py-3 flex flex-col justify-between flex-1 select-none"
    >
      {/* Заголовок лидерборда M3 Expressive в стиле сайта */}
      <div className="text-center mb-5">
        <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-[#f4eff9] border border-[#d8ccea] text-[#61467f] text-xs font-bold uppercase tracking-wider mb-2">
          <Trophy className="w-4 h-4 text-amber-500" aria-hidden="true" />
          Таблица лидеров
        </div>
        <h2 className="text-2xl sm:text-3xl font-black text-[#28242d] tracking-tight">
          Битва за первенство
        </h2>
      </div>

      {/* Список игроков с плавной M3 Expressive анимацией смены мест */}
      <div
        role="list"
        aria-label="Рейтинг игроков"
        className="flex-1 flex flex-col gap-2.5 sm:gap-3 overflow-y-auto pr-1"
      >
        <AnimatePresence>
          {leaderboard.players.map((player, index) => {
            const isMe = player.id === currentPlayerId
            const prev = player.previousRank ?? player.rank
            const rankDelta = prev - player.rank // > 0 means rose up

            return (
              <motion.div
                key={player.id}
                role="listitem"
                aria-label={`${player.rank} место: ${player.nickname}${isMe ? ' (Вы)' : ''}, ${player.score} очков`}
                layout
                initial={{ opacity: 0, y: 15 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.95 }}
                transition={{ type: 'spring', stiffness: 350, damping: 28 }}
                className={`relative flex items-center justify-between p-3.5 sm:p-4 rounded-[24px] border transition-all duration-300 ${
                  isMe
                    ? 'bg-[#ede4f8] border-[#bba3df] shadow-md shadow-purple-900/5 ring-1 ring-[#bba3df]'
                    : 'bg-white border-[#eae3ef] hover:border-[#d8ccea] shadow-sm'
                }`}
              >
                {/* Левая часть: Место, Аватар, Никнейм */}
                <div className="flex items-center gap-3 sm:gap-4 min-w-0">
                  {/* Номер места */}
                  <div className="flex items-center justify-center w-8 sm:w-9 text-center">
                    {index === 0 ? (
                      <span className="text-xl sm:text-2xl" role="img" aria-label="1 место">🥇</span>
                    ) : index === 1 ? (
                      <span className="text-xl sm:text-2xl" role="img" aria-label="2 место">🥈</span>
                    ) : index === 2 ? (
                      <span className="text-xl sm:text-2xl" role="img" aria-label="3 место">🥉</span>
                    ) : (
                      <span className="font-extrabold text-sm sm:text-base text-[#746e7a]">
                        #{player.rank}
                      </span>
                    )}
                  </div>

                  {/* Аватар */}
                  <div
                    aria-hidden="true"
                    className="w-10 h-10 sm:w-11 sm:h-11 rounded-2xl bg-[#f4eff9] border border-[#e2d7ed] flex items-center justify-center text-xl sm:text-2xl shadow-inner flex-shrink-0"
                  >
                    {player.avatar || '😎'}
                  </div>

                  {/* Ник и бейдж "Вы" */}
                  <div className="flex flex-col min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-[#28242d] text-sm sm:text-base truncate max-w-[140px] sm:max-w-[200px]">
                        {player.nickname}
                      </span>
                      {isMe && (
                        <span className="px-2 py-0.5 rounded-full bg-[#6850a1] text-[10px] font-black uppercase text-white shadow-sm">
                          Вы
                        </span>
                      )}
                    </div>
                    {player.streak && player.streak >= 2 ? (
                      <span className="flex items-center gap-1 text-[11px] font-semibold text-amber-700">
                        <Flame className="w-3 h-3 text-amber-500" aria-hidden="true" /> Серия {player.streak}
                      </span>
                    ) : null}
                  </div>
                </div>

                {/* Правая часть: Очки и динамика изменения ранга */}
                <div className="flex items-center gap-3 sm:gap-4 flex-shrink-0">
                  {/* Дельта ранга */}
                  <div className="hidden sm:flex items-center text-xs font-bold w-12 justify-end">
                    {rankDelta > 0 ? (
                      <span className="flex items-center text-emerald-600" aria-label={`Поднялся на ${rankDelta}`}>
                        <TrendingUp className="w-3.5 h-3.5 mr-0.5" aria-hidden="true" /> +{rankDelta}
                      </span>
                    ) : rankDelta < 0 ? (
                      <span className="flex items-center text-rose-600" aria-label={`Опустился на ${Math.abs(rankDelta)}`}>
                        <TrendingDown className="w-3.5 h-3.5 mr-0.5" aria-hidden="true" /> {rankDelta}
                      </span>
                    ) : (
                      <span className="text-[#a89fad] flex items-center" aria-label="Позиция без изменений">
                        <Minus className="w-3.5 h-3.5" aria-hidden="true" />
                      </span>
                    )}
                  </div>

                  {/* Очки */}
                  <div className="text-right">
                    <span className="text-base sm:text-lg font-black text-[#6850a1] block">
                      {player.score.toLocaleString()}
                    </span>
                    <span className="text-[10px] text-[#746e7a] uppercase font-bold">
                      pts
                    </span>
                  </div>
                </div>
              </motion.div>
            )
          })}
        </AnimatePresence>
      </div>

      <div className="mt-4 flex items-center justify-center">
        {isHost && onNext ? (
          <motion.button
            type="button"
            aria-label={isLastQuestion ? 'Перейти к итогам игры' : 'Перейти к следующему вопросу'}
            onClick={() => {
              sounds.playClick()
              onNext()
            }}
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.96 }}
            className="px-7 py-3.5 rounded-full bg-[#6850a1] hover:bg-[#5b438f] text-white font-extrabold text-sm shadow-md shadow-purple-900/15 flex items-center gap-2 cursor-pointer transition"
          >
            <span>{isLastQuestion ? 'Итоги игры' : 'Следующий вопрос'}</span>
            <ArrowRight className="w-4 h-4" aria-hidden="true" />
          </motion.button>
        ) : (
          <span role="status" aria-live="polite" className="text-xs text-[#6850a1] font-semibold animate-pulse">
            {isLastQuestion ? '⚡ Подводим итоги игры...' : '⚡ Загрузка следующего испытания...'}
          </span>
        )}
      </div>
    </section>
  )
}
