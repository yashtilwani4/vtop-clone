#!/bin/bash

# Netlify Deployment Script
echo "🚀 Deploying to Netlify"
echo "======================"

# Check if we're in the right directory
if [ ! -f "frontend/package.json" ]; then
    echo "❌ Error: Please run this script from the project root directory"
    exit 1
fi

# Navigate to frontend directory
cd frontend

echo "📦 Installing dependencies..."
npm install

echo "🔨 Building the application..."
npm run build

if [ $? -eq 0 ]; then
    echo "✅ Build successful!"
    echo ""
    echo "📁 Build files are ready in frontend/build/"
    echo ""
    echo "🌐 Netlify Deployment Options:"
    echo ""
    echo "1. 🎯 QUICK DEPLOY (Recommended):"
    echo "   - Go to: https://netlify.com/drop"
    echo "   - Drag & drop the 'build' folder"
    echo "   - Get instant live URL!"
    echo ""
    echo "2. 🔗 CONNECT GITHUB:"
    echo "   - Go to: https://netlify.com"
    echo "   - Connect your GitHub repository"
    echo "   - Base directory: frontend"
    echo "   - Build command: npm run build"
    echo "   - Publish directory: build"
    echo ""
    echo "3. 📱 NETLIFY CLI:"
    echo "   npm install -g netlify-cli"
    echo "   netlify deploy --prod --dir=build"
    echo ""
    echo "🔧 Environment Variables to set in Netlify:"
    echo "   REACT_APP_API_URL=https://your-backend.onrender.com/api"
    echo "   REACT_APP_APP_NAME=VTOP Academic Portal"
    echo "   REACT_APP_VERSION=1.0.0"
    echo "   REACT_APP_ENV=production"
    echo ""
    echo "🎉 Your app is ready for deployment!"
else
    echo "❌ Build failed! Please check the error messages above."
    exit 1
fi