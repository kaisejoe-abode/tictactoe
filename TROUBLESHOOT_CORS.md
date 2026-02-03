# Troubleshooting CORS Errors on Render

## Common CORS Issues

### Problem: CORS error when connecting from frontend to backend

**Symptoms:**
```
Access to fetch at 'https://backend.onrender.com/api/games' from origin 'https://frontend.onrender.com' 
has been blocked by CORS policy: No 'Access-Control-Allow-Origin' header is present on the requested resource.
```

## Quick Fixes

### 1. Check FRONTEND_URL Environment Variable

**Verify it's set correctly in Render:**

1. Go to Render Dashboard → Backend Service → Environment
2. Check `FRONTEND_URL` value
3. Should be: `https://your-frontend-name.onrender.com`
4. **NO trailing slash!** ✅ `https://frontend.onrender.com` ❌ `https://frontend.onrender.com/`

**Common mistakes:**
- ❌ Has trailing slash: `https://frontend.onrender.com/`
- ❌ Using http instead of https: `http://frontend.onrender.com`
- ❌ Typo in domain name
- ❌ Variable not set at all

### 2. Check CORS Logs

The updated backend logs CORS information:

**In Render Logs, look for:**
```
Allowed CORS origins: [
  'http://localhost:3000',
  'http://localhost:5173',
  'http://localhost:4173',
  'https://your-frontend.onrender.com'
]
```

**If you see:**
```
CORS blocked origin: https://your-frontend.onrender.com
```

The origin is being blocked - check if it matches exactly (including https vs http).

### 3. Verify Frontend is Using Correct API URL

**Check frontend environment variables:**

1. Render Dashboard → Frontend Service → Environment
2. Verify `VITE_API_URL` is set to: `https://your-backend.onrender.com`
3. **NO trailing slash!**
4. **Must use https!**

### 4. Test with curl

```bash
# Test CORS preflight
curl -X OPTIONS https://your-backend.onrender.com/api/games \
  -H "Origin: https://your-frontend.onrender.com" \
  -H "Access-Control-Request-Method: POST" \
  -H "Access-Control-Request-Headers: Content-Type" \
  -v

# Should return:
# < access-control-allow-origin: https://your-frontend.onrender.com
# < access-control-allow-credentials: true
```

## Detailed Solutions

### Solution 1: Update FRONTEND_URL

**In Render Dashboard:**

1. Backend Service → Environment → Edit
2. Find `FRONTEND_URL`
3. Set to: `https://your-frontend-name.onrender.com` (copy exact URL from frontend service)
4. Click "Save Changes"
5. Backend will redeploy automatically

**Wait for redeployment** (~1-2 minutes), then test again.

### Solution 2: Check for Trailing Slashes

The updated CORS configuration now handles trailing slashes automatically:

```typescript
// Remove trailing slash from origin for comparison
const normalizedOrigin = origin.replace(/\/$/, '');
const normalizedAllowedOrigins = allowedOrigins.map(o => o.replace(/\/$/, ''));
```

This means both these will work:
- ✅ `https://frontend.onrender.com`
- ✅ `https://frontend.onrender.com/`

### Solution 3: Verify Environment Variable Loaded

**Check backend logs for:**
```
Allowed CORS origins: [...]
```

If `FRONTEND_URL` is not in the list, it means:
- Environment variable is not set
- dotenv didn't load it
- There's a typo in the variable name

**Fix:** Ensure exact variable name in Render: `FRONTEND_URL` (case-sensitive)

### Solution 4: Add Explicit Origin (Temporary Debug)

To quickly test if CORS is the issue, temporarily hardcode your frontend URL:

```typescript
const allowedOrigins = [
  'http://localhost:3000',
  'http://localhost:5173',
  'http://localhost:4173',
  process.env.FRONTEND_URL,
  'https://your-frontend.onrender.com', // ← Add explicit URL
].filter((origin): origin is string => Boolean(origin));
```

**Then:**
1. Commit and push
2. Wait for redeploy
3. Test if CORS error is gone
4. If it works, the issue was with `FRONTEND_URL` env var
5. Fix the env var and remove hardcoded URL

## Render-Specific Issues

### Issue 1: Service Not Fully Deployed

**Problem:** Frontend deployed before backend finished, grabbed old backend URL

**Solution:**
1. Ensure both services are fully deployed (green checkmark)
2. Check "Events" tab for any failed deployments
3. Manually redeploy if needed

### Issue 2: Multiple Deployments Running

**Problem:** Old deployment still running with old CORS config

**Solution:**
1. Backend → Events
2. Verify latest deployment is "Live"
3. If multiple are running, cancel old ones

### Issue 3: Custom Domain CORS

**Problem:** Using custom domain but CORS only allows Render domains

**Solution:**
Add custom domain to `FRONTEND_URL`:
```
FRONTEND_URL=https://yourdomain.com
```

Or add another environment variable:
```
FRONTEND_URL=https://your-frontend.onrender.com
CUSTOM_DOMAIN=https://yourdomain.com
```

Then update code:
```typescript
const allowedOrigins = [
  'http://localhost:3000',
  'http://localhost:5173',
  'http://localhost:4173',
  process.env.FRONTEND_URL,
  process.env.CUSTOM_DOMAIN,
].filter((origin): origin is string => Boolean(origin));
```

## Debugging Checklist

### Step 1: Check Backend Logs
```
Render Dashboard → Backend Service → Logs
```

Look for:
- [x] `Allowed CORS origins: [...]` - lists all allowed origins
- [x] `Server running on port 3001` - server started
- [x] No error messages about CORS

### Step 2: Check Frontend Environment
```
Render Dashboard → Frontend Service → Environment
```

Verify:
- [x] `VITE_API_URL=https://backend.onrender.com` (correct URL)
- [x] Using `https://` not `http://`
- [x] No trailing slash

### Step 3: Check Backend Environment
```
Render Dashboard → Backend Service → Environment
```

Verify:
- [x] `FRONTEND_URL=https://frontend.onrender.com` (correct URL)
- [x] Using `https://` not `http://`
- [x] Matches frontend URL exactly

### Step 4: Test CORS Manually

**Open browser console on frontend:**
```javascript
fetch('https://your-backend.onrender.com/health')
  .then(r => r.json())
  .then(console.log)
  .catch(console.error);
```

**Expected:** `{status: "ok"}`
**If CORS error:** Backend not allowing your origin

### Step 5: Test from Backend Logs

Look for blocked origins:
```
CORS blocked origin: https://some-origin.com
Allowed origins: [...]
```

## Common Mistakes

### ❌ Wrong Protocol
```
FRONTEND_URL=http://frontend.onrender.com  ← Should be https
```

### ❌ Trailing Slash
```
FRONTEND_URL=https://frontend.onrender.com/  ← Remove slash
```

### ❌ Wrong Service Name
```
FRONTEND_URL=https://tictactoe.onrender.com  ← Check actual URL
```

### ❌ Using External URL for Database
```
DATABASE_URL=postgresql://external-host...  ← Should use internal
```

### ❌ Variable Not Set
```
# Missing in Render environment variables
FRONTEND_URL=  ← Must set this!
```

## Testing CORS Configuration

### Test 1: Health Check (No CORS)
```bash
curl https://your-backend.onrender.com/health
```
**Expected:** `{"status":"ok"}`

### Test 2: CORS Preflight
```bash
curl -X OPTIONS https://your-backend.onrender.com/api/games \
  -H "Origin: https://your-frontend.onrender.com" \
  -H "Access-Control-Request-Method: POST" \
  -v 2>&1 | grep -i access-control
```
**Expected:**
```
< access-control-allow-origin: https://your-frontend.onrender.com
< access-control-allow-credentials: true
```

### Test 3: Actual Request
```bash
curl -X POST https://your-backend.onrender.com/api/games \
  -H "Origin: https://your-frontend.onrender.com" \
  -H "Content-Type: application/json" \
  -d '{"playerName":"Test"}' \
  -v 2>&1 | grep -i access-control
```
**Expected:** Should see `access-control-allow-origin` header

## Advanced: CORS for Multiple Domains

If you need to support multiple frontend domains:

```typescript
const allowedOrigins = [
  'http://localhost:3000',
  'http://localhost:5173',
  'http://localhost:4173',
  process.env.FRONTEND_URL,
  process.env.FRONTEND_URL_STAGING,
  process.env.CUSTOM_DOMAIN,
].filter((origin): origin is string => Boolean(origin));
```

Then set in Render:
```
FRONTEND_URL=https://prod-frontend.onrender.com
FRONTEND_URL_STAGING=https://staging-frontend.onrender.com
CUSTOM_DOMAIN=https://yourdomain.com
```

## Production CORS Best Practices

### ✅ Do:
- Use environment variables for origins
- Log allowed origins on startup
- Use https:// in production
- Remove trailing slashes
- Handle no-origin requests (mobile apps)
- Use specific origins, not wildcards

### ❌ Don't:
- Hardcode production URLs
- Use `origin: '*'` in production
- Allow http:// origins in production
- Forget to set `credentials: true`
- Use different domains without CORS config

## Summary

### Most Common Fix:
1. Go to Render Backend Service → Environment
2. Set `FRONTEND_URL=https://your-actual-frontend.onrender.com` (no trailing slash)
3. Click "Save Changes"
4. Wait for redeploy
5. Refresh your frontend

### Quick Debug:
Check backend logs for:
```
Allowed CORS origins: [...]
CORS blocked origin: ...
```

This will immediately tell you if:
- FRONTEND_URL is loaded correctly
- Which origin is being blocked
- What origins are allowed

The updated CORS configuration with logging should make it much easier to diagnose and fix CORS issues! 🎉
