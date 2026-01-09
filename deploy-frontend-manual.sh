#!/bin/bash

# Manual Frontend Deployment Script
# Use this if Vercel dashboard deployment fails

echo "🚀 Manual Frontend Deployment Script"
echo "======================================"

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
    echo "🌐 Deployment Options:"
    echo "1. Vercel CLI: npx vercel --prod build/"
    echo "2. Netlify: Drag & drop the build/ folder to netlify.com/drop"
    echo "3. Firebase: firebase deploy (after firebase init)"
    echo "4. GitHub Pages: Push build/ contents to gh-pages branch"
    echo ""
    echo "🔧 If using Vercel dashboard:"
    echo "   - Root Directory: frontend"
    echo "   - Framework: Create React App"
    echo "   - Build Command: npm run build"
    echo "   - Output Directory: build"
else
    echo "❌ Build failed! Please check the error messages above."
    exit 1
fi