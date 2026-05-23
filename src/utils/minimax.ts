import type { BoardState, CellValue, Difficulty } from '../types';

const WINNING_COMBOS = [
  [0, 1, 2], [3, 4, 5], [6, 7, 8], // Rows
  [0, 3, 6], [1, 4, 7], [2, 5, 8], // Columns
  [0, 4, 8], [2, 4, 6]            // Diagonals
];

export function checkWinner(board: BoardState): { winner: CellValue | 'Draw' | null; combo?: number[] } {
  // Check winning lines
  for (const combo of WINNING_COMBOS) {
    const [a, b, c] = combo;
    if (board[a] && board[a] === board[b] && board[a] === board[c]) {
      return { winner: board[a], combo };
    }
  }

  // Check draw
  if (board.every(cell => cell !== null)) {
    return { winner: 'Draw' };
  }

  // Game still active
  return { winner: null };
}

function evaluateBoard(board: BoardState, aiSign: 'X' | 'O', opponentSign: 'X' | 'O'): number {
  const result = checkWinner(board).winner;
  if (result === aiSign) return 10;
  if (result === opponentSign) return -10;
  return 0;
}

function minimax(
  board: BoardState,
  depth: number,
  isMaximizing: boolean,
  aiSign: 'X' | 'O',
  opponentSign: 'X' | 'O'
): { score: number; index?: number } {
  const score = evaluateBoard(board, aiSign, opponentSign);

  // Terminal state evaluation
  if (score === 10) return { score: score - depth };
  if (score === -10) return { score: score + depth };
  if (board.every(cell => cell !== null)) return { score: 0 };

  const emptyIndices: number[] = [];
  board.forEach((cell, idx) => {
    if (cell === null) emptyIndices.push(idx);
  });

  if (isMaximizing) {
    let bestScore = -Infinity;
    let bestIndex = -1;

    for (const idx of emptyIndices) {
      board[idx] = aiSign;
      const { score } = minimax(board, depth + 1, false, aiSign, opponentSign);
      board[idx] = null;

      if (score > bestScore) {
        bestScore = score;
        bestIndex = idx;
      }
    }
    return { score: bestScore, index: bestIndex };
  } else {
    let bestScore = Infinity;
    let bestIndex = -1;

    for (const idx of emptyIndices) {
      board[idx] = opponentSign;
      const { score } = minimax(board, depth + 1, true, aiSign, opponentSign);
      board[idx] = null;

      if (score < bestScore) {
        bestScore = score;
        bestIndex = idx;
      }
    }
    return { score: bestScore, index: bestIndex };
  }
}

export function getBestMove(board: BoardState, aiSign: 'X' | 'O', difficulty: Difficulty): number {
  const opponentSign: 'X' | 'O' = aiSign === 'X' ? 'O' : 'X';
  const emptyIndices: number[] = [];
  board.forEach((cell, idx) => {
    if (cell === null) emptyIndices.push(idx);
  });

  if (emptyIndices.length === 0) return -1;

  // 1. Easy Mode: Completely random move
  if (difficulty === 'easy') {
    const randomIdx = Math.floor(Math.random() * emptyIndices.length);
    return emptyIndices[randomIdx];
  }

  // 2. Medium Mode: Smart but imperfect
  if (difficulty === 'medium') {
    // A) 60% chance to act smart, 40% random
    if (Math.random() > 0.6) {
      const randomIdx = Math.floor(Math.random() * emptyIndices.length);
      return emptyIndices[randomIdx];
    }

    // Check if AI can win in this turn
    for (const idx of emptyIndices) {
      board[idx] = aiSign;
      const winResult = checkWinner(board).winner;
      board[idx] = null;
      if (winResult === aiSign) return idx;
    }

    // Check if opponent can win, and block them
    for (const idx of emptyIndices) {
      board[idx] = opponentSign;
      const winResult = checkWinner(board).winner;
      board[idx] = null;
      if (winResult === opponentSign) return idx;
    }

    // Otherwise, pick a corner or center if available, else random
    if (board[4] === null) return 4; // Center
    const corners = [0, 2, 6, 8].filter(c => board[c] === null);
    if (corners.length > 0) {
      return corners[Math.floor(Math.random() * corners.length)];
    }

    const randomIdx = Math.floor(Math.random() * emptyIndices.length);
    return emptyIndices[randomIdx];
  }

  // 3. Unbeatable Mode: Full minimax evaluation
  // Optimization: If it's the first move and center is free, take center (common optimal starting move)
  if (emptyIndices.length === 9) {
    return 4; // Take center on blank board
  }
  if (emptyIndices.length === 8 && board[4] === null) {
    return 4; // Take center on second move if open
  }

  const { index } = minimax([...board], 0, true, aiSign, opponentSign);
  return index !== undefined ? index : emptyIndices[0];
}
