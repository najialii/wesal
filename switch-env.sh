#!/bin/bash

# Environment Switcher Script
# Usage: ./switch-env.sh [local|production]

if [ $# -eq 0 ]; then
    echo "Usage: ./switch-env.sh [local|production]"
    echo ""
    echo "Current environment configuration:"
    echo "Frontend:"
    if [ -f "frontend/.env" ]; then
        grep "VITE_API_URL" frontend/.env
    else
        echo "  No .env file found"
    fi
    echo "Backend:"
    if [ -f "backend/wesaltech/.env" ]; then
        grep "APP_URL" backend/wesaltech/.env
        grep "APP_ENV" backend/wesaltech/.env
    else
        echo "  No .env file found"
    fi
    echo ""
    exit 1
fi

ENV=$1

case $ENV in
    "local")
        echo "🔄 Switching to LOCAL environment..."
        
        # Frontend
        if [ -f "frontend/.env.local" ]; then
            cp frontend/.env.local frontend/.env
            echo "✅ Frontend switched to local (http://localhost:8000/api)"
        else
            echo "❌ frontend/.env.local not found"
        fi
        
        # Backend
        if [ -f "backend/wesaltech/.env.local" ]; then
            cp backend/wesaltech/.env.local backend/wesaltech/.env
            echo "✅ Backend switched to local (http://localhost:8000)"
        else
            echo "❌ backend/wesaltech/.env.local not found"
        fi
        
        # Update TypeScript config
        if [ -f "frontend/src/config/environment.ts" ]; then
            sed -i 's/export const config = productionConfig;/export const config = localConfig;/' frontend/src/config/environment.ts
            echo "✅ TypeScript config switched to local"
        fi
        ;;
        
    "production")
        echo "🔄 Switching to PRODUCTION environment..."
        
        # Frontend
        if [ -f "frontend/.env.production" ]; then
            cp frontend/.env.production frontend/.env
            echo "✅ Frontend switched to production (https://wesaaltech.com/api)"
        else
            echo "❌ frontend/.env.production not found"
        fi
        
        # Backend
        if [ -f "backend/wesaltech/.env.production" ]; then
            cp backend/wesaltech/.env.production backend/wesaltech/.env
            echo "✅ Backend switched to production (https://wesaaltech.com)"
        else
            echo "❌ backend/wesaltech/.env.production not found"
        fi
        
        # Update TypeScript config
        if [ -f "frontend/src/config/environment.ts" ]; then
            sed -i 's/export const config = localConfig;/export const config = productionConfig;/' frontend/src/config/environment.ts
            echo "✅ TypeScript config switched to production"
        fi
        ;;
        
    *)
        echo "❌ Invalid environment. Use 'local' or 'production'"
        exit 1
        ;;
esac

echo ""
echo "📋 Current configuration:"
echo "Frontend (.env):"
if [ -f "frontend/.env" ]; then
    cat frontend/.env
else
    echo "  No .env file found"
fi

echo ""
echo "Backend (.env):"
if [ -f "backend/wesaltech/.env" ]; then
    head -10 backend/wesaltech/.env
    echo "  ... (truncated)"
else
    echo "  No .env file found"
fi

echo ""
echo "🔄 Remember to:"
echo "  - Restart your development servers if they're running"
echo "  - Clear cache if switching to production"
echo "  - Update database credentials in backend/.env if needed"