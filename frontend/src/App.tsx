import { AnimatePresence, motion } from 'framer-motion'
import { AlertCircle, Wifi, Zap } from 'lucide-react'
import { useGameEngine } from './hooks/useGameEngine'
import { GameHeader } from './components/game/GameHeader'
import { QuestionScreen } from './components/game/QuestionScreen'
import { WaitingScreen } from './components/game/WaitingScreen'
import { RevealScreen } from './components/game/RevealScreen'
import { LeaderboardScreen } from './components/game/LeaderboardScreen'
import { PodiumScreen } from './components/game/PodiumScreen'
import { DevToolbar } from './components/dev/DevToolbar'

export function App() {
  const {
    phase,
    question,
    timeRemaining,
    selectedOption,
    revealData,
    leaderboard,
    finishedData,
    myResult,
    myScore,
    myStreak,
    errorMessage,
    isAutoMode,
    submitAnswer,
    restartGame,
    toggleAutoMode,
    setDevPhase,
    triggerDevError,
    currentPlayer
  } = useGameEngine()

  return (
    <div className="min-h-screen bg-[#0f111a] text-white flex flex-col justify-between relative selection:bg-purple-500 selection:text-white">
      {/* Фоновые градиентные свечения в стиле Material 3 Expressive */}
      <div className="fixed top-0 left-1/2 -translate-x-1/2 w-full max-w-4xl h-80 bg-purple-600/10 blur-[120px] pointer-events-none rounded-full" />
      <div className="fixed bottom-0 right-0 w-96 h-96 bg-cyan-600/10 blur-[130px] pointer-events-none rounded-full" />

      {/* Верхний статус-бар комнаты */}
      <div className="w-full border-b border-white/5 bg-[#141622]/80 backdrop-blur-md px-4 py-2 z-10 select-none">
        <div className="max-w-3xl mx-auto flex items-center justify-between text-xs text-gray-400">
          <div className="flex items-center gap-2 font-bold tracking-wide">
            <span className="flex items-center gap-1 text-purple-400 font-extrabold text-sm">
              <Zap className="w-4 h-4 fill-purple-400" /> QuizBlitz
            </span>
            <span className="text-gray-600">/</span>
            <span className="bg-white/10 text-gray-200 px-2 py-0.5 rounded-full font-mono text-[11px]">
              Код: 849-215
            </span>
          </div>

          <div className="flex items-center gap-3">
            <div className="flex items-center gap-1.5 text-emerald-400 font-medium">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
              <span className="hidden sm:inline">Mock WS Online</span>
              <Wifi className="w-3.5 h-3.5 sm:hidden" />
            </div>
            <div className="flex items-center gap-1 text-gray-300 font-bold bg-[#202330] px-2.5 py-0.5 rounded-full border border-white/10">
              <span>{currentPlayer.avatar}</span>
              <span className="text-[11px] truncate max-w-[90px]">{currentPlayer.nickname}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Всплывающий тост сетевой ошибки */}
      <AnimatePresence>
        {errorMessage && (
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="fixed top-14 left-1/2 -translate-x-1/2 z-50 w-11/12 max-w-md bg-rose-500/90 text-white backdrop-blur-md px-4 py-3 rounded-2xl shadow-2xl flex items-center gap-3 border border-rose-300/30 text-sm font-semibold"
          >
            <AlertCircle className="w-5 h-5 flex-shrink-0" />
            <span className="flex-1">{errorMessage}</span>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Верхний игровой хедер с таймером и счетом (скрыт на финальном экране) */}
      {question && phase !== 'finished' && (
        <GameHeader
          currentIndex={question.index}
          totalQuestions={question.total}
          score={myScore}
          streak={myStreak}
          timeRemaining={timeRemaining}
          timeLimit={question.timeLimit}
          showTimer={phase === 'question' || phase === 'waiting'}
        />
      )}

      {/* Основная интерактивная зона с плавным переходом между фазами игры */}
      <main className="flex-1 flex flex-col justify-center py-2 relative z-10">
        <AnimatePresence mode="wait">
          {phase === 'question' && question && (
            <motion.div
              key="question-screen"
              initial={{ opacity: 0, scale: 0.98 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.98 }}
              transition={{ duration: 0.25 }}
              className="flex-1 flex flex-col justify-center"
            >
              <QuestionScreen
                question={question}
                selectedOption={selectedOption}
                onSelectOption={submitAnswer}
              />
            </motion.div>
          )}

          {phase === 'waiting' && question && (
            <motion.div
              key="waiting-screen"
              initial={{ opacity: 0, scale: 0.98 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.98 }}
              transition={{ duration: 0.25 }}
              className="flex-1 flex flex-col justify-center"
            >
              <WaitingScreen
                question={question}
                selectedOption={selectedOption}
                timeRemaining={timeRemaining}
              />
            </motion.div>
          )}

          {phase === 'reveal' && question && revealData && (
            <motion.div
              key="reveal-screen"
              initial={{ opacity: 0, scale: 0.98 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.98 }}
              transition={{ duration: 0.25 }}
              className="flex-1 flex flex-col justify-center"
            >
              <RevealScreen
                question={question}
                revealData={revealData}
                myResult={myResult}
                selectedOption={selectedOption}
              />
            </motion.div>
          )}

          {phase === 'leaderboard' && leaderboard && (
            <motion.div
              key="leaderboard-screen"
              initial={{ opacity: 0, scale: 0.98 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.98 }}
              transition={{ duration: 0.25 }}
              className="flex-1 flex flex-col justify-center"
            >
              <LeaderboardScreen
                leaderboard={leaderboard}
                currentPlayerId={currentPlayer.id}
              />
            </motion.div>
          )}

          {phase === 'finished' && finishedData && (
            <motion.div
              key="podium-screen"
              initial={{ opacity: 0, scale: 0.98 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.98 }}
              transition={{ duration: 0.25 }}
              className="flex-1 flex flex-col justify-center"
            >
              <PodiumScreen
                finishedData={finishedData}
                currentPlayerId={currentPlayer.id}
                onRestart={restartGame}
              />
            </motion.div>
          )}
        </AnimatePresence>
      </main>

      {/* Dev-пульт тестирования */}
      <DevToolbar
        currentPhase={phase}
        isAutoMode={isAutoMode}
        onToggleAuto={toggleAutoMode}
        onSetPhase={setDevPhase}
        onTriggerError={triggerDevError}
        onRestart={restartGame}
      />
    </div>
  )
}

export default App
