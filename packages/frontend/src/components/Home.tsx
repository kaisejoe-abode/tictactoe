import { useState } from 'react';
import { useNavigate } from '@tanstack/react-router';
import { useCreateGame } from '../queries';

export const Home = () => {
  const navigate = useNavigate();
  const createGame = useCreateGame();
  const [playerName, setPlayerName] = useState('');
  const [joinGameId, setJoinGameId] = useState('');
  const [error, setError] = useState('');

  const handleCreateGame = async () => {
    if (!playerName.trim()) {
      setError('Please enter your name');
      return;
    }

    try {
      setError('');
      const game = await createGame.mutateAsync({ playerName: playerName.trim() });
      navigate({ 
        to: '/game/$gameId', 
        params: { gameId: game.id },
        search: { playerName: playerName.trim() }
      });
    } catch (error: any) {
      setError(error.message || 'Failed to create game');
    }
  };

  const handleJoinGame = () => {
    if (!playerName.trim()) {
      setError('Please enter your name');
      return;
    }

    if (!joinGameId.trim()) {
      setError('Please enter a game ID');
      return;
    }

    setError('');
    navigate({ 
      to: '/game/$gameId', 
      params: { gameId: joinGameId.trim() },
      search: { playerName: playerName.trim() }
    });
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100 p-4">
      <div className="max-w-md w-full">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-5xl font-bold text-gray-800 mb-2">
            Tic-Tac-Toe
          </h1>
          <p className="text-gray-600">Play with friends online</p>
        </div>

        {/* Main Card */}
        <div className="bg-white rounded-2xl shadow-xl p-8 space-y-6">
          {/* Player Name Input */}
          <div>
            <label htmlFor="playerName" className="block text-sm font-medium text-gray-700 mb-2">
              Your Name
            </label>
            <input
              id="playerName"
              type="text"
              value={playerName}
              onChange={(e) => setPlayerName(e.target.value)}
              placeholder="Enter your name"
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition"
              onKeyPress={(e) => {
                if (e.key === 'Enter' && playerName.trim()) {
                  handleCreateGame();
                }
              }}
            />
          </div>

          {/* Error Message */}
          {error && (
            <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg text-sm">
              {error}
            </div>
          )}

          {/* Create Game Button */}
          <button
            onClick={handleCreateGame}
            disabled={createGame.isPending || !playerName.trim()}
            className="w-full bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 text-white font-semibold py-3 px-4 rounded-lg transition disabled:opacity-50 disabled:cursor-not-allowed shadow-md hover:shadow-lg"
          >
            {createGame.isPending ? 'Creating Game...' : 'Create New Game'}
          </button>

          {/* Divider */}
          <div className="relative">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-gray-300"></div>
            </div>
            <div className="relative flex justify-center text-sm">
              <span className="px-2 bg-white text-gray-500">Or</span>
            </div>
          </div>

          {/* Join Game Section */}
          <div>
            <label htmlFor="gameId" className="block text-sm font-medium text-gray-700 mb-2">
              Game ID
            </label>
            <input
              id="gameId"
              type="text"
              value={joinGameId}
              onChange={(e) => setJoinGameId(e.target.value)}
              placeholder="Enter game ID to join"
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none transition"
              onKeyPress={(e) => {
                if (e.key === 'Enter' && playerName.trim() && joinGameId.trim()) {
                  handleJoinGame();
                }
              }}
            />
          </div>

          <button
            onClick={handleJoinGame}
            disabled={!playerName.trim() || !joinGameId.trim()}
            className="w-full bg-gradient-to-r from-indigo-500 to-indigo-600 hover:from-indigo-600 hover:to-indigo-700 text-white font-semibold py-3 px-4 rounded-lg transition disabled:opacity-50 disabled:cursor-not-allowed shadow-md hover:shadow-lg"
          >
            Join Game
          </button>
        </div>

        {/* Footer */}
        <div className="text-center mt-6 text-sm text-gray-600">
          <p>Create a game or join an existing one to start playing!</p>
        </div>
      </div>
    </div>
  );
};
