export type Player = 'X' | 'O';
export type Cell = Player | null;
export type Board = Cell[];

export interface GameState {
  id: string;
  board: Board;
  currentPlayer: Player;
  winner: Player | 'draw' | null;
  status: 'waiting' | 'playing' | 'done';
  playerXName: string | null;
  playerOName: string | null;
  playerXId: Player;
  playerOId: Player;
  resetRequestedBy: Player | null;
}

export interface MoveRequest {
  position: number;
  player: Player;
}

export interface CreateGameRequest {
  playerName: string;
}

export interface JoinGameRequest {
  playerName: string;
}

export interface PlayerStats {
  playerName: string;
  wins: number;
  losses: number;
  draws: number;
  totalGames: number;
}
