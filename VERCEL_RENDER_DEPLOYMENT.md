# 🚀 VTOP Portal - Vercel + Render Deployment Guide

Deploy your VTOP Academic Portal with **Vercel** (frontend) and **Render** (backend + database) for a modern, scalable cloud deployment.

## 🌟 Why Vercel + Render?

- **Vercel**: Best-in-class frontend hosting with automatic deployments
- **Render**: Reliable backend hosting with built-in database support
- **Cost-effective**: Free tiers available for both platforms
- **Auto-scaling**: Handles traffic spikes automatically
- **Global CDN**: Fast loading times worldwide
- **Easy maintenance**: Automatic deployments from Git

---

## 📋 Prerequisites

- GitHub account (for code repository)
- Vercel account (free at [vercel.com](https://vercel.com))
- Render account (free at [render.com](https://render.com))
- Your VTOP portal code pushed to GitHub

---

## 🗄️ Step 1: Database Setup on Render

### 1.1 Create MongoDB Database

1. **Login to Render Dashboard**
   - Go to [render.com](https://render.com)
   - Sign up/Login with GitHub

2. **Create New Database**
   - Click "New +" → "PostgreSQL" or use external MongoDB
   - For MongoDB, we'll use MongoDB Atlas (recommended)

### 1.2 MongoDB Atlas Setup (Recommended)

1. **Create MongoDB Atlas Account**
   ```bash
   # Go to https://cloud.mongodb.com
   # Sign up for free account
   # Create new cluster (free tier available)
   ```

2. **Configure Database**
   - Choose AWS/Google Cloud/Azure
   - Select free tier (M0 Sandbox)
   - Choose region closest to your users
   - Create cluster (takes 1-3 minutes)

3. **Setup Database Access**
   - Go to "Database Access" → "Add New Database User"
   - Username: `vtop_admin`
   - Password: Generate secure password
   - Database User Privileges: "Read and write to any database"

4. **Configure Network Access**
   - Go to "Network Access" → "Add IP Address"
   - Add `0.0.0.0/0` (allow access from anywhere)
   - Or add specific Render IP ranges for better security

5. **Get Connection String**
   - Go to "Clusters" → "Connect" → "Connect your application"
   - Copy connection string:
   ```
   mongodb+srv://vtop_admin:<password>@cluster0.xxxxx.mongodb.net/vtop_academic_portal?retryWrites=true&w=majority
   ```

---

## 🖥️ Step 2: Backend Deployment on Render

### 2.1 Prepare Backend for Render

1. **Create Render Configuration**
   ```bash
   # Create render.yaml in project root
   touch render.yaml
   ```

2. **Add Build Script to Backend package.json**
   ```json
   {
     "scripts": {
       "build": "npm install",
       "start": "node server.js",
       "dev": "nodemon server.js",
       "seed": "node scripts/seedData.js"
     }
   }
   ```

### 2.2 Deploy Backend to Render

1. **Create New Web Service**
   - Login to Render Dashboard
   - Click "New +" → "Web Service"
   - Connect your GitHub repository
   - Select your repository

2. **Configure Service Settings**
   ```yaml
   Name: vtop-backend
   Environment: Node
   Region: Choose closest to your users
   Branch: main (or your main branch)
   Root Directory: backend
   Build Command: npm install
   Start Command: npm start
   ```

3. **Add Environment Variables**
   Click "Environment" tab and add:
   ```env
   NODE_ENV=production
   PORT=10000
   MONGODB_URI=mongodb+srv://vtop_admin:YOUR_PASSWORD@cluster0.xxxxx.mongodb.net/vtop_academic_portal?retryWrites=true&w=majority
   JWT_SECRET=your-super-secret-jwt-key-change-this-in-production-make-it-very-long
   JWT_EXPIRES_IN=7d
   FRONTEND_URL=https://your-app-name.vercel.app
   ```

4. **Deploy**
   - Click "Create Web Service"
   - Render will automatically build and deploy
   - Wait for deployment to complete (5-10 minutes)
   - Note your backend URL: `https://vtop-backend.onrender.com`

### 2.3 Seed Database (One-time)

1. **Create Seed Script Service**
   - Create another web service or use Render's background workers
   - Or run seed script manually via Render shell:

2. **Manual Seeding via Render Shell**
   - Go to your backend service dashboard
   - Click "Shell" tab
   - Run: `npm run seed`

---

## 🌐 Step 3: Frontend Deployment on Vercel

### 3.1 Prepare Frontend for Vercel

1. **Update Frontend Environment**
   ```bash
   # Create vercel.json in frontend directory
   cd frontend
   ```

2. **Create vercel.json**
   ```json
   {
     "rewrites": [
       {
         "source": "/(.*)",
         "destination": "/index.html"
       }
     ],
     "headers": [
       {
         "source": "/(.*)",
         "headers": [
           {
             "key": "X-Frame-Options",
             "value": "SAMEORIGIN"
           },
           {
             "key": "X-Content-Type-Options",
             "value": "nosniff"
           }
         ]
       }
     ]
   }
   ```

3. **Update Environment Variables**
   ```bash
   # Create .env.production in frontend directory
   echo "REACT_APP_API_URL=https://vtop-backend.onrender.com/api" > .env.production
   echo "REACT_APP_APP_NAME=VTOP Academic Portal" >> .env.production
   echo "REACT_APP_VERSION=1.0.0" >> .env.production
   ```

### 3.2 Deploy Frontend to Vercel

1. **Connect to Vercel**
   - Go to [vercel.com](https://vercel.com)
   - Sign up/Login with GitHub
   - Click "New Project"
   - Import your GitHub repository

2. **Configure Project Settings**
   ```yaml
   Framework Preset: Create React App
   Root Directory: frontend
   Build Command: npm run build
   Output Directory: build
   Install Command: npm install
   ```

3. **Add Environment Variables**
   In Vercel dashboard, go to Settings → Environment Variables:
   ```env
   REACT_APP_API_URL=https://vtop-backend.onrender.com/api
   REACT_APP_APP_NAME=VTOP Academic Portal
   REACT_APP_VERSION=1.0.0
   REACT_APP_ENV=production
   ```

4. **Deploy**
   - Click "Deploy"
   - Vercel will build and deploy automatically
   - Your app will be available at: `https://your-app-name.vercel.app`

---

## 🔧 Step 4: Configuration & Testing

### 4.1 Update CORS Settings

1. **Update Backend CORS**
   In your backend, update CORS configuration:
   ```javascript
   // backend/server.js or middleware
   const cors = require('cors');
   
   app.use(cors({
     origin: [
       'http://localhost:3000',
       'https://your-app-name.vercel.app'
     ],
     credentials: true
   }));
   ```

2. **Redeploy Backend**
   - Push changes to GitHub
   - Render will auto-deploy

### 4.2 Test Deployment

1. **Test Frontend**
   - Visit your Vercel URL
   - Check if the app loads correctly
   - Verify all pages are accessible

2. **Test Backend API**
   ```bash
   # Test health endpoint
   curl https://vtop-backend.onrender.com/api/health
   
   # Test login endpoint
   curl -X POST https://vtop-backend.onrender.com/api/simple-auth/login \
     -H "Content-Type: application/json" \
     -d '{"username":"neha.24bcy10007@vitbhopal.ac.in","password":"nehababel@2026"}'
   ```

3. **Test Full Application**
   - Login with: `neha.24bcy10007@vitbhopal.ac.in` / `nehababel@2026`
   - Check dashboard loads with CGPA data
   - Verify results page shows semester data
   - Test navigation between pages

---

## 🚀 Step 5: Custom Domain (Optional)

### 5.1 Setup Custom Domain on Vercel

1. **Add Domain**
   - Go to Vercel project settings
   - Click "Domains"
   - Add your custom domain (e.g., `vtop.yourdomain.com`)

2. **Configure DNS**
   ```dns
   # Add CNAME record in your DNS provider
   Type: CNAME
   Name: vtop (or your subdomain)
   Value: cname.vercel-dns.com
   ```

3. **Update Environment Variables**
   ```env
   # Update backend FRONTEND_URL
   FRONTEND_URL=https://vtop.yourdomain.com
   ```

### 5.2 Setup Custom Domain on Render (Optional)

1. **Add Custom Domain**
   - Go to Render service settings
   - Add custom domain (e.g., `api.yourdomain.com`)

2. **Configure DNS**
   ```dns
   # Add CNAME record
   Type: CNAME
   Name: api
   Value: your-service.onrender.com
   ```

---

## 📊 Step 6: Monitoring & Maintenance

### 6.1 Vercel Analytics

1. **Enable Analytics**
   - Go to Vercel project dashboard
   - Enable "Analytics" (free tier available)
   - Monitor page views, performance, and user behavior

### 6.2 Render Monitoring

1. **Monitor Backend**
   - Check Render dashboard for service health
   - Monitor response times and error rates
   - Set up alerts for downtime

### 6.3 Database Monitoring

1. **MongoDB Atlas Monitoring**
   - Monitor database performance
   - Set up alerts for high usage
   - Regular backups (automatic in Atlas)

---

## 🔄 Step 7: Automatic Deployments

### 7.1 Setup Auto-Deploy

Both Vercel and Render support automatic deployments:

1. **Vercel Auto-Deploy**
   - Automatically deploys on every push to main branch
   - Preview deployments for pull requests
   - Rollback capability

2. **Render Auto-Deploy**
   - Automatically deploys backend on push
   - Zero-downtime deployments
   - Health checks before switching traffic

### 7.2 Deployment Workflow

```bash
# Your typical workflow
git add .
git commit -m "Update feature"
git push origin main

# This triggers:
# 1. Render rebuilds and deploys backend
# 2. Vercel rebuilds and deploys frontend
# 3. Both services run health checks
# 4. Traffic switches to new version
```

---

## 💰 Cost Breakdown

### Free Tier Limits

**Vercel (Free)**
- 100GB bandwidth/month
- Unlimited personal projects
- Custom domains
- Automatic HTTPS

**Render (Free)**
- 750 hours/month (enough for 1 service)
- Automatic sleep after 15 min inactivity
- Custom domains
- Automatic HTTPS

**MongoDB Atlas (Free)**
- 512MB storage
- Shared RAM and CPU
- No backup/restore
- Community support

### Paid Upgrades (When Needed)

**Vercel Pro ($20/month)**
- Unlimited bandwidth
- Advanced analytics
- Team collaboration

**Render Starter ($7/month)**
- No sleep mode
- More resources
- Better performance

**MongoDB Atlas ($9/month)**
- 2GB storage
- Dedicated resources
- Automated backups

---

## 🛠️ Troubleshooting

### Common Issues

#### 1. CORS Errors
```javascript
// Fix: Update backend CORS configuration
app.use(cors({
  origin: ['https://your-app-name.vercel.app'],
  credentials: true
}));
```

#### 2. Environment Variables Not Loading
```bash
# Check Vercel environment variables
vercel env ls

# Check Render environment variables
# Go to service settings → Environment
```

#### 3. Database Connection Issues
```javascript
// Check MongoDB connection string format
mongodb+srv://username:password@cluster.mongodb.net/database?retryWrites=true&w=majority
```

#### 4. Build Failures
```bash
# Check build logs in Vercel/Render dashboard
# Common fixes:
npm install --legacy-peer-deps
npm audit fix
```

#### 5. API Routes Not Working
```javascript
// Ensure API routes are properly configured
// Check backend logs in Render dashboard
```

### Performance Optimization

#### 1. Vercel Optimizations
```json
// vercel.json
{
  "headers": [
    {
      "source": "/static/(.*)",
      "headers": [
        {
          "key": "Cache-Control",
          "value": "public, max-age=31536000, immutable"
        }
      ]
    }
  ]
}
```

#### 2. Render Optimizations
```javascript
// Add compression middleware
const compression = require('compression');
app.use(compression());
```

---

## 🎯 Production Checklist

### Pre-Deployment
- [ ] Environment variables configured
- [ ] Database seeded with initial data
- [ ] CORS settings updated
- [ ] Error handling implemented
- [ ] Security headers configured

### Post-Deployment
- [ ] Test all functionality
- [ ] Verify database connections
- [ ] Check API endpoints
- [ ] Test user authentication
- [ ] Monitor performance metrics
- [ ] Set up alerts and monitoring

### Security
- [ ] Strong JWT secret
- [ ] Database credentials secured
- [ ] HTTPS enabled (automatic)
- [ ] Input validation implemented
- [ ] Rate limiting configured

---

## 🚀 Quick Deploy Commands

### One-Time Setup
```bash
# 1. Push code to GitHub
git add .
git commit -m "Initial commit"
git push origin main

# 2. Deploy backend to Render
# - Connect GitHub repo
# - Configure environment variables
# - Deploy

# 3. Deploy frontend to Vercel
# - Connect GitHub repo
# - Configure environment variables
# - Deploy

# 4. Seed database
# Run seed script via Render shell or create background worker
```

### Regular Updates
```bash
# Make changes
git add .
git commit -m "Update feature"
git push origin main

# Both services auto-deploy!
```

---

## 📞 Support & Resources

### Documentation
- [Vercel Documentation](https://vercel.com/docs)
- [Render Documentation](https://render.com/docs)
- [MongoDB Atlas Documentation](https://docs.atlas.mongodb.com)

### Community
- [Vercel Discord](https://vercel.com/discord)
- [Render Community](https://community.render.com)
- [MongoDB Community](https://community.mongodb.com)

### Monitoring Tools
- Vercel Analytics (built-in)
- Render Metrics (built-in)
- MongoDB Atlas Monitoring (built-in)
- External: Sentry, LogRocket, New Relic

---

## 🎉 Congratulations!

Your VTOP Academic Portal is now deployed on modern cloud infrastructure:

- ✅ **Frontend**: Fast, global CDN via Vercel
- ✅ **Backend**: Scalable API via Render
- ✅ **Database**: Managed MongoDB via Atlas
- ✅ **HTTPS**: Automatic SSL certificates
- ✅ **Auto-Deploy**: Push to deploy workflow
- ✅ **Monitoring**: Built-in analytics and metrics

**Your app is live at:**
- **Frontend**: https://your-app-name.vercel.app
- **Backend**: https://vtop-backend.onrender.com

**Login with:**
- Email: `neha.24bcy10007@vitbhopal.ac.in`
- Password: `nehababel@2026`

Enjoy your production-ready VTOP Academic Portal! 🚀