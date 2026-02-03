import { WebSocketServer, WebSocket } from 'ws';
import { Server } from 'http';
import { GameState } from './game-logic';

let wss: WebSocketServer;
const gameSubscriptions = new Map<string, Set<WebSocket>>();

export const initWebSocket = (server: Server) => {
  wss = new WebSocketServer({ server, path: '/ws' });

  wss.on('connection', (ws: WebSocket) => {
    console.log('Client connected');

    ws.on('message', (message: string) => {
      try {
        const data = JSON.parse(message.toString());
        
        if (data.type === 'subscribe' && data.gameId) {
          // Subscribe to game updates
          if (!gameSubscriptions.has(data.gameId)) {
            gameSubscriptions.set(data.gameId, new Set());
          }
          gameSubscriptions.get(data.gameId)!.add(ws);
          console.log(`Client subscribed to game: ${data.gameId}`);
        } else if (data.type === 'unsubscribe' && data.gameId) {
          // Unsubscribe from game updates
          const subscribers = gameSubscriptions.get(data.gameId);
          if (subscribers) {
            subscribers.delete(ws);
            if (subscribers.size === 0) {
              gameSubscriptions.delete(data.gameId);
            }
          }
          console.log(`Client unsubscribed from game: ${data.gameId}`);
        }
      } catch (error) {
        console.error('Error handling message:', error);
      }
    });

    ws.on('close', () => {
      // Remove from all subscriptions
      gameSubscriptions.forEach((subscribers, gameId) => {
        subscribers.delete(ws);
        if (subscribers.size === 0) {
          gameSubscriptions.delete(gameId);
        }
      });
      console.log('Client disconnected');
    });

    ws.on('error', (error) => {
      console.error('WebSocket error:', error);
    });
  });

  console.log('WebSocket server initialized');
};

export const broadcastGameUpdate = (gameId: string, gameState: GameState) => {
  const subscribers = gameSubscriptions.get(gameId);
  if (!subscribers) return;

  const message = JSON.stringify({
    type: 'game_update',
    gameId,
    data: gameState,
  });

  subscribers.forEach((ws) => {
    if (ws.readyState === WebSocket.OPEN) {
      ws.send(message);
    }
  });

  console.log(`Broadcasted update to ${subscribers.size} clients for game ${gameId}`);
};
