# Quick Start Guide

## Get Running in 5 Minutes

### 1. Install dependencies
```bash
npm install
```

### 2. Set up PostgreSQL
```bash
# Create database
createdb tictactoe

# Or if using Docker
docker run --name tictactoe-db -e POSTGRES_PASSWORD=postgres -e POSTGRES_DB=tictactoe -p 5432:5432 -d postgres:15
```

### 3. Configure backend
```bash
cp packages/backend/.env.example packages/backend/.env
# Edit packages/backend/.env with your database credentials
```

### 4. Run migrations
```bash
npm run migrate --workspace=backend
```

### 5. Start the app
```bash
npm run dev
```

### 6. Open your browser
- Frontend: http://localhost:3000
- Backend API: http://localhost:3001

## Test Multiplayer

1. Open `http://localhost:3000` in one browser/tab
2. Enter your name (e.g., "Player 1")
3. Click "Create Game"
4. Copy the game link using the button
5. Open the link in another browser/tab or device (same network)
6. Enter a different name (e.g., "Player 2") and click join
7. Both players can now see each other's names and play!
8. X and O are randomly assigned to players

## Default Environment Variables

**Backend** (packages/backend/.env):
```env
PORT=3001
DATABASE_URL=postgresql://postgres:postgres@localhost:5432/tictactoe
NODE_ENV=development
```

**Frontend** (packages/frontend/.env):
```env
VITE_API_URL=http://localhost:3001
VITE_WS_URL=ws://localhost:3001
```

## Common Issues

**"Database connection failed"**
- Make sure PostgreSQL is running
- Check credentials in `.env` file

**"Port 3000 already in use"**
- Kill existing process: `lsof -ti:3000 | xargs kill`
- Or change port in `packages/frontend/vite.config.ts`

**WebSocket not connecting**
- Ensure backend is running first
- Check browser console for errors
