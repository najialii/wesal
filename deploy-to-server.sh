#!/bin/bash

# WesalTech Server Deployment Script
# Server: 5.189.163.66

SERVER="5.189.163.66"
SERVER_USER="root"  # Change if different
REMOTE_PATH="/var/www/wesaltech"
BACKEND_PATH="$REMOTE_PATH/backend"
FRONTEND_PATH="$REMOTE_PATH/frontend"

echo "🚀 Deploying WesalTech to $SERVER"
echo "=================================="

# Step 1: Build frontend locally
echo "📦 Building frontend..."
cd frontend
npm install
npm run build
cd ..

# Step 2: Create deployment package
echo "📦 Creating deployment package..."
tar -czf wesaltech-deploy.tar.gz \
    --exclude='node_modules' \
    --exclude='vendor' \
    --exclude='.git' \
    --exclude='storage/logs/*' \
    --exclude='storage/framework/cache/*' \
    --exclude='storage/framework/sessions/*' \
    --exclude='storage/framework/views/*' \
    backend/ frontend/dist/

echo "📤 Uploading to server..."
scp wesaltech-deploy.tar.gz $SERVER_USER@$SERVER:/tmp/

echo "🔧 Deploying on server..."
ssh $SERVER_USER@$SERVER << 'ENDSSH'
set -e

# Create directory if not exists
mkdir -p /var/www/wesaltech
cd /var/www/wesaltech

# Backup existing installation
if [ -d "backend" ]; then
    echo "Creating backup..."
    tar -czf backup-$(date +%Y%m%d-%H%M%S).tar.gz backend/ frontend/ 2>/dev/null || true
fi

# Extract new files
echo "Extracting files..."
tar -xzf /tmp/wesaltech-deploy.tar.gz
rm /tmp/wesaltech-deploy.tar.gz

# Backend setup
cd backend

# Install composer dependencies
echo "Installing backend dependencies..."
composer install --no-dev --optimize-autoloader --no-interaction

# Set permissions
echo "Setting permissions..."
chmod -R 775 storage bootstrap/cache
chown -R www-data:www-data storage bootstrap/cache

# Run migrations
echo "Running migrations..."
php artisan migrate --force

# Clear and cache
echo "Caching configuration..."
php artisan config:cache
php artisan route:cache
php artisan view:cache

# Create storage link
php artisan storage:link

# Frontend setup
cd ../frontend
echo "Frontend files ready in dist/"

echo "✅ Deployment complete!"
echo "Backend: /var/www/wesaltech/backend"
echo "Frontend: /var/www/wesaltech/frontend/dist"

ENDSSH

echo ""
echo "✅ Deployment completed successfully!"
echo ""
echo "Next steps:"
echo "1. Configure your web server to point to /var/www/wesaltech/frontend/dist"
echo "2. Configure API proxy to /var/www/wesaltech/backend/public"
echo "3. Update .env file on server with production settings"
echo ""
