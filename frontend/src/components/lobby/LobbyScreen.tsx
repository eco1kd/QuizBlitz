import React, { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { QrCode, Copy, Check, Users, Play, Sparkles, UserPlus, LogIn, PlusCircle, Crown } from 'lucide-react'
import type { Player, RoomInfo } from '../../types/game'
import { sounds } from '../../services/soundEffects'

interface LobbyScreenProps {
  roomInfo: RoomInfo
  players: Player[]
  onStartGame: () => void
  onAddBot?: (nickname: string, avatar: string) => void
  onCreateRoom?: (opts: { topic: string; questionCount: number; difficulty: 'easy' | 'medium' | 'hard' }) => void
  onJoinRoom?: (opts: { code: string; nickname: string; avatar?: string }) => void
}

const AVATARS = ['👾', '🚀', '⚡', '🦊', '🐱', '🐼', '🔥', '👑']
const PRESET_TOPICS = ['Космос', 'IT и Технологии', 'Наука', 'История']

export const LobbyScreen: React.FC<LobbyScreenProps> = ({
  roomInfo,
  players,
  onStartGame,
  onAddBot,
  onCreateRoom,
  onJoinRoom
}) => {
  const [copied, setCopied] = useState(false)
  const [showQRModal, setShowQRModal] = useState(false)
  const [activeTab, setActiveTab] = useState<'lobby' | 'join' | 'create'>('lobby')
  const [isStarting, setIsStarting] = useState(false)

  // Стейт входа по коду
  const [joinCode, setJoinCode] = useState('')
  const [joinNick, setJoinNick] = useState('karapuz1226')
  const [joinAvatar, setJoinAvatar] = useState('👾')

  // Стейт создания комнаты
  const [topic, setTopic] = useState(roomInfo.topic || 'Космос')
  const [questionCount, setQuestionCount] = useState(roomInfo.questionCount || 5)
  const [difficulty, setDifficulty] = useState<'easy' | 'medium' | 'hard'>(roomInfo.difficulty || 'medium')

  const copyCode = () => {
    sounds.playClick()
    navigator.clipboard.writeText(roomInfo.code)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  const handleStart = () => {
    if (isStarting) return
    setIsStarting(true)
    sounds.playCorrect()
    onStartGame()
    // Сбросить состояние через 35 сек на случай отмены/ошибки
    setTimeout(() => setIsStarting(false), 35000)
  }

  const handleQuickAddBot = () => {
    sounds.playClick()
    const botAvatars = ['🦊', '🐼', '🐯', '🦄', '🐲', '👾', '🚀']
    const botNames = ['CyberGamer', 'FastFinger', 'QuizMaster', 'StarGazer', 'RoboKid']
    const avatar = botAvatars[Math.floor(Math.random() * botAvatars.length)]
    const name = `${botNames[Math.floor(Math.random() * botNames.length)]}_${Math.floor(Math.random() * 90 + 10)}`
    onAddBot?.(name, avatar)
  }

  const handleCreateSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    sounds.playClick()
    onCreateRoom?.({ topic, questionCount, difficulty })
    setActiveTab('lobby')
  }

  const handleJoinSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!joinCode.trim() || !joinNick.trim()) return
    sounds.playClick()
    onJoinRoom?.({ code: joinCode.trim(), nickname: joinNick.trim(), avatar: joinAvatar })
    setActiveTab('lobby')
  }

  return (
    <div className="w-full max-w-4xl mx-auto px-4 py-3 flex flex-col justify-between flex-1 select-none">
      {/* Переключатель: Комната / Войти по коду / Настроить комнату */}
      <div className="flex items-center justify-center gap-2 mb-4">
        <button
          type="button"
          onClick={() => {
            sounds.playClick()
            setActiveTab('lobby')
          }}
          className={`px-4 py-2 rounded-full text-xs font-extrabold transition flex items-center gap-1.5 cursor-pointer ${
            activeTab === 'lobby'
              ? 'bg-purple-600 text-white shadow-lg shadow-purple-900/40'
              : 'bg-[#202330] text-gray-300 hover:text-white border border-white/10'
          }`}
        >
          <Users className="w-3.5 h-3.5" />
          Лобби комнаты
        </button>

        <button
          type="button"
          onClick={() => {
            sounds.playClick()
            setActiveTab('join')
          }}
          className={`px-4 py-2 rounded-full text-xs font-extrabold transition flex items-center gap-1.5 cursor-pointer ${
            activeTab === 'join'
              ? 'bg-cyan-600 text-white shadow-lg shadow-cyan-900/40'
              : 'bg-[#202330] text-gray-300 hover:text-white border border-white/10'
          }`}
        >
          <LogIn className="w-3.5 h-3.5" />
          Войти по коду
        </button>

        <button
          type="button"
          onClick={() => {
            sounds.playClick()
            setActiveTab('create')
          }}
          className={`px-4 py-2 rounded-full text-xs font-extrabold transition flex items-center gap-1.5 cursor-pointer ${
            activeTab === 'create'
              ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-900/40'
              : 'bg-[#202330] text-gray-300 hover:text-white border border-white/10'
          }`}
        >
          <PlusCircle className="w-3.5 h-3.5" />
          Создать новую
        </button>
      </div>

      {/* Вкладка 1: Вход по коду в существующую комнату */}
      {activeTab === 'join' && (
        <motion.form
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          onSubmit={handleJoinSubmit}
          className="bg-[#202330] border border-white/10 rounded-[32px] p-6 max-w-md mx-auto w-full my-auto shadow-2xl flex flex-col gap-4"
        >
          <div className="text-center">
            <h3 className="text-xl font-black text-white mb-1">Войти в комнату по коду</h3>
            <p className="text-xs text-gray-400">Введи 6-значный код с экрана хоста</p>
          </div>

          <div>
            <label className="text-xs font-bold text-gray-300 uppercase tracking-wider block mb-1.5">
              Код комнаты (6 цифр)
            </label>
            <input
              type="text"
              maxLength={6}
              value={joinCode}
              onChange={(e) => setJoinCode(e.target.value.replace(/\D/g, ''))}
              placeholder="Например: 482910"
              className="w-full px-4 py-3 rounded-2xl bg-[#181a24] border border-purple-500/30 text-white font-mono text-xl font-black tracking-widest text-center focus:outline-none focus:border-purple-400"
              required
            />
          </div>

          <div>
            <label className="text-xs font-bold text-gray-300 uppercase tracking-wider block mb-1.5">
              Твой никнейм
            </label>
            <input
              type="text"
              maxLength={20}
              value={joinNick}
              onChange={(e) => setJoinNick(e.target.value)}
              placeholder="karapuz1226"
              className="w-full px-4 py-3 rounded-2xl bg-[#181a24] border border-white/10 text-white font-bold text-sm focus:outline-none focus:border-purple-400"
              required
            />
          </div>

          <div>
            <label className="text-xs font-bold text-gray-300 uppercase tracking-wider block mb-1.5">
              Выбери аватарку
            </label>
            <div className="flex items-center justify-between gap-1.5">
              {AVATARS.map((av) => (
                <button
                  key={av}
                  type="button"
                  onClick={() => setJoinAvatar(av)}
                  className={`w-10 h-10 rounded-xl flex items-center justify-center text-xl transition cursor-pointer ${
                    joinAvatar === av
                      ? 'bg-purple-600 ring-2 ring-white scale-110'
                      : 'bg-[#181a24] hover:bg-[#292d3e]'
                  }`}
                >
                  {av}
                </button>
              ))}
            </div>
          </div>

          <button
            type="submit"
            className="mt-2 w-full py-3.5 rounded-2xl bg-gradient-to-r from-cyan-500 to-blue-600 text-white font-black text-base shadow-lg cursor-pointer hover:brightness-110 transition"
          >
            Подключиться к игре 🚀
          </button>
        </motion.form>
      )}

      {/* Вкладка 2: Создание новой комнаты */}
      {activeTab === 'create' && (
        <motion.form
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          onSubmit={handleCreateSubmit}
          className="bg-[#202330] border border-white/10 rounded-[32px] p-6 max-w-md mx-auto w-full my-auto shadow-2xl flex flex-col gap-4"
        >
          <div className="text-center">
            <h3 className="text-xl font-black text-white mb-1">Создать новую игру</h3>
            <p className="text-xs text-gray-400">Выбери тему и параметры генерации вопросов</p>
          </div>

          <div>
            <label className="text-xs font-bold text-gray-300 uppercase tracking-wider block mb-1.5">
              Тема викторины
            </label>
            <input
              type="text"
              value={topic}
              onChange={(e) => setTopic(e.target.value)}
              placeholder="Например: Космос, История Рима..."
              className="w-full px-4 py-3 rounded-2xl bg-[#181a24] border border-white/10 text-white font-bold text-sm focus:outline-none focus:border-purple-400 mb-2"
              required
            />
            <div className="flex flex-wrap gap-1.5">
              {PRESET_TOPICS.map((t) => (
                <button
                  key={t}
                  type="button"
                  onClick={() => setTopic(t)}
                  className="px-2.5 py-1 rounded-full bg-[#181a24] hover:bg-purple-500/20 text-gray-300 hover:text-purple-200 text-xs font-semibold border border-white/5 transition cursor-pointer"
                >
                  {t}
                </button>
              ))}
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-xs font-bold text-gray-300 uppercase tracking-wider block mb-1.5">
                Кол-во вопросов
              </label>
              <div className="flex gap-1.5">
                {[3, 5, 10].map((cnt) => (
                  <button
                    key={cnt}
                    type="button"
                    onClick={() => setQuestionCount(cnt)}
                    className={`flex-1 py-2 rounded-xl font-black text-xs transition cursor-pointer ${
                      questionCount === cnt
                        ? 'bg-purple-600 text-white'
                        : 'bg-[#181a24] text-gray-400 hover:text-white'
                    }`}
                  >
                    {cnt}
                  </button>
                ))}
              </div>
            </div>

            <div>
              <label className="text-xs font-bold text-gray-300 uppercase tracking-wider block mb-1.5">
                Сложность
              </label>
              <div className="flex gap-1">
                {(['easy', 'medium', 'hard'] as const).map((diff) => (
                  <button
                    key={diff}
                    type="button"
                    onClick={() => setDifficulty(diff)}
                    className={`flex-1 py-2 rounded-xl font-bold text-[11px] transition cursor-pointer ${
                      difficulty === diff
                        ? 'bg-indigo-600 text-white'
                        : 'bg-[#181a24] text-gray-400 hover:text-white'
                    }`}
                  >
                    {diff === 'easy' ? 'Лёгкая' : diff === 'medium' ? 'Сред.' : 'Хард'}
                  </button>
                ))}
              </div>
            </div>
          </div>

          <button
            type="submit"
            className="mt-2 w-full py-3.5 rounded-2xl bg-gradient-to-r from-purple-600 to-indigo-600 text-white font-black text-base shadow-lg cursor-pointer hover:brightness-110 transition"
          >
            Создать комнату ⚡
          </button>
        </motion.form>
      )}

      {/* Вкладка 3: Основное лобби ожидания */}
      {activeTab === 'lobby' && (
        <>
          <motion.div
            initial={{ opacity: 0, y: -15 }}
            animate={{ opacity: 1, y: 0 }}
            className="relative bg-gradient-to-br from-[#202330] via-[#1c1f2e] to-[#151724] border border-white/10 rounded-[32px] p-5 sm:p-7 shadow-2xl mb-5 overflow-hidden"
          >
            <div className="absolute -top-16 -right-16 w-48 h-48 bg-purple-600/20 rounded-full blur-3xl pointer-events-none" />
            <div className="absolute -bottom-16 -left-16 w-48 h-48 bg-cyan-600/15 rounded-full blur-3xl pointer-events-none" />

            <div className="relative z-10 flex flex-col md:flex-row items-center justify-between gap-5">
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
                    ⚡ Сложность: {roomInfo.difficulty === 'easy' ? 'Лёгкая' : roomInfo.difficulty === 'hard' ? 'Сложная' : 'Средняя'}
                  </span>
                  <span className="bg-emerald-500/20 text-emerald-300 px-3 py-1 rounded-full border border-emerald-500/30">
                    ● Комната активна
                  </span>
                </div>
              </div>

              <div className="flex items-center gap-3">
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

          {/* Модальное окно QR-кода */}
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

                  <div className="bg-white p-4 rounded-[28px] mx-auto w-56 h-56 flex items-center justify-center shadow-inner">
                    <svg className="w-full h-full text-slate-900" viewBox="0 0 100 100" fill="currentColor">
                      <rect x="10" y="10" width="25" height="25" rx="4" />
                      <rect x="15" y="15" width="15" height="15" fill="white" rx="2" />
                      <rect x="18" y="18" width="9" height="9" fill="black" rx="1" />

                      <rect x="65" y="10" width="25" height="25" rx="4" />
                      <rect x="70" y="15" width="15" height="15" fill="white" rx="2" />
                      <rect x="73" y="18" width="9" height="9" fill="black" rx="1" />

                      <rect x="10" y="65" width="25" height="25" rx="4" />
                      <rect x="15" y="70" width="15" height="15" fill="white" rx="2" />
                      <rect x="18" y="73" width="9" height="9" fill="black" rx="1" />

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

              {onAddBot && roomInfo.isHost && (
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
                        <div className="flex items-center gap-1">
                          {p.isHost && (
                            <span className="text-[10px] font-black text-amber-400 uppercase tracking-wider flex items-center gap-0.5">
                              <Crown className="w-2.5 h-2.5" /> Хост
                            </span>
                          )}
                          {p.isCurrentPlayer && (
                            <span className="text-[10px] font-extrabold text-purple-400 uppercase tracking-wider">
                              {p.isHost ? '• Вы' : 'Вы'}
                            </span>
                          )}
                          {!p.isHost && !p.isCurrentPlayer && (
                            <span className="text-[10px] font-medium text-gray-400">
                              Готов
                            </span>
                          )}
                        </div>
                      </div>
                    </motion.div>
                  ))}
                </AnimatePresence>
              </div>
            </div>
          </div>

          {/* Нижняя зона действия: Кнопка «Начать игру» (видна только хосту) */}
          <div className="flex flex-col items-center gap-2">
            {roomInfo.isHost ? (
              <motion.button
                type="button"
                onClick={handleStart}
                disabled={isStarting}
                whileHover={{ scale: isStarting ? 1 : 1.02 }}
                whileTap={{ scale: isStarting ? 1 : 0.95 }}
                transition={{ type: 'spring', stiffness: 450, damping: 25 }}
                className={`w-full py-4 sm:py-4.5 rounded-[28px] bg-gradient-to-r from-purple-600 via-indigo-600 to-cyan-500 text-white font-black text-lg sm:text-xl shadow-2xl shadow-purple-900/50 flex items-center justify-center gap-2.5 border border-white/20 transition-all ${
                  isStarting ? 'opacity-90 cursor-wait animate-pulse' : 'cursor-pointer hover:brightness-110'
                }`}
              >
                {isStarting ? (
                  <>
                    <Sparkles className="w-6 h-6 animate-spin text-cyan-200" />
                    <span>ИИ генерирует вопросы... 🧠</span>
                  </>
                ) : (
                  <>
                    <Play className="w-6 h-6 fill-current" />
                    <span>Начать игру 🚀</span>
                  </>
                )}
              </motion.button>
            ) : (
              <div className="w-full py-4 rounded-[28px] bg-[#202330] border border-purple-500/30 text-purple-300 font-bold text-sm sm:text-base text-center animate-pulse">
                ⏳ Вы в комнате! Ожидаем, когда Хост нажмёт «Начать игру»...
              </div>
            )}
          </div>
        </>
      )}
    </div>
  )
}
