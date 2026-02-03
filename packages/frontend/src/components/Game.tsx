import { useState, useCallback, useEffect } from 'react';
import { useParams, useNavigate, useSearch } from '@tanstack/react-router';
import { useQueryClient } from '@tanstack/react-query';
import { Board } from '../components/Board';
import { Toast } from '../components/Toast';
import { useGame, useMakeMove, useResetGame, useJoinGame, useCreateGame, useRequestReset, useConfirmReset, useDenyReset, usePlayerStats } from '../queries';
import { useWebSocket } from '../useWebSocket';
import { Player, GameState } from '../types';

export const Game = () => {
  const { gameId } = useParams({ strict: false });
  const search = useSearch({ strict: false }) as { playerName?: string };
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  
  const [hasJoined, setHasJoined] = useState(false);
  const [playerName, setPlayerName] = useState('');
  const [showJoinPrompt, setShowJoinPrompt] = useState(false);
  const [showNewGameModal, setShowNewGameModal] = useState(false);
  const [showResetConfirmModal, setShowResetConfirmModal] = useState(false);
  const [myPlayerSymbol, setMyPlayerSymbol] = useState<Player | null>(null);
  const [showToast, setShowToast] = useState(false);
  const [toastMessage, setToastMessage] = useState('');
  const [toastType, setToastType] = useState<'info' | 'success' | 'warning'>('info');
  const [lastBoardState, setLastBoardState] = useState<string>('');
  
  const { data: game, isLoading, error } = useGame(gameId);
  const makeMove = useMakeMove(gameId!);
  const resetGame = useResetGame(gameId!);
  const requestReset = useRequestReset(gameId!);
  const confirmReset = useConfirmReset(gameId!);
  const denyReset = useDenyReset(gameId!);
  const joinGame = useJoinGame(gameId!);
  const createGame = useCreateGame();
  const { data: stats } = usePlayerStats(playerName);

  // Handle real-time updates via WebSocket
  const handleGameUpdate = useCallback((updatedGame: GameState) => {
    queryClient.setQueryData(['game', gameId], updatedGame);
  }, [queryClient, gameId]);

  useWebSocket(gameId, handleGameUpdate);

  // Detect when opponent resets the game
  useEffect(() => {
    if (!game || !hasJoined) return;

    const currentBoardState = JSON.stringify(game.board);
    const emptyBoard = JSON.stringify(Array(9).fill(null));
    
    // Only show reset toast if:
    // 1. We have a previous board state
    // 2. The previous board had moves (wasn't empty)
    // 3. Current board is now empty (reset)
    // 4. Not currently in a reset request flow
    if (lastBoardState && 
        lastBoardState !== emptyBoard && 
        currentBoardState === emptyBoard && 
        !game.resetRequestedBy) {
      // Board was reset - show notification
      const opponentName = myPlayerSymbol === 'X' ? game.playerOName : game.playerXName;
      setToastMessage(`${opponentName} reset the game!`);
      setToastType('success');
      setShowToast(true);
    }
    
    setLastBoardState(currentBoardState);
  }, [game?.board, hasJoined, myPlayerSymbol, lastBoardState, game?.playerXName, game?.playerOName, game?.resetRequestedBy]);

  // Detect when opponent requests a reset
  useEffect(() => {
    if (!game || !hasJoined || !myPlayerSymbol) return;

    // If there's a reset request and it's not from me
    if (game.resetRequestedBy && game.resetRequestedBy !== myPlayerSymbol) {
      setShowResetConfirmModal(true);
    } else if (!game.resetRequestedBy) {
      setShowResetConfirmModal(false);
    }
  }, [game?.resetRequestedBy, hasJoined, myPlayerSymbol]);

  // Refetch player stats when game finishes
  useEffect(() => {
    if (!game || !playerName) return;
    
    // When game status changes to 'done', refetch stats to update the tally
    if (game.status === 'done') {
      queryClient.invalidateQueries({ queryKey: ['playerStats', playerName] });
    }
  }, [game?.status, playerName, queryClient]);

  // Check if player needs to join
  useEffect(() => {
    if (!game || hasJoined) return;

    const playerNameFromSearch = search?.playerName;
    
    // Check if the current user is the creator (already in the game)
    if (playerNameFromSearch) {
      // Check if this name matches either player in the game
      if (playerNameFromSearch === game.playerXName) {
        setMyPlayerSymbol('X');
        setPlayerName(playerNameFromSearch);
        setHasJoined(true);
        return;
      } else if (playerNameFromSearch === game.playerOName) {
        setMyPlayerSymbol('O');
        setPlayerName(playerNameFromSearch);
        setHasJoined(true);
        return;
      }
    }
    
    // If both players have joined, but user isn't one of them
    if (game.playerXName && game.playerOName) {
      // Prompt for name (they might be a spectator or wrong URL)
      setShowJoinPrompt(true);
      return;
    }

    // One player slot is open
    if (playerNameFromSearch) {
      // Auto-join if name provided
      setPlayerName(playerNameFromSearch);
      handleJoinGame(playerNameFromSearch);
    } else {
      // Show join prompt
      setShowJoinPrompt(true);
    }
  }, [game, hasJoined, search]);

  const handleJoinGame = async (name: string) => {
    try {
      const updatedGame = await joinGame.mutateAsync({ playerName: name });
      
      // Determine which player symbol this user got
      if (updatedGame.playerXName === name) {
        setMyPlayerSymbol('X');
      } else if (updatedGame.playerOName === name) {
        setMyPlayerSymbol('O');
      }
      
      setHasJoined(true);
      setShowJoinPrompt(false);
    } catch (error: any) {
      alert(error.message || 'Failed to join game');
    }
  };

  const handleJoinSubmit = () => {
    if (!playerName.trim()) {
      alert('Please enter your name');
      return;
    }
    handleJoinGame(playerName.trim());
  };

  const handleCellClick = async (position: number) => {
    if (!game || !myPlayerSymbol || game.winner) return;

    try {
      await makeMove.mutateAsync({ position, player: myPlayerSymbol });
    } catch (error: any) {
      alert(error.message || 'Failed to make move');
    }
  };

  const handleReset = async () => {
    if (!myPlayerSymbol) return;
    
    try {
      await requestReset.mutateAsync(myPlayerSymbol);
      setToastMessage('Reset request sent to opponent');
      setToastType('info');
      setShowToast(true);
    } catch (error) {
      alert('Failed to request reset');
    }
  };

  const handleConfirmReset = async () => {
    try {
      await confirmReset.mutateAsync();
      setShowResetConfirmModal(false);
      const opponentName = myPlayerSymbol === 'X' ? game?.playerOName : game?.playerXName;
      setToastMessage(`Game reset! Starting fresh with ${opponentName}`);
      setToastType('success');
      setShowToast(true);
    } catch (error) {
      alert('Failed to confirm reset');
    }
  };

  const handleDenyReset = async () => {
    try {
      await denyReset.mutateAsync();
      setShowResetConfirmModal(false);
      setToastMessage('Reset request denied');
      setToastType('warning');
      setShowToast(true);
    } catch (error) {
      alert('Failed to deny reset');
    }
  };

  const handleCopyLink = () => {
    const url = window.location.origin + `/game/${gameId}`;
    navigator.clipboard.writeText(url);
    alert('Game link copied to clipboard!');
  };

  const handleNewGameClick = () => {
    setShowNewGameModal(true);
  };

  const handlePlayAgain = async () => {
    // Request reset to play again with same opponent (requires confirmation)
    if (!myPlayerSymbol) return;
    
    try {
      await requestReset.mutateAsync(myPlayerSymbol);
      setShowNewGameModal(false);
      setToastMessage('Play again request sent to opponent');
      setToastType('info');
      setShowToast(true);
    } catch (error) {
      alert('Failed to request play again');
    }
  };

  const handleNewOpponent = async () => {
    // Create a completely new game
    try {
      const newGame = await createGame.mutateAsync({ playerName });
      setShowNewGameModal(false);
      navigate({ 
        to: '/game/$gameId', 
        params: { gameId: newGame.id },
        search: { playerName }
      });
    } catch (error: any) {
      alert(error.message || 'Failed to create new game');
    }
  };

  if (!gameId) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <p className="text-red-600">No game ID provided</p>
          <button
            onClick={() => navigate({ to: '/' })}
            className="mt-4 px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600"
          >
            Go Home
          </button>
        </div>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <h2 className="text-xl text-gray-700">Loading game...</h2>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center bg-white p-8 rounded-lg shadow-lg">
          <h2 className="text-2xl font-bold text-red-600 mb-4">Error Loading Game</h2>
          <p className="text-gray-600 mb-6">{error.message}</p>
          <button
            onClick={() => navigate({ to: '/' })}
            className="px-6 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600"
          >
            Go Home
          </button>
        </div>
      </div>
    );
  }

  if (!game) return null;

  // Show join prompt if needed
  if (showJoinPrompt) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100 p-4">
        <div className="bg-white rounded-2xl shadow-xl p-8 max-w-md w-full">
          <h2 className="text-2xl font-bold text-gray-800 mb-4">Join Game</h2>
          <p className="text-gray-600 mb-6">Enter your name to join this game</p>
          
          <input
            type="text"
            value={playerName}
            onChange={(e) => setPlayerName(e.target.value)}
            placeholder="Your name"
            className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none mb-4"
            onKeyPress={(e) => {
              if (e.key === 'Enter') {
                handleJoinSubmit();
              }
            }}
            autoFocus
          />
          
          <button
            onClick={handleJoinSubmit}
            disabled={joinGame.isPending}
            className="w-full bg-blue-500 hover:bg-blue-600 text-white font-semibold py-3 px-4 rounded-lg transition disabled:opacity-50"
          >
            {joinGame.isPending ? 'Joining...' : 'Join Game'}
          </button>

          <button
            onClick={() => navigate({ to: '/' })}
            className="w-full mt-3 bg-gray-200 hover:bg-gray-300 text-gray-700 font-semibold py-3 px-4 rounded-lg transition"
          >
            Cancel
          </button>
        </div>
      </div>
    );
  }

  const getStatusMessage = () => {
    if (game.winner === 'draw') {
      return "It's a draw!";
    }
    if (game.winner) {
      const winnerName = game.winner === 'X' ? game.playerXName : game.playerOName;
      return `${winnerName} wins!`;
    }
    const currentPlayerName = game.currentPlayer === 'X' ? game.playerXName : game.playerOName;
    return `${currentPlayerName || `Player ${game.currentPlayer}`}'s turn`;
  };

  const isMyTurn = myPlayerSymbol === game.currentPlayer;
  const canPlay = game.status === 'playing' && !game.winner;
  const waitingForPlayer = game.status === 'waiting' || !game.playerXName || !game.playerOName;

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 p-4 py-8">
      {/* Toast Notification */}
      {showToast && (
        <Toast
          message={toastMessage}
          type={toastType}
          onClose={() => setShowToast(false)}
        />
      )}

      <div className="max-w-4xl mx-auto">
        {/* Header with Home Button */}
        <div className="relative text-center mb-8">
          {/* Home Button - Absolute positioned top-left */}
          <button
            onClick={() => navigate({ to: '/' })}
            className="absolute left-0 top-0 flex items-center gap-2 px-4 py-2 text-gray-600 hover:text-gray-800 hover:bg-white rounded-lg transition"
            title="Go to Home"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
            </svg>
            <span className="hidden sm:inline">Home</span>
          </button>
          
          {/* Title */}
          <h1 className="text-4xl font-bold text-gray-800 mb-2">Tic-Tac-Toe</h1>
        </div>

        {/* Game Info Card */}
        <div className="bg-white rounded-2xl shadow-xl p-6 mb-6">
          {/* Player Stats - Compact */}
          {stats && hasJoined && (
            <div className="mb-4 flex items-center justify-center gap-4 text-xs">
              <div className="flex items-center gap-1">
                <span className="font-semibold text-green-600">{stats.wins}</span>
                <span className="text-gray-500">W</span>
              </div>
              <div className="w-px h-4 bg-gray-300"></div>
              <div className="flex items-center gap-1">
                <span className="font-semibold text-red-600">{stats.losses}</span>
                <span className="text-gray-500">L</span>
              </div>
              <div className="w-px h-4 bg-gray-300"></div>
              <div className="flex items-center gap-1">
                <span className="font-semibold text-yellow-600">{stats.draws}</span>
                <span className="text-gray-500">D</span>
              </div>
            </div>
          )}

          {/* Status Message */}
          <div className="text-center mb-6">
            <h2 className="text-2xl font-bold text-gray-800 mb-2">
              {getStatusMessage()}
            </h2>
            {waitingForPlayer && (
              <div className="bg-yellow-50 border border-yellow-200 text-yellow-800 px-4 py-2 rounded-lg inline-block">
                Waiting for another player to join...
              </div>
            )}
            {canPlay && isMyTurn && (
              <div className="bg-green-50 border border-green-200 text-green-800 px-4 py-2 rounded-lg inline-block">
                Your turn!
              </div>
            )}
          </div>

          {/* Players Info */}
          <div className="grid grid-cols-2 gap-4 mb-6">
            {/* Player X */}
            <div className={`p-4 rounded-lg border-2 ${game.currentPlayer === 'X' && canPlay ? 'border-blue-500 bg-blue-50' : 'border-gray-200 bg-gray-50'}`}>
              <div className="text-center">
                <div className="text-3xl font-bold text-blue-600 mb-2">X</div>
                <div className="text-sm text-gray-600">
                  {game.playerXName || 'Waiting...'}
                </div>
                {myPlayerSymbol === 'X' && (
                  <div className="mt-1 text-xs font-semibold text-blue-600">(You)</div>
                )}
              </div>
            </div>

            {/* Player O */}
            <div className={`p-4 rounded-lg border-2 ${game.currentPlayer === 'O' && canPlay ? 'border-red-500 bg-red-50' : 'border-gray-200 bg-gray-50'}`}>
              <div className="text-center">
                <div className="text-3xl font-bold text-red-600 mb-2">O</div>
                <div className="text-sm text-gray-600">
                  {game.playerOName || 'Waiting...'}
                </div>
                {myPlayerSymbol === 'O' && (
                  <div className="mt-1 text-xs font-semibold text-red-600">(You)</div>
                )}
              </div>
            </div>
          </div>

          {/* Copy Link Button (show when waiting) */}
          {waitingForPlayer && (
            <div className="text-center mb-4">
              <button
                onClick={handleCopyLink}
                className="inline-flex items-center px-6 py-3 bg-gradient-to-r from-green-500 to-green-600 hover:from-green-600 hover:to-green-700 text-white font-semibold rounded-lg transition shadow-md hover:shadow-lg"
              >
                <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
                </svg>
                Copy Game Link
              </button>
              <p className="text-sm text-gray-500 mt-2">Share this link with a friend to play</p>
            </div>
          )}

          {/* Game Board */}
          <div className="flex justify-center mb-6">
            <Board
              board={game.board}
              onCellClick={handleCellClick}
              disabled={!canPlay || !isMyTurn || makeMove.isPending}
            />
          </div>

          {/* Action Buttons */}
          <div className="flex justify-center gap-4">
            <button
              onClick={handleReset}
              disabled={requestReset.isPending || game.status === 'waiting' || !!game.resetRequestedBy}
              className="px-6 py-3 bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 text-white font-semibold rounded-lg transition disabled:opacity-50 disabled:cursor-not-allowed shadow-md hover:shadow-lg"
            >
              {game.resetRequestedBy === myPlayerSymbol ? 'Reset Requested...' : 'Request Reset'}
            </button>
            <button
              onClick={handleNewGameClick}
              disabled={waitingForPlayer}
              className="px-6 py-3 bg-gray-500 hover:bg-gray-600 text-white font-semibold rounded-lg transition shadow-md hover:shadow-lg disabled:opacity-50 disabled:cursor-not-allowed"
            >
              New Game
            </button>
          </div>

          {/* Error Message */}
          {makeMove.error && (
            <div className="mt-4 bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg text-center">
              {makeMove.error.message}
            </div>
          )}
        </div>
      </div>

      {/* New Game Modal */}
      {showNewGameModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-2xl shadow-2xl p-8 max-w-md w-full">
            <h2 className="text-2xl font-bold text-gray-800 mb-4">Start New Game</h2>
            <p className="text-gray-600 mb-6">Would you like to play again with the same opponent or find a new one?</p>
            
            <div className="space-y-3">
              {/* Play Again with Same Opponent */}
              <button
                onClick={handlePlayAgain}
                disabled={requestReset.isPending || !!game.resetRequestedBy}
                className="w-full flex items-center justify-center px-6 py-4 bg-gradient-to-r from-green-500 to-green-600 hover:from-green-600 hover:to-green-700 text-white font-semibold rounded-lg transition shadow-md hover:shadow-lg disabled:opacity-50"
              >
                <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                </svg>
                {game.resetRequestedBy ? 'Request Pending...' : `Play Again with ${game.playerXName === playerName ? game.playerOName : game.playerXName}`}
              </button>

              {/* New Opponent */}
              <button
                onClick={handleNewOpponent}
                disabled={createGame.isPending}
                className="w-full flex items-center justify-center px-6 py-4 bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 text-white font-semibold rounded-lg transition shadow-md hover:shadow-lg disabled:opacity-50"
              >
                <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18 9v3m0 0v3m0-3h3m-3 0h-3m-2-5a4 4 0 11-8 0 4 4 0 018 0zM3 20a6 6 0 0112 0v1H3v-1z" />
                </svg>
                Find New Opponent
              </button>

              {/* Cancel */}
              <button
                onClick={() => setShowNewGameModal(false)}
                className="w-full px-6 py-4 bg-gray-200 hover:bg-gray-300 text-gray-700 font-semibold rounded-lg transition"
              >
                Cancel
              </button>
            </div>

            {/* Info about play again */}
            <div className="mt-4 p-3 bg-blue-50 border border-blue-200 rounded-lg">
              <p className="text-sm text-blue-800">
                <strong>Play Again:</strong> Sends a request to your opponent. They must accept before the game resets.
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Reset Confirmation Modal */}
      {showResetConfirmModal && game && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-2xl shadow-2xl p-8 max-w-md w-full">
            <div className="text-center mb-6">
              <div className="w-16 h-16 bg-yellow-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <svg className="w-8 h-8 text-yellow-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                </svg>
              </div>
              <h2 className="text-2xl font-bold text-gray-800 mb-2">Reset Game Request</h2>
              <p className="text-gray-600">
                <strong>{game.resetRequestedBy === 'X' ? game.playerXName : game.playerOName}</strong> wants to reset the game and start fresh.
              </p>
            </div>
            
            <div className="space-y-3">
              {/* Accept */}
              <button
                onClick={handleConfirmReset}
                disabled={confirmReset.isPending}
                className="w-full flex items-center justify-center px-6 py-4 bg-gradient-to-r from-green-500 to-green-600 hover:from-green-600 hover:to-green-700 text-white font-semibold rounded-lg transition shadow-md hover:shadow-lg disabled:opacity-50"
              >
                <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
                {confirmReset.isPending ? 'Resetting...' : 'Accept & Reset Game'}
              </button>

              {/* Decline */}
              <button
                onClick={handleDenyReset}
                disabled={denyReset.isPending}
                className="w-full flex items-center justify-center px-6 py-4 bg-gradient-to-r from-red-500 to-red-600 hover:from-red-600 hover:to-red-700 text-white font-semibold rounded-lg transition shadow-md hover:shadow-lg disabled:opacity-50"
              >
                <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
                {denyReset.isPending ? 'Declining...' : 'Decline'}
              </button>
            </div>

            <div className="mt-4 p-3 bg-gray-50 border border-gray-200 rounded-lg">
              <p className="text-sm text-gray-600">
                Accepting will clear the board and start a new game. Your current game progress will be lost.
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
