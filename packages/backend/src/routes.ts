import { Router, Request, Response } from 'express';
import { v4 as uuidv4 } from 'uuid';
import { query } from './db';
import { checkWinner, isValidMove, Player, Board, GameState } from './game-logic';
import { broadcastGameUpdate } from './websocket';

const router = Router();

// Helper function to convert DB row to GameState
const dbRowToGameState = (game: any): GameState => {
  // PostgreSQL's JSONB type is automatically parsed by node-postgres
  // So game.board is already an array, not a JSON string
  const board: Board = typeof game.board === 'string' ? JSON.parse(game.board) : game.board;
  
  return {
    id: game.id,
    board,
    currentPlayer: game.current_player,
    winner: game.winner,
    status: game.status || 'waiting',
    playerXName: game.player_x_name,
    playerOName: game.player_o_name,
    playerXId: game.player_x_id || 'X',
    playerOId: game.player_o_id || 'O',
    resetRequestedBy: game.reset_requested_by || null,
  };
};

// Create a new game
router.post('/games', async (req: Request, res: Response) => {
  try {
    const { playerName } = req.body;

    if (!playerName || !playerName.trim()) {
      return res.status(400).json({ error: 'Player name is required' });
    }

    const gameId = uuidv4();
    const initialBoard: Board = Array(9).fill(null);
    
    // Randomly assign X or O to the first player
    const firstPlayerSymbol: Player = Math.random() < 0.5 ? 'X' : 'O';
    const currentPlayer: Player = 'X'; // X always goes first

    let playerXName = null;
    let playerOName = null;
    
    if (firstPlayerSymbol === 'X') {
      playerXName = playerName.trim();
    } else {
      playerOName = playerName.trim();
    }

    const result = await query(
      `INSERT INTO games (
        id, board, current_player, winner, status,
        player_x_name, player_o_name,
        player_x_id, player_o_id
      )
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
       RETURNING *`,
      [gameId, JSON.stringify(initialBoard), currentPlayer, null, 'waiting', playerXName, playerOName, 'X', 'O']
    );

    const game = result.rows[0];
    const gameState = dbRowToGameState(game);

    res.json(gameState);
  } catch (error) {
    console.error('Error creating game:', error);
    res.status(500).json({ error: 'Failed to create game' });
  }
});

// Join an existing game
router.post('/games/:id/join', async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { playerName } = req.body;

    if (!playerName || !playerName.trim()) {
      return res.status(400).json({ error: 'Player name is required' });
    }

    // Get current game state
    const result = await query(
      'SELECT * FROM games WHERE id = $1',
      [id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Game not found' });
    }

    const game = result.rows[0];

    // Check if both players have already joined
    if (game.player_x_name && game.player_o_name) {
      return res.status(400).json({ error: 'Game is full' });
    }

    // Check if the joining player's name is the same as the existing player's name
    const existingPlayerName = game.player_x_name || game.player_o_name;
    if (existingPlayerName && existingPlayerName.toLowerCase() === playerName.trim().toLowerCase()) {
      return res.status(400).json({ error: 'Player name must be different from the existing player' });
    }

    // Use WHERE clause to prevent race condition - only update if slot is still empty
    let updateQuery: string;
    let newStatus = 'playing'; // Both players present, game can start

    if (!game.player_x_name) {
      // Update only if player_x_name is still null (prevents race condition)
      updateQuery = `UPDATE games 
                     SET player_x_name = $1, status = $2, updated_at = NOW()
                     WHERE id = $3 AND player_x_name IS NULL
                     RETURNING *`;
    } else {
      // Update only if player_o_name is still null (prevents race condition)
      updateQuery = `UPDATE games 
                     SET player_o_name = $1, status = $2, updated_at = NOW()
                     WHERE id = $3 AND player_o_name IS NULL
                     RETURNING *`;
    }

    const updateResult = await query(updateQuery, [playerName.trim(), newStatus, id]);
    
    // If no rows returned, the slot was filled by another request (race condition)
    if (updateResult.rows.length === 0) {
      return res.status(400).json({ error: 'Game is full' });
    }

    const updatedGame = updateResult.rows[0];
    const gameState = dbRowToGameState(updatedGame);

    // Broadcast update to all connected clients
    broadcastGameUpdate(id, gameState);

    res.json(gameState);
  } catch (error) {
    console.error('Error joining game:', error);
    res.status(500).json({ error: 'Failed to join game' });
  }
});

// Get game by ID
router.get('/games/:id', async (req: Request, res: Response) => {
  try {
    const { id } = req.params;

    const result = await query(
      'SELECT * FROM games WHERE id = $1',
      [id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Game not found' });
    }

    const game = result.rows[0];
    const gameState = dbRowToGameState(game);

    res.json(gameState);
  } catch (error) {
    console.error('Error fetching game:', error);
    res.status(500).json({ error: 'Failed to fetch game' });
  }
});

// Make a move
router.post('/games/:id/move', async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { position, player } = req.body;

    if (!player || (player !== 'X' && player !== 'O')) {
      return res.status(400).json({ error: 'Invalid player' });
    }

    if (typeof position !== 'number') {
      return res.status(400).json({ error: 'Invalid position' });
    }

    // Get current game state
    const result = await query(
      'SELECT * FROM games WHERE id = $1',
      [id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Game not found' });
    }

    const game = result.rows[0];
    const board: Board = typeof game.board === 'string' ? JSON.parse(game.board) : game.board;
    const currentPlayer: Player = game.current_player;
    const winner = game.winner;

    // Check if both players have joined
    if (!game.player_x_name || !game.player_o_name) {
      return res.status(400).json({ error: 'Waiting for both players to join' });
    }

    // Validate move
    const validation = isValidMove(board, position, player, currentPlayer, winner);
    if (!validation.valid) {
      return res.status(400).json({ error: validation.error });
    }

    // Make the move
    board[position] = player;
    const newWinner = checkWinner(board);
    const nextPlayer: Player = player === 'X' ? 'O' : 'X';
    const newStatus = newWinner ? 'done' : 'playing';

    // Update database
    await query(
      `UPDATE games 
       SET board = $1, current_player = $2, winner = $3, status = $4, updated_at = NOW()
       WHERE id = $5`,
      [JSON.stringify(board), nextPlayer, newWinner, newStatus, id]
    );

    const gameState: GameState = {
      id,
      board,
      currentPlayer: nextPlayer,
      winner: newWinner,
      status: newStatus,
      playerXName: game.player_x_name,
      playerOName: game.player_o_name,
      playerXId: game.player_x_id || 'X',
      playerOId: game.player_o_id || 'O',
      resetRequestedBy: game.reset_requested_by || null,
    };

    // Broadcast update to all connected clients
    broadcastGameUpdate(id, gameState);

    res.json(gameState);
  } catch (error) {
    console.error('Error making move:', error);
    res.status(500).json({ error: 'Failed to make move' });
  }
});

// Request to reset the game (requires confirmation from opponent)
router.post('/games/:id/reset-request', async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { player } = req.body;

    if (!player || (player !== 'X' && player !== 'O')) {
      return res.status(400).json({ error: 'Invalid player' });
    }

    // Get current game
    const result = await query('SELECT * FROM games WHERE id = $1', [id]);
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Game not found' });
    }

    const game = result.rows[0];

    // Check if both players are present
    if (!game.player_x_name || !game.player_o_name) {
      return res.status(400).json({ error: 'Need both players to request reset' });
    }

    // Set the reset request
    await query(
      `UPDATE games 
       SET reset_requested_by = $1, updated_at = NOW()
       WHERE id = $2`,
      [player, id]
    );

    const gameState: GameState = {
      id,
      board: typeof game.board === 'string' ? JSON.parse(game.board) : game.board,
      currentPlayer: game.current_player,
      winner: game.winner,
      status: game.status,
      playerXName: game.player_x_name,
      playerOName: game.player_o_name,
      playerXId: game.player_x_id || 'X',
      playerOId: game.player_o_id || 'O',
      resetRequestedBy: player,
    };

    // Broadcast update to all connected clients
    broadcastGameUpdate(id, gameState);

    res.json(gameState);
  } catch (error) {
    console.error('Error requesting reset:', error);
    res.status(500).json({ error: 'Failed to request reset' });
  }
});

// Confirm reset request (opponent agrees)
router.post('/games/:id/reset-confirm', async (req: Request, res: Response) => {
  try {
    const { id } = req.params;

    // Get current game
    const result = await query('SELECT * FROM games WHERE id = $1', [id]);
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Game not found' });
    }

    const game = result.rows[0];
    const initialBoard: Board = Array(9).fill(null);
    const currentPlayer: Player = 'X';

    // Reset the game and clear the reset request
    await query(
      `UPDATE games 
       SET board = $1, current_player = $2, winner = $3, status = $4, reset_requested_by = NULL, updated_at = NOW()
       WHERE id = $5`,
      [JSON.stringify(initialBoard), currentPlayer, null, 'playing', id]
    );

    const gameState: GameState = {
      id,
      board: initialBoard,
      currentPlayer,
      winner: null,
      status: 'playing',
      playerXName: game.player_x_name,
      playerOName: game.player_o_name,
      playerXId: game.player_x_id || 'X',
      playerOId: game.player_o_id || 'O',
      resetRequestedBy: null,
    };

    // Broadcast update to all connected clients
    broadcastGameUpdate(id, gameState);

    res.json(gameState);
  } catch (error) {
    console.error('Error confirming reset:', error);
    res.status(500).json({ error: 'Failed to confirm reset' });
  }
});

// Deny reset request
router.post('/games/:id/reset-deny', async (req: Request, res: Response) => {
  try {
    const { id } = req.params;

    // Get current game
    const result = await query('SELECT * FROM games WHERE id = $1', [id]);
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Game not found' });
    }

    const game = result.rows[0];

    // Clear the reset request
    await query(
      `UPDATE games 
       SET reset_requested_by = NULL, updated_at = NOW()
       WHERE id = $1`,
      [id]
    );

    const gameState = dbRowToGameState({ ...game, reset_requested_by: null });

    // Broadcast update to all connected clients
    broadcastGameUpdate(id, gameState);

    res.json(gameState);
  } catch (error) {
    console.error('Error denying reset:', error);
    res.status(500).json({ error: 'Failed to deny reset' });
  }
});

// Reset/restart a game (DEPRECATED - use reset-request flow instead)
router.post('/games/:id/reset', async (req: Request, res: Response) => {
  try {
    const { id } = req.params;

    // Get current game
    const result = await query('SELECT * FROM games WHERE id = $1', [id]);
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Game not found' });
    }

    const game = result.rows[0];
    const initialBoard: Board = Array(9).fill(null);
    const currentPlayer: Player = 'X';

    await query(
      `UPDATE games 
       SET board = $1, current_player = $2, winner = $3, status = $4, reset_requested_by = NULL, updated_at = NOW()
       WHERE id = $5`,
      [JSON.stringify(initialBoard), currentPlayer, null, 'playing', id]
    );

    const gameState: GameState = {
      id,
      board: initialBoard,
      currentPlayer,
      winner: null,
      status: 'playing',
      playerXName: game.player_x_name,
      playerOName: game.player_o_name,
      playerXId: game.player_x_id || 'X',
      playerOId: game.player_o_id || 'O',
      resetRequestedBy: null,
    };

    // Broadcast update to all connected clients
    broadcastGameUpdate(id, gameState);

    res.json(gameState);
  } catch (error) {
    console.error('Error resetting game:', error);
    res.status(500).json({ error: 'Failed to reset game' });
  }
});

// Get player statistics
router.get('/players/:playerName/stats', async (req: Request, res: Response) => {
  try {
    const { playerName } = req.params;

    if (!playerName || !playerName.trim()) {
      return res.status(400).json({ error: 'Player name is required' });
    }

    const name = decodeURIComponent(playerName.trim());

    // Query all completed games where the player participated
    const result = await query(
      `SELECT 
        winner,
        player_x_name,
        player_o_name
       FROM games 
       WHERE status = 'done' 
         AND (LOWER(player_x_name) = LOWER($1) OR LOWER(player_o_name) = LOWER($1))`,
      [name]
    );

    let wins = 0;
    let losses = 0;
    let draws = 0;

    // Calculate stats
    result.rows.forEach((game: any) => {
      if (game.winner === 'draw') {
        draws++;
      } else if (
        (game.winner === 'X' && game.player_x_name.toLowerCase() === name.toLowerCase()) ||
        (game.winner === 'O' && game.player_o_name.toLowerCase() === name.toLowerCase())
      ) {
        wins++;
      } else {
        losses++;
      }
    });

    const stats = {
      playerName: name,
      wins,
      losses,
      draws,
      totalGames: wins + losses + draws,
    };

    res.json(stats);
  } catch (error) {
    console.error('Error fetching player stats:', error);
    res.status(500).json({ error: 'Failed to fetch player stats' });
  }
});

export default router;
