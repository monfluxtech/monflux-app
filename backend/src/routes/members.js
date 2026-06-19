import express from 'express';
import { query } from '../db.js';
import { authenticateToken, resolveCompany } from '../middleware/auth.js';

const router = express.Router();
router.use(authenticateToken, resolveCompany);

const ROLES = ['owner', 'chef_chantier', 'technicien', 'sous_traitant', 'client_readonly'];

// GET /api/members — list all members of the current company
router.get('/', async (req, res) => {
  const { rows } = await query(
    `SELECT cm.id, cm.role, cm.is_owner, cm.created_at,
            u.id AS user_id, u.name, u.email, u.phone
     FROM company_members cm
     JOIN users u ON u.id = cm.user_id
     WHERE cm.company_id = $1
     ORDER BY cm.is_owner DESC, cm.created_at ASC`,
    [req.company_id]
  );
  // Also return pending invites
  const { rows: invites } = await query(
    `SELECT id, email, role, created_at FROM member_invites
     WHERE company_id = $1 AND accepted_at IS NULL
     ORDER BY created_at DESC`,
    [req.company_id]
  );
  res.json({ members: rows, invites });
});

// POST /api/members/invite — invite by email
router.post('/invite', async (req, res) => {
  if (!req.is_owner) return res.status(403).json({ error: 'Seul le propriétaire peut inviter des membres.' });

  const { email, role = 'technicien' } = req.body;
  if (!email) return res.status(400).json({ error: 'Courriel requis.' });
  if (!ROLES.includes(role)) return res.status(400).json({ error: 'Rôle invalide.' });
  if (role === 'owner') return res.status(400).json({ error: 'Impossible d\'assigner le rôle propriétaire via invitation.' });

  // Check if user already exists
  const { rows: [existingUser] } = await query(
    `SELECT id, name, email FROM users WHERE LOWER(email) = LOWER($1)`,
    [email]
  );

  if (existingUser) {
    // Check if already a member
    const { rows: [existing] } = await query(
      `SELECT id FROM company_members WHERE company_id = $1 AND user_id = $2`,
      [req.company_id, existingUser.id]
    );
    if (existing) return res.status(409).json({ error: 'Cet utilisateur est déjà membre.' });

    // Add directly
    await query(
      `INSERT INTO company_members (company_id, user_id, role, is_owner)
       VALUES ($1, $2, $3, FALSE)`,
      [req.company_id, existingUser.id, role]
    );
    return res.json({ added: true, user: existingUser, role });
  }

  // User doesn't exist — create pending invite
  // Upsert: if already invited, update role
  const { rows: [invite] } = await query(
    `INSERT INTO member_invites (company_id, email, role, invited_by)
     VALUES ($1, $2, $3, $4)
     ON CONFLICT (company_id, email) WHERE accepted_at IS NULL
     DO UPDATE SET role = EXCLUDED.role, invited_by = EXCLUDED.invited_by, created_at = NOW()
     RETURNING id, email, role, created_at`,
    [req.company_id, email.toLowerCase(), role, req.user.userId]
  );
  res.json({ invited: true, invite, message: `Invitation créée pour ${email}. Elle sera activée à la connexion.` });
});

// PATCH /api/members/:memberId/role — change a member's role
router.patch('/:memberId/role', async (req, res) => {
  if (!req.is_owner) return res.status(403).json({ error: 'Seul le propriétaire peut modifier les rôles.' });

  const { role } = req.body;
  if (!ROLES.includes(role)) return res.status(400).json({ error: 'Rôle invalide.' });
  if (role === 'owner') return res.status(400).json({ error: 'Impossible de promouvoir au rôle propriétaire.' });

  const { rows: [member] } = await query(
    `SELECT id, is_owner FROM company_members WHERE id = $1 AND company_id = $2`,
    [req.params.memberId, req.company_id]
  );
  if (!member) return res.status(404).json({ error: 'Membre introuvable.' });
  if (member.is_owner) return res.status(400).json({ error: 'Impossible de modifier le rôle du propriétaire.' });

  const { rows: [updated] } = await query(
    `UPDATE company_members SET role = $1 WHERE id = $2 RETURNING id, role`,
    [role, req.params.memberId]
  );
  res.json(updated);
});

// DELETE /api/members/:memberId — remove a member
router.delete('/:memberId', async (req, res) => {
  if (!req.is_owner) return res.status(403).json({ error: 'Seul le propriétaire peut retirer des membres.' });

  const { rows: [member] } = await query(
    `SELECT id, user_id, is_owner FROM company_members WHERE id = $1 AND company_id = $2`,
    [req.params.memberId, req.company_id]
  );
  if (!member) return res.status(404).json({ error: 'Membre introuvable.' });
  if (member.is_owner) return res.status(400).json({ error: 'Impossible de retirer le propriétaire.' });

  await query(`DELETE FROM company_members WHERE id = $1`, [req.params.memberId]);
  res.json({ removed: true });
});

// DELETE /api/members/invites/:inviteId — cancel a pending invite
router.delete('/invites/:inviteId', async (req, res) => {
  if (!req.is_owner) return res.status(403).json({ error: 'Seul le propriétaire peut annuler une invitation.' });
  await query(
    `DELETE FROM member_invites WHERE id = $1 AND company_id = $2`,
    [req.params.inviteId, req.company_id]
  );
  res.json({ cancelled: true });
});

export default router;
