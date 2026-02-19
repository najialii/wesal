#!/bin/bash

echo "=== FIXING WESAALTECH DOMAIN CONFLICT ==="
echo "This will fix the nginx configuration to properly serve wesaaltech.com"
echo

# Step 1: Update the wesaaltech config to use specific domain
echo "1. Updating wesaaltech config to use specific domain..."
sed -i 's/server_name _;/server_name wesaaltech.com www.wesaaltech.com;/' /etc/nginx/sites-available/wesaaltech

# Step 2: Update the default config to NOT serve wesaaltech.com
echo "2. Updating default config to exclude wesaaltech.com..."
sed -i 's/server_name wesaaltech.com www.wesaaltech.com _;/server_name _;/' /etc/nginx/sites-available/default

# Step 3: Test nginx configuration
echo "3. Testing nginx configuration..."
nginx -t

if [ $? -eq 0 ]; then
    echo "4. Configuration test passed. Reloading nginx..."
    systemctl reload nginx
    
    echo "5. Checking nginx status..."
    systemctl status nginx --no-pager -l
    
    echo "6. Testing wesaaltech.com response..."
    echo "Testing with curl..."
    curl -I -H "Host: wesaaltech.com" http://localhost/ 2>/dev/null | head -5
    
    echo
    echo "SUCCESS: wesaaltech.com should now serve the correct content"
    echo "Visit https://wesaaltech.com to verify"
else
    echo "ERROR: Nginx configuration test failed"
    echo "Run: nginx -t for details"
    exit 1
fi