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

    let active = true
    const duration = 3 * 1000
    const end = Date.now() + duration
    let animId: number

    const frame = () => {
      if (!active) return
      confetti({
        particleCount: 4,
        angle: 60,
        spread: 55,
        origin: { x: 0, y: 0.7 },
        colors: ['#6850a1', '#52e1c9', '#ff7597', '#fbbf24']
      })
      confetti({
        particleCount: 4,
        angle: 120,
        spread: 55,
        origin: { x: 1, y: 0.7 },
        colors: ['#6850a1', '#52e1c9', '#ff7597', '#fbbf24']
      })

      if (Date.now() < end && active) {
        animId = requestAnimationFrame(frame)
      }
    }

    frame()

    return () => {
      active = false
      cancelAnimationFrame(animId)
      confetti.reset()
    }
  }, [])

  return (
    <section
      role="region"
      aria-label="Финал игры и подиум победителей"
      className="w-full max-w-3xl mx-auto px-2 py-3 flex flex-col justify-between flex-1 select-none overflow-y-auto"
    >
      {/* Заголовок победы в стиле сайта */}
      <div className="text-center mb-4 sm:mb-6">
        <motion.div
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          transition={{ type: 'spring', stiffness: 350, damping: 20 }}
          className="inline-flex items-center gap-1.5 px-4 py-1.5 rounded-full bg-amber-50 border border-amber-300 text-amber-800 text-xs font-bold uppercase tracking-wider mb-2 shadow-sm"
        >
          <Trophy className="w-4 h-4 text-amber-500" aria-hidden="true" />
          Финал игры
        </motion.div>
        <h2 className="text-2xl sm:text-4xl font-black text-[#28242d] tracking-tight">
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
            <span className="text-xs font-bold text-[#334155] truncate max-w-full block mb-0.5">
              {secondPlace.nickname}
            </span>
            <span className="text-[11px] font-extrabold text-[#6850a1] mb-2">
              {secondPlace.score.toLocaleString()} pts
            </span>
            {/* Тумба 2 места */}
            <div className="w-full h-24 sm:h-28 rounded-t-[26px] bg-gradient-to-t from-slate-300 via-slate-200 to-slate-100 border-t-2 border-slate-400 flex flex-col items-center justify-center shadow-md">
              <span className="text-2xl sm:text-3xl font-black text-slate-700">2</span>
              <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Silver</span>
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
              className="w-7 h-7 sm:w-8 sm:h-8 text-amber-500 drop-shadow-[0_2px_8px_rgba(245,158,11,0.5)] -mb-1 animate-bounce"
            />
            <div className="text-3xl sm:text-4xl mb-1" aria-hidden="true">{firstPlace.avatar || '👑'}</div>
            <span className="text-xs sm:text-sm font-black text-[#78350f] truncate max-w-full block mb-0.5">
              {firstPlace.nickname}
            </span>
            <span className="text-xs font-black text-[#b45309] mb-2">
              {firstPlace.score.toLocaleString()} pts
            </span>
            {/* Тумба 1 места */}
            <div className="w-full h-32 sm:h-38 rounded-t-[28px] bg-gradient-to-t from-amber-400 via-yellow-400 to-amber-200 border-t-2 border-yellow-100 flex flex-col items-center justify-center shadow-xl shadow-amber-500/20">
              <span className="text-3xl sm:text-4xl font-black text-[#78350f] drop-shadow-sm">1</span>
              <span className="text-[10px] font-black text-[#92400e] uppercase tracking-wider">Champion</span>
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
            <span className="text-xs font-bold text-[#7c2d12] truncate max-w-full block mb-0.5">
              {thirdPlace.nickname}
            </span>
            <span className="text-[11px] font-extrabold text-[#ea580c] mb-2">
              {thirdPlace.score.toLocaleString()} pts
            </span>
            {/* Тумба 3 места */}
            <div className="w-full h-18 sm:h-22 rounded-t-[24px] bg-gradient-to-t from-orange-300 via-amber-200 to-amber-100 border-t-2 border-amber-300 flex flex-col items-center justify-center shadow-md">
              <span className="text-xl sm:text-2xl font-black text-amber-900">3</span>
              <span className="text-[10px] font-bold text-amber-700 uppercase tracking-wider">Bronze</span>
            </div>
          </motion.div>
        )}
      </div>

      {/* Персональная карточка статистики игрока в стиле .profile-card / .stat-grid сайта */}
      {myPlayer && (
        <motion.div
          role="region"
          aria-label="Личная статистика игрока"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5 }}
          className="bg-white border border-[#e9e2ec] rounded-[28px] p-4 sm:p-5 shadow-sm mb-4"
        >
          <div className="flex items-center justify-between mb-3 border-b border-[#f1ecf5] pb-2.5">
            <div className="flex items-center gap-2">
              <Award className="w-5 h-5 text-[#6850a1]" aria-hidden="true" />
              <span className="font-bold text-[#28242d] text-sm sm:text-base">Твой результат</span>
            </div>
            <span className="px-3 py-1 bg-[#ede4f8] text-[#6850a1] font-extrabold text-xs rounded-full border border-[#d8ccea]">
              #{myPlayer.rank} место в игре
            </span>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5" role="list">
            <div
              role="listitem"
              aria-label={`Счёт: ${myPlayer.score}`}
              className="bg-[#f8f4fc] p-3 rounded-2xl border border-[#eee6f5] text-center"
            >
              <span className="text-[10px] text-[#746e7a] uppercase font-bold block mb-1">Счёт</span>
              <span className="text-base sm:text-lg font-black text-[#6850a1]">{myPlayer.score.toLocaleString()}</span>
            </div>
            <div
              role="listitem"
              aria-label={`Точность: ${accuracyPercent}%`}
              className="bg-[#f8f4fc] p-3 rounded-2xl border border-[#eee6f5] text-center"
            >
              <span className="text-[10px] text-[#746e7a] uppercase font-bold block mb-1">Точность</span>
              <span className="text-base sm:text-lg font-black text-emerald-700">
                {accuracyPercent}%
              </span>
            </div>
            <div
              role="listitem"
              aria-label={`Средняя скорость: ${stats.averageResponseTimeSec} секунд`}
              className="bg-[#f8f4fc] p-3 rounded-2xl border border-[#eee6f5] text-center"
            >
              <span className="text-[10px] text-[#746e7a] uppercase font-bold block mb-1">Ср. Скорость</span>
              <span className="text-base sm:text-lg font-black text-sky-700">{stats.averageResponseTimeSec}s</span>
            </div>
            <div
              role="listitem"
              aria-label={`Лучший стрик: ${stats.highestStreak}`}
              className="bg-[#f8f4fc] p-3 rounded-2xl border border-[#eee6f5] text-center"
            >
              <span className="text-[10px] text-[#746e7a] uppercase font-bold block mb-1">Лучший стрик</span>
              <span className="text-base sm:text-lg font-black text-amber-700 flex items-center justify-center gap-1">
                <Flame className="w-4 h-4 text-amber-500" aria-hidden="true" /> {stats.highestStreak}
              </span>
            </div>
          </div>
        </motion.div>
      )}

      {/* Кнопка Сыграть еще в стиле сайта (.button.primary) */}
      <motion.button
        type="button"
        aria-label="Сыграть ещё раз"
        onClick={onRestart}
        whileHover={{ scale: 1.02 }}
        whileTap={{ scale: 0.96 }}
        transition={{ type: 'spring', stiffness: 400, damping: 25 }}
        className="w-full py-4 rounded-full bg-[#6850a1] hover:bg-[#5b438f] text-white font-extrabold text-base sm:text-lg shadow-lg shadow-purple-900/15 flex items-center justify-center gap-2 cursor-pointer transition"
      >
        <RotateCcw className="w-5 h-5 stroke-[2.5]" aria-hidden="true" />
        Сыграть ещё раз
      </motion.button>
    </section>
  )
}
