import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { api } from './api';
import { GameState, MoveRequest, CreateGameRequest, JoinGameRequest, PlayerStats } from './types';

export const useCreateGame = () => {
  return useMutation({
    mutationFn: (data: CreateGameRequest) => api.createGame(data),
  });
};

export const useJoinGame = (gameId: string) => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: JoinGameRequest) => api.joinGame(gameId, data),
    onSuccess: (data) => {
      queryClient.setQueryData(['game', gameId], data);
    },
  });
};

export const useGame = (gameId: string | undefined) => {
  return useQuery<GameState>({
    queryKey: ['game', gameId],
    queryFn: () => api.getGame(gameId!),
    enabled: !!gameId,
    refetchInterval: 2000, // Poll every 2 seconds as fallback
  });
};

export const useMakeMove = (gameId: string) => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (move: MoveRequest) => api.makeMove(gameId, move),
    onSuccess: (data) => {
      queryClient.setQueryData(['game', gameId], data);
    },
  });
};

export const useResetGame = (gameId: string) => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: () => api.resetGame(gameId),
    onSuccess: (data) => {
      queryClient.setQueryData(['game', gameId], data);
    },
  });
};

export const useRequestReset = (gameId: string) => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (player: 'X' | 'O') => api.requestReset(gameId, player),
    onSuccess: (data) => {
      queryClient.setQueryData(['game', gameId], data);
    },
  });
};

export const useConfirmReset = (gameId: string) => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: () => api.confirmReset(gameId),
    onSuccess: (data) => {
      queryClient.setQueryData(['game', gameId], data);
    },
  });
};

export const useDenyReset = (gameId: string) => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: () => api.denyReset(gameId),
    onSuccess: (data) => {
      queryClient.setQueryData(['game', gameId], data);
    },
  });
};

export const usePlayerStats = (playerName: string | undefined) => {
  return useQuery<PlayerStats>({
    queryKey: ['playerStats', playerName],
    queryFn: () => api.getPlayerStats(playerName!),
    enabled: !!playerName && playerName.trim().length > 0,
    staleTime: 5000, // Consider data fresh for 5 seconds
  });
};
