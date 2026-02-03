# Deploying Tic-Tac-Toe to Render

## Overview

Render fully supports WebSockets and can host your entire application:
- ✅ **Backend**: Node.js/Express with WebSocket support
- ✅ **Frontend**: Static site (Vite build)
- ✅ **Database**: PostgreSQL (managed database)

## Why Render?

- ✅ WebSocket support (unlike Vercel for WebSockets)
- ✅ Managed PostgreSQL database
- ✅ Free tier available
- ✅ Automatic deployments from Git
- ✅ SSL certificates included
- ✅ Simple environment variable management

## Prerequisites

1. GitHub account with your code pushed
2. Render account (free): https://render.com

## Deployment Steps

### 1. Create PostgreSQL Database

1. Go to https://dashboard.render.com/
2. Click **"New +"** → **"PostgreSQL"**
3. Configure:
   - **Name**: `tictactoe-db`
   - **Database**: `tictactoe`
   - **User**: (auto-generated)
   - **Region**: Choose closest to you
   - **Instance Type**: Free tier
4. Click **"Create Database"**
5. Wait for database to provision (~2 minutes)
6. Copy the **Internal Database URL** (starts with `postgresql://`)

### 2. Deploy Backend

1. Click **"New +"** → **"Web Service"**
2. Connect your GitHub repository
3. Configure:
   - **Name**: `tictactoe-backend`
   - **Region**: Same as database
   - **Branch**: `main`
   - **Root Directory**: `packages/backend`
   - **Runtime**: `Node`
   - **Build Command**: `npm install && npm run build`
   - **Start Command**: `npm run start:prod`
   - **Instance Type**: Free tier

4. **Environment Variables** (click "Advanced"):

   **Option 1: Using Connection String (Recommended)**
   ```
   NODE_ENV=production
   PORT=3001
   DATABASE_URL=<paste-internal-database-url-from-step-1>
   FRONTEND_URL=<will-add-after-frontend-deployment>
   ```

   **Option 2: Using Individual Credentials**
   ```
   NODE_ENV=production
   PORT=3001
   DB_HOST=<database-host>
   DB_PORT=5432
   DB_NAME=tictactoe
   DB_USER=<database-user>
   DB_PASSWORD=<database-password>
   FRONTEND_URL=<will-add-after-frontend-deployment>
   ```

   💡 **Tip**: For Render's managed PostgreSQL, use Option 1 (DATABASE_URL) as it's simpler and automatically provided.

5. Click **"Create Web Service"**
6. Wait for deployment (~3-5 minutes)
7. Copy your backend URL (e.g., `https://tictactoe-backend.onrender.com`)

### 3. Verify Database Migration

The backend will automatically run database migrations on startup using the `start:prod` script.

To verify tables were created successfully:

1. Go to your backend service dashboard
2. Click **"Logs"** tab
3. Look for:
   ```
   Running database migrations...
   ✅ Database migrations completed successfully!
   Server running on port 3001
   ```

If migrations fail, check:
- Database connection URL is correct
- Database is accessible from the backend
- Environment variables are set correctly

**Optional: Manual migration verification**

If needed, you can run migrations manually via Shell:

1. Click **"Shell"** (top right)
2. Run: `npm run migrate`
3. Verify: Look for "✅ Database migrations completed successfully!"

### 4. Deploy Frontend

1. Click **"New +"** → **"Static Site"**
2. Connect your GitHub repository
3. Configure:
   - **Name**: `tictactoe-frontend`
   - **Branch**: `main`
   - **Root Directory**: `packages/frontend`
   - **Build Command**: `npm install && npm run build`
   - **Publish Directory**: `dist`

4. **Environment Variables**:
   ```
   VITE_API_URL=https://tictactoe-backend.onrender.com
   VITE_WS_URL=wss://tictactoe-backend.onrender.com
   ```
   
   ⚠️ **Important**: Use `https://` for API and `wss://` for WebSocket!

5. Click **"Create Static Site"**
6. Wait for deployment (~2-3 minutes)
7. Copy your frontend URL (e.g., `https://tictactoe-frontend.onrender.com`)

### 5. Update Backend Environment

1. Go back to your backend service
2. Click **"Environment"** (left sidebar)
3. Add/Update:
   ```
   FRONTEND_URL=https://tictactoe-frontend.onrender.com
   ```
4. Click **"Save Changes"**
5. Backend will automatically redeploy

### 6. Update Backend CORS Configuration

Update `packages/backend/src/index.ts` to include production URLs:

```typescript
// CORS configuration
const allowedOrigins = [
  'http://localhost:3000',
  'http://localhost:5173',
  'http://localhost:4173',
  process.env.FRONTEND_URL, // Production frontend URL
  'https://tictactoe-frontend.onrender.com', // Explicit production URL
].filter((origin): origin is string => Boolean(origin));
```

Commit and push - both services will auto-deploy.

## Database Configuration

The backend supports two ways to configure database connection:

### Option 1: Connection String (Recommended)

Best for managed databases (Render, Heroku, Railway, etc.):

```env
DATABASE_URL=postgresql://user:password@host:5432/database
```

**Advantages:**
- ✅ Simple single variable
- ✅ Automatically provided by platforms
- ✅ Easy to copy/paste
- ✅ Includes all connection info

**How to get from Render:**
1. Dashboard → Databases → Your Database
2. Copy "Internal Database URL"
3. Paste into `DATABASE_URL` environment variable

### Option 2: Individual Credentials

Best for custom database setups or granular control:

```env
DB_HOST=your-db-host.com
DB_PORT=5432
DB_NAME=tictactoe
DB_USER=your_username
DB_PASSWORD=your_secure_password
```

**Advantages:**
- ✅ More granular control
- ✅ Easier to update individual values
- ✅ Better for some CI/CD pipelines

**How to get from Render:**
1. Dashboard → Databases → Your Database → Info tab
2. Copy individual values:
   - **Hostname** → `DB_HOST`
   - **Port** → `DB_PORT`
   - **Database** → `DB_NAME`
   - **Username** → `DB_USER`
   - **Password** → `DB_PASSWORD`

### How It Works

The backend (`packages/backend/src/db.ts`) checks for `DATABASE_URL` first:

```typescript
const pool = new Pool(
  process.env.DATABASE_URL
    ? {
        connectionString: process.env.DATABASE_URL,
      }
    : {
        host: process.env.DB_HOST || 'localhost',
        port: parseInt(process.env.DB_PORT || '5432'),
        database: process.env.DB_NAME || 'tictactoe',
        user: process.env.DB_USER,
        password: process.env.DB_PASSWORD,
      }
);
```

**Priority**: If `DATABASE_URL` is set, individual credentials are ignored.

## Project Structure for Render

Your repository should have this structure:

```
tic_tac_toe/
├── packages/
│   ├── backend/
│   │   ├── src/
│   │   ├── package.json
│   │   └── tsconfig.json
│   └── frontend/
│       ├── src/
│       ├── package.json
│       ├── vite.config.ts
│       └── index.html
├── package.json (root)
└── README.md
```

## Backend Production Configuration

### Update package.json

Add a production start script to `packages/backend/package.json`:

```json
{
  "scripts": {
    "dev": "tsx watch src/index.ts",
    "build": "tsc",
    "start": "node dist/index.js",
    "migrate": "node scripts/migrate.js"
  }
}
```

### Build TypeScript

Ensure your backend compiles TypeScript:

```bash
cd packages/backend
npm install --save-dev typescript @types/node
npx tsc --init
```

Update `tsconfig.json`:
```json
{
  "compilerOptions": {
    "target": "ES2020",
    "module": "commonjs",
    "outDir": "./dist",
    "rootDir": "./src",
    "strict": true,
    "esModuleInterop": true,
    "skipLibCheck": true,
    "forceConsistentCasingInFileNames": true
  },
  "include": ["src/**/*"],
  "exclude": ["node_modules"]
}
```

### Update Build and Start Commands

In Render backend settings:
- **Build Command**: `npm install && npm run build`
- **Start Command**: `npm run start:prod`

The `start:prod` script runs migrations before starting the server:
```json
{
  "scripts": {
    "start:prod": "npm run migrate && npm start"
  }
}
```

This ensures database tables are created/updated on every deployment.

## WebSocket Configuration

### Backend WebSocket Setup

Your current WebSocket setup should work on Render. Ensure `packages/backend/src/websocket.ts` listens on the HTTP server:

```typescript
import { Server } from 'ws';
import { Server as HTTPServer } from 'http';

export const initWebSocket = (server: HTTPServer) => {
  const wss = new Server({ server });
  
  wss.on('connection', (ws) => {
    console.log('Client connected');
    // ... your WebSocket logic
  });
  
  console.log('WebSocket server initialized');
  return wss;
};
```

### Frontend WebSocket Connection

Update `packages/frontend/src/useWebSocket.ts` to use the environment variable:

```typescript
const WS_URL = import.meta.env.VITE_WS_URL || 'ws://localhost:3001';

export const useWebSocket = (gameId: string | undefined, onUpdate: (game: GameState) => void) => {
  useEffect(() => {
    if (!gameId) return;

    const ws = new WebSocket(`${WS_URL}/`);
    
    ws.onopen = () => {
      ws.send(JSON.stringify({ type: 'subscribe', gameId }));
    };
    
    // ... rest of your WebSocket logic
  }, [gameId, onUpdate]);
};
```

## Testing the Deployment

### 1. Test Backend Health

```bash
curl https://tictactoe-backend.onrender.com/health
```

Expected:
```json
{"status":"ok"}
```

### 2. Test Database Connection

From backend shell in Render:
```bash
npm run migrate
```

Or test connection:
```bash
node -e "
const { Pool } = require('pg');
const pool = new Pool({ connectionString: process.env.DATABASE_URL });
pool.query('SELECT NOW()')
  .then(res => console.log('✅ Connected! Time:', res.rows[0].now))
  .catch(err => console.error('❌ Error:', err.message));
"
```

### 3. Test WebSocket

Open browser console on frontend:
```javascript
const ws = new WebSocket('wss://tictactoe-backend.onrender.com');
ws.onopen = () => console.log('✅ WebSocket connected!');
ws.onerror = (e) => console.error('❌ WebSocket error:', e);
```

### 4. Test Full Flow

1. Go to frontend URL
2. Create a game
3. Copy game link
4. Open in incognito/another browser
5. Join game
6. Play a few moves
7. Verify real-time updates work

## Troubleshooting

### Backend Won't Start

**Check logs**: Backend service → Logs tab

Common issues:
- Missing environment variables
- Database connection failed
- Port binding error (ensure using `process.env.PORT`)
- TypeScript build errors

### WebSocket Not Connecting

**Symptoms**: Game updates don't sync in real-time

**Fixes**:
1. Check `VITE_WS_URL` uses `wss://` (not `ws://`)
2. Verify backend WebSocket server initialized
3. Check CORS includes production frontend URL
4. Test WebSocket manually (see Testing section)

### CORS Errors

**Symptoms**: "blocked by CORS policy"

**Fixes**:
1. Add frontend URL to `allowedOrigins` in `backend/src/index.ts`
2. Ensure `FRONTEND_URL` environment variable is set
3. Redeploy backend after changes

### Database Connection Error

**Symptoms**: "Connection refused" or "ECONNREFUSED"

**Fixes**:
1. Use **Internal Database URL** (not External)
2. Ensure database is in same region as backend
3. Check database environment variables:
   - If using `DATABASE_URL`: Verify it's the internal URL from Render
   - If using individual credentials: Check `DB_HOST`, `DB_USER`, `DB_PASSWORD`, etc.
4. Verify database is running (check Render dashboard)
5. Test connection from backend shell:
   ```bash
   node -e "
   const { Pool } = require('pg');
   const pool = new Pool({ connectionString: process.env.DATABASE_URL });
   pool.query('SELECT NOW()')
     .then(() => console.log('✅ Connected!'))
     .catch(err => console.error('❌ Error:', err.message));
   "
   ```

### Build Failures

**Frontend Build Fails**:
- Check `vite.config.ts` is correct
- Ensure all dependencies in `package.json`
- Verify build works locally: `npm run build`

**Backend Build Fails**:
- Check TypeScript compiles: `npm run build`
- Verify `tsconfig.json` is correct
- Ensure `dist/` is in `.gitignore` but built on Render

## Render Free Tier Limitations

### Web Services (Backend)
- ⏰ Spins down after 15 minutes of inactivity
- 🐌 Cold start: 30-60 seconds to wake up
- 💾 512 MB RAM
- ⚡ Shared CPU

### Static Sites (Frontend)
- ✅ Always on (no spin down)
- ✅ Global CDN
- ✅ Fast response times

### Database
- 💾 256 MB storage
- 🔗 Limited connections
- ⏱️ Expires after 90 days (need to keep active)

### Upgrading

For production use, consider paid tiers:
- **Backend**: $7/month (always on, more resources)
- **Database**: $7/month (persistent, more storage)

## Custom Domain (Optional)

### Add Custom Domain

1. Buy domain from registrar (Namecheap, Google Domains, etc.)
2. In Render dashboard:
   - Frontend service → Settings → Custom Domain
   - Add: `yourdomain.com`
3. Add DNS records at your registrar:
   ```
   Type  Name  Value
   CNAME www   <render-provided-value>
   CNAME @     <render-provided-value>
   ```
4. SSL certificate auto-provisioned

### Update Environment Variables

After adding custom domain:

**Backend**:
```
FRONTEND_URL=https://yourdomain.com
```

**Frontend**:
```
VITE_API_URL=https://api.yourdomain.com
VITE_WS_URL=wss://api.yourdomain.com
```

## Monitoring

### Render Dashboard

- **Metrics**: CPU, Memory, Request count
- **Logs**: Real-time application logs
- **Events**: Deployments, crashes, scaling

### Set Up Alerts

1. Service → Settings → Notifications
2. Add email for:
   - Deploy failures
   - Service crashes
   - Health check failures

## CI/CD Pipeline

Render auto-deploys on Git push:

1. Push to `main` branch
2. Render detects changes
3. Runs build command
4. Deploys new version
5. Health check validates
6. Switches traffic to new version

### Manual Deploy

Dashboard → Service → Manual Deploy → "Deploy latest commit"

### Rollback

Dashboard → Service → Events → Select previous deploy → "Rollback"

## Cost Estimate

### Free Tier (Development)
- Backend: Free (with spin down)
- Frontend: Free
- Database: Free (90 days)
- **Total**: $0/month

### Production Tier
- Backend: $7/month (Starter)
- Frontend: Free
- Database: $7/month (Starter)
- **Total**: $14/month

### Comparison with Other Platforms

| Platform | Backend | Frontend | Database | WebSockets | Total |
|----------|---------|----------|----------|------------|-------|
| Render | $7 | Free | $7 | ✅ | $14/mo |
| Heroku | $7 | $5 | $9 | ✅ | $21/mo |
| Railway | $5 | $5 | $5 | ✅ | $15/mo |
| Vercel | ❌ | Free | External | ❌ | N/A |
| Netlify | ❌ | Free | External | ❌ | N/A |

## Complete Checklist

### Pre-Deployment
- [ ] Code pushed to GitHub
- [ ] Environment variables documented
- [ ] Database migration script tested
- [ ] Build works locally
- [ ] TypeScript compiles without errors

### Database
- [ ] PostgreSQL created on Render
- [ ] Internal Database URL or individual credentials copied
- [ ] Migration script ready

### Backend
- [ ] Web service created
- [ ] Environment variables set (DATABASE_URL or DB_* credentials)
- [ ] Build command: `npm install && npm run build`
- [ ] Start command: `npm run start:prod` (includes automatic migration)
- [ ] Deployment logs show successful migration
- [ ] Health endpoint returns 200

### Frontend
- [ ] Static site created
- [ ] Environment variables set (VITE_API_URL, VITE_WS_URL)
- [ ] Build command: `npm install && npm run build`
- [ ] Publish directory: `dist`
- [ ] Site loads without errors

### Integration
- [ ] Backend FRONTEND_URL updated
- [ ] CORS configured correctly
- [ ] WebSocket connects successfully
- [ ] Game creation works
- [ ] Game joining works
- [ ] Real-time updates work
- [ ] Stats display correctly

### Optional
- [ ] Custom domain configured
- [ ] SSL certificate active
- [ ] Monitoring alerts set up
- [ ] Error tracking configured

## Support Resources

- **Render Docs**: https://render.com/docs
- **WebSocket Guide**: https://render.com/docs/websockets
- **Node.js Guide**: https://render.com/docs/deploy-node-express-app
- **Static Sites**: https://render.com/docs/static-sites
- **Community**: https://community.render.com

## Summary

Render is an excellent choice for your tic-tac-toe app because:

✅ Full WebSocket support (unlike Vercel)
✅ Managed PostgreSQL included
✅ Flexible database configuration (connection string or individual credentials)
✅ Simple monorepo deployment
✅ Free tier for testing
✅ Auto-deployment from Git
✅ Built-in SSL certificates
✅ No serverless limitations

The free tier is perfect for development and demos. Upgrade to paid tiers ($14/month) when you're ready for production.
