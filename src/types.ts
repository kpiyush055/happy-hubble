export type GameMode = 'local' | 'ai';

export type Difficulty = 'easy' | 'medium' | 'unbeatable';

export type Theme = 'cyberpunk' | 'space' | 'retro';

export type CellValue = 'X' | 'O' | null;

export type BoardState = CellValue[];

export interface PlayerConfig {
  name: string;
  sign: 'X' | 'O';
  color: string;
}

export interface MatchRecord {
  id: string;
  winnerName: string;
  winnerSign: CellValue | 'Draw';
  timestamp: string;
  mode: GameMode;
  difficulty?: Difficulty;
  movesCount: number;
}

export interface GameStats {
  xWins: number;
  oWins: number;
  draws: number;
}
