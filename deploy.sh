#!/bin/bash

# VTOP Academic Portal Deployment Script
# Usage: ./deploy.sh [environment]
# Environments: development, staging, production

set -e  # Exit on any error

# Configuration
ENVIRONMENT=${1:-development}
PROJECT_NAME="vtop-portal"
BACKUP_DIR="/backups"
LOG_FILE="/var/log/deploy.log"

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Logging function
log() {
    echo -e "${GREEN}[$(date +'%Y-%m-%d %H:%M:%S')]${NC} $1" | tee -a $LOG_FILE
}

error() {
    echo -e "${RED}[ERROR]${NC} $1" | tee -a $LOG_FILE
    exit 1
}

warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1" | tee -a $LOG_FILE
}

info() {
    echo -e "${BLUE}[INFO]${NC} $1" | tee -a $LOG_FILE
}

# Check if running as root
check_root() {
    if [[ $EUID -eq 0 ]]; then
        error "This script should not be run as root for security reasons"
    fi
}

# Check system requirements
check_requirements() {
    log "Checking system requirements..."
    
    # Check Node.js
    if ! command -v node &> /dev/null; then
        error "Node.js is not installed"
    fi
    
    # Check npm
    if ! command -v npm &> /dev/null; then
        error "npm is not installed"
    fi
    
    # Check PM2
    if ! command -v pm2 &> /dev/null; then
        warning "PM2 is not installed. Installing..."
        npm install -g pm2
    fi
    
    # Check MongoDB
    if ! command -v mongod &> /dev/null; then
        warning "MongoDB is not installed locally. Make sure you have a MongoDB connection string."
    fi
    
    # Check Nginx
    if ! command -v nginx &> /dev/null; then
        warning "Nginx is not installed"
    fi
    
    log "System requirements check completed"
}

# Create necessary directories
create_directories() {
    log "Creating necessary directories..."
    
    sudo mkdir -p $BACKUP_DIR
    sudo chown $USER:$USER $BACKUP_DIR
    
    mkdir -p logs
    mkdir -p backend/uploads
    
    log "Directories created successfully"
}

# Install dependencies
install_dependencies() {
    log "Installing dependencies..."
    
    # Backend dependencies
    cd backend
    npm ci --production
    cd ..
    
    # Frontend dependencies
    cd frontend
    npm ci
    cd ..
    
    log "Dependencies installed successfully"
}

# Build frontend
build_frontend() {
    log "Building frontend..."
    
    cd frontend
    
    # Set environment variables based on deployment environment
    case $ENVIRONMENT in
        production)
            export REACT_APP_API_URL="https://yourdomain.com/api"
            ;;
        staging)
            export REACT_APP_API_URL="https://staging.yourdomain.com/api"
            ;;
        *)
            export REACT_APP_API_URL="http://localhost:5000/api"
            ;;
    esac
    
    npm run build
    cd ..
    
    log "Frontend built successfully"
}

# Setup environment files
setup_environment() {
    log "Setting up environment files..."
    
    # Backend environment
    if [ ! -f backend/.env ]; then
        cp backend/.env.example backend/.env
        warning "Please update backend/.env with your configuration"
    fi
    
    # Frontend environment
    if [ ! -f frontend/.env ]; then
        cp frontend/.env.example frontend/.env
        warning "Please update frontend/.env with your configuration"
    fi
    
    log "Environment files setup completed"
}

# Database operations
setup_database() {
    log "Setting up database..."
    
    # Check if we should seed the database
    read -p "Do you want to seed the database with initial data? (y/N): " -n 1 -r
    echo
    if [[ $REPLY =~ ^[Yy]$ ]]; then
        cd backend
        npm run seed
        cd ..
        log "Database seeded successfully"
    fi
}

# PM2 deployment
deploy_with_pm2() {
    log "Deploying with PM2..."
    
    # Stop existing processes
    pm2 stop $PROJECT_NAME 2>/dev/null || true
    pm2 delete $PROJECT_NAME 2>/dev/null || true
    
    # Start new process
    pm2 start ecosystem.config.js --env $ENVIRONMENT
    pm2 save
    
    # Setup PM2 startup script
    pm2 startup
    
    log "PM2 deployment completed"
}

# Docker deployment
deploy_with_docker() {
    log "Deploying with Docker..."
    
    # Check if Docker is installed
    if ! command -v docker &> /dev/null; then
        error "Docker is not installed"
    fi
    
    if ! command -v docker-compose &> /dev/null; then
        error "Docker Compose is not installed"
    fi
    
    # Stop existing containers
    docker-compose down
    
    # Build and start containers
    docker-compose up -d --build
    
    # Wait for services to be ready
    log "Waiting for services to start..."
    sleep 30
    
    # Check if services are running
    if docker-compose ps | grep -q "Up"; then
        log "Docker deployment completed successfully"
    else
        error "Docker deployment failed"
    fi
}

# Nginx configuration
setup_nginx() {
    log "Setting up Nginx..."
    
    # Check if Nginx config exists
    if [ ! -f /etc/nginx/sites-available/$PROJECT_NAME ]; then
        warning "Nginx configuration not found. Please set up Nginx manually."
        return
    fi
    
    # Enable site
    sudo ln -sf /etc/nginx/sites-available/$PROJECT_NAME /etc/nginx/sites-enabled/
    
    # Test configuration
    sudo nginx -t
    
    # Reload Nginx
    sudo systemctl reload nginx
    
    log "Nginx setup completed"
}

# Health check
health_check() {
    log "Performing health check..."
    
    # Wait for application to start
    sleep 10
    
    # Check backend health
    if curl -f http://localhost:5000/api/health &> /dev/null; then
        log "Backend health check passed"
    else
        error "Backend health check failed"
    fi
    
    # Check if frontend is accessible
    if curl -f http://localhost:3000 &> /dev/null || curl -f http://localhost:80 &> /dev/null; then
        log "Frontend health check passed"
    else
        warning "Frontend health check failed"
    fi
    
    log "Health check completed"
}

# Backup current deployment
backup_deployment() {
    if [ -d "/var/www/$PROJECT_NAME" ]; then
        log "Creating backup of current deployment..."
        
        BACKUP_NAME="${PROJECT_NAME}_backup_$(date +%Y%m%d_%H%M%S)"
        tar -czf "$BACKUP_DIR/$BACKUP_NAME.tar.gz" -C /var/www $PROJECT_NAME
        
        log "Backup created: $BACKUP_DIR/$BACKUP_NAME.tar.gz"
    fi
}

# Main deployment function
main() {
    log "Starting deployment for environment: $ENVIRONMENT"
    
    check_root
    check_requirements
    create_directories
    backup_deployment
    setup_environment
    install_dependencies
    build_frontend
    setup_database
    
    # Choose deployment method
    echo "Choose deployment method:"
    echo "1) PM2 (recommended for VPS)"
    echo "2) Docker"
    read -p "Enter choice (1-2): " -n 1 -r
    echo
    
    case $REPLY in
        1)
            deploy_with_pm2
            setup_nginx
            ;;
        2)
            deploy_with_docker
            ;;
        *)
            error "Invalid choice"
            ;;
    esac
    
    health_check
    
    log "Deployment completed successfully!"
    log "Application should be accessible at:"
    log "- Frontend: http://localhost (or your domain)"
    log "- Backend API: http://localhost/api (or your domain/api)"
    
    # Show next steps
    echo
    echo -e "${GREEN}Next steps:${NC}"
    echo "1. Update DNS records to point to your server"
    echo "2. Set up SSL certificate with Let's Encrypt"
    echo "3. Configure monitoring and backups"
    echo "4. Update environment variables for production"
}

# Run main function
main "$@"