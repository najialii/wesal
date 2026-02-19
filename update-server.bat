@echo off
echo Updating WesalTech on server...

REM Build frontend locally first
echo Building frontend...
cd frontend
call npm run build
cd ..

echo.
echo Frontend built successfully!
echo.
echo Now run these commands in your terminal:
echo.
echo ssh root@5.189.163.66
echo cd /var/www/wesaltech/backend
echo git pull
echo composer install --no-dev
echo php artisan migrate --force
echo php artisan config:cache
echo php artisan route:cache
echo.
echo Then upload frontend/dist to server
echo.
pause
