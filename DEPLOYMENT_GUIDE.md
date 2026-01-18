# WesalTech Project Deployment Guide

## Server Information
- **IP Address**: 5.189.163.66
- **User**: root
- **Domain**: https://wesaaltech.com/

## Pre-Deployment Steps

### 1. Connect to Server
```bash
ssh root@5.189.163.66
```

### 2. Backup Current Project (Important!)
```bash
# Create backup directory
mkdir -p /root/backups/$(date +%Y%m%d_%H%M%S)

# Backup current website
cp -r /var/www/html/* /root/backups/$(date +%Y%m%d_%H%M%S)/

# Backup database (if MySQL)
mysqldump -u root -p wesaltech_db > /root/backups/$(date +%Y%m%d_%H%M%S)/database_backup.sql
```

## Deployment Process

### 3. Prepare New Project Directory
```bash
# Create new project directory
mkdir -p /var/www/wesaltech-new
cd /var/www/wesaltech-new
```

### 4. Upload Project Files
You have several options:

#### Option A: Using Git (Recommended)
```bash
# Clone your repository
git clone https://github.com/yourusername/wesaltech.git .

# Or if you have the project locally, use rsync:
# rsync -avz --progress /path/to/local/project/ root@5.189.163.66:/var/www/wesaltech-new/
```

#### Option B: Upload via SCP/SFTP
```bash
# From your local machine:
scp -r /path/to/your/project/* root@5.189.163.66:/var/www/wesaltech-new/
```

### 5. Backend Setup (Laravel)
```bash
cd /var/www/wesaltech-new/backend/wesaltech

# Install dependencies
composer install --optimize-autoloader --no-dev

# Set permissions
chown -R www-data:www-data storage bootstrap/cache
chmod -R 775 storage bootstrap/cache

# Copy environment file
cp .env.example .env

# Generate application key
php artisan key:generate

# Configure database in .env file
nano .env
```

### 6. Database Configuration
Edit the `.env` file:
```env
DB_CONNECTION=mysql
DB_HOST=127.0.0.1
DB_PORT=3306
DB_DATABASE=wesaltech_db
DB_USERNAME=root
DB_PASSWORD=your_database_password

APP_URL=https://wesaaltech.com
APP_ENV=production
APP_DEBUG=false
```

### 7. Run Database Migrations
```bash
# Run migrations
php artisan migrate --force

# Seed database (if needed)
php artisan db:seed --force

# Clear caches
php artisan config:cache
php artisan route:cache
php artisan view:cache
```

### 8. Frontend Setup (React/Vite)
```bash
cd /var/www/wesaltech-new/frontend

# Install dependencies
npm install

# Create production environment file
cp .env.example .env.production

# Configure API URL in .env.production
echo "VITE_API_URL=https://wesaaltech.com/api" > .env.production

# Build for production
npm run build
```

### 9. Web Server Configuration

#### For Apache:
```bash
# Create virtual host configuration
nano /etc/apache2/sites-available/wesaaltech.conf
```

Add this configuration:
```apache
<VirtualHost *:80>
    ServerName wesaaltech.com
    ServerAlias www.wesaaltech.com
    DocumentRoot /var/www/wesaltech-new/frontend/dist
    
    # API routes to Laravel backend
    Alias /api /var/www/wesaltech-new/backend/wesaltech/public
    
    <Directory /var/www/wesaltech-new/frontend/dist>
        AllowOverride All
        Require all granted
        
        # Handle React Router
        RewriteEngine On
        RewriteBase /
        RewriteRule ^index\.html$ - [L]
        RewriteCond %{REQUEST_FILENAME} !-f
        RewriteCond %{REQUEST_FILENAME} !-d
        RewriteRule . /index.html [L]
    </Directory>
    
    <Directory /var/www/wesaltech-new/backend/wesaltech/public>
        AllowOverride All
        Require all granted
    </Directory>
    
    ErrorLog ${APACHE_LOG_DIR}/wesaaltech_error.log
    CustomLog ${APACHE_LOG_DIR}/wesaaltech_access.log combined
</VirtualHost>

<VirtualHost *:443>
    ServerName wesaaltech.com
    ServerAlias www.wesaaltech.com
    DocumentRoot /var/www/wesaltech-new/frontend/dist
    
    # SSL Configuration (if you have SSL certificates)
    SSLEngine on
    SSLCertificateFile /path/to/your/certificate.crt
    SSLCertificateKeyFile /path/to/your/private.key
    
    # Same configuration as above for HTTP
    Alias /api /var/www/wesaltech-new/backend/wesaltech/public
    
    <Directory /var/www/wesaltech-new/frontend/dist>
        AllowOverride All
        Require all granted
        
        RewriteEngine On
        RewriteBase /
        RewriteRule ^index\.html$ - [L]
        RewriteCond %{REQUEST_FILENAME} !-f
        RewriteCond %{REQUEST_FILENAME} !-d
        RewriteRule . /index.html [L]
    </Directory>
    
    <Directory /var/www/wesaltech-new/backend/wesaltech/public>
        AllowOverride All
        Require all granted
    </Directory>
</VirtualHost>
```

### 10. Enable Site and Restart Services
```bash
# Disable old site (if exists)
a2dissite 000-default

# Enable new site
a2ensite wesaaltech

# Enable required modules
a2enmod rewrite
a2enmod ssl

# Test configuration
apache2ctl configtest

# Restart Apache
systemctl restart apache2

# Restart PHP-FPM (if using)
systemctl restart php8.1-fpm
```

### 11. Final Steps
```bash
# Set final permissions
chown -R www-data:www-data /var/www/wesaltech-new
chmod -R 755 /var/www/wesaltech-new

# Create symbolic link (optional, for easy access)
ln -sf /var/www/wesaltech-new /var/www/current

# Test the application
curl -I https://wesaaltech.com
```

## Post-Deployment Verification

### 12. Test the Application
1. Visit https://wesaaltech.com
2. Test user registration/login
3. Test onboarding flow
4. Test main features
5. Check API endpoints: https://wesaaltech.com/api/health

### 13. Monitor Logs
```bash
# Apache logs
tail -f /var/log/apache2/wesaaltech_error.log
tail -f /var/log/apache2/wesaaltech_access.log

# Laravel logs
tail -f /var/www/wesaltech-new/backend/wesaltech/storage/logs/laravel.log
```

## Troubleshooting

### Common Issues:
1. **Permission errors**: Check file permissions and ownership
2. **Database connection**: Verify database credentials in .env
3. **API not working**: Check Apache alias configuration
4. **Frontend not loading**: Verify build process and file paths

### Quick Commands:
```bash
# Clear Laravel caches
php artisan cache:clear
php artisan config:clear
php artisan route:clear
php artisan view:clear

# Restart services
systemctl restart apache2
systemctl restart mysql
```

## Security Considerations
1. Update server packages: `apt update && apt upgrade`
2. Configure firewall: `ufw enable`
3. Set up SSL certificates (Let's Encrypt recommended)
4. Regular backups
5. Monitor logs for suspicious activity

## Rollback Plan
If something goes wrong:
```bash
# Stop Apache
systemctl stop apache2

# Restore from backup
rm -rf /var/www/html/*
cp -r /root/backups/YYYYMMDD_HHMMSS/* /var/www/html/

# Restore database
mysql -u root -p wesaltech_db < /root/backups/YYYYMMDD_HHMMSS/database_backup.sql

# Start Apache
systemctl start apache2
```