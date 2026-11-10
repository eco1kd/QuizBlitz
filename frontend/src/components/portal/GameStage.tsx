import type { GameEngine } from '../../hooks/useGameEngine'
import { GameHeader } from '../game/GameHeader'
import { QuestionScreen } from '../game/QuestionScreen'
import { WaitingScreen } from '../game/WaitingScreen'
import { RevealScreen } from '../game/RevealScreen'
import { LeaderboardScreen } from '../game/LeaderboardScreen'
import { PodiumScreen } from '../game/PodiumScreen'
// The game screens belong to frontend part 2. This adapter keeps their contracts intact.
export function GameStage({
  engine: e,
  onExit,
  onReplay,
}: {
  engine: GameEngine
  onExit: () => void
  onReplay: () => void
}) {
  return (
    <div className="game-stage">
      <div className="game-stage-top">
        <span>
          ⚡ {e.roomInfo.topic} · {e.roomInfo.code}
        </span>
        <button onClick={onExit}>Выйти из игры</button>
      </div>
      {e.question && e.phase !== 'finished' && (
        <GameHeader
          currentIndex={e.question.index}
          totalQuestions={e.question.total}
          score={e.myScore}
          streak={e.myStreak}
          timeRemaining={e.timeRemaining}
          timeLimit={e.question.timeLimit}
          showTimer={e.phase === 'question' || e.phase === 'waiting'}
        />
      )}
      {e.phase === 'question' && e.question && (
        <QuestionScreen
          question={e.question}
          selectedOption={e.selectedOption}
          onSelectOption={e.submitAnswer}
          disabled={!e.connected}
        />
      )}
      {e.phase === 'waiting' && e.question && (
        <WaitingScreen
          question={e.question}
          selectedOption={e.selectedOption}
          timeRemaining={e.timeRemaining}
        />
      )}
      {e.phase === 'reveal' && e.question && e.revealData && (
        <RevealScreen
          question={e.question}
          revealData={e.revealData}
          myResult={e.myResult}
          selectedOption={e.selectedOption}
          isHost={e.roomInfo.isHost}
          onNext={e.nextStep}
        />
      )}
      {e.phase === 'leaderboard' && e.leaderboard && (
        <LeaderboardScreen
          leaderboard={e.leaderboard}
          currentPlayerId={e.currentPlayer.id}
          isHost={e.roomInfo.isHost}
          onNext={e.nextStep}
        />
      )}
      {e.phase === 'finished' && e.finishedData && (
        <PodiumScreen
          finishedData={e.finishedData}
          currentPlayerId={e.currentPlayer.id}
          onRestart={onReplay}
        />
      )}
    </div>
  )
}
