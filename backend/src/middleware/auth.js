import jwt from 'jsonwebtoken';
import { query } from '../db.js';

export function authenticateToken(req, res, next) {
  const token = req.headers['authorization']?.split(' ')[1];
  if (!token) return res.status(401).json({ error: 'Token requis' });

  const secret = process.env.JWT_SECRET;
  if (!secret) {
    console.error('JWT_SECRET not set');
    return res.status(500).json({ error: 'Server misconfiguration' });
  }

  jwt.verify(token, secret, (err, payload) => {
    if (err) return res.status(403).json({ error: 'Token invalide ou expiré' });
    req.user = payload;
    next();
  });
}

export function generateToken(userId, email) {
  const secret = process.env.JWT_SECRET;
  if (!secret) throw new Error('JWT_SECRET is not defined');
  return jwt.sign({ userId, email }, secret, { expiresIn: '30d' });
}

// Resolves company context: sets req.company_id and req.plan
export async function resolveCompany(req, res, next) {
  try {
    const { rows } = await query(
      `SELECT cm.company_id, cm.role, cm.is_owner,
              es.plan_id, es.seats, es.is_dev_override, es.dev_note,
              p.slug AS plan_slug, p.features
       FROM company_members cm
       JOIN effective_subscriptions es ON es.company_id = cm.company_id
       JOIN plans p ON p.id = es.plan_id
       WHERE cm.user_id = $1
       ORDER BY cm.is_owner DESC
       LIMIT 1`,
      [req.user.userId]
    );

    if (!rows.length) {
      return res.status(403).json({ error: 'Aucune compagnie associée' });
    }

    req.company_id = rows[0].company_id;
    req.member_role = rows[0].role;
    req.is_owner = rows[0].is_owner;
    req.plan = {
      slug: rows[0].plan_slug,
      features: rows[0].features,
      seats: rows[0].seats,
      is_dev_override: rows[0].is_dev_override,
      dev_note: rows[0].dev_note,
    };
    next();
  } catch (err) {
    console.error('resolveCompany error:', err);
    res.status(500).json({ error: 'Erreur serveur' });
  }
}

// Checks if a feature flag is enabled for the company's plan
export function requireFeature(featureKey) {
  return (req, res, next) => {
    if (!req.plan) return res.status(403).json({ error: 'Plan non résolu' });
    if (!req.plan.features[featureKey]) {
      return res.status(402).json({
        error: `Cette fonctionnalité requiert un forfait supérieur`,
        feature: featureKey,
        current_plan: req.plan.slug,
      });
    }
    next();
  };
}
