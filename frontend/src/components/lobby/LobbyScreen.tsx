import React, { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { QrCode, Copy, Check, Users, Play, Sparkles, UserPlus } from 'lucide-react'
import type { Player, RoomInfo } from '../../types/game'
import { sounds } from '../../services/soundEffects'

interface LobbyScreenProps {
  roomInfo: RoomInfo
  players: Player[]
  onStartGame: () => void
  onAddBot?: (nickname: string, avatar: string) => void
}

export const LobbyScreen: React.FC<LobbyScreenProps> = ({
  roomInfo,
  players,
  onStartGame,
  onAddBot
}) => {
  const [copied, setCopied] = useState(false)
  const [showQRModal, setShowQRModal] = useState(false)

  const copyCode = () => {
    sounds.playClick()
    navigator.clipboard.writeText(roomInfo.code)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  const handleStart = () => {
    sounds.playCorrect()
    onStartGame()
  }

  const handleQuickAddBot = () => {
    sounds.playClick()
    const botAvatars = ['🦊', '🐼', '🐯', '🦄', '🐲', '👾', '🚀']
    const botNames = ['CyberGamer', 'FastFinger', 'QuizMaster', 'StarGazer', 'RoboKid']
    const avatar = botAvatars[Math.floor(Math.random() * botAvatars.length)]
    const name = `${botNames[Math.floor(Math.random() * botNames.length)]}_${Math.floor(Math.random() * 90 + 10)}`
    onAddBot?.(name, avatar)
  }

  return (
    <div className="w-full max-w-4xl mx-auto px-4 py-4 flex flex-col justify-between flex-1 select-none">
      {/* Верхний баннер комнаты в стиле Material 3 Expressive Card */}
      <motion.div
        initial={{ opacity: 0, y: -15 }}
        animate={{ opacity: 1, y: 0 }}
        className="relative bg-gradient-to-br from-[#202330] via-[#1c1f2e] to-[#151724] border border-white/10 rounded-[32px] p-5 sm:p-7 shadow-2xl mb-5 overflow-hidden"
      >
        {/* Фоновые декоративные сферы */}
        <div className="absolute -top-16 -right-16 w-48 h-48 bg-purple-600/20 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute -bottom-16 -left-16 w-48 h-48 bg-cyan-600/15 rounded-full blur-3xl pointer-events-none" />

        <div className="relative z-10 flex flex-col md:flex-row items-center justify-between gap-5">
          {/* Левая часть: Название темы и параметры */}
          <div className="text-center md:text-left">
            <div className="inline-flex items-center gap-1.5 px-3.5 py-1 rounded-full bg-purple-500/20 text-purple-300 text-xs font-bold uppercase tracking-wider mb-2 border border-purple-500/30">
              <Sparkles className="w-3.5 h-3.5" />
              Тема викторины
            </div>
            <h2 className="text-2xl sm:text-3xl font-black text-white tracking-tight mb-2">
              {roomInfo.topic}
            </h2>
            <div className="flex flex-wrap items-center justify-center md:justify-start gap-2 text-xs font-semibold text-gray-300">
              <span className="bg-[#292d3e] px-3 py-1 rounded-full border border-white/5">
                🎯 {roomInfo.questionCount} вопросов
              </span>
              <span className="bg-[#292d3e] px-3 py-1 rounded-full border border-white/5">
                ⚡ Сложность: {roomInfo.difficulty === 'medium' ? 'Средняя' : 'Любая'}
              </span>
              <span className="bg-emerald-500/20 text-emerald-300 px-3 py-1 rounded-full border border-emerald-500/30">
                ● Комната открыта
              </span>
            </div>
          </div>

          {/* Правая часть: Крупный код комнаты и QR */}
          <div className="flex items-center gap-3">
            {/* Кнопка с кодом */}
            <button
              type="button"
              onClick={copyCode}
              title="Нажми, чтобы скопировать код"
              className="group bg-[#181a24] hover:bg-[#202330] border border-purple-500/30 hover:border-purple-400/60 rounded-[24px] p-3.5 px-5 flex flex-col items-center justify-center transition-all shadow-lg active:scale-95 cursor-pointer"
            >
              <span className="text-[10px] uppercase font-bold text-gray-400 tracking-widest mb-0.5">
                Код комнаты
              </span>
              <div className="flex items-center gap-2">
                <span className="text-2xl sm:text-3xl font-black font-mono tracking-widest text-transparent bg-clip-text bg-gradient-to-r from-purple-300 via-indigo-200 to-cyan-300">
                  {roomInfo.code.slice(0, 3)} {roomInfo.code.slice(3)}
                </span>
                {copied ? (
                  <Check className="w-5 h-5 text-emerald-400 stroke-[3]" />
                ) : (
                  <Copy className="w-5 h-5 text-gray-400 group-hover:text-white transition" />
                )}
              </div>
            </button>

            {/* Кнопка QR-кода */}
            <button
              type="button"
              onClick={() => {
                sounds.playClick()
                setShowQRModal(!showQRModal)
              }}
              title="Показать QR-код для гостей"
              className="w-14 h-14 sm:w-16 sm:h-16 rounded-[24px] bg-[#292d3e] hover:bg-[#34394f] border border-white/10 flex items-center justify-center text-purple-300 hover:text-white transition shadow-lg active:scale-95 cursor-pointer"
            >
              <QrCode className="w-7 h-7 sm:w-8 sm:h-8" />
            </button>
          </div>
        </div>
      </motion.div>

      {/* Модальное окно QR-кода при клике */}
      <AnimatePresence>
        {showQRModal && (
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.9 }}
            className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4"
            onClick={() => setShowQRModal(false)}
          >
            <div
              className="bg-[#202330] border border-white/15 rounded-[36px] p-6 text-center max-w-sm w-full shadow-2xl"
              onClick={(e) => e.stopPropagation()}
            >
              <h3 className="text-lg font-black text-white mb-1">Сканируй для входа</h3>
              <p className="text-xs text-gray-400 mb-4">Наведи камеру смартфона, чтобы войти по коду</p>

              {/* Стилизованный QR в M3 Expressive контейнере */}
              <div className="bg-white p-4 rounded-[28px] mx-auto w-56 h-56 flex items-center justify-center shadow-inner">
                {/* SVG псевдо-QR код */}
                <svg className="w-full h-full text-slate-900" viewBox="0 0 100 100" fill="currentColor">
                  {/* Угловые маркеры */}
                  <rect x="10" y="10" width="25" height="25" rx="4" />
                  <rect x="15" y="15" width="15" height="15" fill="white" rx="2" />
                  <rect x="18" y="18" width="9" height="9" fill="black" rx="1" />

                  <rect x="65" y="10" width="25" height="25" rx="4" />
                  <rect x="70" y="15" width="15" height="15" fill="white" rx="2" />
                  <rect x="73" y="18" width="9" height="9" fill="black" rx="1" />

                  <rect x="10" y="65" width="25" height="25" rx="4" />
                  <rect x="15" y="70" width="15" height="15" fill="white" rx="2" />
                  <rect x="18" y="73" width="9" height="9" fill="black" rx="1" />

                  {/* Стилизованные точки данных */}
                  <circle cx="45" cy="20" r="3.5" />
                  <circle cx="55" cy="20" r="3.5" />
                  <circle cx="45" cy="30" r="3.5" />
                  <circle cx="20" cy="45" r="3.5" />
                  <circle cx="30" cy="45" r="3.5" />
                  <circle cx="45" cy="50" r="5" />
                  <circle cx="65" cy="50" r="3.5" />
                  <circle cx="80" cy="50" r="3.5" />
                  <circle cx="50" cy="70" r="3.5" />
                  <circle cx="65" cy="75" r="4" />
                  <circle cx="80" cy="75" r="4" />
                  <circle cx="50" cy="85" r="3.5" />
                  <circle cx="75" cy="85" r="3.5" />
                </svg>
              </div>

              <div className="mt-4 font-mono font-bold text-xl text-purple-300">
                Код: {roomInfo.code}
              </div>

              <button
                type="button"
                onClick={() => setShowQRModal(false)}
                className="mt-4 w-full py-2.5 rounded-2xl bg-white/10 hover:bg-white/20 text-white text-xs font-bold transition"
              >
                Закрыть
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Список подключенных игроков */}
      <div className="flex-1 flex flex-col min-h-0 mb-4">
        <div className="flex items-center justify-between mb-3 px-1">
          <div className="flex items-center gap-2">
            <Users className="w-4 h-4 text-purple-400" />
            <span className="text-sm font-bold text-white">Игроки в лобби</span>
            <span className="px-2.5 py-0.5 rounded-full bg-purple-500/20 text-purple-300 text-xs font-extrabold border border-purple-500/30">
              {players.length}
            </span>
          </div>

          {/* Быстрое добавление бота для тестирования */}
          {onAddBot && (
            <button
              type="button"
              onClick={handleQuickAddBot}
              className="flex items-center gap-1 px-3 py-1.5 rounded-full bg-[#202330] hover:bg-[#292d3e] border border-white/10 text-xs font-semibold text-gray-300 hover:text-white transition cursor-pointer"
            >
              <UserPlus className="w-3.5 h-3.5 text-cyan-400" />
              <span>+ Игрок-бот</span>
            </button>
          )}
        </div>

        {/* Сетка карточек игроков с пружинной анимацией */}
        <div className="flex-1 bg-[#181a24]/60 border border-white/5 rounded-[30px] p-3 sm:p-4 overflow-y-auto">
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-2.5 sm:gap-3">
            <AnimatePresence>
              {players.map((p, idx) => (
                <motion.div
                  key={p.id}
                  layout
                  initial={{ opacity: 0, scale: 0.8, y: 15 }}
                  animate={{ opacity: 1, scale: 1, y: 0 }}
                  exit={{ opacity: 0, scale: 0.8 }}
                  transition={{ type: 'spring', stiffness: 400, damping: 25, delay: idx * 0.04 }}
                  className={`relative p-3 rounded-[22px] flex items-center gap-2.5 border transition-all ${
                    p.isCurrentPlayer
                      ? 'bg-gradient-to-r from-purple-950/60 to-[#25203d] border-purple-500/40 shadow-md ring-1 ring-purple-400/30'
                      : 'bg-[#202330] border-white/10 hover:border-white/20'
                  }`}
                >
                  <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-2xl bg-white/10 flex items-center justify-center text-xl flex-shrink-0 shadow-inner">
                    {p.avatar || '😎'}
                  </div>

                  <div className="flex flex-col min-w-0">
                    <span className="font-bold text-xs sm:text-sm text-white truncate">
                      {p.nickname}
                    </span>
                    {p.isHost ? (
                      <span className="text-[10px] font-black text-amber-400 uppercase tracking-wider">
                        Хост
                      </span>
                    ) : p.isCurrentPlayer ? (
                      <span className="text-[10px] font-extrabold text-purple-400 uppercase tracking-wider">
                        Вы
                      </span>
                    ) : (
                      <span className="text-[10px] font-medium text-gray-400">
                        Готов
                      </span>
                    )}
                  </div>
                </motion.div>
              ))}
            </AnimatePresence>
          </div>
        </div>
      </div>

      {/* Нижняя зона действия: Кнопка «Начать игру» */}
      <div className="flex flex-col items-center gap-2">
        <motion.button
          type="button"
          onClick={handleStart}
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.95 }}
          transition={{ type: 'spring', stiffness: 450, damping: 25 }}
          className="w-full py-4 sm:py-4.5 rounded-[28px] bg-gradient-to-r from-purple-600 via-indigo-600 to-cyan-500 text-white font-black text-lg sm:text-xl shadow-2xl shadow-purple-900/50 flex items-center justify-center gap-2.5 cursor-pointer border border-white/20"
        >
          <Play className="w-6 h-6 fill-current" />
          Начать игру
        </motion.button>
        <span className="text-xs text-gray-400 font-medium">
          Кнопку «Старт» нажимает только хост (@karapuz1226)
        </span>
      </div>
    </div>
  )
}
