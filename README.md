# 🏗️ MONFLUX - Construction Management App

Application SaaS moderne pour les entrepreneurs en construction québécois. Chat IA, gestion de projets, formulaires intelligents, et rapports en temps réel.

## 🚀 Quick Start (5 minutes)

### Prérequis
- Node.js 18+
- npm ou yarn

### Installation locale

```bash
# 1. Clone et install backend
cd backend
npm install
cp .env.example .env

# 2. Setup database et seed data
node seed.js

# 3. Démarrer backend
npm run dev  # runs on http://localhost:5000

# 4. Dans un nouveau terminal, setup frontend
cd ../frontend
npm install
npm run dev  # runs on http://localhost:5173
```

Accédez à **http://localhost:5173** et login avec:
- Email: `demo@monflux.app`
- Password: `demo123`

## 📋 Architecture

```
backend/
├── src/
│   ├── routes/        # API endpoints (auth, projects, chat, forms, contacts, teams)
│   ├── middleware/    # JWT auth, cors
│   ├── db.js          # SQLite connection
│   ├── prompts.js     # AI personas for construction
│   └── server.js      # Express app
├── schema.sql         # Database schema
├── seed.js            # Demo data
└── package.json

frontend/
├── src/
│   ├── pages/         # Auth, Onboarding, Dashboard, ProjectView
│   ├── components/    # ChatComponent, FormComponent, DatabaseComponent, ReportsComponent
│   ├── api.js         # API client (axios)
│   ├── store.js       # State management (zustand)
│   └── App.jsx        # Router
├── index.html
├── vite.config.js
├── tailwind.config.js
└── package.json
```

## 🎯 Features

### Auth & Onboarding
- Signup/Login avec JWT
- Onboarding 4-step (utilisation, équipe, secteur, infos entreprise)
- Auto-création de projet sample

### Dashboard
- Visualiser tous les projets
- Créer nouveau projet
- Accès rapide aux détails

### Project View - 4 Tabs

#### 1. 💬 Chat IA
- Conversation streaming avec Claude AI
- 5 personas: General, Estimations, Compliance RBQ, Team, Reporting
- Détection automatique du contexte
- Historique sauvegardé

#### 2. 📋 Formulaires
- Templates: Daily Checklist, Progress Report, Safety Incident
- Soumissions sauvegardées
- Export CSV

#### 3. 📊 Base de données
- CRM contacts léger
- Add/Edit/Delete contacts
- Lien avec projets

#### 4. 📈 Rapports
- Progression du projet
- Graphiques heures/jour
- Équipe activity
- Export PDF

## 🔧 Configuration

### Backend (.env)
```
NODE_ENV=development
PORT=5000
JWT_SECRET=change-me-in-production
ANTHROPIC_API_KEY=sk-ant-...
```

### Frontend (.env)
```
VITE_API_BASE=http://localhost:5000/api
```

## 🚢 Déploiement

### Option 1: Vercel + Railway (Recommandé)

**Frontend (Vercel):**
```bash
cd frontend
npm run build
# Connecter repo à Vercel, déployer
```

**Backend (Railway):**
```bash
cd backend
# Connecter repo à Railway
# Ajouter variables d'env: JWT_SECRET, ANTHROPIC_API_KEY
# Déployer
```

Puis configurer CORS et les URLs dans le frontend.

### Option 2: Docker

```bash
docker build -t monflux-backend ./backend
docker run -e PORT=5000 -e ANTHROPIC_API_KEY=... monflux-backend

docker build -t monflux-frontend ./frontend
docker run -p 3000:80 monflux-frontend
```

## 📊 Tech Stack

- **Frontend**: React 18, Tailwind CSS, Zustand, React Query, Axios, Vite
- **Backend**: Node.js/Express, SQLite, JWT, Bcryptjs
- **AI**: Anthropic Claude API (streaming)
- **Deploy**: Vercel (frontend), Railway (backend)

## 🔐 Sécurité

- JWT tokens (30 days expiry)
- Passwords hashed avec bcryptjs
- CORS configuré
- API auth middleware sur toutes les routes protégées

## 📈 Roadmap

- [ ] Intégrations Slack/Teams
- [ ] Export PDF avancés
- [ ] Gestion inventaire
- [ ] Analytics avancées
- [ ] Mobile app native (React Native)
- [ ] Webhooks pour CRM externes

## 🤝 Support

Pour questions ou bugs, créer une issue ou contacter le team.

---

Made with ❤️ for Quebec construction entrepreneurs 🇨🇦
