# Troubleshooting SPA Routing on Render Static Sites

## Current Issue

Direct URLs and page reloads still return 404 Not Found even after adding `_redirects` file.

## Root Cause Analysis

Render Static Sites have specific requirements for SPA routing that differ from regular static hosts.

## Solutions (Try in Order)

### Solution 1: Update Render Dashboard Settings

The most reliable method is to configure routing directly in Render Dashboard:

1. Go to **Render Dashboard** → Your Frontend Service
2. Click **"Settings"** (left sidebar)
3. Scroll to **"Redirects/Rewrites"** section
4. Click **"Add Rule"**
5. Configure:
   - **Source**: `/*`
   - **Destination**: `/index.html`
   - **Action**: `Rewrite` (not Redirect)
   - **Status**: `200`
6. Click **"Save Changes"**
7. Service will redeploy automatically

**This is the most reliable method for Render!**

### Solution 2: Create render.yaml in Repository Root

Create `/render.yaml` (in root, not in packages/frontend):

```yaml
services:
  - type: web
    name: tictactoe-frontend
    runtime: static
    buildCommand: cd packages/frontend && npm install && npm run build
    staticPublishPath: packages/frontend/dist
    
    routes:
      - type: rewrite
        source: /*
        destination: /index.html
```

Then:
1. Commit and push
2. In Render, go to **Blueprint** settings
3. Point to `render.yaml`
4. Redeploy

### Solution 3: Check Render Build Settings

Verify your Render service settings:

**Build Command:**
```bash
npm install && npm run build
```

**Publish Directory:**
```
dist
```

**Root Directory:**
```
packages/frontend
```

### Solution 4: Alternative _redirects Format

Some static hosts require different syntax. Try updating `packages/frontend/public/_redirects`:

**Option A: Netlify/Render format**
```
/*    /index.html   200
```

**Option B: Explicit format**
```
/game/*  /index.html  200
/*       /index.html  200
```

**Option C: With trailing slash**
```
/*/ /index.html 200
/*  /index.html 200
```

### Solution 5: Add Headers File

Create `packages/frontend/public/_headers`:

```
/*
  X-Frame-Options: DENY
  X-Content-Type-Options: nosniff

/index.html
  Cache-Control: no-cache
```

This ensures proper handling of index.html.

## Verification Steps

### Step 1: Verify File Exists After Build

```bash
cd packages/frontend
npm run build
ls -la dist/

# Should see:
# dist/_redirects
# dist/index.html
# dist/assets/
```

### Step 2: Check Render Build Log

In Render Dashboard → Frontend Service → Logs

Look for:
```
Building...
✓ dist/_redirects
✓ dist/index.html
Publishing to Render...
```

### Step 3: Test Direct File Access

```bash
# Test if _redirects is accessible
curl https://your-app.onrender.com/_redirects

# Should return:
/*    /index.html   200
```

### Step 4: Test Routing

```bash
# Should return HTML (not 404)
curl -I https://your-app.onrender.com/game/test

# Check status code:
HTTP/2 200  ← Should be 200
HTTP/2 404  ← Problem if this
```

## Common Issues

### Issue 1: _redirects Not in Published Directory

**Problem**: File in `public/` but not in `dist/`

**Solution**: Verify `vite.config.ts`:
```typescript
export default defineConfig({
  publicDir: 'public',  // ← Must be set
  // ...
});
```

### Issue 2: Render Using Wrong Publish Directory

**Problem**: Render looking in wrong place for files

**Solution**: 
1. Render Dashboard → Frontend Service → Settings
2. Check **"Publish Directory"** is set to `dist`
3. Check **"Root Directory"** is set to `packages/frontend`

### Issue 3: Old Build Cached

**Problem**: Old deployment without `_redirects`

**Solution**:
1. Render Dashboard → Frontend Service
2. Click **"Manual Deploy"** → **"Clear build cache & deploy"**
3. Wait for fresh deployment

### Issue 4: Wrong Service Type

**Problem**: Service is Web Service instead of Static Site

**Solution**: 
- Render Static Sites and Web Services handle files differently
- Verify service type is **"Static Site"** not **"Web Service"**
- If wrong, create new Static Site service

## Testing Locally

### Test with Production Build

```bash
cd packages/frontend
npm run build

# Install serve
npm install -g serve

# Serve with SPA support
serve dist -s

# Test: Open http://localhost:3000/game/test
# Should show app (not 404)
```

### Test with Vite Preview

```bash
cd packages/frontend
npm run build
npx vite preview

# Vite preview has built-in SPA fallback
# Test: Open http://localhost:4173/game/test
```

## Alternative: Client-Side Fallback

If server-side redirects don't work, add client-side fallback:

**Create `packages/frontend/public/404.html`:**

```html
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <title>Redirecting...</title>
  <script>
    // Redirect to index.html with path preserved
    sessionStorage.redirect = location.pathname + location.search;
    history.replaceState(null, null, '/');
  </script>
</head>
<body>Redirecting...</body>
</html>
```

**Update `packages/frontend/index.html`:**

```html
<script>
  // Check for redirect from 404
  (function() {
    var redirect = sessionStorage.redirect;
    delete sessionStorage.redirect;
    if (redirect && redirect !== location.pathname) {
      history.replaceState(null, null, redirect);
    }
  })();
</script>
```

⚠️ **Note**: This is a workaround, not ideal for SEO.

## Best Solution for Render

**The most reliable method is Dashboard Configuration:**

1. Render Dashboard → Service → Settings
2. Add Rewrite Rule: `/* → /index.html`
3. Action: Rewrite (not Redirect)
4. Save and redeploy

This overrides any file-based configuration and works 100% of the time.

## Debug Checklist

- [ ] `_redirects` file exists in `packages/frontend/public/`
- [ ] `_redirects` file copied to `dist/` after build
- [ ] Render service type is "Static Site"
- [ ] Publish directory is `dist`
- [ ] Root directory is `packages/frontend`
- [ ] Build command is `npm install && npm run build`
- [ ] Rewrite rule added in Render Dashboard
- [ ] Cache cleared and redeployed
- [ ] Tested with curl (returns 200, not 404)

## Contact Render Support

If none of these work:

1. Go to https://render.com/support
2. Provide:
   - Service name
   - Build logs
   - Expected vs actual behavior
3. Ask specifically about "SPA routing configuration"

They can check if there's a service-specific issue.

## Summary

**Recommended approach:**
1. ✅ Add `_redirects` file (already done)
2. ✅ Configure in Render Dashboard Settings
3. ✅ Add rewrite rule: `/* → /index.html`
4. ✅ Clear cache and redeploy

This combination ensures SPA routing works on Render! 🎉
