#!/bin/bash

echo "🔧 Fixing WesalTech deployment issues..."

# Fix file permissions for assets
echo "📁 Fixing file permissions..."
chmod -R 755 /var/www/html
chown -R www-data:www-data /var/www/html
chmod 644 /var/www/html/index.html
chmod -R 644 /var/www/html/assets/*

# Start backend on port 8001
echo "🚀 Starting Laravel backend on port 8001..."
cd /root/wesaltech-new
pkill -f "php artisan serve"
nohup php artisan serve --host=0.0.0.0 --port=8001 > /tmp/laravel-8001.log 2>&1 &

# Restart nginx
echo "🔄 Restarting nginx..."
systemctl restart nginx

# Check if backend is running
sleep 3
if curl -s http://localhost:8001 > /dev/null; then
    echo "✅ Backend is running on port 8001"
else
    echo "❌ Backend failed to start"
    cat /tmp/laravel-8001.log
fi

# Check nginx status
if systemctl is-active --quiet nginx; then
    echo "✅ Nginx is running"
else
    echo "❌ Nginx is not running"
fi

echo "🎉 Deployment fix completed!"
echo "Site: https://wesaaltech.com"