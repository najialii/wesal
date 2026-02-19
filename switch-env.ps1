# Environment Switcher PowerShell Script
# Usage: switch-env.ps1 [local|production]

param(
    [Parameter(Mandatory=$false)]
    [ValidateSet("local", "production")]
    [string]$Environment
)

if (-not $Environment) {
    Write-Host "Usage: switch-env.ps1 [local|production]" -ForegroundColor Yellow
    Write-Host ""
    Write-Host "Current environment configuration:" -ForegroundColor Cyan
    Write-Host "Frontend:" -ForegroundColor Green
    if (Test-Path "frontend\.env") {
        Get-Content "frontend\.env" | Select-String "VITE_API_URL"
    } else {
        Write-Host "  No .env file found" -ForegroundColor Red
    }
    Write-Host "Backend:" -ForegroundColor Green
    if (Test-Path "backend\wesaltech\.env") {
        Get-Content "backend\wesaltech\.env" | Select-String "APP_URL"
        Get-Content "backend\wesaltech\.env" | Select-String "APP_ENV"
    } else {
        Write-Host "  No .env file found" -ForegroundColor Red
    }
    Write-Host ""
    exit 1
}

switch ($Environment) {
    "local" {
        Write-Host "🔄 Switching to LOCAL environment..." -ForegroundColor Yellow
        
        # Frontend
        if (Test-Path "frontend\.env.local") {
            Copy-Item "frontend\.env.local" "frontend\.env" -Force
            Write-Host "✅ Frontend switched to local (http://localhost:8000/api)" -ForegroundColor Green
        } else {
            Write-Host "❌ frontend\.env.local not found" -ForegroundColor Red
        }
        
        # Backend
        if (Test-Path "backend\wesaltech\.env.local") {
            Copy-Item "backend\wesaltech\.env.local" "backend\wesaltech\.env" -Force
            Write-Host "✅ Backend switched to local (http://localhost:8000)" -ForegroundColor Green
        } else {
            Write-Host "❌ backend\wesaltech\.env.local not found" -ForegroundColor Red
        }
        
        # Update TypeScript config
        if (Test-Path "frontend\src\config\environment.ts") {
            $content = Get-Content "frontend\src\config\environment.ts" -Raw
            $content = $content -replace 'export const config = productionConfig;', 'export const config = localConfig;'
            Set-Content "frontend\src\config\environment.ts" -Value $content
            Write-Host "✅ TypeScript config switched to local" -ForegroundColor Green
        }
    }
    
    "production" {
        Write-Host "🔄 Switching to PRODUCTION environment..." -ForegroundColor Yellow
        
        # Frontend
        if (Test-Path "frontend\.env.production") {
            Copy-Item "frontend\.env.production" "frontend\.env" -Force
            Write-Host "✅ Frontend switched to production (https://wesaaltech.com/api)" -ForegroundColor Green
        } else {
            Write-Host "❌ frontend\.env.production not found" -ForegroundColor Red
        }
        
        # Backend
        if (Test-Path "backend\wesaltech\.env.production") {
            Copy-Item "backend\wesaltech\.env.production" "backend\wesaltech\.env" -Force
            Write-Host "✅ Backend switched to production (https://wesaaltech.com)" -ForegroundColor Green
        } else {
            Write-Host "❌ backend\wesaltech\.env.production not found" -ForegroundColor Red
        }
        
        # Update TypeScript config
        if (Test-Path "frontend\src\config\environment.ts") {
            $content = Get-Content "frontend\src\config\environment.ts" -Raw
            $content = $content -replace 'export const config = localConfig;', 'export const config = productionConfig;'
            Set-Content "frontend\src\config\environment.ts" -Value $content
            Write-Host "✅ TypeScript config switched to production" -ForegroundColor Green
        }
    }
}

Write-Host ""
Write-Host "📋 Current configuration:" -ForegroundColor Cyan
Write-Host "Frontend (.env):" -ForegroundColor Green
if (Test-Path "frontend\.env") {
    Get-Content "frontend\.env"
} else {
    Write-Host "  No .env file found" -ForegroundColor Red
}

Write-Host ""
Write-Host "Backend (.env):" -ForegroundColor Green
if (Test-Path "backend\wesaltech\.env") {
    Get-Content "backend\wesaltech\.env" | Select-Object -First 10
    Write-Host "  ... (truncated)" -ForegroundColor Gray
} else {
    Write-Host "  No .env file found" -ForegroundColor Red
}

Write-Host ""
Write-Host "🔄 Remember to:" -ForegroundColor Cyan
Write-Host "  - Restart your development servers if they're running" -ForegroundColor Yellow
Write-Host "  - Clear cache if switching to production" -ForegroundColor Yellow
Write-Host "  - Update database credentials in backend\.env if needed" -ForegroundColor Yellow