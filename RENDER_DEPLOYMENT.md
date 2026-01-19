# 🚀 Render Backend Deployment Guide

## 🎯 **Your Render Services:**
- **Frontend**: `https://day-care-app.onrender.com`
- **Backend**: `https://day-care-app-1.onrender.com`

## 📋 **Render Backend Service Configuration:**

### **Build Command:**
```
npm install
```

### **Start Command:**
```
npm start
```

### **Root Directory:**
```
backend
```

## 🔧 **Environment Variables (Required):**

```
NODE_ENV=production
MONGODB_URI=mongodb+srv://ashvaksheik:x1AN2mXixKFKzKdM@ashitconsulting.it8rdg.mongodb.net/daycare_concierge?retryWrites=true&w=majority&appName=ASHITCONSULTING
DB_NAME=daycare_concierge
JWT_SECRET=82e5b440376ba6f5e1a393011b08a47b81ff483490d2fd5ae84790afd054f30e54f4712d227e5de510a2bd36a5a57821638aacc7887457475063d3b03017b348
FRONTEND_URL=https://day-care-app.onrender.com
PORT=10000
```

## 🚨 **Important Notes:**

1. **Port**: Render uses port 10000 by default
2. **CORS**: Already configured for your frontend domain
3. **Database**: MongoDB Atlas connection is production-ready
4. **Security**: JWT secret is generated and secure

## ✅ **Deployment Steps:**

1. **Push your code** to GitHub
2. **Connect Render** to your repository
3. **Set environment variables** as listed above
4. **Deploy** - Render will automatically run `npm install` then `npm start`

## 🔍 **Verification:**

After deployment, test these endpoints:
- `https://day-care-app-1.onrender.com/api/health`
- `https://day-care-app-1.onrender.com/api/test-data`

## 📱 **Frontend Integration:**

Your frontend at `https://day-care-app.onrender.com` will automatically connect to the backend at `https://day-care-app-1.onrender.com` once deployed.
