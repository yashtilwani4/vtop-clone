#!/bin/bash

# VTOP Academic Portal - Vercel + Render Deployment Script
# This script helps prepare your project for Vercel and Render deployment

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Logging functions
log() {
    echo -e "${GREEN}[$(date +'%Y-%m-%d %H:%M:%S')]${NC} $1"
}

error() {
    echo -e "${RED}[ERROR]${NC} $1"
    exit 1
}

warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

info() {
    echo -e "${BLUE}[INFO]${NC} $1"
}

# Check if git is initialized
check_git() {
    if [ ! -d ".git" ]; then
        warning "Git repository not initialized. Initializing..."
        git init
        git add .
        git commit -m "Initial commit for deployment"
    fi
}

# Check if remote origin exists
check_remote() {
    if ! git remote get-url origin &> /dev/null; then
        warning "No git remote 'origin' found."
        echo "Please add your GitHub repository as origin:"
        echo "git remote add origin https://github.com/yourusername/your-repo.git"
        echo "git push -u origin main"
        exit 1
    fi
}

# Update package.json scripts for deployment
update_package_scripts() {
    log "Updating package.json scripts for deployment..."
    
    # Backend package.json
    if [ -f "backend/package.json" ]; then
        # Check if build script exists, if not add it
        if ! grep -q '"build"' backend/package.json; then
            # Add build script after scripts opening
            sed -i 's/"scripts": {/"scripts": {\n    "build": "npm install",/' backend/package.json
        fi
        
        # Ensure start script exists
        if ! grep -q '"start"' backend/package.json; then
            sed -i 's/"scripts": {/"scripts": {\n    "start": "node server.js",/' backend/package.json
        fi
    fi
    
    log "Package.json scripts updated"
}

# Create necessary configuration files
create_config_files() {
    log "Creating deployment configuration files..."
    
    # Vercel configuration already created
    if [ ! -f "frontend/vercel.json" ]; then
        warning "frontend/vercel.json not found. Please ensure it exists."
    fi
    
    # Render configuration already created
    if [ ! -f "render.yaml" ]; then
        warning "render.yaml not found. Please ensure it exists."
    fi
    
    log "Configuration files checked"
}

# Setup environment variables
setup_environment() {
    log "Setting up environment variables..."
    
    # Backend environment
    if [ ! -f "backend/.env.production" ]; then
        warning "backend/.env.production not found. Please create it with your production settings."
    fi
    
    # Frontend environment
    if [ ! -f "frontend/.env.production" ]; then
        warning "frontend/.env.production not found. Please create it with your production settings."
    fi
    
    log "Environment setup completed"
}

# Validate project structure
validate_structure() {
    log "Validating project structure..."
    
    # Check required directories
    if [ ! -d "backend" ]; then
        error "Backend directory not found"
    fi
    
    if [ ! -d "frontend" ]; then
        error "Frontend directory not found"
    fi
    
    # Check required files
    if [ ! -f "backend/server.js" ]; then
        error "backend/server.js not found"
    fi
    
    if [ ! -f "frontend/package.json" ]; then
        error "frontend/package.json not found"
    fi
    
    log "Project structure validation passed"
}

# Test build locally
test_build() {
    log "Testing local build..."
    
    # Test backend
    cd backend
    if npm install; then
        log "Backend dependencies installed successfully"
    else
        error "Backend dependency installation failed"
    fi
    cd ..
    
    # Test frontend build
    cd frontend
    if npm install && npm run build; then
        log "Frontend build successful"
    else
        error "Frontend build failed"
    fi
    cd ..
    
    log "Local build test completed"
}

# Generate deployment instructions
generate_instructions() {
    log "Generating deployment instructions..."
    
    cat << 'EOF' > DEPLOYMENT_INSTRUCTIONS.md
# 🚀 Deployment Instructions

## Backend Deployment (Render)

1. **Go to [render.com](https://render.com) and sign up/login**

2. **Create New Web Service**
   - Click "New +" → "Web Service"
   - Connect your GitHub repository
   - Configure:
     - Name: `vtop-backend`
     - Environment: `Node`
     - Region: Choose closest to your users
     - Branch: `main`
     - Root Directory: `backend`
     - Build Command: `npm install`
     - Start Command: `npm start`

3. **Add Environment Variables**
   ```
   NODE_ENV=production
   PORT=10000
   MONGODB_URI=mongodb+srv://username:password@cluster.mongodb.net/vtop_academic_portal
   JWT_SECRET=your-super-secret-jwt-key-make-it-very-long
   JWT_EXPIRES_IN=7d
   FRONTEND_URL=https://your-app-name.vercel.app
   ```

4. **Deploy and note your backend URL**

## Frontend Deployment (Vercel)

1. **Go to [vercel.com](https://vercel.com) and sign up/login**

2. **Import Project**
   - Click "New Project"
   - Import your GitHub repository
   - Configure:
     - Framework Preset: `Create React App`
     - Root Directory: `frontend`
     - Build Command: `npm run build`
     - Output Directory: `build`

3. **Add Environment Variables**
   ```
   REACT_APP_API_URL=https://your-backend-url.onrender.com/api
   REACT_APP_APP_NAME=VTOP Academic Portal
   REACT_APP_VERSION=1.0.0
   ```

4. **Deploy**

## Database Setup (MongoDB Atlas)

1. **Create MongoDB Atlas account at [cloud.mongodb.com](https://cloud.mongodb.com)**
2. **Create new cluster (free tier available)**
3. **Create database user and get connection string**
4. **Update MONGODB_URI in Render environment variables**

## Seed Database

1. **Go to your Render service dashboard**
2. **Click "Shell" tab**
3. **Run: `npm run seed`**

## Test Deployment

- Visit your Vercel URL
- Login with: `neha.24bcy10007@vitbhopal.ac.in` / `nehababel@2026`
- Verify all functionality works

Your app is now live! 🎉
EOF

    log "Deployment instructions generated in DEPLOYMENT_INSTRUCTIONS.md"
}

# Main deployment preparation function
main() {
    log "Starting Vercel + Render deployment preparation..."
    
    validate_structure
    check_git
    check_remote
    update_package_scripts
    create_config_files
    setup_environment
    test_build
    generate_instructions
    
    log "Deployment preparation completed successfully!"
    
    echo
    echo -e "${GREEN}🎉 Your project is ready for deployment!${NC}"
    echo
    echo -e "${BLUE}Next steps:${NC}"
    echo "1. Push your code to GitHub:"
    echo "   git add ."
    echo "   git commit -m 'Prepare for deployment'"
    echo "   git push origin main"
    echo
    echo "2. Follow the instructions in DEPLOYMENT_INSTRUCTIONS.md"
    echo
    echo "3. Deploy backend to Render first, then frontend to Vercel"
    echo
    echo -e "${YELLOW}Important:${NC}"
    echo "- Update MongoDB connection string in Render environment variables"
    echo "- Update FRONTEND_URL in Render with your Vercel domain"
    echo "- Update REACT_APP_API_URL in Vercel with your Render domain"
    echo
    echo -e "${GREEN}Happy deploying! 🚀${NC}"
}

# Run main function
main "$@"