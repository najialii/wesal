#!/bin/bash

echo "=== FIXING WESAALTECH SITE PRIORITY ==="
echo "This will disable the default site and ensure wesaaltech config takes priority"
echo

# Check current nginx status
echo "1. Current nginx status:"
systemctl status nginx --no-pager -l

echo
echo "2. Current enabled sites:"
ls -la /etc/nginx/sites-enabled/

echo
echo "3. Disabling default site that conflicts with wesaaltech..."
rm -f /etc/nginx/sites-enabled/default

echo
echo "4. Ensuring wesaaltech site is properly enabled..."
ln -sf /etc/nginx/sites-available/wesaaltech /etc/nginx/sites-enabled/wesaaltech

echo
echo "5. Testing nginx configuration..."
nginx -t

if [ $? -eq 0 ]; then
    echo
    echo "6. Reloading nginx with new configuration..."
    systemctl reload nginx
    
    echo
    echo "7. Verifying nginx is running..."
    systemctl status nginx --no-pager -l
    
    echo
    echo "8. Testing wesaaltech.com response..."
    curl -I -H "Host: wesaaltech.com" http://localhost/ 2>/dev/null || echo "Local test failed"
    
    echo
    echo "SUCCESS: Default site disabled, wesaaltech should now be served correctly"
    echo "Visit https://wesaaltech.com to verify the correct content is displayed"
else
    echo
    echo "ERROR: Nginx configuration test failed"
    echo "Run: nginx -t for details"
    exit 1
fi