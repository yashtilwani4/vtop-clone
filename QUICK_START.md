# 🚀 VTOP Academic Portal - Quick Start Guide

## Prerequisites
- Node.js 16+ and npm 8+
- MongoDB (local or Atlas)
- Git

## 1. Clone & Setup
```bash
git clone <your-repo-url>
cd vtop-academic-portal
npm run install-deps
```

## 2. Environment Configuration
```bash
# Backend
cp backend/.env.example backend/.env
# Edit backend/.env with your MongoDB URI and JWT secret

# Frontend  
cp frontend/.env.example frontend/.env
# Edit frontend/.env with your API URL
```

## 3. Database Setup
```bash
npm run seed
```

## 4. Start Development
```bash
npm run dev
```

## 5. Access Application
- **Frontend**: http://localhost:3000
- **Backend**: http://localhost:5000
- **Login**: neha.24bcy10007@vitbhopal.ac.in / nehababel@2026

## 🐳 Docker Quick Start
```bash
docker-compose up -d
```

## 📦 Production Deployment
```bash
# Make deploy script executable (Linux/Mac)
chmod +x deploy.sh

# Run deployment
./deploy.sh production
```

## 🔧 Common Commands
```bash
# Install all dependencies
npm run install-deps

# Start development servers
npm run dev

# Build for production
npm run build

# Seed database
npm run seed

# Run tests
npm test

# Docker commands
npm run docker:up
npm run docker:down
npm run docker:logs
```

## 📱 Default Accounts

### Student Account
- **Email**: neha.24bcy10007@vitbhopal.ac.in
- **Password**: nehababel@2026
- **Registration**: 24BCY10007

### Faculty Account (if seeded)
- **Email**: faculty@vitbhopal.ac.in
- **Password**: faculty123

### Admin Account (if seeded)
- **Email**: admin@vitbhopal.ac.in
- **Password**: admin123

## 🆘 Need Help?
- Check [DEPLOYMENT_GUIDE.md](./DEPLOYMENT_GUIDE.md) for detailed deployment instructions
- Check [README.md](./README.md) for project documentation
- Open an issue on GitHub for bugs or questions

## 🎯 Key Features
- ✅ Student Dashboard with CGPA tracking
- ✅ Results Management (3 semesters)
- ✅ Course Registration
- ✅ Attendance Tracking
- ✅ Timetable Management
- ✅ Notice Board
- ✅ Mobile-Responsive Design
- ✅ Role-based Access (Student/Faculty/Admin)

Happy coding! 🎉