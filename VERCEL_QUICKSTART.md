# Vercel Deployment - Quick Start

## What You'll Need

1. **GitHub Account** - To host your code
2. **Vercel Account** - For frontend (free tier: https://vercel.com)
3. **Render Account** - For backend (free tier: https://render.com)
   - Alternative: Railway (https://railway.app)

## Quick Deployment Steps

### 1. Push to GitHub

```bash
git init
git add .
git commit -m "Initial commit"
git branch -M main
git remote add origin https://github.com/YOUR_USERNAME/tic-tac-toe.git
git push -u origin main
```

### 2. Deploy Backend (Render)

**Create Database:**
1. Go to https://dashboard.render.com/
2. New + → PostgreSQL
3. Name: `tictactoe-db`, Database: `tictactoe`, Plan: Free
4. Copy the **Internal Database URL**

**Create Backend Service:**
1. New + → Web Service
2. Connect GitHub repo
3. Settings:
   - Name: `tictactoe-backend`
   - Root Directory: `packages/backend`
   - Build Command: `npm install && npm run build`
   - Start Command: `npm run migrate && npm start`
4. Environment Variables:
   - `DATABASE_URL`: [paste Internal Database URL]
   - `NODE_ENV`: `production`
   - `FRONTEND_URL`: `https://YOUR-PROJECT.vercel.app` (update after Step 3)
5. Deploy → Copy your backend URL (e.g., `https://tictactoe-backend.onrender.com`)

### 3. Deploy Frontend (Vercel)

**Via Vercel Dashboard:**
1. Go to https://vercel.com/dashboard
2. Add New → Project
3. Import GitHub repo
4. Settings:
   - Build Command: `npm run build --workspace=frontend`
   - Output Directory: `packages/frontend/dist`
   - Install Command: `npm install`
5. Environment Variables:
   - `VITE_API_URL`: `https://tictactoe-backend.onrender.com` (your backend URL)
   - `VITE_WS_URL`: `wss://tictactoe-backend.onrender.com` (same, but with wss://)
6. Deploy → Copy your frontend URL

### 4. Update Backend CORS

Go back to Render dashboard:
1. Open your backend service
2. Update Environment Variable:
   - `FRONTEND_URL`: [paste your Vercel URL]
3. Save (will trigger redeploy)

### 5. Test!

Visit your Vercel URL and play!

## Important Notes

⚠️ **Free Tier Limitations:**
- Render free tier **sleeps after 15 minutes** of inactivity
- First request after sleep takes ~30 seconds to wake up
- Database has storage limits

💡 **Tips:**
- Use Internal Database URL on Render (faster)
- WebSocket requires `wss://` for HTTPS (not `ws://`)
- Environment variables starting with `VITE_` are exposed to frontend

## Troubleshooting

**"Cannot connect to backend"**
- Check VITE_API_URL is correct (https://, not http://)
- Check CORS: FRONTEND_URL must match your Vercel domain

**"WebSocket failed to connect"**
- Use `wss://` (not `ws://`) for your backend URL
- Check backend logs on Render

**"Database connection failed"**
- Verify DATABASE_URL is correct
- Use Internal Database URL for Render services

## Alternative: Railway Instead of Render

If you prefer Railway:

1. Go to https://railway.app/
2. New Project → Deploy from GitHub
3. Add PostgreSQL database
4. Configure backend service:
   - Root Directory: `packages/backend`
   - Build: `npm install && npm run build`
   - Start: `npm run migrate && npm start`
5. Environment variables:
   - `DATABASE_URL`: `${{Postgres.DATABASE_URL}}`
   - `NODE_ENV`: `production`
   - `FRONTEND_URL`: [your Vercel URL]

Railway advantages:
- Faster cold starts
- Better free tier ($5/month credit)
- No sleep after inactivity

## Cost Estimates

- **Vercel**: Free (100GB bandwidth/month)
- **Render**: Free (with sleep) or $7/month (no sleep)
- **Railway**: $5 credit/month on free tier

For production use, consider paid tiers for better performance.

## Next Steps

- [ ] Add custom domain
- [ ] Set up automatic deployments
- [ ] Add monitoring/logging
- [ ] Implement error tracking (Sentry)
- [ ] Add analytics
