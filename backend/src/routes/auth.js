import express from 'express';
import bcrypt from 'bcryptjs';
import { query } from '../db.js';
import { generateToken, authenticateToken, resolveCompany } from '../middleware/auth.js';

const router = express.Router();

// POST /api/auth/signup
router.post('/signup', async (req, res) => {
  const { email, password, name } = req.body;
  if (!email || !password) {
    return res.status(400).json({ error: 'Email et mot de passe requis' });
  }
  try {
    const hash = await bcrypt.hash(password, 12);
    const { rows } = await query(
      `INSERT INTO users (email, password_hash, name)
       VALUES ($1, $2, $3)
       RETURNING id, email, name, language`,
      [email.toLowerCase().trim(), hash, name || null]
    );
    const user = rows[0];
    const token = generateToken(user.id, user.email);
    res.status(201).json({ userId: user.id, email: user.email, name: user.name, token, needs_onboarding: true });
  } catch (err) {
    if (err.code === '23505') {
      return res.status(409).json({ error: 'Cet email est déjà utilisé' });
    }
    console.error(err);
    res.status(500).json({ error: 'Erreur serveur' });
  }
});

// POST /api/auth/login
router.post('/login', async (req, res) => {
  const { email, password } = req.body;
  if (!email || !password) {
    return res.status(400).json({ error: 'Email et mot de passe requis' });
  }
  try {
    const { rows } = await query(
      `SELECT u.id, u.email, u.name, u.password_hash, u.avatar_url, u.language,
              cm.company_id, cm.role, cm.is_owner,
              c.onboarding_completed
       FROM users u
       LEFT JOIN company_members cm ON cm.user_id = u.id AND cm.is_owner = TRUE
       LEFT JOIN companies c ON c.id = cm.company_id
       WHERE u.email = $1
       LIMIT 1`,
      [email.toLowerCase().trim()]
    );
    if (!rows.length) {
      return res.status(401).json({ error: 'Email ou mot de passe invalide' });
    }
    const user = rows[0];
    const valid = await bcrypt.compare(password, user.password_hash);
    if (!valid) {
      return res.status(401).json({ error: 'Email ou mot de passe invalide' });
    }
    await query('UPDATE users SET last_login_at = NOW() WHERE id = $1', [user.id]);
    const token = generateToken(user.id, user.email);
    res.json({
      token,
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        avatar_url: user.avatar_url,
        language: user.language,
      },
      company: user.company_id ? {
        id: user.company_id,
        role: user.role,
        is_owner: user.is_owner,
        onboarding_completed: user.onboarding_completed,
      } : null,
      needs_onboarding: !user.company_id || !user.onboarding_completed,
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Erreur serveur' });
  }
});

// GET /api/auth/me
router.get('/me', authenticateToken, resolveCompany, async (req, res) => {
  try {
    const { rows } = await query(
      `SELECT u.id, u.email, u.name, u.avatar_url, u.phone, u.language,
              u.landing_pref, u.is_verified, u.created_at
       FROM users u WHERE u.id = $1`,
      [req.user.userId]
    );
    if (!rows.length) return res.status(404).json({ error: 'Utilisateur non trouvé' });
    res.json({
      user: rows[0],
      company_id: req.company_id,
      role: req.member_role,
      is_owner: req.is_owner,
      plan: req.plan,
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Erreur serveur' });
  }
});

// PATCH /api/auth/me
router.patch('/me', authenticateToken, async (req, res) => {
  const { name, phone, language, landing_pref, avatar_url } = req.body;
  try {
    const { rows } = await query(
      `UPDATE users SET
         name = COALESCE($1, name),
         phone = COALESCE($2, phone),
         language = COALESCE($3, language),
         landing_pref = COALESCE($4, landing_pref),
         avatar_url = COALESCE($5, avatar_url),
         updated_at = NOW()
       WHERE id = $6
       RETURNING id, email, name, phone, language, landing_pref, avatar_url`,
      [name, phone, language, landing_pref, avatar_url, req.user.userId]
    );
    res.json(rows[0]);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Erreur serveur' });
  }
});

export default router;
