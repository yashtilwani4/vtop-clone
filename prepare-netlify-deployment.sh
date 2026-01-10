#!/bin/bash

echo "🚀 Preparing Netlify Deployment for VTOP"
echo "========================================"

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
    echo ""
    echo "✅ BUILD SUCCESSFUL!"
    echo "==================="
    echo ""
    echo "📁 Your deployment files are ready in: frontend/build/"
    echo ""
    echo "🎯 NEXT STEPS - Choose one option:"
    echo ""
    echo "1. 🚀 INSTANT DEPLOYMENT (Recommended):"
    echo "   • Go to: https://netlify.com/drop"
    echo "   • Drag the 'frontend/build' folder to the page"
    echo "   • Get your live URL in 2 minutes!"
    echo ""
    echo "2. 🔗 AUTOMATED DEPLOYMENT:"
    echo "   • Go to: https://netlify.com"
    echo "   • Connect your GitHub repository"
    echo "   • Base directory: frontend"
    echo "   • Build command: npm run build"
    echo "   • Publish directory: build"
    echo ""
    echo "3. 📱 CLI DEPLOYMENT:"
    echo "   npm install -g netlify-cli"
    echo "   netlify login"
    echo "   netlify deploy --prod --dir=build"
    echo ""
    echo "🔧 ENVIRONMENT VARIABLES TO SET:"
    echo "   REACT_APP_API_URL=https://your-backend.onrender.com/api"
    echo "   REACT_APP_APP_NAME=VTOP Academic Portal"
    echo "   REACT_APP_VERSION=1.0.0"
    echo "   REACT_APP_ENV=production"
    echo ""
    echo "📋 BUILD SUMMARY:"
    echo "   • Files: $(find build -type f | wc -l) files ready"
    echo "   • Size: $(du -sh build | cut -f1) total"
    echo "   • Status: ✅ Ready for deployment"
    echo ""
    echo "🎉 Your VTOP app is ready to go live!"
else
    echo "❌ Build failed! Please check the error messages above."
    exit 1
fi