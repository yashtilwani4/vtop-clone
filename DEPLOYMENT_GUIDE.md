# VTOP Academic Portal - Deployment Guide

## 📋 Table of Contents
1. [Prerequisites](#prerequisites)
2. [Environment Setup](#environment-setup)
3. [Local Development Deployment](#local-development-deployment)
4. [Production Deployment Options](#production-deployment-options)
   - [Option 1: Traditional VPS/Server](#option-1-traditional-vpsserver)
   - [Option 2: Heroku Deployment](#option-2-heroku-deployment)
   - [Option 3: Vercel + Railway](#option-3-vercel--railway)
   - [Option 4: Docker Deployment](#option-4-docker-deployment)
5. [Database Setup](#database-setup)
6. [SSL Certificate Setup](#ssl-certificate-setup)
7. [Domain Configuration](#domain-configuration)
8. [Monitoring & Maintenance](#monitoring--maintenance)
9. [Troubleshooting](#troubleshooting)

---

## Prerequisites

### System Requirements
- **Node.js**: v16.0.0 or higher
- **npm**: v8.0.0 or higher
- **MongoDB**: v5.0 or higher
- **Git**: Latest version
- **Domain**: For production deployment
- **SSL Certificate**: For HTTPS (recommended)

### Development Tools
```bash
# Check versions
node --version
npm --version
git --version
```

---

## Environment Setup

### 1. Clone Repository
```bash
git clone <your-repository-url>
cd vtop-academic-portal
```

### 2. Install Dependencies
```bash
# Install backend dependencies
cd backend
npm install

# Install frontend dependencies
cd ../frontend
npm install
```

### 3. Environment Variables

#### Backend Environment (.env)
```bash
# Create backend/.env file
cd backend
cp .env.example .env
```

**Required Environment Variables:**
```env
# Database
MONGODB_URI=mongodb://localhost:27017/vtop_academic_portal
# For production: mongodb+srv://username:password@cluster.mongodb.net/vtop_academic_portal

# JWT Configuration
JWT_SECRET=your-super-secret-jwt-key-here-make-it-long-and-random
JWT_EXPIRES_IN=7d

# Server Configuration
PORT=5000
NODE_ENV=production

# CORS Configuration
FRONTEND_URL=http://localhost:3000
# For production: https://yourdomain.com

# Email Configuration (Optional)
EMAIL_HOST=smtp.gmail.com
EMAIL_PORT=587
EMAIL_USER=your-email@gmail.com
EMAIL_PASS=your-app-password

# File Upload (Optional)
MAX_FILE_SIZE=5242880
UPLOAD_PATH=./uploads
```

#### Frontend Environment (.env)
```bash
# Create frontend/.env file
cd frontend
cp .env.example .env
```

**Required Environment Variables:**
```env
# API Configuration
REACT_APP_API_URL=http://localhost:5000/api
# For production: https://api.yourdomain.com/api

# App Configuration
REACT_APP_APP_NAME=VTOP Academic Portal
REACT_APP_VERSION=1.0.0

# Optional: Analytics
REACT_APP_GOOGLE_ANALYTICS_ID=your-ga-id
```

---

## Local Development Deployment

### 1. Database Setup
```bash
# Install MongoDB locally or use MongoDB Atlas
# For local MongoDB:
mongod --dbpath /path/to/your/db

# For MongoDB Atlas:
# 1. Create account at https://cloud.mongodb.com
# 2. Create cluster
# 3. Get connection string
# 4. Update MONGODB_URI in backend/.env
```

### 2. Seed Database
```bash
cd backend
npm run seed
# or
node scripts/seedData.js
```

### 3. Start Development Servers
```bash
# Terminal 1: Start Backend
cd backend
npm run dev

# Terminal 2: Start Frontend
cd frontend
npm start
```

### 4. Access Application
- **Frontend**: http://localhost:3000
- **Backend API**: http://localhost:5000
- **Default Login**: 
  - Username: `neha.24bcy10007@vitbhopal.ac.in`
  - Password: `nehababel@2026`

---

## Production Deployment Options

## Option 1: Traditional VPS/Server

### 1. Server Setup (Ubuntu 20.04+)
```bash
# Update system
sudo apt update && sudo apt upgrade -y

# Install Node.js
curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
sudo apt-get install -y nodejs

# Install MongoDB
wget -qO - https://www.mongodb.org/static/pgp/server-6.0.asc | sudo apt-key add -
echo "deb [ arch=amd64,arm64 ] https://repo.mongodb.org/apt/ubuntu focal/mongodb-org/6.0 multiverse" | sudo tee /etc/apt/sources.list.d/mongodb-org-6.0.list
sudo apt-get update
sudo apt-get install -y mongodb-org

# Install PM2 for process management
sudo npm install -g pm2

# Install Nginx
sudo apt install nginx -y
```

### 2. Deploy Application
```bash
# Clone repository
git clone <your-repository-url> /var/www/vtop-portal
cd /var/www/vtop-portal

# Set permissions
sudo chown -R $USER:$USER /var/www/vtop-portal

# Install dependencies
cd backend && npm install --production
cd ../frontend && npm install

# Build frontend
npm run build

# Setup environment variables
cp backend/.env.example backend/.env
cp frontend/.env.example frontend/.env
# Edit the .env files with production values
```

### 3. PM2 Configuration
```bash
# Create ecosystem file
cat > ecosystem.config.js << EOF
module.exports = {
  apps: [{
    name: 'vtop-backend',
    script: './backend/server.js',
    cwd: '/var/www/vtop-portal',
    env: {
      NODE_ENV: 'production',
      PORT: 5000
    },
    instances: 'max',
    exec_mode: 'cluster',
    error_file: './logs/err.log',
    out_file: './logs/out.log',
    log_file: './logs/combined.log',
    time: true
  }]
}
EOF

# Start application
pm2 start ecosystem.config.js
pm2 save
pm2 startup
```

### 4. Nginx Configuration
```bash
# Create Nginx config
sudo nano /etc/nginx/sites-available/vtop-portal
```

```nginx
server {
    listen 80;
    server_name yourdomain.com www.yourdomain.com;

    # Frontend
    location / {
        root /var/www/vtop-portal/frontend/build;
        index index.html index.htm;
        try_files $uri $uri/ /index.html;
    }

    # Backend API
    location /api {
        proxy_pass http://localhost:5000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
    }

    # Security headers
    add_header X-Frame-Options "SAMEORIGIN" always;
    add_header X-XSS-Protection "1; mode=block" always;
    add_header X-Content-Type-Options "nosniff" always;
    add_header Referrer-Policy "no-referrer-when-downgrade" always;
    add_header Content-Security-Policy "default-src 'self' http: https: data: blob: 'unsafe-inline'" always;
}
```

```bash
# Enable site
sudo ln -s /etc/nginx/sites-available/vtop-portal /etc/nginx/sites-enabled/
sudo nginx -t
sudo systemctl restart nginx
```

---

## Option 2: Heroku Deployment

### 1. Prepare for Heroku
```bash
# Install Heroku CLI
# Visit: https://devcenter.heroku.com/articles/heroku-cli

# Login to Heroku
heroku login
```

### 2. Backend Deployment
```bash
cd backend

# Create Heroku app
heroku create vtop-backend-app

# Add MongoDB addon
heroku addons:create mongolab:sandbox

# Set environment variables
heroku config:set NODE_ENV=production
heroku config:set JWT_SECRET=your-jwt-secret
heroku config:set FRONTEND_URL=https://vtop-frontend-app.vercel.app

# Create Procfile
echo "web: node server.js" > Procfile

# Deploy
git init
git add .
git commit -m "Initial commit"
git push heroku main
```

### 3. Frontend Deployment (Vercel)
```bash
cd frontend

# Install Vercel CLI
npm i -g vercel

# Update environment variables
# Create .env.production
echo "REACT_APP_API_URL=https://vtop-backend-app.herokuapp.com/api" > .env.production

# Deploy
vercel --prod
```

---

## Option 3: Vercel + Railway

### 1. Backend on Railway
```bash
# Visit railway.app and connect GitHub
# Create new project from GitHub repo
# Add environment variables in Railway dashboard:
# - MONGODB_URI (use Railway MongoDB addon)
# - JWT_SECRET
# - NODE_ENV=production
# - FRONTEND_URL=https://your-vercel-domain.vercel.app
```

### 2. Frontend on Vercel
```bash
# Visit vercel.com and connect GitHub
# Import project
# Add environment variables:
# - REACT_APP_API_URL=https://your-railway-domain.railway.app/api
# Deploy automatically on git push
```

---

## Option 4: Docker Deployment

### 1. Create Dockerfiles

#### Backend Dockerfile
```dockerfile
# backend/Dockerfile
FROM node:18-alpine

WORKDIR /app

COPY package*.json ./
RUN npm ci --only=production

COPY . .

EXPOSE 5000

CMD ["node", "server.js"]
```

#### Frontend Dockerfile
```dockerfile
# frontend/Dockerfile
FROM node:18-alpine as build

WORKDIR /app
COPY package*.json ./
RUN npm ci

COPY . .
RUN npm run build

FROM nginx:alpine
COPY --from=build /app/build /usr/share/nginx/html
COPY nginx.conf /etc/nginx/nginx.conf

EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]
```

### 2. Docker Compose
```yaml
# docker-compose.yml
version: '3.8'

services:
  mongodb:
    image: mongo:6.0
    container_name: vtop-mongodb
    restart: unless-stopped
    environment:
      MONGO_INITDB_ROOT_USERNAME: admin
      MONGO_INITDB_ROOT_PASSWORD: password123
    ports:
      - "27017:27017"
    volumes:
      - mongodb_data:/data/db

  backend:
    build: ./backend
    container_name: vtop-backend
    restart: unless-stopped
    ports:
      - "5000:5000"
    environment:
      - NODE_ENV=production
      - MONGODB_URI=mongodb://admin:password123@mongodb:27017/vtop_academic_portal?authSource=admin
      - JWT_SECRET=your-jwt-secret
      - FRONTEND_URL=http://localhost:3000
    depends_on:
      - mongodb

  frontend:
    build: ./frontend
    container_name: vtop-frontend
    restart: unless-stopped
    ports:
      - "80:80"
    depends_on:
      - backend

volumes:
  mongodb_data:
```

### 3. Deploy with Docker
```bash
# Build and run
docker-compose up -d

# View logs
docker-compose logs -f

# Stop
docker-compose down
```

---

## Database Setup

### 1. MongoDB Atlas (Recommended for Production)
```bash
# 1. Create account at https://cloud.mongodb.com
# 2. Create new cluster
# 3. Create database user
# 4. Whitelist IP addresses (0.0.0.0/0 for all IPs)
# 5. Get connection string
# 6. Update MONGODB_URI in environment variables
```

### 2. Local MongoDB
```bash
# Install MongoDB
# Ubuntu/Debian:
sudo apt-get install mongodb

# macOS:
brew install mongodb-community

# Windows:
# Download from https://www.mongodb.com/try/download/community

# Start MongoDB
sudo systemctl start mongod

# Enable auto-start
sudo systemctl enable mongod
```

### 3. Database Initialization
```bash
cd backend

# Seed database with initial data
npm run seed

# Or run specific scripts
node scripts/seedData.js
node scripts/createInterimResults.js
node scripts/addWinterSemester.js
node scripts/addFallSemester.js
```

---

## SSL Certificate Setup

### 1. Let's Encrypt (Free SSL)
```bash
# Install Certbot
sudo apt install certbot python3-certbot-nginx

# Get certificate
sudo certbot --nginx -d yourdomain.com -d www.yourdomain.com

# Auto-renewal
sudo crontab -e
# Add: 0 12 * * * /usr/bin/certbot renew --quiet
```

### 2. Update Nginx for HTTPS
```nginx
server {
    listen 80;
    server_name yourdomain.com www.yourdomain.com;
    return 301 https://$server_name$request_uri;
}

server {
    listen 443 ssl http2;
    server_name yourdomain.com www.yourdomain.com;

    ssl_certificate /etc/letsencrypt/live/yourdomain.com/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/yourdomain.com/privkey.pem;

    # SSL configuration
    ssl_protocols TLSv1.2 TLSv1.3;
    ssl_ciphers ECDHE-RSA-AES256-GCM-SHA512:DHE-RSA-AES256-GCM-SHA512:ECDHE-RSA-AES256-GCM-SHA384:DHE-RSA-AES256-GCM-SHA384;
    ssl_prefer_server_ciphers off;

    # Rest of your configuration...
}
```

---

## Domain Configuration

### 1. DNS Setup
```bash
# Add these DNS records:
# A record: @ -> Your server IP
# A record: www -> Your server IP
# CNAME record: api -> yourdomain.com (if using subdomain for API)
```

### 2. Update Environment Variables
```bash
# Backend .env
FRONTEND_URL=https://yourdomain.com

# Frontend .env
REACT_APP_API_URL=https://yourdomain.com/api
# or
REACT_APP_API_URL=https://api.yourdomain.com
```

---

## Monitoring & Maintenance

### 1. PM2 Monitoring
```bash
# Monitor processes
pm2 monit

# View logs
pm2 logs

# Restart application
pm2 restart all

# Update application
git pull
npm install --production
pm2 restart all
```

### 2. Database Backup
```bash
# Create backup script
cat > backup.sh << 'EOF'
#!/bin/bash
DATE=$(date +%Y%m%d_%H%M%S)
mongodump --uri="$MONGODB_URI" --out="/backups/vtop_backup_$DATE"
# Upload to cloud storage (optional)
EOF

chmod +x backup.sh

# Schedule daily backups
crontab -e
# Add: 0 2 * * * /path/to/backup.sh
```

### 3. Log Rotation
```bash
# Configure logrotate
sudo nano /etc/logrotate.d/vtop-portal

/var/www/vtop-portal/logs/*.log {
    daily
    missingok
    rotate 52
    compress
    delaycompress
    notifempty
    create 644 $USER $USER
    postrotate
        pm2 reloadLogs
    endscript
}
```

### 4. Health Checks
```bash
# Create health check endpoint in backend
# Add to backend/routes/health.js
app.get('/health', (req, res) => {
  res.status(200).json({
    status: 'OK',
    timestamp: new Date().toISOString(),
    uptime: process.uptime()
  });
});

# Monitor with curl
curl https://yourdomain.com/api/health
```

---

## Troubleshooting

### Common Issues

#### 1. Port Already in Use
```bash
# Find process using port
sudo lsof -i :5000
sudo lsof -i :3000

# Kill process
sudo kill -9 <PID>
```

#### 2. MongoDB Connection Issues
```bash
# Check MongoDB status
sudo systemctl status mongod

# Check connection
mongo --eval "db.adminCommand('ismaster')"

# Check logs
sudo tail -f /var/log/mongodb/mongod.log
```

#### 3. Nginx Issues
```bash
# Test configuration
sudo nginx -t

# Check status
sudo systemctl status nginx

# Check logs
sudo tail -f /var/log/nginx/error.log
```

#### 4. PM2 Issues
```bash
# Check PM2 status
pm2 status

# Restart PM2
pm2 kill
pm2 start ecosystem.config.js

# Check logs
pm2 logs --lines 100
```

#### 5. Build Issues
```bash
# Clear npm cache
npm cache clean --force

# Delete node_modules and reinstall
rm -rf node_modules package-lock.json
npm install

# Frontend build issues
cd frontend
rm -rf build
npm run build
```

### Performance Optimization

#### 1. Enable Gzip Compression
```nginx
# Add to Nginx config
gzip on;
gzip_vary on;
gzip_min_length 1024;
gzip_proxied expired no-cache no-store private must-revalidate auth;
gzip_types text/plain text/css text/xml text/javascript application/x-javascript application/xml+rss application/javascript;
```

#### 2. Enable Caching
```nginx
# Static files caching
location ~* \.(js|css|png|jpg|jpeg|gif|ico|svg)$ {
    expires 1y;
    add_header Cache-Control "public, immutable";
}
```

#### 3. Database Indexing
```javascript
// Add indexes for better performance
// In MongoDB shell or script:
db.users.createIndex({ "email": 1 });
db.users.createIndex({ "registrationNumber": 1 });
db.simpleresults.createIndex({ "studentId": 1, "semester": 1 });
```

---

## Security Checklist

- [ ] Use HTTPS in production
- [ ] Set strong JWT secret
- [ ] Configure CORS properly
- [ ] Use environment variables for secrets
- [ ] Enable MongoDB authentication
- [ ] Set up firewall rules
- [ ] Regular security updates
- [ ] Monitor logs for suspicious activity
- [ ] Use rate limiting
- [ ] Validate all inputs
- [ ] Sanitize database queries

---

## Support & Maintenance

### Regular Tasks
1. **Weekly**: Check application logs and performance
2. **Monthly**: Update dependencies and security patches
3. **Quarterly**: Database backup verification and cleanup
4. **Annually**: SSL certificate renewal (if not automated)

### Monitoring Tools
- **Uptime**: UptimeRobot, Pingdom
- **Performance**: New Relic, DataDog
- **Logs**: ELK Stack, Splunk
- **Errors**: Sentry, Bugsnag

---

## Conclusion

This deployment guide covers multiple deployment scenarios from development to production. Choose the option that best fits your requirements:

- **Development**: Local setup with MongoDB
- **Small Scale**: VPS with Nginx and PM2
- **Medium Scale**: Heroku + Vercel
- **Large Scale**: Docker with orchestration
- **Enterprise**: Kubernetes with monitoring

For any issues or questions, refer to the troubleshooting section or check the application logs.

**Happy Deploying! 🚀**