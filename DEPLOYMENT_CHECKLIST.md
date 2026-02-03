# Pre-Deployment Checklist

Before deploying to Vercel and Render, complete these steps:

## ✅ Checklist

### Code Preparation
- [x] Frontend uses environment variables (VITE_API_URL, VITE_WS_URL)
- [x] Backend CORS configured with FRONTEND_URL
- [x] .gitignore includes .env files
- [x] vercel.json created
- [ ] All dependencies in package.json
- [ ] TypeScript compiles without errors

### Test Locally
```bash
# Terminal 1 - Backend
cd packages/backend
npm install
npm run dev

# Terminal 2 - Frontend  
cd packages/frontend
npm install
npm run dev
```

- [ ] Create game works
- [ ] Join game works
- [ ] Make moves works
- [ ] WebSocket updates work
- [ ] Play again works

### Git Setup
```bash
git init
git add .
git commit -m "Initial commit"
```

- [ ] Code committed to git
- [ ] GitHub repo created
- [ ] Code pushed to GitHub

### Accounts Created
- [ ] GitHub account
- [ ] Vercel account (https://vercel.com)
- [ ] Render account (https://render.com) OR Railway (https://railway.app)

### Backend Deployment (Render)
- [ ] PostgreSQL database created
- [ ] Internal Database URL copied
- [ ] Web service created
- [ ] Environment variables set:
  - [ ] DATABASE_URL
  - [ ] NODE_ENV=production
  - [ ] FRONTEND_URL (update after frontend deploy)
- [ ] Backend deployed successfully
- [ ] Backend URL copied (e.g., https://xxx.onrender.com)
- [ ] Test backend health endpoint: https://xxx.onrender.com/health

### Frontend Deployment (Vercel)
- [ ] Project imported from GitHub
- [ ] Build settings configured
- [ ] Environment variables set:
  - [ ] VITE_API_URL=https://xxx.onrender.com
  - [ ] VITE_WS_URL=wss://xxx.onrender.com
- [ ] Frontend deployed successfully
- [ ] Frontend URL copied (e.g., https://xxx.vercel.app)

### Final Configuration
- [ ] Backend FRONTEND_URL updated with Vercel URL
- [ ] Backend redeployed with new CORS settings
- [ ] Test full flow on production:
  - [ ] Create game
  - [ ] Join game (different browser/device)
  - [ ] Play game
  - [ ] WebSocket updates work

### Optional Enhancements
- [ ] Custom domain added to Vercel
- [ ] Automatic deployments from GitHub enabled
- [ ] Error monitoring setup (Sentry)
- [ ] Analytics added
- [ ] README updated with production URLs

## Environment Variables Summary

### Backend (.env on Render)
```
DATABASE_URL=postgresql://user:pass@host/tictactoe
NODE_ENV=production
FRONTEND_URL=https://your-project.vercel.app
```

### Frontend (Environment Variables on Vercel)
```
VITE_API_URL=https://tictactoe-backend.onrender.com
VITE_WS_URL=wss://tictactoe-backend.onrender.com
```

## Quick Commands

### Test Backend Build
```bash
cd packages/backend
npm install
npm run build
npm start
```

### Test Frontend Build
```bash
cd packages/frontend
npm install
npm run build
npm run preview
```

### Run Migrations Manually
```bash
cd packages/backend
npm run migrate
```

## Common Issues

**Build fails on Render**
- Check `packages/backend/tsconfig.json` exists
- Verify all imports are correct
- Check TypeScript compiles locally first

**CORS errors in production**
- FRONTEND_URL must exactly match Vercel domain (including https://)
- No trailing slash in URLs
- Redeploy backend after updating FRONTEND_URL

**WebSocket fails in production**
- Use `wss://` not `ws://` for secure connections
- Check firewall/network settings
- Verify WebSocket endpoint: wss://xxx.onrender.com/ws

**Database connection fails**
- Use Internal Database URL (not External) on Render
- Verify DATABASE_URL format: postgresql://user:pass@host:port/db
- Check database is in same region as backend service

## Need Help?

- Vercel docs: https://vercel.com/docs
- Render docs: https://render.com/docs
- Railway docs: https://docs.railway.app
