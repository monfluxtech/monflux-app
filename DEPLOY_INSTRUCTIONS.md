# 🚀 MONFLUX - Deploy to Vercel + Railway

## Prerequisites
- GitHub account (free): https://github.com/signup
- Vercel account (free): https://vercel.com/signup
- Railway account (free): https://railway.app

All three are **completely free** and can be created in 2 minutes each.

---

## STEP 1: Create GitHub Repository (5 min)

### 1.1 Create repo on GitHub
- Go to https://github.com/new
- Repository name: `monflux-app`
- Description: "MONFLUX - Construction Management SaaS"
- Choose **Public** (so Vercel/Railway can access)
- Click "Create repository"

### 1.2 Push code to GitHub
Copy these commands and paste one by one:

```bash
cd monflux-app
git init
git add .
git commit -m "Initial commit: MONFLUX app"
git branch -M main
git remote add origin https://github.com/YOUR_USERNAME/monflux-app.git
git push -u origin main
```

Replace `YOUR_USERNAME` with your actual GitHub username.

**Done!** Your code is now on GitHub.

---

## STEP 2: Deploy Frontend to Vercel (3 min)

### 2.1 Connect Vercel
- Go to https://vercel.com/import
- Click "Continue with GitHub"
- Select `monflux-app` repo
- Click "Import"

### 2.2 Configure project
- **Framework Preset**: `Vite` (Vercel auto-detects)
- **Root Directory**: `./frontend` (important!)
- **Build Command**: `npm run build` (should be auto-filled)
- **Install Command**: `npm install` (should be auto-filled)

### 2.3 Click "Deploy"
- Wait 2-3 minutes
- You'll see a URL like: `https://monflux-app.vercel.app`
- Save this URL!

### 2.4 Configure environment variable
After deploy:
- Go to project Settings → Environment Variables
- Add variable:
  - Name: `VITE_API_BASE`
  - Value: `https://your-railway-backend-url/api` (you'll get this in STEP 3)

---

## STEP 3: Deploy Backend to Railway (5 min)

### 3.1 Connect Railway
- Go to https://railway.app
- Click "New Project"
- Select "Deploy from GitHub repo"
- Select `monflux-app` repo
- Click "Deploy"

### 3.2 Configure Railway
After Railway detects the project:
- It will show a dialog
- Choose `backend` as the root directory
- Click "Deploy"

### 3.3 Set Environment Variables
After deployment:
- Go to Railway project
- Click "Variables" tab
- Add these variables:
  ```
  NODE_ENV = production
  PORT = 5000
  JWT_SECRET = (generate a random string, e.g., "super-secret-key-123-change-me")
  ANTHROPIC_API_KEY = (your API key from Anthropic)
  ```

### 3.4 Get your backend URL
- In Railway, click your deployed service
- Copy the URL (looks like: `https://monflux-api-production.up.railway.app`)
- This is your backend URL

### 3.5 Update Vercel with backend URL
- Go back to Vercel project
- Settings → Environment Variables
- Update `VITE_API_BASE` with your Railway backend URL:
  ```
  VITE_API_BASE=https://your-railway-backend.up.railway.app/api
  ```
- Click "Save" and Vercel will auto-redeploy

---

## STEP 4: Test Your Live App (2 min)

- Go to your Vercel URL: `https://monflux-app.vercel.app`
- Login: `demo@monflux.app` / `demo123`
- Try Chat IA (it should work with your Anthropic key!)
- Try creating a project
- Try all features

---

## ✅ You're Done!

Your app is now live! Share the Vercel URL with anyone:
```
https://monflux-app.vercel.app
```

They can use it without installing anything.

---

## 💡 If Something Doesn't Work

### Frontend not loading
- Check Vercel build logs (Deployments → click latest)
- Check that `VITE_API_BASE` env var is set

### Chat IA not working
- Check Railway has `ANTHROPIC_API_KEY` env var
- Check it's your actual valid API key
- Check backend is running on Railway (should show "Active")

### Backend URL wrong
- In Railway, go to "Network" tab
- Copy the public URL from there
- Update Vercel env var with this URL

---

## 📊 What Just Happened

```
Frontend (React) ← Vercel (vercel.app)
         ↓
Backend API ← Railway (railway.app)
         ↓
SQLite Database (on Railway)
```

Both platforms auto-scale for free up to certain limits. Perfect for MVP.

---

**Estimated time: 15 minutes**

Done? Move to STEP 2 - Building the same app with Lovable!
