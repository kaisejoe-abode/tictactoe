# Bug Fix: CORS Error - Failed to Fetch on Create Game

## Problem
When creating a new game locally, the frontend displayed a "failed to fetch" error. The backend was running correctly and responding to direct curl requests, but browser requests were being blocked.

## Root Cause
**CORS Configuration Mismatch**

The backend CORS configuration in `packages/backend/src/index.ts` only allowed:
- `http://localhost:5173` (default Vite port)
- `http://localhost:4173` (Vite preview port)

However, the frontend Vite configuration in `packages/frontend/vite.config.ts` explicitly set the dev server port to **3000**:
```typescript
server: {
  port: 3000,
  // ...
}
```

This caused a CORS policy violation:
```
Access to fetch at 'http://localhost:3001/api/games' from origin 'http://localhost:3000' 
has been blocked by CORS policy: No 'Access-Control-Allow-Origin' header present.
```

## Solution

Updated the backend CORS configuration to include `http://localhost:3000`:

**File: `packages/backend/src/index.ts`**

```typescript
// CORS configuration
const allowedOrigins = [
  'http://localhost:3000', // Vite dev server (default) ← ADDED
  'http://localhost:5173', // Vite dev server (alternate)
  'http://localhost:4173', // Vite preview
  process.env.FRONTEND_URL, // Production frontend URL
].filter((origin): origin is string => Boolean(origin));
```

## Why This Happened

The project was likely initially set up with Vite's default port (5173), but later the `vite.config.ts` was modified to use port 3000. The backend CORS configuration wasn't updated to match.

## Testing

After the fix, verify:

1. **Backend is running**: `npm run dev` in `packages/backend/`
2. **Frontend is running**: `npm run dev` in `packages/frontend/`
3. **Create game works**: Go to http://localhost:3000, enter name, click "Create New Game"
4. **No CORS errors**: Check browser console for errors

## How to Verify CORS is Working

### Method 1: Browser Console
Open browser DevTools (F12) → Network tab → Try creating a game → Check request headers:

**Request should include:**
```
Origin: http://localhost:3000
```

**Response should include:**
```
Access-Control-Allow-Origin: http://localhost:3000
```

### Method 2: Direct Test
```bash
curl -X POST http://localhost:3001/api/games \
  -H "Content-Type: application/json" \
  -H "Origin: http://localhost:3000" \
  -d '{"playerName": "Test"}' \
  -v 2>&1 | grep -i "access-control"
```

Should output:
```
< access-control-allow-origin: http://localhost:3000
< access-control-allow-credentials: true
```

## Future Prevention

### Option 1: Use Environment Variable
Update both frontend and backend to use a shared env variable:

**Frontend `.env`:**
```
VITE_PORT=3000
```

**Frontend `vite.config.ts`:**
```typescript
server: {
  port: parseInt(process.env.VITE_PORT || '3000'),
}
```

### Option 2: Wildcard for Development
For local development only, use wildcard CORS:

```typescript
app.use(cors({
  origin: process.env.NODE_ENV === 'production' 
    ? allowedOrigins 
    : true, // Allow all origins in development
  credentials: true,
}));
```

⚠️ **Warning**: Never use wildcard CORS in production!

### Option 3: Document Port Configuration
Add clear documentation in README about port configuration and CORS setup.

## Related Configuration

### Frontend Port
- **File**: `packages/frontend/vite.config.ts`
- **Setting**: `server.port = 3000`
- **URL**: http://localhost:3000

### Backend Port
- **File**: `packages/backend/.env`
- **Setting**: `PORT=3001`
- **URL**: http://localhost:3001

### CORS Origins
- **File**: `packages/backend/src/index.ts`
- **Setting**: `allowedOrigins` array
- **Must include**: All frontend URLs that will access the API

## Symptoms of CORS Issues

🚫 **Browser Console Errors:**
```
Access to fetch ... has been blocked by CORS policy
```

🚫 **Network Tab:**
- Request shows "CORS error"
- Status code may show (failed) or 0
- No response body visible

🚫 **Frontend Behavior:**
- "Failed to fetch" error messages
- Buttons appear to do nothing
- Network requests fail silently

✅ **Backend Logs:**
- May show no errors (CORS blocks happen browser-side)
- Direct curl/Postman requests work fine

## Resolution Status
✅ **Fixed** - Added `http://localhost:3000` to CORS allowed origins.

The backend will hot-reload automatically with `tsx watch`, so the fix is immediate.

## Testing Checklist

After applying this fix:
- [x] Backend runs without errors
- [x] Frontend runs on port 3000
- [ ] Create game works without errors
- [ ] Join game works without errors
- [ ] No CORS errors in browser console
- [ ] WebSocket connection establishes successfully

## Additional Notes

The Vite configuration also includes a proxy setup:
```typescript
proxy: {
  '/api': {
    target: 'http://localhost:3001',
    changeOrigin: true,
  },
}
```

This proxy is not being used because the frontend directly accesses `http://localhost:3001/api/*` via the `VITE_API_URL` environment variable. The proxy would only work if API calls used relative paths like `/api/games` instead of absolute URLs.

If you prefer to use the Vite proxy instead:
1. Change `api.ts` to use relative URLs: `const API_URL = '';`
2. Remove `http://localhost:3001` from all fetch calls
3. CORS configuration would still be needed for WebSocket connections
