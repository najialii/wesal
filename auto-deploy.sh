#!/bin/bash
# Auto deployment script for WesalTech
echo "Starting deployment..."

# Update and install packages
apt update -y
apt install -y nginx mysql-server php8.1 php8.1-fpm php8.1-mysql php8.1-xml php8.1-mbstring php8.1-curl php8.1-zip php8.1-gd composer nodejs npm git curl unzip

# Clone project
rm -rf /var/www/wesaltech
git clone https://github.com/najialii/wesal.git /var/www/wesaltech

# Setup Laravel
cd /var/www/wesaltech/backend/wesaltech
composer install --no-dev --optimize-autoloader
cp .env.example .env
php artisan key:generate

# Database setup
mysql -u root -p112235813nJ -e "CREATE DATABASE IF NOT EXISTS wesaltech_db;"
sed -i 's/DB_DATABASE=.*/DB_DATABASE=wesaltech_db/' .env
sed -i 's/DB_USERNAME=.*/DB_USERNAME=root/' .env
sed -i 's/DB_PASSWORD=.*/DB_PASSWORD=112235813nJ/' .env
php artisan migrate --force
php artisan db:seed --force

# Set permissions
chown -R www-data:www-data storage bootstrap/cache
chmod -R 775 storage bootstrap/cache

# Build frontend
cd /var/www/wesaltech/frontend
npm install
npm run build

# Configure Nginx
cat > /etc/nginx/sites-available/wesaaltech.com << 'EOF'
server {
    listen 80;
    server_name wesaaltech.com www.wesaaltech.com;
    root /var/www/wesaltech/frontend/dist;
    index index.html;

    location / {
        try_files $uri $uri/ /index.html;
    }

    location /api {
        alias /var/www/wesaltech/backend/wesaltech/public;
        try_files $uri $uri/ @laravel;
        
        location ~ \.php$ {
            include fastcgi_params;
            fastcgi_pass unix:/var/run/php/php8.1-fpm.sock;
            fastcgi_param SCRIPT_FILENAME /var/www/wesaltech/backend/wesaltech/public/index.php;
        }
    }

    location @laravel {
        rewrite /api/(.*)$ /api/index.php/$1 last;
    }
}
EOF

# Enable site
ln -sf /etc/nginx/sites-available/wesaaltech.com /etc/nginx/sites-enabled/
rm -f /etc/nginx/sites-enabled/default
nginx -t

# Restart services
systemctl restart nginx
systemctl restart php8.1-fpm
systemctl restart mysql

# Final permissions
chown -R www-data:www-data /var/www/wesaltech
chmod -R 755 /var/www/wesaltech

echo "Deployment completed!"
echo "Visit: http://wesaaltech.com"