import React, { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Wrench, ChevronUp, ChevronDown, Play, Pause, AlertTriangle, RotateCcw, Radio } from 'lucide-react'
import type { ConnectionMode } from '../../hooks/useGameEngine'

interface DevToolbarProps {
  currentPhase: string
  connectionMode: ConnectionMode
  onSwitchConnectionMode: (mode: ConnectionMode) => void
  isAutoMode: boolean
  onToggleAuto: (active: boolean) => void
  onSetPhase: (phase: 'lobby' | 'question' | 'waiting' | 'reveal' | 'leaderboard' | 'finished', opts?: { correct?: boolean }) => void
  onTriggerError: (msg: string) => void
  onRestart: () => void
}

export const DevToolbar: React.FC<DevToolbarProps> = ({
  currentPhase,
  connectionMode,
  onSwitchConnectionMode,
  isAutoMode,
  onToggleAuto,
  onSetPhase,
  onTriggerError,
  onRestart
}) => {
  const [isOpen, setIsOpen] = useState(false)

  return (
    <div className="fixed bottom-3 right-3 z-50 select-none">
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: 15, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 15, scale: 0.95 }}
            className="mb-2 p-3 bg-[#181a24]/95 backdrop-blur-md border border-purple-500/30 rounded-[24px] shadow-2xl text-xs text-white w-72 flex flex-col gap-2.5"
          >
            <div className="flex items-center justify-between border-b border-white/10 pb-2">
              <span className="font-black text-purple-300 flex items-center gap-1.5">
                <Wrench className="w-3.5 h-3.5" />
                Dev-пульт QuizBlitz
              </span>
              <span className="px-2 py-0.5 rounded-full bg-purple-500/20 text-purple-300 font-mono text-[10px]">
                Фаза: {currentPhase}
              </span>
            </div>

            {/* Переключатель источника: Реальный бэк @eco1kd / Мок */}
            <div className="flex items-center justify-between bg-[#202330] p-2 rounded-xl">
              <span className="text-gray-300 font-medium flex items-center gap-1">
                <Radio className="w-3.5 h-3.5 text-cyan-400" /> Сервер:
              </span>
              <div className="flex gap-1">
                <button
                  type="button"
                  onClick={() => onSwitchConnectionMode('live')}
                  className={`px-2 py-1 rounded-lg font-bold transition-colors cursor-pointer ${
                    connectionMode === 'live' ? 'bg-emerald-600 text-white' : 'bg-gray-800 text-gray-400'
                  }`}
                >
                  Live (:3001)
                </button>
                <button
                  type="button"
                  onClick={() => onSwitchConnectionMode('mock')}
                  className={`px-2 py-1 rounded-lg font-bold transition-colors cursor-pointer ${
                    connectionMode === 'mock' ? 'bg-purple-600 text-white' : 'bg-gray-800 text-gray-400'
                  }`}
                >
                  Mock
                </button>
              </div>
            </div>

            {/* Авто-игра / Ручной режим */}
            <div className="flex items-center justify-between bg-[#202330] p-2 rounded-xl">
              <span className="text-gray-300 font-medium">Авто-переход:</span>
              <button
                type="button"
                onClick={() => onToggleAuto(!isAutoMode)}
                className={`px-2.5 py-1 rounded-lg font-bold flex items-center gap-1 transition-colors cursor-pointer ${
                  isAutoMode ? 'bg-emerald-600 text-white' : 'bg-gray-700 text-gray-300'
                }`}
              >
                {isAutoMode ? (
                  <>
                    <Play className="w-3 h-3 fill-current" /> Auto
                  </>
                ) : (
                  <>
                    <Pause className="w-3 h-3" /> Manual
                  </>
                )}
              </button>
            </div>

            {/* Быстрые переходы по состояниям экрана игры */}
            <div className="flex flex-col gap-1.5">
              <span className="text-[10px] uppercase font-bold text-gray-400">Быстрый просмотр экранов (Mock):</span>
              <div className="grid grid-cols-2 gap-1.5">
                <button
                  type="button"
                  onClick={() => onSetPhase('lobby')}
                  className="px-2 py-1.5 rounded-xl bg-indigo-900/60 hover:bg-indigo-800 text-indigo-200 font-semibold transition cursor-pointer"
                >
                  0. Лобби
                </button>
                <button
                  type="button"
                  onClick={() => onSetPhase('question')}
                  className="px-2 py-1.5 rounded-xl bg-[#292d3e] hover:bg-[#34394f] text-gray-200 font-semibold transition cursor-pointer"
                >
                  1. Вопрос
                </button>
                <button
                  type="button"
                  onClick={() => onSetPhase('waiting')}
                  className="px-2 py-1.5 rounded-xl bg-[#292d3e] hover:bg-[#34394f] text-gray-200 font-semibold transition cursor-pointer"
                >
                  2. Ожидание
                </button>
                <button
                  type="button"
                  onClick={() => onSetPhase('reveal', { correct: true })}
                  className="px-2 py-1.5 rounded-xl bg-emerald-900/60 hover:bg-emerald-800 text-emerald-200 font-semibold transition cursor-pointer"
                >
                  3. Reveal (Верно)
                </button>
                <button
                  type="button"
                  onClick={() => onSetPhase('reveal', { correct: false })}
                  className="px-2 py-1.5 rounded-xl bg-rose-900/60 hover:bg-rose-800 text-rose-200 font-semibold transition cursor-pointer"
                >
                  3. Reveal (Мимо)
                </button>
                <button
                  type="button"
                  onClick={() => onSetPhase('leaderboard')}
                  className="px-2 py-1.5 rounded-xl bg-[#292d3e] hover:bg-[#34394f] text-gray-200 font-semibold transition cursor-pointer"
                >
                  4. Лидерборд
                </button>
                <button
                  type="button"
                  onClick={() => onSetPhase('finished')}
                  className="px-2 py-1.5 rounded-xl bg-amber-900/50 hover:bg-amber-800 text-amber-200 font-semibold transition col-span-2 cursor-pointer"
                >
                  5. Финал / Подиум
                </button>
              </div>
            </div>

            {/* Симуляция сетевой ошибки */}
            <div className="flex items-center gap-1.5 pt-1 border-t border-white/10">
              <button
                type="button"
                onClick={() => onTriggerError('Соединение с WebSocket-сервером разорвано (код 1006)')}
                className="flex-1 py-1.5 px-2 rounded-xl bg-rose-500/20 hover:bg-rose-500/30 text-rose-300 font-bold flex items-center justify-center gap-1 transition cursor-pointer"
              >
                <AlertTriangle className="w-3.5 h-3.5" />
                Тест ошибки WS
              </button>
              <button
                type="button"
                onClick={onRestart}
                className="p-1.5 rounded-xl bg-gray-800 hover:bg-gray-700 text-gray-300 transition cursor-pointer"
                title="Перезапустить игру"
              >
                <RotateCcw className="w-3.5 h-3.5" />
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Кнопка открытия/закрытия пульта */}
      <motion.button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        whileTap={{ scale: 0.95 }}
        className="px-3.5 py-2 rounded-full bg-[#202330] border border-purple-500/40 text-purple-300 font-bold text-xs flex items-center gap-2 shadow-xl hover:bg-[#292d3e] transition cursor-pointer"
      >
        <Wrench className="w-4 h-4 text-purple-400" />
        <span>Dev ({connectionMode === 'live' ? 'Live' : 'Mock'})</span>
        {isOpen ? <ChevronDown className="w-3.5 h-3.5" /> : <ChevronUp className="w-3.5 h-3.5" />}
      </motion.button>
    </div>
  )
}
