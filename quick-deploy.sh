#!/bin/bash

# Quick WesalTech Deployment Script
# Run this on your server: bash quick-deploy.sh

echo "🚀 WesalTech Quick Deployment"
echo "============================="

# Set MySQL root password (you'll need to set this)
export MYSQL_ROOT_PASSWORD="112235813nJ"

# Make the main deployment script executable
chmod +x deploy.sh

# Run the deployment
./deploy.sh

echo "✅ Quick deployment completed!"