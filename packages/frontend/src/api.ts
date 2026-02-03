import { GameState, MoveRequest, CreateGameRequest, JoinGameRequest, PlayerStats } from './types';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001';

export const api = {
  createGame: async (data: CreateGameRequest): Promise<GameState> => {
    const response = await fetch(`${API_URL}/api/games`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });
    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Failed to create game');
    }
    return response.json();
  },

  joinGame: async (gameId: string, data: JoinGameRequest): Promise<GameState> => {
    const response = await fetch(`${API_URL}/api/games/${gameId}/join`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });
    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Failed to join game');
    }
    return response.json();
  },

  getGame: async (gameId: string): Promise<GameState> => {
    const response = await fetch(`${API_URL}/api/games/${gameId}`);
    if (!response.ok) throw new Error('Failed to fetch game');
    return response.json();
  },

  makeMove: async (gameId: string, move: MoveRequest): Promise<GameState> => {
    const response = await fetch(`${API_URL}/api/games/${gameId}/move`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(move),
    });
    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Failed to make move');
    }
    return response.json();
  },

  resetGame: async (gameId: string): Promise<GameState> => {
    const response = await fetch(`${API_URL}/api/games/${gameId}/reset`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
    });
    if (!response.ok) throw new Error('Failed to reset game');
    return response.json();
  },

  requestReset: async (gameId: string, player: 'X' | 'O'): Promise<GameState> => {
    const response = await fetch(`${API_URL}/api/games/${gameId}/reset-request`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ player }),
    });
    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Failed to request reset');
    }
    return response.json();
  },

  confirmReset: async (gameId: string): Promise<GameState> => {
    const response = await fetch(`${API_URL}/api/games/${gameId}/reset-confirm`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
    });
    if (!response.ok) throw new Error('Failed to confirm reset');
    return response.json();
  },

  denyReset: async (gameId: string): Promise<GameState> => {
    const response = await fetch(`${API_URL}/api/games/${gameId}/reset-deny`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
    });
    if (!response.ok) throw new Error('Failed to deny reset');
    return response.json();
  },

  getPlayerStats: async (playerName: string): Promise<PlayerStats> => {
    const encodedName = encodeURIComponent(playerName);
    const response = await fetch(`${API_URL}/api/players/${encodedName}/stats`);
    if (!response.ok) throw new Error('Failed to fetch player stats');
    return response.json();
  },
};
