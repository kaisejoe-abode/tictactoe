# Tic-Tac-Toe Multiplayer Game

A real-time multiplayer Tic-Tac-Toe web application supporting Player vs Player over the internet.

## Tech Stack

- **Frontend**: React, TypeScript, TanStack Router, TanStack Query, Vite
- **Backend**: Node.js, Express, TypeScript, WebSocket
- **Database**: PostgreSQL
- **Architecture**: Monorepo with npm workspaces

## Features

- ✅ Player name registration
- ✅ Create and join games via shareable links
- ✅ Real-time updates using WebSockets (with polling fallback)
- ✅ Player vs Player multiplayer across devices
- ✅ Random X/O assignment for first player
- ✅ Display player names and turn indicators
- ✅ Full game rule enforcement (turns, illegal moves, win/draw detection)
- ✅ Modern UI with Tailwind CSS
- ✅ Game reset functionality

## Project Structure

```
tic_tac_toe/
├── packages/
│   ├── backend/          # Express API + WebSocket server
│   │   ├── src/
│   │   │   ├── index.ts       # Server entry point
│   │   │   ├── routes.ts      # API routes
│   │   │   ├── websocket.ts   # WebSocket logic
│   │   │   ├── game-logic.ts  # Game rules & validation
│   │   │   └── db.ts          # Database connection
│   │   └── scripts/
│   │       └── migrate.js     # Database migrations
│   └── frontend/         # React SPA
│       ├── src/
│       │   ├── components/    # React components
│       │   ├── routes/        # TanStack Router routes
│       │   ├── api.ts         # API client
│       │   ├── queries.ts     # TanStack Query hooks
│       │   └── useWebSocket.ts # WebSocket hook
│       └── vite.config.ts
└── package.json          # Root workspace config
```

## Prerequisites

- Node.js 18+ and npm
- PostgreSQL 12+

## Setup Instructions

### 1. Clone the repository

```bash
git clone <repository-url>
cd tic_tac_toe
```

### 2. Install dependencies

```bash
npm install
```

This will install dependencies for both frontend and backend packages.

### 3. Set up PostgreSQL database

Create a PostgreSQL database:

```bash
# Using psql
createdb tictactoe

# Or using PostgreSQL client
psql -U postgres
CREATE DATABASE tictactoe;
```

### 4. Configure environment variables

**Backend** (`packages/backend/.env`):

```bash
cp packages/backend/.env.example packages/backend/.env
```

Edit `packages/backend/.env`:

```env
PORT=3001
DATABASE_URL=postgresql://username:password@localhost:5432/tictactoe
NODE_ENV=development
```

Replace `username` and `password` with your PostgreSQL credentials.

**Frontend** (`packages/frontend/.env`):

```bash
cp packages/frontend/.env.example packages/frontend/.env
```

The defaults should work for local development:

```env
VITE_API_URL=http://localhost:3001
VITE_WS_URL=ws://localhost:3001
```

### 5. Run database migrations

```bash
npm run migrate --workspace=backend
```

This creates the `games` table in your database.

### 6. Start the development servers

```bash
npm run dev
```

This starts both backend (port 3001) and frontend (port 3000) concurrently.

Alternatively, run them separately:

```bash
# Terminal 1 - Backend
npm run dev:backend

# Terminal 2 - Frontend
npm run dev:frontend
```

### 7. Access the application

Open your browser and go to: `http://localhost:3000`

## How to Play

1. **Enter your name**: On the home page, enter your player name
2. **Create a game**: Click "Create New Game" button
3. **Share the link**: Copy the game URL and share it with another player
4. **Wait for opponent**: The game displays a "waiting" status until the second player joins
5. **Join the game**: The other player opens the link and enters their name to join
6. **Play**: X/O assignment is randomized - the game shows whose turn it is
7. **Take turns**: Click on empty cells to place your mark
8. **Win or draw**: The game detects wins and draws automatically
9. **Play again**: Click "Reset Game" to start a new round

## Game Rules

- 3×3 board, X always goes first
- X or O assignment is randomized when creating a game
- Players must take turns (enforced by server)
- Cannot place a mark on an occupied cell
- Cannot move when game is finished or not your turn
- Win conditions: 3 in a row (horizontal, vertical, or diagonal)
- Draw: All cells filled with no winner

## API Endpoints

- `POST /api/games` - Create a new game (requires `playerName`)
- `POST /api/games/:id/join` - Join an existing game (requires `playerName`)
- `GET /api/games/:id` - Get game state
- `POST /api/games/:id/move` - Make a move
- `POST /api/games/:id/reset` - Reset the game
- `GET /health` - Health check

## WebSocket Events

- Client → Server: `{ type: 'subscribe', gameId: 'xxx' }`
- Server → Client: `{ type: 'game_update', gameId: 'xxx', data: GameState }`

## Deployment

### Backend Deployment

The backend can be deployed to any platform supporting Node.js and PostgreSQL:

**Render/Railway/Fly.io/Heroku:**

1. Create a PostgreSQL database instance
2. Set environment variables:
   - `DATABASE_URL`: PostgreSQL connection string
   - `PORT`: Server port (usually provided by platform)
   - `NODE_ENV=production`
3. Build command: `npm run build --workspace=backend`
4. Start command: `npm run start --workspace=backend`
5. Run migrations: `npm run migrate --workspace=backend`

### Frontend Deployment

The frontend can be deployed to Vercel, Netlify, or similar:

**Vercel/Netlify:**

1. Set build settings:
   - Build command: `npm run build --workspace=frontend`
   - Output directory: `packages/frontend/dist`
2. Set environment variables:
   - `VITE_API_URL`: Your backend URL (e.g., `https://your-api.onrender.com`)
   - `VITE_WS_URL`: Your WebSocket URL (e.g., `wss://your-api.onrender.com`)

**Important**: Update CORS settings in `packages/backend/src/index.ts` to allow your frontend domain.

### Example Deployment Configuration

**Render (backend):**

```yaml
services:
  - type: web
    name: tictactoe-backend
    env: node
    buildCommand: npm install && npm run build --workspace=backend
    startCommand: npm run start --workspace=backend
    envVars:
      - key: DATABASE_URL
        fromDatabase:
          name: tictactoe-db
          property: connectionString
```

**Vercel (frontend):**

```json
{
  "buildCommand": "npm run build --workspace=frontend",
  "outputDirectory": "packages/frontend/dist",
  "installCommand": "npm install"
}
```

## Architecture Notes

### Real-time Updates

The app uses a hybrid approach for real-time updates:

1. **WebSocket (Primary)**: Instant updates when moves are made
2. **Polling (Fallback)**: 2-second polling as backup if WebSocket fails

### Scaling to Player vs Computer (PvC)

To add PvC mode:

1. Add a game mode field to the database (`mode: 'pvp' | 'pvc'`)
2. Create an AI service (`packages/backend/src/ai.ts`) with algorithms:
   - Easy: Random valid moves
   - Medium: Basic minimax with limited depth
   - Hard: Full minimax with alpha-beta pruning
3. Modify the move endpoint to check if it's the computer's turn
4. Auto-trigger computer moves after human moves
5. Add UI to select PvP vs PvC mode on game creation

Example AI integration:

```typescript
// In routes.ts, after player move:
if (game.mode === 'pvc' && !newWinner) {
  const aiMove = await getAIMove(board, difficulty);
  // Make AI move automatically
}
```

## Development Commands

```bash
# Install dependencies
npm install

# Run both servers
npm run dev

# Run backend only
npm run dev:backend

# Run frontend only
npm run dev:frontend

# Build for production
npm run build

# Run database migration
npm run migrate --workspace=backend
```

## Troubleshooting

**Database connection issues:**
- Verify PostgreSQL is running: `pg_isready`
- Check credentials in `.env` file
- Ensure database exists: `psql -l`

**WebSocket connection fails:**
- Check if backend is running on correct port
- Verify `VITE_WS_URL` in frontend `.env`
- Check browser console for errors

**Port already in use:**
- Change `PORT` in backend `.env`
- Change port in `vite.config.ts` for frontend

## License

MIT
