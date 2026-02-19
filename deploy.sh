#!/bin/bash
set -e

echo "🚀 WesalTech Deployment Script"
echo "================================"

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Configuration
BACKEND_DIR="backend"
FRONTEND_DIR="frontend"

# Check if we're in the right directory
if [ ! -d "$BACKEND_DIR" ] || [ ! -d "$FRONTEND_DIR" ]; then
    echo -e "${RED}Error: Backend or Frontend directory not found!${NC}"
    exit 1
fi

echo -e "${YELLOW}Step 1: Backend Deployment${NC}"
cd $BACKEND_DIR

# Install dependencies
echo "Installing backend dependencies..."
composer install --no-dev --optimize-autoloader

# Run migrations
echo "Running database migrations..."
php artisan migrate --force

# Clear and cache
echo "Caching configuration..."
php artisan config:cache
php artisan route:cache
php artisan view:cache

# Storage link
echo "Creating storage symlink..."
php artisan storage:link

cd ..

echo -e "${GREEN}✓ Backend deployed successfully${NC}"

echo -e "${YELLOW}Step 2: Frontend Build${NC}"
cd $FRONTEND_DIR

# Install dependencies
echo "Installing frontend dependencies..."
npm install

# Build
echo "Building frontend..."
npm run build

cd ..

echo -e "${GREEN}✓ Frontend built successfully${NC}"

echo ""
echo -e "${GREEN}================================${NC}"
echo -e "${GREEN}Deployment Complete!${NC}"
echo -e "${GREEN}================================${NC}"
echo ""
echo "Next steps:"
echo "1. Copy frontend/dist/* to your web server"
echo "2. Configure nginx/apache"
echo "3. Set up SSL certificate"
echo "4. Start the backend server (php artisan serve or PM2)"
echo ""
echo "See DEPLOYMENT_GUIDE.md for detailed instructions"
