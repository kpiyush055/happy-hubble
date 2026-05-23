import { useState, useEffect, useRef, useCallback } from 'react';
import type { GameMode, Difficulty, Theme, PlayerConfig, BoardState, MatchRecord, GameStats, CellValue } from './types';
import { GameLobby } from './components/GameLobby';
import { TicTacToeBoard } from './components/TicTacToeBoard';
import { Timer } from './components/Timer';
import { getBestMove, checkWinner } from './utils/minimax';
import { playClickSound, playMoveSound, playWinSound, playDrawSound, playTimeOutSound, toggleSound } from './utils/audio';
import './App.css';

const DEFAULT_P1: PlayerConfig = {
  name: 'Player 1',
  sign: 'X',
  color: 'var(--color-x)',
};

const DEFAULT_P2: PlayerConfig = {
  name: 'Nebula AI',
  sign: 'O',
  color: 'var(--color-o)',
};

export default function App() {
  const [theme, setTheme] = useState<Theme>('cyberpunk');
  const [gameStarted, setGameStarted] = useState(false);
  const [mode, setMode] = useState<GameMode>('ai');
  const [difficulty, setDifficulty] = useState<Difficulty>('unbeatable');
  const [blitzSeconds, setBlitzSeconds] = useState<number | null>(null);

  const [player1, setPlayer1] = useState<PlayerConfig>(DEFAULT_P1);
  const [player2, setPlayer2] = useState<PlayerConfig>(DEFAULT_P2);

  // Core Game State
  const [board, setBoard] = useState<BoardState>(Array(9).fill(null));
  const [currentPlayer, setCurrentPlayer] = useState<'X' | 'O'>('X');
  const [winner, setWinner] = useState<CellValue | 'Draw' | 'Timeout' | null>(null);
  const [winningCombo, setWinningCombo] = useState<number[] | undefined>(undefined);
  const [winningPlayerName, setWinningPlayerName] = useState<string>('');
  
  // Timer State
  const [timerRemaining, setTimerRemaining] = useState<number>(0);
  const timerIntervalRef = useRef<any>(null);

  // Extra State
  const [isAiThinking, setIsAiThinking] = useState(false);
  const [isSoundOn, setIsSoundOn] = useState(true);
  const [stats, setStats] = useState<GameStats>({ xWins: 0, oWins: 0, draws: 0 });
  const [matchHistory, setMatchHistory] = useState<MatchRecord[]>([]);
  const [showGameOverModal, setShowGameOverModal] = useState(false);

  // Initialize theme class on mount
  useEffect(() => {
    document.body.className = `theme-${theme}`;
  }, []);

  // Helper to determine if it is currently AI's turn
  const isAiTurn = gameStarted && !winner && mode === 'ai' && currentPlayer === player2.sign;

  // Stop Timer
  const stopTimer = useCallback(() => {
    if (timerIntervalRef.current) {
      clearInterval(timerIntervalRef.current);
      timerIntervalRef.current = null;
    }
  }, []);

  // Start Timer
  const startTimer = useCallback((seconds: number) => {
    stopTimer();
    setTimerRemaining(seconds);
    
    timerIntervalRef.current = setInterval(() => {
      setTimerRemaining(prev => {
        if (prev <= 1) {
          stopTimer();
          handleTimeout();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
  }, [stopTimer]);

  // Handle Timeout (Loss for current player)
  const handleTimeout = () => {
    playTimeOutSound();
    
    // The opposite player wins
    const activeSign = currentPlayer;
    const winningPlayer = activeSign === player1.sign ? player2 : player1;

    setWinner('Timeout');
    setWinningPlayerName(winningPlayer.name);

    // Update statistics
    setStats(prev => {
      const isXWinner = winningPlayer.sign === 'X';
      return {
        ...prev,
        xWins: isXWinner ? prev.xWins + 1 : prev.xWins,
        oWins: !isXWinner ? prev.oWins + 1 : prev.oWins,
      };
    });

    // Add match history
    const record: MatchRecord = {
      id: Math.random().toString(36).substring(2, 9),
      winnerName: winningPlayer.name,
      winnerSign: winningPlayer.sign,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' }),
      mode,
      difficulty: mode === 'ai' ? difficulty : undefined,
      movesCount: board.filter(cell => cell !== null).length,
    };
    setMatchHistory(prev => [record, ...prev]);

    playWinSound();
    setShowGameOverModal(true);
  };

  // Launch / Start Match from Lobby
  const handleStartGame = (config: {
    mode: GameMode;
    difficulty: Difficulty;
    theme: Theme;
    blitzSeconds: number | null;
    player1: PlayerConfig;
    player2: PlayerConfig;
  }) => {
    setMode(config.mode);
    setDifficulty(config.difficulty);
    setTheme(config.theme);
    setBlitzSeconds(config.blitzSeconds);
    setPlayer1(config.player1);
    setPlayer2(config.player2);

    // Reset session stats if we change mode
    if (mode !== config.mode) {
      setStats({ xWins: 0, oWins: 0, draws: 0 });
      setMatchHistory([]);
    }

    resetMatch(config.blitzSeconds);
    setGameStarted(true);
  };

  // Restart/Reset current Match
  const resetMatch = (
    timerSec = blitzSeconds
  ) => {
    stopTimer();
    setBoard(Array(9).fill(null));
    setCurrentPlayer('X'); // X always goes first
    setWinner(null);
    setWinningCombo(undefined);
    setWinningPlayerName('');
    setIsAiThinking(false);
    setShowGameOverModal(false);

    if (timerSec !== null) {
      startTimer(timerSec);
    }
  };

  // Handle a player's cell move selection
  const handleCellClick = (index: number) => {
    if (board[index] !== null || winner || isAiThinking) return;

    // Play marker sound
    playMoveSound(currentPlayer === 'O');

    // Make the move
    const nextBoard = [...board];
    nextBoard[index] = currentPlayer;
    setBoard(nextBoard);

    // Evaluate
    const evaluation = checkWinner(nextBoard);
    
    if (evaluation.winner) {
      stopTimer();
      setWinner(evaluation.winner);
      setWinningCombo(evaluation.combo);

      if (evaluation.winner === 'Draw') {
        playDrawSound();
        setWinningPlayerName('Draw');
        setStats(prev => ({ ...prev, draws: prev.draws + 1 }));
      } else {
        playWinSound();
        const winningPlayer = evaluation.winner === player1.sign ? player1 : player2;
        setWinningPlayerName(winningPlayer.name);
        setStats(prev => {
          const isX = evaluation.winner === 'X';
          return {
            ...prev,
            xWins: isX ? prev.xWins + 1 : prev.xWins,
            oWins: !isX ? prev.oWins + 1 : prev.oWins,
          };
        });
      }

      // Add to Ledger
      const record: MatchRecord = {
        id: Math.random().toString(36).substring(2, 9),
        winnerName: evaluation.winner === 'Draw' ? 'Draw' : (evaluation.winner === player1.sign ? player1.name : player2.name),
        winnerSign: evaluation.winner,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' }),
        mode,
        difficulty: mode === 'ai' ? difficulty : undefined,
        movesCount: nextBoard.filter(cell => cell !== null).length,
      };
      setMatchHistory(prev => [record, ...prev]);
      setShowGameOverModal(true);
      return;
    }

    // Switch turns
    const nextPlayer = currentPlayer === 'X' ? 'O' : 'X';
    setCurrentPlayer(nextPlayer);

    // Restart timer
    if (blitzSeconds !== null) {
      startTimer(blitzSeconds);
    }
  };

  // AI solver effect
  useEffect(() => {
    if (isAiTurn) {
      stopTimer();
      setIsAiThinking(true);

      // Add thinking delay for rich UX
      const thinkingDelay = setTimeout(() => {
        const aiSign = player2.sign;
        const bestMoveIndex = getBestMove(board, aiSign, difficulty);

        if (bestMoveIndex !== -1) {
          setIsAiThinking(false);
          handleCellClick(bestMoveIndex);
        }
      }, 700);

      return () => clearTimeout(thinkingDelay);
    }
  }, [isAiTurn, board, difficulty, player2.sign]);

  // Sound Toggle Handler
  const handleSoundToggle = () => {
    const nextState = !isSoundOn;
    setIsSoundOn(nextState);
    toggleSound(nextState);
    playClickSound();
  };

  // Back to lobby
  const handleBackToLobby = () => {
    playClickSound();
    stopTimer();
    setGameStarted(false);
  };

  // Sound check for button tap
  const handleButtonTap = () => {
    playClickSound();
  };

  return (
    <div className="app-container">
      {/* Ambient backgrounds */}
      <div className="ambient-bg" />
      <div className="background-effect-top" />
      <div className="background-effect-bottom" />

      {/* Header bar */}
      <header className="app-header">
        <div className="title-container">
          <h1>Nebula Tic-Tac-Toe</h1>
          <span className="subtitle">
            {gameStarted
              ? `${mode === 'ai' ? `vs ${difficulty} AI` : 'Local Multiplayer'}`
              : 'Futuristic Grid Arena'}
          </span>
        </div>
        <div className="controls-row">
          <button
            onClick={handleSoundToggle}
            className="icon-btn"
            aria-label={isSoundOn ? 'Mute Sounds' : 'Unmute Sounds'}
          >
            {isSoundOn ? '🔊' : '🔇'}
          </button>
          {gameStarted && (
            <button
              onClick={handleBackToLobby}
              className="icon-btn"
              aria-label="Back to Lobby"
            >
              🏠
            </button>
          )}
        </div>
      </header>

      {/* Game Content Grid */}
      {!gameStarted ? (
        <GameLobby onStartGame={handleStartGame} initialTheme={theme} />
      ) : (
        <div className="game-arena-grid">
          {/* Main Board Column */}
          <div className="board-column">
            {/* Status bar */}
            <div className="status-bar">
              <div className="status-turn">
                <span>Current: </span>
                <span
                  style={{
                    color: currentPlayer === player1.sign ? player1.color : player2.color,
                    fontWeight: 800,
                  }}
                >
                  {currentPlayer === player1.sign ? player1.name : player2.name} ({currentPlayer})
                </span>
                {mode === 'ai' && currentPlayer === player2.sign && (
                  <span className="status-badge badge-ai">Thinking...</span>
                )}
              </div>

              {/* Blitz Timer */}
              {blitzSeconds !== null && !winner && (
                <Timer
                  secondsRemaining={timerRemaining}
                  totalSeconds={blitzSeconds}
                  isActive={!winner && !isAiThinking}
                />
              )}
            </div>

            {/* Board */}
            <TicTacToeBoard
              board={board}
              onCellClick={handleCellClick}
              winningCombo={winningCombo}
              disabled={isAiThinking || winner !== null}
              currentPlayerSign={currentPlayer}
              theme={theme}
            />

            <button
              onClick={() => { handleButtonTap(); resetMatch(); }}
              className="action-btn"
              style={{ maxWidth: '420px', marginTop: '24px' }}
            >
              Reset Match
            </button>
          </div>

          {/* Stats & Ledger Column */}
          <div className="stats-panel">
            {/* Scorecard */}
            <div className="scoreboard">
              <div className={`score-card ${currentPlayer === player1.sign ? 'active-score-x' : ''}`}>
                <div className="score-label">{player1.name}</div>
                <div className="score-value">{player1.sign === 'X' ? stats.xWins : stats.oWins}</div>
              </div>
              <div className="score-card">
                <div className="score-label">Ties</div>
                <div className="score-value">{stats.draws}</div>
              </div>
              <div className={`score-card ${currentPlayer === player2.sign ? 'active-score-o' : ''}`}>
                <div className="score-label">{player2.name}</div>
                <div className="score-value">{player2.sign === 'X' ? stats.xWins : stats.oWins}</div>
              </div>
            </div>

            {/* Match History Ledger */}
            <div className="glass-panel ledger-card">
              <div className="ledger-header">Match History</div>
              <div className="ledger-list">
                {matchHistory.length === 0 ? (
                  <div className="ledger-empty">No matches played this session</div>
                ) : (
                  matchHistory.map((item) => (
                    <div key={item.id} className="ledger-item">
                      <div>
                        <span style={{ fontWeight: 600 }}>{item.winnerName}</span>
                        <span style={{ color: 'var(--color-text-muted)', marginLeft: '6px' }}>
                          {item.winnerSign === 'Draw'
                            ? '(Tied)'
                            : `(${item.winnerSign} won)`}
                        </span>
                      </div>
                      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end' }}>
                        <span className="ledger-win" style={{ fontSize: '0.75rem' }}>
                          {item.movesCount} moves
                        </span>
                        <span style={{ fontSize: '0.65rem', color: 'var(--color-text-muted)' }}>
                          {item.timestamp}
                        </span>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>

            <button
              onClick={handleBackToLobby}
              className="secondary-btn"
            >
              Change Setup / Lobby
            </button>
          </div>
        </div>
      )}

      {/* Game Over Popup Modal */}
      {showGameOverModal && (
        <div className={`dialog-overlay open`}>
          <div className="dialog-content">
            <h3 className="dialog-title">
              {winner === 'Draw' ? 'Match Tied!' : 'Victory!'}
            </h3>
            <div className="dialog-msg">
              {winner === 'Draw' ? (
                <span>It's a draw! Well played by both.</span>
              ) : winner === 'Timeout' ? (
                <span>
                  Time expired!{' '}
                  <strong style={{ color: 'var(--color-accent)' }}>{winningPlayerName}</strong> wins the match!
                </span>
              ) : (
                <span>
                  <strong style={{ color: 'var(--color-accent)' }}>{winningPlayerName}</strong> wins the match in{' '}
                  {board.filter(cell => cell !== null).length} moves!
                </span>
              )}
            </div>
            <button
              onClick={() => { handleButtonTap(); resetMatch(); }}
              className="action-btn"
            >
              Rematch
            </button>
            <button
              onClick={handleBackToLobby}
              className="secondary-btn"
            >
              Back to Lobby
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
