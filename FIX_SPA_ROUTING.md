# Fix: SPA Routing on Render (404 Not Found)

## Problem

When deploying a Single Page Application (SPA) like our React app to Render, direct URLs like:
- `https://your-app.onrender.com/game/abc123`
- `https://your-app.onrender.com/any-route`

Return **404 Not Found** instead of loading the app.

## Why This Happens

### SPA vs Traditional Server Routing

**Traditional Server:**
- Browser requests `/game/abc123`
- Server looks for file at `/game/abc123`
- File doesn't exist → 404 error

**SPA (React + TanStack Router):**
- All routes handled by JavaScript in the browser
- Only `/index.html` exists on the server
- React Router parses `/game/abc123` and shows the correct component

### The Issue

When you:
1. Navigate within the app: ✅ Works (client-side routing)
2. Refresh the page: ❌ 404 (server tries to find file)
3. Open a link directly: ❌ 404 (server tries to find file)
4. Share a game link: ❌ 404 (server tries to find file)

## Solution: Redirect All Routes to index.html

We need to tell the server: "For any route that doesn't match a real file, serve `index.html` instead."

### Implementation

**File: `packages/frontend/public/_redirects`**

```
/*    /index.html   200
```

**What this does:**
- `/*` = Match all routes
- `/index.html` = Serve index.html
- `200` = Return 200 status (not 301/302 redirect)

This is called a "SPA fallback" or "history API fallback."

### How It Works

1. Browser requests `/game/abc123`
2. Render static server checks for file
3. File doesn't exist
4. Checks `_redirects` file
5. Matches `/*` rule
6. Serves `/index.html` with 200 status
7. React loads
8. TanStack Router reads `/game/abc123` from URL
9. Shows correct game page ✅

## Render Static Site Configuration

The `_redirects` file is automatically recognized by Render when placed in:
- `public/_redirects` (copied to dist during build)
- `dist/_redirects` (after build)

### How Vite Handles It

Vite automatically copies files from `public/` to `dist/` during build:

```
public/
  _redirects      → copied to →    dist/
                                    _redirects
                                    index.html
                                    assets/
```

## Verification

### Test Locally

1. Build the app:
   ```bash
   cd packages/frontend
   npm run build
   ```

2. Check `_redirects` was copied:
   ```bash
   ls dist/_redirects
   ```

3. Serve with a static server:
   ```bash
   npx serve dist
   ```

4. Open http://localhost:3000/game/test
5. Should show the app (not 404) ✅

### Test on Render

After deploying:

1. Go to `https://your-app.onrender.com`
2. Create a game
3. Copy the game link
4. Open in **new incognito tab**
5. Should load the game (not 404) ✅

## Alternative Redirect Formats

### Option 1: _redirects (Current - Render/Netlify Format)
```
/*    /index.html   200
```

### Option 2: render.yaml
```yaml
services:
  - type: web
    name: frontend
    runtime: static
    routes:
      - type: rewrite
        source: /*
        destination: /index.html
```

### Option 3: Vite Plugin (Local Dev)

For local development, Vite already handles this automatically via `vite.config.ts`.

## Common Issues

### Issue 1: _redirects Not Copied

**Problem:** File not in `dist/` after build

**Solution:** Ensure it's in `public/_redirects` before building

**Verify:**
```bash
ls packages/frontend/public/_redirects  # Should exist
npm run build
ls packages/frontend/dist/_redirects     # Should exist
```

### Issue 2: Still Getting 404

**Problem:** Old build deployed without `_redirects`

**Solution:**
1. Commit `public/_redirects`
2. Push to trigger new deployment
3. Verify in Render logs: "Copied _redirects"

### Issue 3: Works Locally, Not on Render

**Problem:** Local dev server has different behavior

**Solution:** Test with production build:
```bash
npm run build
npx serve dist
```

## Other Platforms

Different platforms use different methods:

### Netlify
Same as Render - uses `_redirects`:
```
/*    /index.html   200
```

### Vercel
Uses `vercel.json`:
```json
{
  "rewrites": [
    { "source": "/(.*)", "destination": "/index.html" }
  ]
}
```

### Apache (.htaccess)
```apache
<IfModule mod_rewrite.c>
  RewriteEngine On
  RewriteBase /
  RewriteRule ^index\.html$ - [L]
  RewriteCond %{REQUEST_FILENAME} !-f
  RewriteCond %{REQUEST_FILENAME} !-d
  RewriteRule . /index.html [L]
</IfModule>
```

### Nginx
```nginx
location / {
  try_files $uri $uri/ /index.html;
}
```

## Best Practices

### ✅ Do:
- Keep `_redirects` in `public/` folder
- Use 200 status (not 301/302)
- Test with production build locally
- Verify file copied to `dist/` after build

### ❌ Don't:
- Put `_redirects` in root directory
- Use redirect codes (301/302) for SPA fallback
- Forget to commit `public/_redirects`
- Mix client-side and server-side routing

## Debugging

### Check Build Output

Look for in Render logs:
```
Building...
✓ built in 2.3s
dist/index.html                   0.45 kB
dist/_redirects                   0.02 kB  ← Should see this
dist/assets/index-abc123.js       142.34 kB
```

### Test Specific Route

```bash
# Test with curl (should return HTML, not 404)
curl -I https://your-app.onrender.com/game/test

# Should see:
HTTP/2 200
content-type: text/html
```

### Browser DevTools

1. Open DevTools → Network tab
2. Navigate to `/game/abc123`
3. Check first request
4. Should be `200` for `index.html` (not 404)

## Related Files

- `packages/frontend/public/_redirects` - The redirect configuration
- `packages/frontend/vite.config.ts` - Build configuration
- `packages/frontend/src/router.tsx` - Client-side routing

## Summary

### The Fix
Create `packages/frontend/public/_redirects` with:
```
/*    /index.html   200
```

### What It Does
- Tells Render to serve `index.html` for all routes
- Lets React Router handle navigation
- Fixes 404 errors on direct URLs

### Result
✅ Direct links work
✅ Page refresh works
✅ Shared game links work
✅ Bookmarks work
✅ Browser back/forward works

This is a standard requirement for all SPAs deployed to static hosting! 🎉
