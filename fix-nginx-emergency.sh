#!/bin/bash

echo "=== EMERGENCY NGINX FIX SCRIPT ==="
echo "This will diagnose and fix nginx configuration issues"
echo

# Stop nginx first to prevent conflicts
echo "1. Stopping nginx service..."
systemctl stop nginx

echo
echo "2. Checking what's wrong with current config..."
nginx -t 2>&1

echo
echo "3. Backing up current broken configs..."
BACKUP_DIR="/tmp/nginx-emergency-backup-$(date +%Y%m%d-%H%M%S)"
mkdir -p $BACKUP_DIR
cp -r /etc/nginx/sites-available/* $BACKUP_DIR/ 2>/dev/null || true
cp -r /etc/nginx/sites-enabled/* $BACKUP_DIR/ 2>/dev/null || true
echo "Backup created at: $BACKUP_DIR"

echo
echo "4. Removing all site configurations to start clean..."
rm -f /etc/nginx/sites-enabled/*
rm -f /etc/nginx/sites-available/wesaaltech.com
rm -f /etc/nginx/sites-available/minimoondz.com

echo
echo "5. Creating minimal working default site..."
cat > /etc/nginx/sites-available/default << 'EOF'
server {
    listen 80 default_server;
    listen [::]:80 default_server;
    
    root /var/www/html;
    index index.html index.htm index.nginx-debian.html;
    
    server_name _;
    
    location / {
        try_files $uri $uri/ =404;
    }
}
EOF

echo
echo "6. Enabling default site..."
ln -sf /etc/nginx/sites-available/default /etc/nginx/sites-enabled/

echo
echo "7. Testing nginx configuration..."
nginx -t

if [ $? -eq 0 ]; then
    echo
    echo "8. Starting nginx with clean config..."
    systemctl start nginx
    systemctl status nginx --no-pager -l
    
    echo
    echo "9. Testing basic connectivity..."
    curl -I http://localhost/ 2>/dev/null || echo "Local test failed"
    
    echo
    echo "SUCCESS: Nginx is now running with basic configuration"
    echo "Next step: We'll add sites one by one safely"
else
    echo
    echo "ERROR: Even basic nginx config failed. Check main nginx.conf"
    echo "Run: nginx -t for details"
fi