#!/bin/bash

echo "=== NGINX ERROR DIAGNOSIS ==="
echo

echo "1. Current nginx test result:"
nginx -t

echo
echo "2. Detailed nginx error log:"
journalctl -xeu nginx.service --no-pager -l | tail -20

echo
echo "3. Current site configurations:"
echo "Available sites:"
ls -la /etc/nginx/sites-available/

echo
echo "Enabled sites:"
ls -la /etc/nginx/sites-enabled/

echo
echo "4. Content of wesaaltech.com config (if exists):"
if [ -f /etc/nginx/sites-available/wesaaltech.com ]; then
    cat /etc/nginx/sites-available/wesaaltech.com
else
    echo "File does not exist"
fi

echo
echo "5. Nginx process status:"
systemctl status nginx --no-pager -l