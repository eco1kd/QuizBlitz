import React, { useEffect } from 'react'
import { motion } from 'framer-motion'
import confetti from 'canvas-confetti'
import { Trophy, Crown, Flame, Award, RotateCcw } from 'lucide-react'
import type { GameFinishedData } from '../../types/game'
import { sounds } from '../../services/soundEffects'

interface PodiumScreenProps {
  finishedData: GameFinishedData
  currentPlayerId: string
  onRestart: () => void
}

export const PodiumScreen: React.FC<PodiumScreenProps> = ({
  finishedData,
  currentPlayerId,
  onRestart
}) => {
  const { leaderboard, stats } = finishedData

  const firstPlace = leaderboard[0]
  const secondPlace = leaderboard[1]
  const thirdPlace = leaderboard[2]

  const myPlayer = leaderboard.find(p => p.id === currentPlayerId)

  // Персональное количество правильных ответов (или нормализованное по числу игроков, строго <= totalQuestions)
  const myCorrectCount =
    stats.playerCorrectCounts?.[currentPlayerId] ??
    (stats.correctAnswersCount <= stats.totalQuestions
      ? stats.correctAnswersCount
      : Math.round(stats.correctAnswersCount / Math.max(1, leaderboard.length)))

  const accuracyPercent = stats.totalQuestions
    ? Math.min(100, Math.round((myCorrectCount / stats.totalQuestions) * 100))
    : 0

  // Запуск праздничного конфетти салюта и фанфар при входе на подиум
  useEffect(() => {
    sounds.playFanfare()

    const duration = 3 * 1000
    const end = Date.now() + duration

    const frame = () => {
      confetti({
        particleCount: 4,
        angle: 60,
        spread: 55,
        origin: { x: 0, y: 0.7 },
        colors: ['#9d86ff', '#52e1c9', '#ff7597', '#fbbf24']
      })
      confetti({
        particleCount: 4,
        angle: 120,
        spread: 55,
        origin: { x: 1, y: 0.7 },
        colors: ['#9d86ff', '#52e1c9', '#ff7597', '#fbbf24']
      })

      if (Date.now() < end) {
        requestAnimationFrame(frame)
      }
    }

    frame()
  }, [])

  return (
    <section
      role="region"
      aria-label="Финал игры и подиум победителей"
      className="w-full max-w-3xl mx-auto px-4 py-4 flex flex-col justify-between flex-1 select-none overflow-y-auto"
    >
      {/* Заголовок победы */}
      <div className="text-center mb-4 sm:mb-6">
        <motion.div
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          transition={{ type: 'spring', stiffness: 350, damping: 20 }}
          className="inline-flex items-center gap-1.5 px-4 py-1.5 rounded-full bg-yellow-500/20 border border-yellow-500/40 text-yellow-300 text-xs font-bold uppercase tracking-wider mb-2"
        >
          <Trophy className="w-4 h-4 text-yellow-400" aria-hidden="true" />
          Финал игры
        </motion.div>
        <h2 className="text-2xl sm:text-4xl font-black text-white tracking-tight">
          Подиум победителей
        </h2>
      </div>

      {/* Выразительный M3 Expressive Пьедестал Топ-3 */}
      <div
        role="list"
        aria-label="Призёры игры (Топ-3)"
        className="flex items-end justify-center gap-2 sm:gap-4 my-3 sm:my-6 h-56 sm:h-64 px-2"
      >
        {/* 2 МЕСТО (Слева) */}
        {secondPlace && (
          <motion.div
            role="listitem"
            aria-label={`2 место: ${secondPlace.nickname}, ${secondPlace.score} очков`}
            initial={{ opacity: 0, y: 40 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2, type: 'spring', stiffness: 300 }}
            className="flex flex-col items-center flex-1 max-w-[110px] sm:max-w-[130px]"
          >
            <div className="text-2xl sm:text-3xl mb-1" aria-hidden="true">{secondPlace.avatar || '🥈'}</div>
            <span className="text-xs font-bold text-gray-200 truncate max-w-full block mb-0.5">
              {secondPlace.nickname}
            </span>
            <span className="text-[11px] font-extrabold text-purple-300 mb-2">
              {secondPlace.score.toLocaleString()} pts
            </span>
            {/* Тумба 2 места */}
            <div className="w-full h-24 sm:h-28 rounded-t-[26px] bg-gradient-to-t from-slate-800 to-slate-600 border-t-2 border-slate-300 flex flex-col items-center justify-center shadow-lg">
              <span className="text-2xl sm:text-3xl font-black text-slate-200">2</span>
              <span className="text-[10px] font-bold text-slate-400 uppercase">Silver</span>
            </div>
          </motion.div>
        )}

        {/* 1 МЕСТО (Центр, самый высокий) */}
        {firstPlace && (
          <motion.div
            role="listitem"
            aria-label={`1 место (Чемпион): ${firstPlace.nickname}, ${firstPlace.score} очков`}
            initial={{ opacity: 0, y: 60 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4, type: 'spring', stiffness: 300 }}
            className="flex flex-col items-center flex-1 max-w-[130px] sm:max-w-[160px] relative z-10"
          >
            <Crown
              aria-hidden="true"
              className="w-7 h-7 sm:w-8 sm:h-8 text-amber-400 drop-shadow-[0_0_10px_rgba(251,191,36,0.8)] -mb-1 animate-bounce"
            />
            <div className="text-3xl sm:text-4xl mb-1" aria-hidden="true">{firstPlace.avatar || '👑'}</div>
            <span className="text-xs sm:text-sm font-black text-yellow-300 truncate max-w-full block mb-0.5">
              {firstPlace.nickname}
            </span>
            <span className="text-xs font-black text-white mb-2">
              {firstPlace.score.toLocaleString()} pts
            </span>
            {/* Тумба 1 места */}
            <div className="w-full h-32 sm:h-38 rounded-t-[28px] bg-gradient-to-t from-amber-700 via-amber-600 to-yellow-500 border-t-2 border-yellow-200 flex flex-col items-center justify-center shadow-2xl shadow-yellow-500/20">
              <span className="text-3xl sm:text-4xl font-black text-white drop-shadow-md">1</span>
              <span className="text-[10px] font-black text-yellow-100 uppercase tracking-wider">Champion</span>
            </div>
          </motion.div>
        )}

        {/* 3 МЕСТО (Справа) */}
        {thirdPlace && (
          <motion.div
            role="listitem"
            aria-label={`3 место: ${thirdPlace.nickname}, ${thirdPlace.score} очков`}
            initial={{ opacity: 0, y: 40 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1, type: 'spring', stiffness: 300 }}
            className="flex flex-col items-center flex-1 max-w-[110px] sm:max-w-[130px]"
          >
            <div className="text-2xl sm:text-3xl mb-1" aria-hidden="true">{thirdPlace.avatar || '🥉'}</div>
            <span className="text-xs font-bold text-gray-200 truncate max-w-full block mb-0.5">
              {thirdPlace.nickname}
            </span>
            <span className="text-[11px] font-extrabold text-purple-300 mb-2">
              {thirdPlace.score.toLocaleString()} pts
            </span>
            {/* Тумба 3 места */}
            <div className="w-full h-18 sm:h-22 rounded-t-[24px] bg-gradient-to-t from-amber-950 to-amber-800 border-t-2 border-amber-500/50 flex flex-col items-center justify-center shadow-lg">
              <span className="text-xl sm:text-2xl font-black text-amber-200">3</span>
              <span className="text-[10px] font-bold text-amber-400 uppercase">Bronze</span>
            </div>
          </motion.div>
        )}
      </div>

      {/* Персональная карточка статистики игрока M3 Expressive Card */}
      {myPlayer && (
        <motion.div
          role="region"
          aria-label="Личная статистика игрока"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5 }}
          className="bg-[var(--bg-surface-container)] border border-white/10 rounded-[30px] p-4 sm:p-5 shadow-xl mb-4"
        >
          <div className="flex items-center justify-between mb-3 border-b border-white/10 pb-2.5">
            <div className="flex items-center gap-2">
              <Award className="w-5 h-5 text-purple-400" aria-hidden="true" />
              <span className="font-bold text-white text-sm sm:text-base">Твой результат</span>
            </div>
            <span className="px-3 py-1 bg-purple-500/20 text-purple-300 font-extrabold text-xs rounded-full border border-purple-500/30">
              #{myPlayer.rank} место в игре
            </span>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5" role="list">
            <div
              role="listitem"
              aria-label={`Счёт: ${myPlayer.score}`}
              className="bg-[var(--bg-surface-dim)] p-3 rounded-2xl border border-white/5 text-center"
            >
              <span className="text-[10px] text-gray-400 uppercase font-bold block mb-1">Счёт</span>
              <span className="text-base sm:text-lg font-black text-white">{myPlayer.score.toLocaleString()}</span>
            </div>
            <div
              role="listitem"
              aria-label={`Точность: ${accuracyPercent}%`}
              className="bg-[var(--bg-surface-dim)] p-3 rounded-2xl border border-white/5 text-center"
            >
              <span className="text-[10px] text-gray-400 uppercase font-bold block mb-1">Точность</span>
              <span className="text-base sm:text-lg font-black text-emerald-400">
                {accuracyPercent}%
              </span>
            </div>
            <div
              role="listitem"
              aria-label={`Средняя скорость: ${stats.averageResponseTimeSec} секунд`}
              className="bg-[var(--bg-surface-dim)] p-3 rounded-2xl border border-white/5 text-center"
            >
              <span className="text-[10px] text-gray-400 uppercase font-bold block mb-1">Ср. Скорость</span>
              <span className="text-base sm:text-lg font-black text-cyan-400">{stats.averageResponseTimeSec}s</span>
            </div>
            <div
              role="listitem"
              aria-label={`Лучший стрик: ${stats.highestStreak}`}
              className="bg-[var(--bg-surface-dim)] p-3 rounded-2xl border border-white/5 text-center"
            >
              <span className="text-[10px] text-gray-400 uppercase font-bold block mb-1">Лучший стрик</span>
              <span className="text-base sm:text-lg font-black text-amber-400 flex items-center justify-center gap-1">
                <Flame className="w-4 h-4" aria-hidden="true" /> {stats.highestStreak}
              </span>
            </div>
          </div>
        </motion.div>
      )}

      {/* Кнопка Сыграть еще */}
      <motion.button
        type="button"
        aria-label="Сыграть ещё раз"
        onClick={onRestart}
        whileHover={{ scale: 1.02 }}
        whileTap={{ scale: 0.96 }}
        transition={{ type: 'spring', stiffness: 400, damping: 25 }}
        className="w-full py-4 rounded-[26px] bg-gradient-to-r from-purple-600 via-indigo-600 to-cyan-500 text-white font-extrabold text-base sm:text-lg shadow-xl shadow-purple-900/40 flex items-center justify-center gap-2 cursor-pointer border border-white/20"
      >
        <RotateCcw className="w-5 h-5 stroke-[2.5]" aria-hidden="true" />
        Сыграть ещё раз
      </motion.button>
    </section>
  )
}
