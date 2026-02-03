import { useEffect, useRef, useCallback } from 'react';
import { GameState } from './types';

const WS_URL = import.meta.env.VITE_WS_URL || 'ws://localhost:3001';

export const useWebSocket = (
  gameId: string | undefined,
  onGameUpdate: (gameState: GameState) => void
) => {
  const ws = useRef<WebSocket | null>(null);
  const reconnectTimeout = useRef<NodeJS.Timeout | null>(null);

  const connect = useCallback(() => {
    if (!gameId) return;

    try {
      ws.current = new WebSocket(`${WS_URL}/ws`);

      ws.current.onopen = () => {
        console.log('WebSocket connected');
        if (ws.current) {
          ws.current.send(JSON.stringify({ type: 'subscribe', gameId }));
        }
      };

      ws.current.onmessage = (event) => {
        try {
          const message = JSON.parse(event.data);
          if (message.type === 'game_update' && message.gameId === gameId) {
            onGameUpdate(message.data);
          }
        } catch (error) {
          console.error('Error parsing WebSocket message:', error);
        }
      };

      ws.current.onclose = () => {
        console.log('WebSocket disconnected');
        // Attempt to reconnect after 3 seconds
        reconnectTimeout.current = setTimeout(() => {
          console.log('Attempting to reconnect...');
          connect();
        }, 3000);
      };

      ws.current.onerror = (error) => {
        console.error('WebSocket error:', error);
      };
    } catch (error) {
      console.error('Error creating WebSocket:', error);
    }
  }, [gameId, onGameUpdate]);

  useEffect(() => {
    connect();

    return () => {
      if (reconnectTimeout.current) {
        clearTimeout(reconnectTimeout.current);
      }
      if (ws.current) {
        ws.current.close();
      }
    };
  }, [connect]);

  return ws.current;
};
