#!/bin/bash

echo "=== WesalTech Deployment - Site Restoration Script ==="
echo "This script will restore all sites and properly configure WesalTech"
echo

# Check current nginx status
echo "1. Checking current nginx status..."
systemctl status nginx --no-pager -l

echo
echo "2. Checking current site configurations..."
ls -la /etc/nginx/sites-available/
echo
ls -la /etc/nginx/sites-enabled/

echo
echo "3. Testing nginx configuration..."
nginx -t

echo
echo "4. Backing up current configurations..."
mkdir -p /tmp/nginx-backup-$(date +%Y%m%d-%H%M%S)
cp -r /etc/nginx/sites-available/* /tmp/nginx-backup-$(date +%Y%m%d-%H%M%S)/ 2>/dev/null || true

echo
echo "5. Removing all current site configurations to start fresh..."
rm -f /etc/nginx/sites-enabled/*

echo
echo "6. Creating clean default configuration..."
cat > /etc/nginx/sites-available/default << 'EOF'
server {
    listen 80 default_server;
    listen [::]:80 default_server;
    
    root /var/www/html;
    index index.html index.htm index.n