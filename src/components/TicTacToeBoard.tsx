import type { BoardState, Theme } from '../types';

interface TicTacToeBoardProps {
  board: BoardState;
  onCellClick: (index: number) => void;
  winningCombo?: number[];
  disabled: boolean;
  currentPlayerSign: 'X' | 'O';
  theme: Theme;
}

export const TicTacToeBoard = ({
  board,
  onCellClick,
  winningCombo,
  disabled,
  currentPlayerSign,
  theme,
}: TicTacToeBoardProps) => {
  const isRetro = theme === 'retro';

  // Render SVG X Icon
  const renderX = (animate = true) => {
    return (
      <svg className="mark-svg mark-x" viewBox="0 0 100 100">
        {isRetro ? (
          // Retro pixelated X
          <>
            <line x1="20" y1="20" x2="80" y2="80" className={animate ? 'draw-x-line-1' : ''} />
            <line x1="80" y1="20" x2="20" y2="80" className={animate ? 'draw-x-line-2' : ''} />
          </>
        ) : (
          // Smooth modern X
          <>
            <path
              d="M 20,20 L 80,80"
              className={animate ? 'draw-x-line-1' : ''}
            />
            <path
              d="M 80,20 L 20,80"
              className={animate ? 'draw-x-line-2' : ''}
            />
          </>
        )}
      </svg>
    );
  };

  // Render SVG O Icon
  const renderO = (animate = true) => {
    return (
      <svg className="mark-svg mark-o" viewBox="0 0 100 100">
        {isRetro ? (
          // Retro blocky O
          <rect
            x="20"
            y="20"
            width="60"
            height="60"
            className={animate ? 'draw-circle' : ''}
          />
        ) : (
          // Smooth modern O
          <circle
            cx="50"
            cy="50"
            r="32"
            className={animate ? 'draw-circle' : ''}
          />
        )}
      </svg>
    );
  };

  // Ghost hover preview mark for active players
  const renderGhostHint = () => {
    return (
      <div className="hover-hint" style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        {currentPlayerSign === 'X' ? renderX(false) : renderO(false)}
      </div>
    );
  };

  return (
    <div className="board-container">
      <div className="board-grid" role="grid" aria-label="Tic Tac Toe Board">
        {board.map((cell, index) => {
          const isWinningCell = winningCombo?.includes(index);
          const cellLabel = cell 
            ? `Cell ${index + 1} marked with ${cell}` 
            : `Cell ${index + 1} empty. Click to place ${currentPlayerSign}`;

          return (
            <button
              key={index}
              role="gridcell"
              aria-label={cellLabel}
              className={`board-cell ${isWinningCell ? 'winning-cell' : ''}`}
              onClick={() => onCellClick(index)}
              disabled={disabled || cell !== null}
            >
              {cell === 'X' && renderX()}
              {cell === 'O' && renderO()}
              {cell === null && !disabled && renderGhostHint()}
            </button>
          );
        })}
      </div>
    </div>
  );
};
