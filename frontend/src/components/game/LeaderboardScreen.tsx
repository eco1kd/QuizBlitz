import React from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Trophy, TrendingUp, TrendingDown, Minus, Flame } from 'lucide-react'
import type { LeaderboardData } from '../../types/game'

interface LeaderboardScreenProps {
  leaderboard: LeaderboardData
  currentPlayerId: string
}

export const LeaderboardScreen: React.FC<LeaderboardScreenProps> = ({
  leaderboard,
  currentPlayerId
}) => {
  return (
    <div className="w-full max-w-2xl mx-auto px-4 py-4 flex flex-col justify-between flex-1 select-none">
      {/* Заголовок лидерборда M3 Expressive */}
      <div className="text-center mb-5">
        <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-purple-500/15 border border-purple-500/30 text-purple-300 text-xs font-bold uppercase tracking-wider mb-2">
          <Trophy className="w-4 h-4 text-yellow-400" />
          Таблица лидеров
        </div>
        <h2 className="text-2xl sm:text-3xl font-black text-white tracking-tight">
          Битва за первенство
        </h2>
      </div>

      {/* Список игроков с плавной M3 Expressive анимацией смены мест */}
      <div className="flex-1 flex flex-col gap-2.5 sm:gap-3 overflow-y-auto pr-1">
        <AnimatePresence>
          {leaderboard.players.map((player, index) => {
            const isMe = player.id === currentPlayerId
            const prev = player.previousRank ?? player.rank
            const rankDelta = prev - player.rank // > 0 means rose up

            return (
              <motion.div
                key={player.id}
                layout
                initial={{ opacity: 0, y: 15 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.95 }}
                transition={{ type: 'spring', stiffness: 350, damping: 28 }}
                className={`relative flex items-center justify-between p-3.5 sm:p-4 rounded-[26px] border transition-all duration-300 ${
                  isMe
                    ? 'bg-gradient-to-r from-purple-950/70 via-[#272344] to-[#1e1c33] border-purple-400/60 shadow-lg shadow-purple-950/40 ring-1 ring-purple-400/50'
                    : 'bg-[#202330] border-white/10 hover:border-white/20 shadow-md'
                }`}
              >
                {/* Левая часть: Место, Аватар, Никнейм */}
                <div className="flex items-center gap-3 sm:gap-4 min-w-0">
                  {/* Номер места */}
                  <div className="flex items-center justify-center w-8 sm:w-9 text-center">
                    {index === 0 ? (
                      <span className="text-xl sm:text-2xl" role="img" aria-label="1st">🥇</span>
                    ) : index === 1 ? (
                      <span className="text-xl sm:text-2xl" role="img" aria-label="2nd">🥈</span>
                    ) : index === 2 ? (
                      <span className="text-xl sm:text-2xl" role="img" aria-label="3rd">🥉</span>
                    ) : (
                      <span className="font-extrabold text-sm sm:text-base text-gray-400">
                        #{player.rank}
                      </span>
                    )}
                  </div>

                  {/* Аватар */}
                  <div className="w-10 h-10 sm:w-11 sm:h-11 rounded-2xl bg-white/10 flex items-center justify-center text-xl sm:text-2xl shadow-inner border border-white/10 flex-shrink-0">
                    {player.avatar || '😎'}
                  </div>

                  {/* Ник и бейдж "Вы" */}
                  <div className="flex flex-col min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-white text-sm sm:text-base truncate max-w-[140px] sm:max-w-[200px]">
                        {player.nickname}
                      </span>
                      {isMe && (
                        <span className="px-2 py-0.5 rounded-full bg-purple-500 text-[10px] font-black uppercase text-white shadow-sm">
                          Вы
                        </span>
                      )}
                    </div>
                    {player.streak && player.streak >= 2 ? (
                      <span className="flex items-center gap-1 text-[11px] font-semibold text-amber-400">
                        <Flame className="w-3 h-3" /> Серия {player.streak}
                      </span>
                    ) : null}
                  </div>
                </div>

                {/* Правая часть: Очки и динамика изменения ранга */}
                <div className="flex items-center gap-3 sm:gap-4 flex-shrink-0">
                  {/* Дельта ранга */}
                  <div className="hidden sm:flex items-center text-xs font-bold w-12 justify-end">
                    {rankDelta > 0 ? (
                      <span className="flex items-center text-emerald-400">
                        <TrendingUp className="w-3.5 h-3.5 mr-0.5" /> +{rankDelta}
                      </span>
                    ) : rankDelta < 0 ? (
                      <span className="flex items-center text-rose-400">
                        <TrendingDown className="w-3.5 h-3.5 mr-0.5" /> {rankDelta}
                      </span>
                    ) : (
                      <span className="text-gray-500 flex items-center">
                        <Minus className="w-3.5 h-3.5" />
                      </span>
                    )}
                  </div>

                  {/* Очки */}
                  <div className="text-right">
                    <span className="text-base sm:text-lg font-black text-white block">
                      {player.score.toLocaleString()}
                    </span>
                    <span className="text-[10px] text-gray-400 uppercase font-semibold">
                      pts
                    </span>
                  </div>
                </div>
              </motion.div>
            )
          })}
        </AnimatePresence>
      </div>

      <div className="mt-4 text-center">
        <span className="text-xs text-purple-300/80 font-medium animate-pulse">
          ⚡ Загрузка следующего испытания...
        </span>
      </div>
    </div>
  )
}
