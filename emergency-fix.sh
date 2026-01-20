#!/bin/bash

echo "🚨 Emergency Fix - Resolving HTTP2 Protocol Errors and Backend Issues"

# 1. Upload and apply new nginx config
echo "📝 Updating nginx configuration..."
scp nginx-config.conf root@5.189.163.66:/etc/nginx/sites-available/default

# 2. Test and reload nginx
echo "🔧 Testing and reloading nginx..."
ssh root@5.189.163.66 << 'EOF'
# Test nginx config
nginx -t

if [ $? -eq 0 ]; then
    echo "✅ Nginx config is valid, reloading..."
    systemctl reload nginx
    systemctl status nginx --no-pager -l
else
    echo "❌ Nginx config has errors!"
    exit 1
fi
EOF

# 3. Check backend status and restart if needed
echo "🔍 Checking backend status..."
ssh root@5.189.163.66 << 'EOF'
echo "Backend process status:"
ps aux | grep php | grep -v grep

echo "Port 8001 status:"
netstat -tlnp | grep :8001

echo "Laravel logs (last 20 lines):"
if [ -f /var/www/wesaltech/backend/wesaltech/storage/logs/laravel.log ]; then
    tail -20 /var/www/wesaltech/backend/wesaltech/storage/logs/laravel.log
else
    echo "No Laravel log file found"
fi

# Check if backend is running, if not start it
if ! netstat -tlnp | grep :8001 > /dev/null; then
    echo "🚀 Starting Laravel backend..."
    cd /var/www/wesaltech/backend/wesaltech
    
    # Kill any existing php processes
    pkill -f "php.*artisan.*serve"
    
    # Start fresh
    nohup php artisan serve --host=127.0.0.1 --port=8001 > /tmp/laravel.log 2>&1 &
    
    sleep 3
    
    # Check if it started
    if netstat -tlnp | grep :8001 > /dev/null; then
        echo "✅ Backend started successfully"
    else
        echo "❌ Backend failed to start"
        cat /tmp/laravel.log
    fi
else
    echo "✅ Backend is already running"
fi
EOF

# 4. Clear browser cache instruction
echo ""
echo "🧹 IMPORTANT: Clear browser cache completely!"
echo "   - Chrome: Ctrl+Shift+Delete -> All time -> Everything"
echo "   - Firefox: Ctrl+Shift+Delete -> Everything -> Clear Now"
echo ""

# 5. Test the fixes
echo "🧪 Testing the fixes..."
echo "Frontend: http://5.189.163.66"
echo "Backend API: http://5.189.163.66/api/health"

ssh root@5.189.163.66 << 'EOF'
echo "Testing API endpoint:"
curl -s -o /dev/null -w "%{http_code}" http://127.0.0.1:8001/api/health
echo ""
EOF

echo "✅ Emergency fix completed!"
echo "🔄 Please hard refresh your browser (Ctrl+F5) and try again"