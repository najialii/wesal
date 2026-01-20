@echo off
echo 🔧 Emergency Sidebar Collapse Fix
echo ==================================

cd frontend

echo Stopping any running dev server...
taskkill /f /im node.exe 2>nul

echo Clearing cache...
if exist node_modules\.vite rmdir /s /q node_modules\.vite 2>nul
if exist dist rmdir /s /q dist 2>nul

echo Starting dev server...
start /b npm run dev

echo.
echo ✅ Fix applied! The sidebar should now:
echo    - Collapse to icons in both English and Arabic
echo    - Show tooltips with correct text when collapsed
echo    - Allow main content to expand properly
echo.
echo 🌐 Open your browser and test both languages
echo 📱 Try collapsing/expanding the sidebar with the toggle button

pause