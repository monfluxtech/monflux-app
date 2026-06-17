# 🚀 MONFLUX - Setup & Launch Guide

## ✅ Status de Complétude

- ✅ Backend Express + SQLite
- ✅ Auth (signup/login/JWT)
- ✅ Onboarding 4-step
- ✅ Projects CRUD
- ✅ Chat IA (Claude API streaming)
- ✅ Forms avec templates
- ✅ Contacts CRM
- ✅ Team management
- ✅ Frontend React complète
- ✅ 4 Tab views (Chat, Forms, DB, Reports)
- ✅ Responsive design avec Tailwind
- ✅ Demo data seeding
- ✅ Docker setup
- ✅ Deployment ready

## 🎯 Avant de lancer

### Variables d'env requises

1. **Backend (.env)**
   ```
   ANTHROPIC_API_KEY=sk-ant-... (obtenir de https://console.anthropic.com)
   ```

2. **Frontend (.env optionnel)**
   - Par défaut pointe sur http://localhost:5000/api

## 🏃 Launch en 5 minutes

### Method 1: Npm (Recommandé pour dev)

**Terminal 1 - Backend:**
```bash
cd backend
npm install
node seed.js  # Créer user demo
npm run dev
# ✅ Backend running on http://localhost:5000
```

**Terminal 2 - Frontend:**
```bash
cd frontend
npm install
npm run dev
# ✅ Frontend running on http://localhost:5173
```

**Ouvrir http://localhost:5173** et login:
- Email: `demo@monflux.app`
- Password: `demo123`

### Method 2: Docker (Un seul commande)

```bash
docker-compose up
# Backend: http://localhost:5000
# Frontend: http://localhost:5173
```

## 🧪 Test Features

### 1. Chat IA
- Aller à un projet
- Tab "Chat IA"
- Poser une question construction (ex: "Combien de temps le ciment sèche?")
- Voir la réponse en streaming

### 2. Formulaires
- Tab "Formulaires"
- Sélectionner un template (Daily Checklist, Progress Report, etc.)
- Remplir et soumettre

### 3. Contacts
- Tab "Base de données"
- Ajouter un contact
- Voir la liste

### 4. Rapports
- Tab "Rapports"
- Voir les graphiques et statistiques de progression

## 📊 Architecture API

```
POST   /api/auth/signup              # Créer compte
POST   /api/auth/login               # Login
POST   /api/auth/onboarding          # Compléter setup
GET    /api/auth/me                  # Info utilisateur

GET    /api/projects                 # List projets
POST   /api/projects                 # Créer projet
GET    /api/projects/:id             # Detail projet
PUT    /api/projects/:id             # Mettre à jour
DELETE /api/projects/:id             # Supprimer

POST   /api/chat/:projectId/message  # Send message (streaming)
GET    /api/chat/:projectId/history  # Get chat history

GET    /api/forms/templates          # List templates
POST   /api/forms/:projectId/submit  # Submit form
GET    /api/forms/:projectId/submissions # Get submissions

GET    /api/contacts                 # List contacts
POST   /api/contacts                 # Create contact
PUT    /api/contacts/:id             # Update contact
DELETE /api/contacts/:id             # Delete contact

GET    /api/teams/:projectId/members # List team
POST   /api/teams/:projectId/members # Invite member
DELETE /api/teams/:projectId/members/:memberId # Remove member
```

## 🔑 Keys & Secrets

- **JWT_SECRET**: Changez absolument en production! Générez une clé forte.
- **ANTHROPIC_API_KEY**: Obtenir de https://console.anthropic.com/account/api-keys

## 🚢 Deploy (Vercel + Railway)

### Frontend sur Vercel

```bash
cd frontend
npm run build
# Connecter repo à Vercel, push
# Vercel auto-détecte Vite et déploie
```

### Backend sur Railway

```bash
cd backend
# Connecter repo à Railway
# Ajouter env vars: JWT_SECRET, ANTHROPIC_API_KEY
# Auto-déploie sur git push
```

### Post-Deploy

Mettre à jour dans frontend/.env:
```
VITE_API_BASE=https://your-railway-backend.railway.app/api
```

## 🐛 Troubleshooting

**Frontend n'arrive pas à connecter backend:**
- Check VITE_API_BASE en frontend/.env
- Check CORS en backend (devrait être activé)
- Check que backend tourne sur le bon port

**API Key errors:**
- Vérifier ANTHROPIC_API_KEY est correct
- Vérifier que le compte Anthropic a des crédits

**Database errors:**
- Vérifier que ./backend/monflux.db peut être créé
- Run `node seed.js` pour initialiser

## 📝 Prochaines Steps

1. ✅ Tester tout localement
2. ✅ Créer compte Anthropic et obtenir API key
3. ✅ Customizer les prompts IA dans backend/src/prompts.js
4. ✅ Ajouter plus de templates de formulaires dans backend/src/routes/forms.js
5. ✅ Déployer sur Vercel + Railway
6. ✅ Tester avec des leads construction réels
7. ✅ Itérer basé sur feedback

## 🎉 You're All Set!

L'app est prête à montrer aux leads. Bonne chance! 🚀
