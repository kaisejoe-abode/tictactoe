# Deployment Guide

This guide will help you deploy your Tic-Tac-Toe app with the frontend on Vercel and backend on Render (or Railway).

## Architecture

- **Frontend**: Vercel (Static site with React + Vite)
- **Backend**: Render/Railway (Node.js + Express + WebSockets + PostgreSQL)

## Prerequisites

1. GitHub account
2. Vercel account (free)
3. Render account (free) or Railway account
4. Your code pushed to a GitHub repository

## Step 1: Push to GitHub

```bash
cd /Users/Joel/Code/tic_tac_toe
git init
git add .
git commit -m "Initial commit"
git branch -M main
git remote add origin https://github.com/YOUR_USERNAME/tic-tac-toe.git
git push -u origin main
```

## Step 2: Deploy Backend to Render

### 2.1 Create PostgreSQL Database on Render

1. Go to https://dashboard.render.com/
2. Click **New +** → **PostgreSQL**
3. Configure:
   - **Name**: `tictactoe-db`
   - **Database**: `tictactoe`
   - **User**: (auto-generated)
   - **Region**: Choose closest to you
   - **Plan**: Free
4. Click **Create Database**
5. Copy the **Internal Database URL** (or External if needed)

### 2.2 Create Web Service on Render

1. Click **New +** → **Web Service**
2. Connect your GitHub repository
3. Configure:
   - **Name**: `tictactoe-backend`
   - **Region**: Same as database
   - **Branch**: `main`
   - **Root Directory**: `packages/backend`
   - **Environment**: `Node`
   - **Build Command**: `npm install && npm run build`
   - **Start Command**: `npm run migrate && npm start`
   - **Plan**: Free

4. Add Environment Variables:
   - `DATABASE_URL`: (Paste the Internal Database URL from Step 2.1)
   - `NODE_ENV`: `production`
   - `PORT`: `3001` (Render will override this)

5. Click **Create Web Service**

6. Wait for deployment to complete. You'll get a URL like:
   `https://tictactoe-backend.onrender.com`

### 2.3 Update Backend for Production

Add this to your backend `package.json` scripts:

```json
{
  "scripts": {
    "start": "node dist/index.js"
  }
}
```

## Step 3: Deploy Frontend to Vercel

### 3.1 Install Vercel CLI (Optional)

```bash
npm install -g vercel
```

### 3.2 Deploy via Vercel Dashboard

1. Go to https://vercel.com/dashboard
2. Click **Add New** → **Project**
3. Import your GitHub repository
4. Configure:
   - **Framework Preset**: Vite
   - **Root Directory**: `.` (leave as is)
   - **Build Command**: `npm run build --workspace=frontend`
   - **Output Directory**: `packages/frontend/dist`
   - **Install Command**: `npm install`

5. Add Environment Variables:
   - `VITE_API_URL`: `https://tictactoe-backend.onrender.com`
   - `VITE_WS_URL`: `wss://tictactoe-backend.onrender.com`

6. Click **Deploy**

### 3.3 Update Frontend to Use Environment Variables

Make sure your `api.ts` and `useWebSocket.ts` use these environment variables:

```typescript
// In api.ts
const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001';

// In useWebSocket.ts
const WS_URL = import.meta.env.VITE_WS_URL || 'ws://localhost:3001';
```

## Step 4: Configure Backend CORS

Update your backend to allow your Vercel domain:

```typescript
// In packages/backend/src/index.ts
app.use(cors({
  origin: [
    'http://localhost:5173',
    'http://localhost:4173',
    'https://your-vercel-domain.vercel.app'
  ],
  credentials: true
}));
```

## Step 5: Test Your Deployment

1. Visit your Vercel URL: `https://your-project.vercel.app`
2. Create a game
3. Open another browser/incognito window
4. Join the game with the game ID
5. Play and verify WebSocket updates work

## Alternative: Railway (Instead of Render)

Railway is another great option:

1. Go to https://railway.app/
2. Click **New Project** → **Deploy from GitHub repo**
3. Select your repository
4. Add PostgreSQL database:
   - Click **New** → **Database** → **PostgreSQL**
5. Add environment variables in your backend service:
   - `DATABASE_URL`: `${{Postgres.DATABASE_URL}}` (Railway magic variable)
   - `NODE_ENV`: `production`
6. Configure build:
   - **Root Directory**: `packages/backend`
   - **Build Command**: `npm install && npm run build`
   - **Start Command**: `npm run migrate && npm start`

## Troubleshooting

### Backend Issues

- **WebSocket not connecting**: Ensure you're using `wss://` (not `ws://`) for HTTPS
- **Database connection fails**: Check DATABASE_URL is correct
- **CORS errors**: Add your Vercel domain to CORS origins

### Frontend Issues

- **API calls fail**: Check VITE_API_URL environment variable
- **Environment variables not working**: Make sure they start with `VITE_`
- **Build fails**: Check all dependencies are in package.json

### Render-Specific Issues

- **Cold starts**: Free tier sleeps after 15 mins of inactivity (first request takes ~30s)
- **Database connection**: Use Internal Database URL for faster connections

## Costs

- **Vercel**: Free tier includes 100GB bandwidth
- **Render**: Free tier for hobby projects (sleeps after inactivity)
- **Railway**: $5/month credit on free tier

## Next Steps

1. Add custom domain to Vercel
2. Set up automatic deployments from GitHub
3. Add environment-specific configurations
4. Set up monitoring and logging
5. Consider upgrading to paid tiers for production use
