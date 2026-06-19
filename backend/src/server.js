import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import { initializeDatabase } from './db.js';

// Routes
import authRoutes       from './routes/auth.js';
import onboardingRoutes from './routes/onboarding.js';
import companiesRoutes  from './routes/companies.js';
import projectsRoutes   from './routes/projects.js';
import leadsRoutes      from './routes/leads.js';
import contactsRoutes   from './routes/contacts.js';
import quotesRoutes     from './routes/quotes.js';
import invoicesRoutes   from './routes/invoices.js';
import subsRoutes       from './routes/subcontractors.js';
import rfqRoutes        from './routes/rfqs.js';
import punchRoutes      from './routes/punch.js';
import timesheetRoutes  from './routes/timesheets.js';
import chatRoutes       from './routes/chat.js';
import aiRoutes         from './routes/ai.js';
import devRoutes        from './routes/dev.js';
import docsRoutes       from './routes/documents.js';
import pdfRoutes        from './routes/pdf.js';
import emailRoutes      from './routes/email.js';
import publicRoutes     from './routes/public.js';
import dashboardRoutes  from './routes/dashboard.js';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;

const allowedOrigins = process.env.NODE_ENV === 'production'
  ? [
      'https://monflux.tech',
      process.env.FRONTEND_URL,
    ].filter(Boolean)
  : ['http://localhost:3000', 'http://localhost:5173'];

app.use(cors({
  origin: (origin, cb) => {
    if (!origin) return cb(null, true);
    if (allowedOrigins.includes(origin)) return cb(null, true);
    if (/\.vercel\.app$/.test(origin)) return cb(null, true);
    cb(new Error(`CORS: origin ${origin} not allowed`));
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
  optionsSuccessStatus: 200,
}));

app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ extended: true, limit: '50mb' }));

// ── Routes publiques ────────────────────────────────────────
app.use('/api/auth',        authRoutes);
app.use('/api/public',      publicRoutes);
app.use('/api/dashboard',   dashboardRoutes);

// ── Routes authentifiées ────────────────────────────────────
app.use('/api/onboarding',  onboardingRoutes);
app.use('/api/companies',   companiesRoutes);
app.use('/api/projects',    projectsRoutes);
app.use('/api/leads',       leadsRoutes);
app.use('/api/contacts',    contactsRoutes);
app.use('/api/quotes',      quotesRoutes);
app.use('/api/invoices',    invoicesRoutes);
app.use('/api/subcontractors', subsRoutes);
app.use('/api/rfqs',        rfqRoutes);
app.use('/api/punch',       punchRoutes);
app.use('/api/timesheets',  timesheetRoutes);
app.use('/api/chat',        chatRoutes);
app.use('/api/ai',          aiRoutes);
app.use('/api/documents',   docsRoutes);
app.use('/api/pdf',         pdfRoutes);
app.use('/api/email',      emailRoutes);

// ── DEV ONLY — plan switcher ────────────────────────────────
if (process.env.NODE_ENV !== 'production') {
  app.use('/api/dev', devRoutes);
}

// ── Health check ────────────────────────────────────────────
app.get('/api/health', async (req, res) => {
  res.json({ status: 'ok', version: '2.0.0', env: process.env.NODE_ENV });
});

// ── Error handler ───────────────────────────────────────────
app.use((err, req, res, next) => {
  console.error(err);
  res.status(err.status || 500).json({ error: err.message || 'Erreur serveur' });
});

async function start() {
  try {
    await initializeDatabase();
    app.listen(PORT, () => {
      console.log(`✅ MONFLUX 2.0 Backend — port ${PORT} [${process.env.NODE_ENV || 'development'}]`);
    });
  } catch (err) {
    console.error('Startup failed:', err);
    process.exit(1);
  }
}

start();
