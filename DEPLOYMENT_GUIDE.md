# WesalTech Deployment Guide

## Pre-Deployment Checklist

### Backend
- [x] Google OAuth configured
- [x] Audit logging implemented
- [x] Database migrations ready
- [x] Product images storage configured
- [ ] Environment variables set for production
- [ ] Database backup created

### Frontend
- [x] Landing page created
- [x] Marketing pages (Solutions, About, Contact)
- [x] Bilingual support (EN/AR)
- [ ] Production build tested
- [ ] Environment variables configured

## Deployment Steps

### 1. Backend Deployment

#### Update Production Environment
```bash
cd backend
cp .env.example .env.production
```

Edit `.env.production` with production values:
```env
APP_ENV=production
APP_DEBUG=false
APP_URL=https://wesaaltech.com

DB_CONNECTION=mysql
DB_HOST=your-production-db-host
DB_PORT=3306
DB_DATABASE=wesaltech_production
DB_USERNAME=your-db-user
DB_PASSWORD=your-secure-password

# Google OAuth (use production credentials)
GOOGLE_CLIENT_ID=your-production-client-id
GOOGLE_CLIENT_SECRET=your-production-client-secret
```

#### Deploy Backend
```bash
# On your server
cd /path/to/backend

# Pull latest code
git pull origin main

# Install dependencies
composer install --no-dev --optimize-autoloader

# Run migrations
php artisan migrate --force

# Clear and cache config
php artisan config:cache
php artisan route:cache
php artisan view:cache

# Set permissions
chmod -R 775 storage bootstrap/cache
chown -R www-data:www-data storage bootstrap/cache

# Create storage symlink
php artisan storage:link
```

### 2. Frontend Deployment

#### Update Production Environment
```bash
cd frontend
```

Edit `src/config/environment.ts`:
```typescript
export const config = productionConfig; // Switch to production
```

Or create `.env.production`:
```env
VITE_API_URL=https://wesaaltech.com/api
VITE_APP_ENV=production
VITE_APP_DEBUG=false
```

#### Build Frontend
```bash
# Install dependencies
npm install

# Build for production
npm run build

# The build output will be in 'dist' folder
```

#### Deploy Frontend Build
```bash
# Copy dist folder to your web server
scp -r dist/* user@your-server:/var/www/wesaaltech.com/public_html/

# Or if using nginx
scp -r dist/* user@your-server:/usr/share/nginx/html/
```

### 3. Web Server Configuration

#### Nginx Configuration
Create `/etc/nginx/sites-available/wesaaltech.com`:
```nginx
server {
    listen 80;
    server_name wesaaltech.com www.wesaaltech.com;
    return 301 https://$server_name$request_uri;
}

server {
    listen 443 ssl http2;
    server_name wesaaltech.com www.wesaaltech.com;

    ssl_certificate /etc/letsencrypt/live/wesaaltech.com/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/wesaaltech.com/privkey.pem;

    root /var/www/wesaaltech.com/public_html;
    index index.html;

    # Frontend (SPA)
    location / {
        try_files $uri $uri/ /index.html;
    }

    # Backend API
    location /api {
        proxy_pass http://localhost:8000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }

    # Storage files
    location /storage {
        alias /path/to/backend/storage/app/public;
        expires 30d;
        add_header Cache-Control "public, immutable";
    }
}
```

Enable the site:
```bash
sudo ln -s /etc/nginx/sites-available/wesaaltech.com /etc/nginx/sites-enabled/
sudo nginx -t
sudo systemctl reload nginx
```

### 4. SSL Certificate (Let's Encrypt)
```bash
sudo apt install certbot python3-certbot-nginx
sudo certbot --nginx -d wesaaltech.com -d www.wesaaltech.com
```

### 5. Process Manager (PM2 for Laravel)
```bash
# Install PM2
npm install -g pm2

# Start Laravel
cd /path/to/backend
pm2 start "php artisan serve --host=0.0.0.0 --port=8000" --name wesaltech-api

# Save PM2 configuration
pm2 save
pm2 startup
```

### 6. Database Backup
```bash
# Create backup script
cat > /usr/local/bin/backup-wesaltech.sh << 'EOF'
#!/bin/bash
DATE=$(date +%Y%m%d_%H%M%S)
BACKUP_DIR="/backups/wesaltech"
mkdir -p $BACKUP_DIR

# Backup database
mysqldump -u root -p wesaltech_production > $BACKUP_DIR/db_$DATE.sql

# Backup storage
tar -czf $BACKUP_DIR/storage_$DATE.tar.gz /path/to/backend/storage

# Keep only last 7 days
find $BACKUP_DIR -name "*.sql" -mtime +7 -delete
find $BACKUP_DIR -name "*.tar.gz" -mtime +7 -delete
EOF

chmod +x /usr/local/bin/backup-wesaltech.sh

# Add to crontab (daily at 2 AM)
crontab -e
# Add: 0 2 * * * /usr/local/bin/backup-wesaltech.sh
```

## Post-Deployment

### 1. Test the Application
- [ ] Visit https://wesaaltech.com
- [ ] Test landing page
- [ ] Test registration
- [ ] Test Google login
- [ ] Test POS system
- [ ] Test maintenance scheduling
- [ ] Test audit logs

### 2. Monitor Logs
```bash
# Backend logs
tail -f /path/to/backend/storage/logs/laravel.log

# Nginx logs
tail -f /var/log/nginx/error.log
tail -f /var/log/nginx/access.log

# PM2 logs
pm2 logs wesaltech-api
```

### 3. Performance Optimization
```bash
# Enable OPcache in php.ini
opcache.enable=1
opcache.memory_consumption=256
opcache.max_accelerated_files=20000

# Restart PHP-FPM
sudo systemctl restart php8.2-fpm
```

## Quick Deploy Script

Create `deploy.sh`:
```bash
#!/bin/bash
set -e

echo "🚀 Deploying WesalTech..."

# Backend
echo "📦 Deploying Backend..."
cd backend
git pull origin main
composer install --no-dev --optimize-autoloader
php artisan migrate --force
php artisan config:cache
php artisan route:cache
php artisan view:cache

# Frontend
echo "🎨 Building Frontend..."
cd ../frontend
npm install
npm run build

echo "📤 Uploading to server..."
rsync -avz --delete dist/ user@server:/var/www/wesaaltech.com/public_html/

echo "✅ Deployment complete!"
```

## Rollback Plan

If something goes wrong:
```bash
# Rollback database
mysql -u root -p wesaltech_production < /backups/wesaltech/db_YYYYMMDD_HHMMSS.sql

# Rollback code
git reset --hard HEAD~1
composer install
php artisan migrate:rollback

# Restart services
pm2 restart wesaltech-api
sudo systemctl reload nginx
```

## Monitoring & Maintenance

### Health Checks
- Database connectivity
- API response time
- Storage space
- SSL certificate expiry
- Backup completion

### Regular Tasks
- Weekly: Review logs
- Monthly: Update dependencies
- Quarterly: Security audit
- Yearly: SSL renewal (automatic with certbot)
