# Render CLI Guide

## Overview

Render provides a CLI tool for managing services, deployments, and configuration from the command line.

## Installation

### Using npm (Recommended)
```bash
npm install -g @render-cli/render
```

### Using Homebrew (macOS)
```bash
brew tap render-oss/render
brew install render
```

### Using curl (Linux/macOS)
```bash
curl -sSL https://cli.render.com/install | bash
```

### Verify Installation
```bash
render version
```

## Authentication

### Login to Render
```bash
render login
```

This will:
1. Open your browser
2. Ask you to authorize the CLI
3. Store your credentials locally

### Using API Key (CI/CD)
```bash
export RENDER_API_KEY=your_api_key_here
```

Get your API key from: https://dashboard.render.com/u/settings

## Basic Commands

### List Services
```bash
# List all services
render services list

# List by type
render services list --type web
render services list --type static
render services list --type database
```

### Service Details
```bash
# Get service info
render services get <service-id>

# Get service logs
render logs <service-id>

# Follow logs in real-time
render logs <service-id> --follow
```

### Deployments

#### Trigger Deployment
```bash
# Deploy specific service
render deploy <service-id>

# Deploy with commit SHA
render deploy <service-id> --commit <sha>

# Deploy specific branch
render deploy <service-id> --branch main
```

#### List Deployments
```bash
render deployments list <service-id>
```

#### Deployment Status
```bash
render deployments get <deployment-id>
```

### Environment Variables

#### List Environment Variables
```bash
render env list <service-id>
```

#### Set Environment Variable
```bash
render env set <service-id> KEY=VALUE

# Set multiple
render env set <service-id> KEY1=VALUE1 KEY2=VALUE2
```

#### Delete Environment Variable
```bash
render env delete <service-id> KEY
```

### Service Management

#### Restart Service
```bash
render services restart <service-id>
```

#### Suspend Service
```bash
render services suspend <service-id>
```

#### Resume Service
```bash
render services resume <service-id>
```

## Configuration File (render.yaml)

Render supports Infrastructure as Code using `render.yaml`:

### Create render.yaml

```yaml
# render.yaml
services:
  # Backend Service
  - type: web
    name: tictactoe-backend
    runtime: node
    buildCommand: npm install && npm run build
    startCommand: npm run start:prod
    envVars:
      - key: NODE_ENV
        value: production
      - key: PORT
        value: 3001
      - key: DATABASE_URL
        fromDatabase:
          name: tictactoe-db
          property: connectionString
      - key: FRONTEND_URL
        sync: false
    rootDir: packages/backend

  # Frontend Service  
  - type: web
    name: tictactoe-frontend
    runtime: static
    buildCommand: npm install && npm run build
    staticPublishPath: ./dist
    envVars:
      - key: VITE_API_URL
        value: https://tictactoe-backend.onrender.com
      - key: VITE_WS_URL
        value: wss://tictactoe-backend.onrender.com
    rootDir: packages/frontend

databases:
  - name: tictactoe-db
    databaseName: tictactoe
    plan: free
```

### Using render.yaml

#### Initialize from render.yaml
```bash
# Deploy all services defined in render.yaml
render blueprint create
```

#### Update from render.yaml
```bash
# Update existing services
render blueprint update
```

#### Validate render.yaml
```bash
render blueprint validate
```

### Benefits of render.yaml
- ✅ Version control your infrastructure
- ✅ Reproducible deployments
- ✅ Easy to migrate between accounts
- ✅ Document your setup
- ✅ Deploy multiple services at once

## Useful CLI Workflows

### Quick Deploy Script

Create `deploy.sh`:
```bash
#!/bin/bash

# Get service IDs (replace with yours)
BACKEND_ID="srv-xxxxx"
FRONTEND_ID="srv-yyyyy"

echo "🚀 Deploying backend..."
render deploy $BACKEND_ID --branch main

echo "⏳ Waiting for backend..."
sleep 30

echo "🚀 Deploying frontend..."
render deploy $FRONTEND_ID --branch main

echo "✅ Deployment complete!"
```

### Check Logs Script

Create `check-logs.sh`:
```bash
#!/bin/bash

BACKEND_ID="srv-xxxxx"

echo "📋 Backend Logs:"
render logs $BACKEND_ID --tail 50
```

### Environment Variables Setup

Create `set-env.sh`:
```bash
#!/bin/bash

BACKEND_ID="srv-xxxxx"
FRONTEND_ID="srv-yyyyy"

echo "Setting backend environment variables..."
render env set $BACKEND_ID \
  NODE_ENV=production \
  DATABASE_URL=$DATABASE_URL \
  FRONTEND_URL=https://tictactoe-frontend.onrender.com

echo "Setting frontend environment variables..."
render env set $FRONTEND_ID \
  VITE_API_URL=https://tictactoe-backend.onrender.com \
  VITE_WS_URL=wss://tictactoe-backend.onrender.com

echo "✅ Environment variables set!"
```

## Get Service IDs

### From Dashboard
1. Go to https://dashboard.render.com
2. Click on a service
3. Look at URL: `https://dashboard.render.com/web/srv-xxxxx`
4. `srv-xxxxx` is your service ID

### Using CLI
```bash
# List all services with IDs
render services list --format json | jq '.[] | {name, id}'
```

## CI/CD Integration

### GitHub Actions Example

Create `.github/workflows/deploy.yml`:

```yaml
name: Deploy to Render

on:
  push:
    branches: [main]

jobs:
  deploy:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      
      - name: Install Render CLI
        run: npm install -g @render-cli/render
      
      - name: Deploy Backend
        env:
          RENDER_API_KEY: ${{ secrets.RENDER_API_KEY }}
        run: render deploy ${{ secrets.RENDER_BACKEND_ID }}
      
      - name: Wait for Backend
        run: sleep 60
      
      - name: Deploy Frontend
        env:
          RENDER_API_KEY: ${{ secrets.RENDER_API_KEY }}
        run: render deploy ${{ secrets.RENDER_FRONTEND_ID }}
```

Set secrets in GitHub:
- `RENDER_API_KEY`: Your Render API key
- `RENDER_BACKEND_ID`: Backend service ID
- `RENDER_FRONTEND_ID`: Frontend service ID

## Troubleshooting

### Authentication Issues

```bash
# Re-login
render logout
render login

# Check auth status
render whoami
```

### Service Not Found

```bash
# Make sure you're in the right account
render whoami

# List all services
render services list
```

### Deployment Failed

```bash
# Check deployment status
render deployments get <deployment-id>

# View logs
render logs <service-id> --tail 100
```

## Advanced: Render API

For more control, use the Render API directly:

### Using curl

```bash
# Get all services
curl -X GET https://api.render.com/v1/services \
  -H "Authorization: Bearer $RENDER_API_KEY"

# Trigger deploy
curl -X POST https://api.render.com/v1/services/<service-id>/deploys \
  -H "Authorization: Bearer $RENDER_API_KEY"

# Get environment variables
curl -X GET https://api.render.com/v1/services/<service-id>/env-vars \
  -H "Authorization: Bearer $RENDER_API_KEY"
```

### API Documentation
https://api-docs.render.com/

## Quick Reference

### Essential Commands

```bash
# Login
render login

# List services
render services list

# Deploy service
render deploy <service-id>

# View logs
render logs <service-id> --follow

# Set environment variable
render env set <service-id> KEY=VALUE

# Restart service
render services restart <service-id>
```

### For Your Tic-Tac-Toe App

```bash
# 1. Get your service IDs
render services list

# 2. Set backend environment
render env set <backend-id> \
  FRONTEND_URL=https://tictactoe-jd4g.onrender.com \
  NODE_ENV=production

# 3. Deploy backend
render deploy <backend-id>

# 4. Deploy frontend (after backend is ready)
render deploy <frontend-id>

# 5. Check logs
render logs <backend-id> --tail 50
```

## Comparison: CLI vs Dashboard

| Task | CLI | Dashboard |
|------|-----|-----------|
| Deploy | ✅ Fast | ✅ Visual feedback |
| Set env vars | ✅ Scriptable | ✅ Easier for many vars |
| View logs | ✅ Real-time follow | ✅ Better search/filter |
| Create service | ⚠️ Complex | ✅ Guided setup |
| CI/CD | ✅ Perfect | ❌ Manual only |
| Quick check | ⚠️ Need IDs | ✅ Visual overview |

## Best Practices

### ✅ Do:
- Use `render.yaml` for infrastructure as code
- Store service IDs in scripts/env vars
- Use CLI for deployments in CI/CD
- Keep API key secure
- Version control `render.yaml`

### ❌ Don't:
- Commit API keys to git
- Share API keys between team members
- Use CLI for initial setup (use dashboard)
- Hard-code service IDs in public repos

## Resources

- **CLI Documentation**: https://render.com/docs/cli
- **API Documentation**: https://api-docs.render.com/
- **render.yaml Reference**: https://render.com/docs/infrastructure-as-code
- **CLI GitHub**: https://github.com/render-oss/render-cli

## Summary

The Render CLI is great for:
- 🚀 Automated deployments
- 🔧 CI/CD pipelines
- 📝 Infrastructure as code
- 🔁 Batch operations
- 📊 Log monitoring

For your current CORS issue, you can use:

```bash
# 1. Login
render login

# 2. Find backend service ID
render services list

# 3. Set FRONTEND_URL
render env set <backend-id> FRONTEND_URL=https://tictactoe-jd4g.onrender.com

# 4. Redeploy
render deploy <backend-id>

# 5. Watch logs
render logs <backend-id> --follow
```

This will set the environment variable and trigger a redeployment automatically! 🎉
