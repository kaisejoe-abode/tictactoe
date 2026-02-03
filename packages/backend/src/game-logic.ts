export type Player = 'X' | 'O';
export type Cell = Player | null;
export type Board = Cell[];

export interface Game {
  id: string;
  board: Board;
  current_player: Player;
  winner: Player | 'draw' | null;
  player_x_name: string | null;
  player_o_name: string | null;
  player_x_id: Player;
  player_o_id: Player;
  status: 'waiting' | 'playing' | 'done';
  created_at: Date;
  updated_at: Date;
}

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

export const checkWinner = (board: Board): Player | 'draw' | null => {
  // Win patterns (indices)
  const winPatterns = [
    [0, 1, 2], [3, 4, 5], [6, 7, 8], // rows
    [0, 3, 6], [1, 4, 7], [2, 5, 8], // columns
    [0, 4, 8], [2, 4, 6]             // diagonals
  ];

  // Check for winner
  for (const pattern of winPatterns) {
    const [a, b, c] = pattern;
    if (board[a] && board[a] === board[b] && board[a] === board[c]) {
      return board[a] as Player;
    }
  }

  // Check for draw (board full)
  if (board.every(cell => cell !== null)) {
    return 'draw';
  }

  // Game still in progress
  return null;
};

export const isValidMove = (
  board: Board,
  position: number,
  player: Player,
  currentPlayer: Player,
  winner: Player | 'draw' | null
): { valid: boolean; error?: string } => {
  // Check if game is already over
  if (winner) {
    return { valid: false, error: 'Game is already finished' };
  }

  // Check if it's the player's turn
  if (player !== currentPlayer) {
    return { valid: false, error: 'Not your turn' };
  }

  // Check if position is valid
  if (position < 0 || position > 8) {
    return { valid: false, error: 'Invalid position' };
  }

  // Check if cell is already occupied
  if (board[position] !== null) {
    return { valid: false, error: 'Cell already occupied' };
  }

  return { valid: true };
};
