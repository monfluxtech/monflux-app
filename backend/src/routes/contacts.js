import express from 'express';
import { query } from '../db.js';
import { authenticateToken, resolveCompany } from '../middleware/auth.js';

const router = express.Router();
router.use(authenticateToken, resolveCompany);

// GET /api/contacts — list with project count
router.get('/', async (req, res) => {
  const { type, q, is_recurring } = req.query;
  let sql = `
    SELECT c.*,
           COUNT(DISTINCT p.id) AS project_count,
           MAX(p.updated_at)    AS last_project_at
    FROM contacts c
    LEFT JOIN projects p ON p.contact_id = c.id AND p.company_id = c.company_id
    WHERE c.company_id = $1
  `;
  const params = [req.company_id];
  if (type) { params.push(type); sql += ` AND c.type = $${params.length}`; }
  if (q)    { params.push(`%${q}%`); sql += ` AND (c.name ILIKE $${params.length} OR c.company_name ILIKE $${params.length} OR c.email ILIKE $${params.length})`; }
  if (is_recurring === 'true')  sql += ` AND c.is_recurring = TRUE`;
  if (is_recurring === 'false') sql += ` AND c.is_recurring = FALSE`;
  sql += ' GROUP BY c.id ORDER BY c.name';
  const { rows } = await query(sql, params);
  res.json(rows);
});

// GET /api/contacts/:id — single contact with their projects
router.get('/:id', async (req, res) => {
  const { rows: [c] } = await query(
    `SELECT * FROM contacts WHERE id = $1 AND company_id = $2`,
    [req.params.id, req.company_id]
  );
  if (!c) return res.status(404).json({ error: 'Contact non trouvé' });

  const { rows: projects } = await query(
    `SELECT id, name, status, contract_value, start_date, end_date
     FROM projects WHERE contact_id = $1 AND company_id = $2
     ORDER BY created_at DESC`,
    [req.params.id, req.company_id]
  );
  res.json({ ...c, projects });
});

// POST /api/contacts
router.post('/', async (req, res) => {
  const { name, type, email, phone, whatsapp, address, city, company_name,
          notes, tags, is_recurring, source, follow_up_at, follow_up_note } = req.body;
  if (!name) return res.status(400).json({ error: 'Nom requis' });
  const { rows: [c] } = await query(
    `INSERT INTO contacts
       (company_id,name,type,email,phone,whatsapp,address,city,company_name,
        notes,tags,is_recurring,source,follow_up_at,follow_up_note)
     VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15)
     RETURNING *`,
    [req.company_id, name, type||'prospect', email, phone, whatsapp,
     address, city, company_name, notes, tags||[],
     !!is_recurring, source||null, follow_up_at||null, follow_up_note||null]
  );
  res.status(201).json(c);
});

// PATCH /api/contacts/:id
router.patch('/:id', async (req, res) => {
  const allowed = ['name','type','email','phone','whatsapp','address','city','company_name',
                   'notes','tags','is_recurring','source','follow_up_at','follow_up_note',
                   'last_contacted_at'];
  const updates = Object.fromEntries(Object.entries(req.body).filter(([k]) => allowed.includes(k)));
  if (!Object.keys(updates).length) return res.status(400).json({ error: 'Aucun champ' });
  const setClause = Object.keys(updates).map((k, i) => `${k} = $${i + 1}`).join(', ');
  const values = [...Object.values(updates), req.params.id, req.company_id];
  const { rows: [c] } = await query(
    `UPDATE contacts SET ${setClause}, updated_at = NOW()
     WHERE id = $${values.length-1} AND company_id = $${values.length} RETURNING *`,
    values
  );
  if (!c) return res.status(404).json({ error: 'Contact non trouvé' });
  res.json(c);
});

// POST /api/contacts/:id/touch — update last_contacted_at
router.post('/:id/touch', async (req, res) => {
  const { rows: [c] } = await query(
    `UPDATE contacts SET last_contacted_at = NOW(), updated_at = NOW()
     WHERE id = $1 AND company_id = $2 RETURNING *`,
    [req.params.id, req.company_id]
  );
  if (!c) return res.status(404).json({ error: 'Contact non trouvé' });
  res.json(c);
});

router.delete('/:id', async (req, res) => {
  await query(`DELETE FROM contacts WHERE id = $1 AND company_id = $2`, [req.params.id, req.company_id]);
  res.json({ success: true });
});

export default router;
