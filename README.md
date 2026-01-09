# VTOP Academic Portal

A comprehensive academic management system built with React.js and Node.js, designed to replicate the functionality of VIT's VTOP portal.

## 🌟 Features

### Student Features
- **Dashboard**: Overview of academic performance, CGPA, and quick actions
- **Results Management**: View semester-wise results with GPA calculations
- **Course Registration**: Register for courses and view enrolled courses
- **Attendance Tracking**: Monitor attendance across all subjects
- **Timetable**: View class schedules and academic calendar
- **Notice Board**: Stay updated with important announcements
- **Profile Management**: Update personal information and settings

### Faculty Features
- **Course Management**: Manage assigned courses and student enrollments
- **Attendance Management**: Mark and track student attendance
- **Results Entry**: Enter and manage student grades and results
- **Notice Publishing**: Create and publish notices for students
- **Student Analytics**: View student performance and attendance reports

### Admin Features
- **User Management**: Manage student, faculty, and staff accounts
- **Course Administration**: Create and manage academic courses
- **System Configuration**: Configure system settings and parameters
- **Reports & Analytics**: Generate comprehensive academic reports

## 🛠️ Technology Stack

### Frontend
- **React.js 18** - Modern UI library
- **Tailwind CSS** - Utility-first CSS framework
- **React Router** - Client-side routing
- **Axios** - HTTP client for API calls
- **Heroicons** - Beautiful SVG icons

### Backend
- **Node.js** - JavaScript runtime
- **Express.js** - Web application framework
- **MongoDB** - NoSQL database
- **Mongoose** - MongoDB object modeling
- **JWT** - JSON Web Token authentication
- **bcrypt** - Password hashing

### DevOps & Deployment
- **Docker** - Containerization
- **Nginx** - Web server and reverse proxy
- **PM2** - Process manager for Node.js
- **Let's Encrypt** - SSL certificates

## 📱 Mobile-Friendly Design

The application is fully responsive and optimized for:
- 📱 Mobile phones (320px+)
- 📱 Tablets (768px+)
- 💻 Desktops (1024px+)
- 🖥️ Large screens (1440px+)

## 🚀 Quick Start

### Prerequisites
- Node.js 16+ and npm 8+
- MongoDB (local or Atlas)
- Git

### Installation
```bash
# Clone repository
git clone <your-repository-url>
cd vtop-academic-portal

# Install dependencies
npm run install-deps

# Setup environment variables
cp backend/.env.example backend/.env
cp frontend/.env.example frontend/.env
# Edit the .env files with your configuration

# Seed database
npm run seed

# Start development servers
npm run dev
```

### Access Application
- **Frontend**: http://localhost:3000
- **Backend API**: http://localhost:5000
- **Default Login**: neha.24bcy10007@vitbhopal.ac.in / nehababel@2026

## 🐳 Docker Deployment

```bash
# Build and start containers
docker-compose up -d

# View logs
docker-compose logs -f

# Stop containers
docker-compose down
```

## 📦 Production Deployment

For detailed deployment instructions, see [DEPLOYMENT_GUIDE.md](./DEPLOYMENT_GUIDE.md)

### Quick Production Deploy
```bash
# Make script executable (Linux/Mac)
chmod +x deploy.sh

# Deploy to production
./deploy.sh production
```

### Deployment Options
1. **Traditional VPS** - Ubuntu server with Nginx and PM2
2. **Heroku + Vercel** - Cloud platform deployment
3. **Docker** - Containerized deployment
4. **Railway + Vercel** - Modern cloud deployment

## 🔧 Available Scripts

```bash
# Development
npm run dev              # Start both frontend and backend
npm run server          # Start backend only
npm run client          # Start frontend only

# Production
npm run build           # Build frontend for production
npm start              # Start production server
npm run deploy         # Deploy to production

# Database
npm run seed           # Seed database with sample data
npm run backup         # Backup database
npm run restore        # Restore database

# Docker
npm run docker:up      # Start Docker containers
npm run docker:down    # Stop Docker containers
npm run docker:logs    # View container logs

# Testing
npm test              # Run all tests
```

## 📊 Academic Data

The system includes realistic academic data:

### Student Profile
- **Name**: Neha Ajay Babel
- **Registration**: 24BCY10007
- **Email**: neha.24bcy10007@vitbhopal.ac.in
- **Program**: B.Tech Cyber Security
- **Overall CGPA**: 6.27

### Semester Results
1. **Interim Semester**: 7 courses, 6.00 GPA
2. **Winter Semester 2024-25**: 8 courses, 7.17 GPA
3. **Fall Semester 2025-26**: 8 courses, 5.45 GPA

## 🔐 Security Features

- JWT-based authentication
- Password hashing with bcrypt
- Role-based access control
- Input validation and sanitization
- CORS protection
- Rate limiting
- Security headers
- SQL injection prevention

## 🎨 UI/UX Features

- **Modern Design**: Clean and professional interface
- **Responsive Layout**: Works on all device sizes
- **Dark/Light Theme**: Automatic theme detection
- **Accessibility**: WCAG 2.1 compliant
- **Performance**: Optimized loading and caching
- **Animations**: Smooth transitions and micro-interactions

## 📈 Performance Optimizations

- Code splitting and lazy loading
- Image optimization
- Gzip compression
- Browser caching
- CDN integration
- Database indexing
- API response caching

## 🔍 Monitoring & Analytics

- Application performance monitoring
- Error tracking and reporting
- User analytics and insights
- System health checks
- Automated backups
- Log aggregation

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## 📝 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🆘 Support

- 📖 [Quick Start Guide](./QUICK_START.md)
- 🚀 [Deployment Guide](./DEPLOYMENT_GUIDE.md)
- 🐛 [Issue Tracker](https://github.com/yourusername/vtop-portal/issues)
- 💬 [Discussions](https://github.com/yourusername/vtop-portal/discussions)

## 🏗️ Project Structure

```
vtop-academic-portal/
├── backend/                 # Node.js backend
│   ├── models/             # Database models
│   ├── routes/             # API routes
│   ├── middleware/         # Custom middleware
│   ├── scripts/            # Database scripts
│   └── server.js           # Entry point
├── frontend/               # React frontend
│   ├── src/
│   │   ├── components/     # Reusable components
│   │   ├── pages/          # Page components
│   │   ├── contexts/       # React contexts
│   │   └── utils/          # Utility functions
│   └── public/             # Static assets
├── nginx/                  # Nginx configuration
├── docker-compose.yml      # Docker setup
├── ecosystem.config.js     # PM2 configuration
└── deploy.sh              # Deployment script
```

## 🎯 Roadmap

- [ ] Mobile app (React Native)
- [ ] Real-time notifications
- [ ] Advanced analytics dashboard
- [ ] Integration with external systems
- [ ] Multi-language support
- [ ] Offline functionality
- [ ] Advanced reporting tools
- [ ] API documentation with Swagger

---

**Built with ❤️ for VIT Bhopal Academic Community**