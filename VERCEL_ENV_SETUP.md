# 🔧 Vercel Environment Variables Setup Guide

## ✅ Issue Fixed: Environment Variable References

The `vercel.json` has been updated to remove the problematic environment variable references. Now you need to set the environment variables directly in the Vercel dashboard.

## 🚀 **Step-by-Step Setup**

### **Step 1: Deploy to Vercel First**
```bash
# Push the fixed vercel.json to GitHub
git add .
git commit -m "Fix Vercel environment variable references"
git push origin main
```

### **Step 2: Import Project to Vercel**
1. Go to [vercel.com](https://vercel.com)
2. Sign up/Login with GitHub
3. Click "New Project"
4. Import your GitHub repository
5. Configure project settings:
   - **Framework Preset:** `Create React App`
   - **Root Directory:** `frontend`
   - **Build Command:** `npm run build`
   - **Output Directory:** `build`
   - **Install Command:** `npm install`

### **Step 3: Add Environment Variables**
1. **During Import (Recommended):**
   - In the "Configure Project" step
   - Click "Environment Variables"
   - Add the variables listed below

2. **After Deployment:**
   - Go to your project dashboard
   - Click "Settings" → "Environment Variables"
   - Add the variables listed below

## 📋 **Required Environment Variables**

Add these environment variables in Vercel:

### **Production Environment Variables**
```env
REACT_APP_API_URL=https://your-backend-url.onrender.com/api
REACT_APP_APP_NAME=VTOP Academic Portal
REACT_APP_VERSION=1.0.0
REACT_APP_ENV=production
```

### **Optional Environment Variables**
```env
REACT_APP_ENABLE_PWA=true
REACT_APP_ENABLE_ANALYTICS=false
REACT_APP_DEBUG=false
REACT_APP_PRIMARY_COLOR=#1e3c72
REACT_APP_SECONDARY_COLOR=#2a5298
REACT_APP_THEME=light
```

## 🔧 **How to Add Environment Variables in Vercel**

### **Method 1: During Project Import**
1. When importing your GitHub repo
2. In "Configure Project" step
3. Expand "Environment Variables" section
4. For each variable:
   - **Name:** `REACT_APP_API_URL`
   - **Value:** `https://your-backend-url.onrender.com/api`
   - **Environment:** Select "Production", "Preview", and "Development"
5. Click "Add" for each variable
6. Click "Deploy"

### **Method 2: After Deployment**
1. Go to your Vercel project dashboard
2. Click "Settings" tab
3. Click "Environment Variables" in sidebar
4. Click "Add New"
5. For each variable:
   - **Name:** `REACT_APP_API_URL`
   - **Value:** `https://your-backend-url.onrender.com/api`
   - **Environment:** Select all environments
6. Click "Save"
7. **Important:** Redeploy after adding variables

## 🔄 **Update Backend URL**

### **Get Your Render Backend URL**
1. Go to your Render dashboard
2. Find your `vtop-backend` service
3. Copy the URL (e.g., `https://vtop-backend-abc123.onrender.com`)
4. Use this URL + `/api` for `REACT_APP_API_URL`

### **Example:**
If your Render backend URL is: `https://vtop-backend-abc123.onrender.com`
Then set: `REACT_APP_API_URL=https://vtop-backend-abc123.onrender.com/api`

## 🚀 **Complete Deployment Process**

### **1. Deploy Backend (Render)**
```bash
# Your backend should already be deployed
# Get the URL from Render dashboard
```

### **2. Deploy Frontend (Vercel)**
```bash
# Push code to GitHub
git add .
git commit -m "Ready for Vercel deployment"
git push origin main

# Import to Vercel and add environment variables
```

### **3. Update Backend CORS**
After getting your Vercel URL, update your Render backend environment variables:
```env
FRONTEND_URL=https://your-app-name.vercel.app
```

## 🧪 **Test Your Deployment**

### **1. Test Frontend**
- Visit your Vercel URL: `https://your-app-name.vercel.app`
- Check if the app loads without errors
- Open browser console and check for any errors

### **2. Test API Connection**
- Try to login with: `neha.24bcy10007@vitbhopal.ac.in` / `nehababel@2026`
- Check if dashboard loads with CGPA data
- Verify all navigation works

### **3. Check Environment Variables**
In browser console, you can check if environment variables are loaded:
```javascript
console.log(process.env.REACT_APP_API_URL);
```

## 🔍 **Troubleshooting**

### **If Environment Variables Don't Work**
1. **Check Variable Names:** Must start with `REACT_APP_`
2. **Redeploy:** After adding variables, trigger a new deployment
3. **Check Environments:** Ensure variables are set for "Production"
4. **Clear Cache:** Try hard refresh (Ctrl+F5 or Cmd+Shift+R)

### **If API Calls Fail**
1. **Check CORS:** Ensure backend `FRONTEND_URL` is set correctly
2. **Check URLs:** Verify backend URL is accessible
3. **Check Network Tab:** Look for failed requests in browser dev tools

### **Common Issues**
```bash
# Issue: API calls return CORS errors
# Solution: Update backend FRONTEND_URL environment variable

# Issue: Environment variables are undefined
# Solution: Ensure they start with REACT_APP_ and redeploy

# Issue: Build fails
# Solution: Check build logs in Vercel dashboard
```

## 📋 **Environment Variables Checklist**

- [ ] `REACT_APP_API_URL` set to your Render backend URL + `/api`
- [ ] `REACT_APP_APP_NAME` set to "VTOP Academic Portal"
- [ ] `REACT_APP_VERSION` set to "1.0.0"
- [ ] `REACT_APP_ENV` set to "production"
- [ ] All variables applied to "Production" environment
- [ ] Project redeployed after adding variables
- [ ] Backend `FRONTEND_URL` updated with Vercel domain

## 🎉 **Success Indicators**

Your deployment is successful when:
- ✅ Vercel build completes without errors
- ✅ App loads at your Vercel URL
- ✅ Login functionality works
- ✅ Dashboard shows CGPA data (6.27)
- ✅ All pages navigate correctly
- ✅ No console errors in browser

## 🔗 **Final URLs**

After successful deployment:
- **Frontend:** `https://your-app-name.vercel.app`
- **Backend:** `https://your-backend-name.onrender.com`
- **Login:** `neha.24bcy10007@vitbhopal.ac.in` / `nehababel@2026`

Your VTOP Academic Portal is now live! 🚀