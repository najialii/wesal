#!/bin/bash

# Quick upload script for WesalTech
SERVER="root@5.189.163.66"
REMOTE_PATH="/var/www/html"

echo "Uploading frontend build to server..."

# Upload index.html first
scp frontend/dist/index.html $SERVER:$REMOTE_PATH/

# Upload CSS
scp frontend/dist/assets/*.css $SERVER:$REMOTE_PATH/assets/ 2>/dev/null || true

# Upload JS in smaller chunks
for js_file in frontend/dist/assets/*.js; do
  echo "Uploading $(basename $js_file)..."
  scp "$js_file" $SERVER:$REMOTE_PATH/assets/
done

# Upload fonts
scp frontend/dist/assets/*.ttf $SERVER:$REMOTE_PATH/assets/ 2>/dev/null || true

# Upload SVG
scp frontend/dist/*.svg $SERVER:$REMOTE_PATH/ 2>/dev/null || true

echo "Frontend upload complete!"

# Verify nginx is using correct path
echo "Verifying nginx configuration..."
ssh $SERVER "nginx -t && systemctl restart nginx"

echo "Deployment complete!"
