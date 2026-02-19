TED ALL# Manual Deployment to 5.189.163.66

## Step 1: Build Frontend Locally

Run this on yr local maine:
```bash
cd fronpm install
npm run build
```
Step 2: Connect to Server

```bash
ssh root@5.189.163.66
```
(Enter password when prompted)

## Step 3: Create Directory on Server

Once connected to server:
```bash
mkdir -p /var/www/wesaltech
cd /var/www/wesaltech
```

## Step 4: Upload Files

From your local machine (new terminal):
```bash
# Upload backend
scp -r backend root@5.189.163.66:/var/www/wesaltech/

# Upload frontend build
scp -r frontend/dist root@5.189.163.66:/var/www/wesaltech/frontend/
```

## Step 5: Setup Backend on Server

Back in SSH session:
```bash
cd /var/www/wesaltech/backend

# Install dependencies
composer install --no-dev --optimize-autoloader

# Set permissions
chmod -R 775 storage bootstrap/cache
chown -R www-data:www-data storage bootstrap/cache

# Copy environment file
cp .env.example .env

# Edit .env with production settings
nano .env
```

Update these in .env:
```
APP_ENV=production
APP_DEBUG=false
APP_URL=http://5.189.163.66

DB_CONNECTION=mysql
DB_HOST=127.0.0.1
DB_PORT=3306
DB_DATABASE=wesaltech
DB_USERNAME=root
DB_PASSWORD=YOUR_DB_PASSWORD
```

Continue:
```bash
# Generate app key
php artisan key:generate

# Run migrations
php artisan migrate --force

# Cache config
php artisan config:cache
php artisan route:cache

# Create storage link
php artisan storage:link
```

## Step 6: Configure Nginx

Create nginx config:
```bash
nano /etc/nginx/sites-available/wesaltech
```

Add this configuration:
```nginx
server {
    listen 80;
    server_name 5.189.163.66;
    
    root /var/www/wesaltech/frontend/dist;
    index index.html;

    # Frontend
    location / {
        try_files $uri $uri/ /index.html;
    }

    # Backend API
    location /api {
        alias /var/www/wesaltech/backend/public;
        try_files $uri $uri/ @backend;
        
        location ~ \.php$ {
            include fastcgi_params;
            fastcgi_pass unix:/var/run/php/php8.2-fpm.sock;
            fastcgi_param SCRIPT_FILENAME /var/www/wesaltech/backend/public/index.php;
        }
    }

    location @backend {
        rewrite /api/(.*)$ /index.php?/$1 last;
    }

    # Storage files
    location /storage {
        alias /var/www/wesaltech/backend/storage/app/public;
    }
}
```

Enable site:
```bash
ln -s /etc/nginx/sites-available/wesaltech /etc/nginx/sites-enabled/
nginx -t
systemctl reload nginx
```

## Step 7: Start Backend

```bash
cd /var/www/wesaltech/backend
php artisan serve --host=0.0.0.0 --port=8000 &
```

Or use PM2:
```bash
pm2 start "php artisan serve --host=0.0.0.0 --port=8000" --name wesaltech
pm2 save
```

## Step 8: Test

Visit: http://5.189.163.66

## Quick Commands Reference

### Update deployment:
```bash
cd /var/www/wesaltech/backend
git pull
composer install --no-dev
php artisan migrate --force
php artisan config:cache
php artisan route:cache
```

### View logs:
```bash
tail -f /var/www/wesaltech/backend/storage/logs/laravel.log
```

### Restart services:
```bash
systemctl reload nginx
pm2 restart wesaltech
```
