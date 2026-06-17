# ✅ MONFLUX App - Launch Checklist

Use this to track your launch progress.

## 🎯 Phase 1: Preparation (15 min)

- [ ] Download the `monflux-app` folder
- [ ] Extract it to your working directory
- [ ] Have Node.js 18+ installed (`node --version`)
- [ ] Have npm installed (`npm --version`)
- [ ] Open terminal/command prompt

## 🔑 Phase 2: Get API Key (2 min)

- [ ] Visit https://console.anthropic.com/account/api-keys
- [ ] Login to your Anthropic account (create if needed)
- [ ] Create a new API key
- [ ] Copy the key (you won't see it again!)
- [ ] Paste it somewhere safe for now

## 🏗️ Phase 3: Setup Backend (3 min)

```bash
# Terminal 1
cd monflux-app/backend
npm install
```

- [ ] Wait for `npm install` to complete
- [ ] Copy `../.env.example` to `../.env`
  ```bash
  cp ../.env.example ../.env
  ```
- [ ] Edit the `.env` file (any text editor)
  - Find `ANTHROPIC_API_KEY=your-anthropic-api-key`
  - Replace with your actual key from Phase 2
  - Save the file
- [ ] Initialize database with demo data
  ```bash
  node seed.js
  ```
- [ ] You should see: "✅ Demo data seeded successfully!"
- [ ] Start backend server
  ```bash
  npm run dev
  ```
- [ ] You should see: "✅ MONFLUX Backend running on port 5000"
- [ ] Leave this terminal running

## 🎨 Phase 4: Setup Frontend (2 min)

```bash
# Terminal 2 (NEW TERMINAL - keep backend running)
cd monflux-app/frontend
npm install
npm run dev
```

- [ ] Wait for `npm install` to complete
- [ ] Start frontend dev server
- [ ] You should see: "VITE v..." and a localhost URL
- [ ] Usually: `http://localhost:5173`

## 🚀 Phase 5: Test the App (5 min)

- [ ] Open browser: http://localhost:5173
- [ ] You should see MONFLUX login page
- [ ] Login with demo account:
  - Email: `demo@monflux.app`
  - Password: `demo123`
- [ ] You should see the onboarding OR the dashboard (if already done)
- [ ] Click on a project to see the detail view

## 🧪 Phase 6: Test Features (5 min each)

### Chat IA
- [ ] Go to a project
- [ ] Click "Chat IA" tab
- [ ] Ask a construction question
- [ ] Wait for streaming response
- [ ] Verify it's using Claude (look for construction-specific answer)

### Formulaires
- [ ] Click "Formulaires" tab
- [ ] Select a template
- [ ] Fill out the form
- [ ] Click "Soumettre"
- [ ] Verify it was saved in submissions list

### Base de données
- [ ] Click "Base de données" tab
- [ ] Click "Nouveau Contact"
- [ ] Add a contact (name required)
- [ ] Click "Ajouter"
- [ ] Verify contact appears in table

### Rapports
- [ ] Click "Rapports" tab
- [ ] Verify you see charts and metrics
- [ ] Check team member list

## 📝 Phase 7: Customization (Optional)

- [ ] Open `backend/src/prompts.js`
- [ ] Modify the AI personas if you want different behavior
- [ ] Restart backend: Ctrl+C then `npm run dev`
- [ ] Test chat again to see changes

## 🌐 Phase 8: Deploy (When Ready)

When you want to show this to leads or deploy to production:

### For showing locally to others:
- [ ] Get your local IP: `ipconfig` (Windows) or `ifconfig` (Mac/Linux)
- [ ] Share: `http://[YOUR_IP]:5173`
- [ ] Others must be on same network

### For production deployment:
- [ ] Read SETUP_GUIDE.md "Deploy" section
- [ ] Create Vercel account (for frontend)
- [ ] Create Railway account (for backend)
- [ ] Push code to GitHub
- [ ] Connect to Vercel and Railway
- [ ] Set environment variables
- [ ] Deploy!

## ✨ Troubleshooting

### "npm not found"
- Install Node.js from nodejs.org

### "EADDRINUSE: address already in use :5000"
- Port 5000 is already used
- Either kill the process: `lsof -i :5000` then `kill -9 <PID>`
- Or change port in backend/src/server.js

### "Chat doesn't work"
- Check ANTHROPIC_API_KEY in .env
- Check API key is correct (no extra spaces)
- Check you're in correct project
- Check backend is running

### "Frontend shows 'can't reach backend'"
- Make sure backend is running on port 5000
- Check CORS isn't blocked
- Restart frontend: Ctrl+C then `npm run dev`

### "Database error"
- Delete `backend/monflux.db` if it exists
- Run `node seed.js` again
- Restart backend

## 🎉 When You're Done

- [ ] All features tested
- [ ] Chat IA working with your API key
- [ ] Forms submitting
- [ ] Contacts saving
- [ ] Ready to show to leads!

### Next:
1. Get feedback from construction entrepreneurs
2. Iterate based on their needs
3. Deploy to production
4. Continue building

---

**Estimated total time: 30 minutes**

Good luck! 🚀

Questions? Check README.md, SETUP_GUIDE.md, or LAUNCH.md
