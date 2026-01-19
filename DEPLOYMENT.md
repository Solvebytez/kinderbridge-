# 🚀 Production Deployment Guide

## Overview
Your backend is now production-ready and configured to work with your live frontend at `https://day-care-app.onrender.com`.

## 📋 Pre-Deployment Checklist

### 1. Security Updates (CRITICAL)
- [ ] **Change JWT_SECRET** in `config.production.env`
- [ ] Generate a strong, unique JWT secret (use: `node -e "console.log(require('crypto').randomBytes(64).toString('hex'))"`)
- [ ] Update MongoDB password if needed
- [ ] Ensure all environment variables are secure

### 2. Environment Configuration
- [ ] Use `config.production.env` for production
- [ ] Set `NODE_ENV=production`
- [ ] Verify `FRONTEND_URL=https://day-care-app.onrender.com`

## 🎯 Deployment Options

### Option 1: Render.com (Recommended)
1. **Create new Web Service**
2. **Connect your GitHub repository**
3. **Build Command:** `npm install`
4. **Start Command:** `npm start`
5. **Environment Variables:**
   ```
   NODE_ENV=production
   MONGODB_URI=your_mongodb_uri
   JWT_SECRET=your_strong_jwt_secret
   FRONTEND_URL=https://day-care-app.onrender.com
   ```

### Option 2: Heroku
1. **Install Heroku CLI**
2. **Create app:** `heroku create your-app-name`
3. **Set environment variables:**
   ```bash
   heroku config:set NODE_ENV=production
   heroku config:set JWT_SECRET=your_strong_jwt_secret
   heroku config:set FRONTEND_URL=https://day-care-app.onrender.com
   ```
4. **Deploy:** `git push heroku main`

### Option 3: Railway
1. **Connect GitHub repository**
2. **Set environment variables**
3. **Deploy automatically**

## 🔧 Production Commands

### Start Production Server
```bash
npm run prod
# or
NODE_ENV=production node production-server.js
```

### Start Development Server
```bash
npm run dev
```

### Start Production Server (default)
```bash
npm start
```

## 🌐 CORS Configuration

Your backend is now configured to accept requests from:
- ✅ `https://day-care-app.onrender.com` (Production)
- ✅ `http://localhost:3000` (Development)

## 🔒 Security Features

### Rate Limiting
- **General API:** 100 requests per 15 minutes per IP
- **Authentication:** 5 requests per 15 minutes per IP
- **Enhanced security headers with Helmet.js**

### Database Security
- **Connection pooling optimized for production**
- **Automatic reconnection handling**
- **Secure MongoDB Atlas connection**

## 📊 Monitoring & Health Checks

### Health Check Endpoint
```
GET /api/health
```

### Test Endpoint
```
GET /api/test
```

## 🚨 Important Notes

1. **JWT_SECRET:** MUST be changed in production
2. **MongoDB URI:** Keep secure and don't commit to public repos
3. **Environment Variables:** Use production config file
4. **Logs:** Production logging is enabled with `morgan('combined')`

## 🔄 Update Frontend

After deploying backend, update your frontend environment:

```env
NEXT_PUBLIC_API_URL=https://your-backend-url.com
```

## ✅ Verification

1. **Deploy backend to production**
2. **Test CORS:** Frontend should be able to call backend
3. **Test registration:** Create a new user account
4. **Test login:** Authenticate with created user
5. **Check health endpoint:** Verify production status

## 🆘 Troubleshooting

### CORS Issues
- Verify `FRONTEND_URL` is correct
- Check if backend is running
- Ensure environment variables are set

### Database Connection
- Verify MongoDB Atlas connection string
- Check network access and IP whitelist
- Ensure database user has proper permissions

### JWT Issues
- Verify JWT_SECRET is set
- Check token expiration settings
- Ensure proper authorization headers

## 📞 Support

If you encounter issues:
1. Check server logs
2. Verify environment variables
3. Test endpoints individually
4. Check MongoDB Atlas status

---

**🎉 Your backend is now production-ready! Deploy it and your frontend will be able to communicate with it properly.**
