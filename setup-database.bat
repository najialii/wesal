@echo off
REM Database Setup Script for Windows
REM This script helps set up the database for local development

echo 🔧 WesalTech Database Setup
echo.

REM Check if we're in the right directory
if not exist "backend\wesaltech\artisan" (
    echo ❌ Error: Please run this script from the project root directory
    echo    Expected to find: backend\wesaltech\artisan
    pause
    exit /b 1
)

echo 📋 Current environment:
cd backend\wesaltech
php artisan env
echo.

echo 🔑 Generating application key...
php artisan key:generate --force
echo.

echo 🗄️ Checking database connection...
php artisan migrate:status
if %errorlevel% neq 0 (
    echo.
    echo ❌ Database connection failed!
    echo.
    echo 💡 Make sure:
    echo    1. MySQL/MariaDB is running
    echo    2. Database 'wesaltech_db' exists
    echo    3. Database credentials in .env are correct
    echo.
    echo 🔧 To create the database, run in MySQL:
    echo    CREATE DATABASE wesaltech_db;
    echo.
    pause
    exit /b 1
)

echo.
echo ✅ Database connection successful!
echo.

echo 🚀 Running migrations...
php artisan migrate --force
echo.

echo 🌱 Running seeders...
php artisan db:seed --force
echo.

echo ✅ Database setup complete!
echo.
echo 🔄 You can now start the development server with:
echo    cd backend\wesaltech
echo    php artisan serve
echo.
pause