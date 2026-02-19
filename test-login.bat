@echo off
echo Testing WesalTech Login...
echo.

echo 1. Testing Backend Connection...
curl -X GET http://localhost:8000/api/health 2>nul
if %errorlevel% neq 0 (
    echo ERROR: Backend is not running on http://localhost:8000
    echo Please start the backend server first
    pause
    exit /b 1
)
echo Backend is running!
echo.

echo 2. Testing Login Endpoint...
curl -X POST http://localhost:8000/api/auth/login ^
  -H "Content-Type: application/json" ^
  -H "Accept: application/json" ^
  -d "{\"email\":\"admin@wesaltech.com\",\"password\":\"11235813nJ\"}"
echo.
echo.

echo 3. Testing CORS...
curl -X OPTIONS http://localhost:8000/api/auth/login ^
  -H "Origin: http://localhost:5175" ^
  -H "Access-Control-Request-Method: POST" ^
  -H "Access-Control-Request-Headers: Content-Type" ^
  -i
echo.

pause
