@echo off
REM Environment Switcher Script for Windows
REM Usage: switch-env.bat [local|production]

if "%1"=="" (
    echo Usage: switch-env.bat [local^|production]
    echo.
    echo Current environment configuration:
    echo Frontend:
    if exist "frontend\.env" (
        findstr "VITE_API_URL" frontend\.env
    ) else (
        echo   No .env file found
    )
    echo Backend:
    if exist "backend\wesaltech\.env" (
        findstr "APP_URL" backend\wesaltech\.env
        findstr "APP_ENV" backend\wesaltech\.env
    ) else (
        echo   No .env file found
    )
    echo.
    exit /b 1
)

set ENV=%1

if "%ENV%"=="local" (
    echo 🔄 Switching to LOCAL environment...
    
    REM Frontend
    if exist "frontend\.env.local" (
        copy "frontend\.env.local" "frontend\.env" >nul
        echo ✅ Frontend switched to local ^(http://localhost:8000/api^)
    ) else (
        echo ❌ frontend\.env.local not found
    )
    
    REM Backend
    if exist "backend\wesaltech\.env.local" (
        copy "backend\wesaltech\.env.local" "backend\wesaltech\.env" >nul
        echo ✅ Backend switched to local ^(http://localhost:8000^)
    ) else (
        echo ❌ backend\wesaltech\.env.local not found
    )
    
    REM Update TypeScript config
    if exist "frontend\src\config\environment.ts" (
        powershell -Command "(Get-Content 'frontend\src\config\environment.ts') -replace 'export const config = productionConfig;', 'export const config = localConfig;' | Set-Content 'frontend\src\config\environment.ts'"
        echo ✅ TypeScript config switched to local
    )
    
) else if "%ENV%"=="production" (
    echo 🔄 Switching to PRODUCTION environment...
    
    REM Frontend
    if exist "frontend\.env.production" (
        copy "frontend\.env.production" "frontend\.env" >nul
        echo ✅ Frontend switched to production ^(https://wesaaltech.com/api^)
    ) else (
        echo ❌ frontend\.env.production not found
    )
    
    REM Backend
    if exist "backend\wesaltech\.env.production" (
        copy "backend\wesaltech\.env.production" "backend\wesaltech\.env" >nul
 Backend switched to production ^(https://wesaaltech.com^)
    ) else (
        echo ❌ backend\wesaltech\.env.production not found
    )
    
    REM Update TypeScript config
    if exist "frontend\src\config\environment.ts" (
        powershell -Command "(Get-Content 'frontend\src\config\environment.ts') -replace 'export const config = localConfig;', 'export const config = productionConfig;' | Set-Content 'frontend\src\config\environment.ts'"
        echo ✅ TypeScript config switched to production
    )
    
) else (
    echo ❌ Invalid environment. Use 'local' or 'production'
    exit /b 1
)

echo.
echo 📋 Current configuration:
echo Frontend ^(.env^):
if exist "frontend\.env" (
    type "frontend\.env"
) else (
    echo   No .env file found
)

echo.
echo Backend ^(.env^):
if exist "backend\wesaltech\.env" (
    powershell -Command "Get-Content 'backend\wesaltech\.env' | Select-Object -First 10"
    echo   ... ^(truncated^)
) else (
    echo   No .env file found
)

echo.
echo 🔄 Remember to:
echo   - Restart your development servers if they're running
echo   - Clear cache if switching to production
echo   - Update database credentials in backend\.env if needed