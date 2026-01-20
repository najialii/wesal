#!/bin/bash

echo "🔧 Emergency Sidebar Collapse Fix"
echo "=================================="

# Navigate to frontend directory
cd frontend

# Kill any running dev server
echo "Stopping any running dev server..."
pkill -f "vite" 2>/dev/null || true
pkill -f "npm run dev" 2>/dev/null || true

# Clear node modules cache
echo "Clearing cache..."
rm -rf node_modules/.vite 2>/dev/null || true
rm -rf dist 2>/dev/null || true

# Restart dev server
echo "Starting dev server..."
npm run dev &

echo ""
echo "✅ Fix applied! The sidebar should now:"
echo "   - Collapse to icons in both English and Arabic"
echo "   - Show tooltips with correct text when collapsed"
echo "   - Allow main content to expand properly"
echo ""
echo "🌐 Open your browser and test both languages"
echo "📱 Try collapsing/expanding the sidebar with the toggle button"