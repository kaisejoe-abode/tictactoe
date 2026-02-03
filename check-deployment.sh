#!/bin/bash

# Deployment Readiness Check Script
# This script verifies your app is ready for deployment

echo "🔍 Checking deployment readiness..."
echo ""

# Color codes
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

ERRORS=0
WARNINGS=0

# Check if in correct directory
if [ ! -f "vercel.json" ]; then
    echo -e "${RED}❌ Not in project root directory${NC}"
    echo "   Please run from /Users/Joel/Code/tic_tac_toe"
    exit 1
fi

echo -e "${GREEN}✅ In correct directory${NC}"
echo ""

# Check Node.js
if command -v node &> /dev/null; then
    NODE_VERSION=$(node --version)
    echo -e "${GREEN}✅ Node.js installed: $NODE_VERSION${NC}"
else
    echo -e "${RED}❌ Node.js not installed${NC}"
    ERRORS=$((ERRORS+1))
fi

# Check npm
if command -v npm &> /dev/null; then
    NPM_VERSION=$(npm --version)
    echo -e "${GREEN}✅ npm installed: $NPM_VERSION${NC}"
else
    echo -e "${RED}❌ npm not installed${NC}"
    ERRORS=$((ERRORS+1))
fi

echo ""
echo "📦 Checking dependencies..."

# Check if node_modules exists
if [ -d "node_modules" ]; then
    echo -e "${GREEN}✅ Root dependencies installed${NC}"
else
    echo -e "${YELLOW}⚠️  Root dependencies not installed. Run: npm install${NC}"
    WARNINGS=$((WARNINGS+1))
fi

if [ -d "packages/backend/node_modules" ]; then
    echo -e "${GREEN}✅ Backend dependencies installed${NC}"
else
    echo -e "${YELLOW}⚠️  Backend dependencies not installed${NC}"
    WARNINGS=$((WARNINGS+1))
fi

if [ -d "packages/frontend/node_modules" ]; then
    echo -e "${GREEN}✅ Frontend dependencies installed${NC}"
else
    echo -e "${YELLOW}⚠️  Frontend dependencies not installed${NC}"
    WARNINGS=$((WARNINGS+1))
fi

echo ""
echo "🏗️  Testing builds..."

# Test backend build
echo -n "   Backend build... "
if npm run build --workspace=backend > /dev/null 2>&1; then
    echo -e "${GREEN}✅${NC}"
else
    echo -e "${RED}❌${NC}"
    ERRORS=$((ERRORS+1))
fi

# Test frontend build
echo -n "   Frontend build... "
if npm run build --workspace=frontend > /dev/null 2>&1; then
    echo -e "${GREEN}✅${NC}"
else
    echo -e "${RED}❌${NC}"
    ERRORS=$((ERRORS+1))
fi

echo ""
echo "📄 Checking configuration files..."

# Check required files
FILES=(
    "vercel.json"
    ".vercelignore"
    "packages/backend/.env.example"
    "packages/frontend/.env.example"
    "packages/backend/tsconfig.json"
    "packages/frontend/tsconfig.json"
)

for file in "${FILES[@]}"; do
    if [ -f "$file" ]; then
        echo -e "${GREEN}✅ $file${NC}"
    else
        echo -e "${RED}❌ $file missing${NC}"
        ERRORS=$((ERRORS+1))
    fi
done

echo ""
echo "🔐 Checking environment files..."

if [ -f "packages/backend/.env" ]; then
    echo -e "${GREEN}✅ Backend .env exists${NC}"
else
    echo -e "${YELLOW}⚠️  Backend .env not found (will need to set on Render)${NC}"
fi

if [ -f "packages/frontend/.env" ]; then
    echo -e "${GREEN}✅ Frontend .env exists${NC}"
else
    echo -e "${YELLOW}⚠️  Frontend .env not found (will need to set on Vercel)${NC}"
fi

echo ""
echo "📚 Checking documentation..."

DOCS=(
    "READY_TO_DEPLOY.md"
    "VERCEL_QUICKSTART.md"
    "DEPLOYMENT.md"
    "DEPLOYMENT_CHECKLIST.md"
)

for doc in "${DOCS[@]}"; do
    if [ -f "$doc" ]; then
        echo -e "${GREEN}✅ $doc${NC}"
    else
        echo -e "${YELLOW}⚠️  $doc missing${NC}"
        WARNINGS=$((WARNINGS+1))
    fi
done

echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""

if [ $ERRORS -eq 0 ] && [ $WARNINGS -eq 0 ]; then
    echo -e "${GREEN}🎉 All checks passed! You're ready to deploy!${NC}"
    echo ""
    echo "Next steps:"
    echo "1. git init && git add . && git commit -m 'Ready for deployment'"
    echo "2. Push to GitHub"
    echo "3. Follow VERCEL_QUICKSTART.md"
    exit 0
elif [ $ERRORS -eq 0 ]; then
    echo -e "${YELLOW}⚠️  Ready to deploy with $WARNINGS warning(s)${NC}"
    echo ""
    echo "You can proceed with deployment, but address warnings if needed."
    exit 0
else
    echo -e "${RED}❌ Found $ERRORS error(s) and $WARNINGS warning(s)${NC}"
    echo ""
    echo "Please fix errors before deploying."
    exit 1
fi
