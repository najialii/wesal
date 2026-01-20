#!/bin/bash

# Deploy WesalTech Backend API
echo "Starting backend deployment..."

# Navigate to backend directory
cd backend/wesaltech

# Install PHP dependencies
echo "Installing PHP dependencies..."
composer install --no-dev --optimize-autoloader

# Set up environment
echo "Setting up environment..."
cp .env.example .env.production

# Update production environment variables
sed -i 's/APP_ENV=local/APP_ENV=production/' .env.production
sed -i 's/APP_DEBUG=true/APP_DEBUG=false/' .env.production
sed -i 's/APP_URL=http:\/\/localhost/APP_URL=https:\/\/wesaaltech.com/' .env.production

# Generate application key
php artisan key:generate --env=production

# Run database migrations
echo "Running database migrations..."
php artisan migrate --force --env=production

# Seed database if needed
php artisan db:seed --class=SuperAdminSeeder --env=production
php artisan db:seed --class=RoleSeeder --env=production

# Clear and cache config
php artisan config:cache --env=production
php artisan route:cache --env=production
php artisan view:cache --env=production

# Set proper permissions
chmod -R 755 storage bootstrap/cache
chown -R www-data:www-data storage bootstrap/cache

echo "Backend deployment completed!"