import express from 'express';
import { query } from '../db.js';
import { authenticateToken, resolveCompany } from '../middleware/auth.js';

const router = express.Router();
router.use(authenticateToken, resolveCompany);

// GET /api/projects — list all projects for company (Gantt feed)
router.get('/', async (req, res) => {
  try {
    const { rows } = await query(
      `SELECT p.*,
              c.name AS client_name, c.email AS client_email, c.phone AS client_phone,
              COUNT(DISTINCT pp.id) AS phase_count,
              COUNT(DISTINCT pm2.id) AS member_count,
              COALESCE(SUM(t.hours_total), 0) AS total_hours_logged
       FROM projects p
       LEFT JOIN contacts c ON c.id = p.client_id
       LEFT JOIN project_phases pp ON pp.project_id = p.id
       LEFT JOIN project_members pm2 ON pm2.project_id = p.id
       LEFT JOIN timesheets t ON t.project_id = p.id
       WHERE p.company_id = $1
       GROUP BY p.id, c.name, c.email, c.phone
       ORDER BY p.start_date ASC NULLS LAST, p.created_at DESC`,
      [req.company_id]
    );
    res.json(rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Erreur serveur' });
  }
});

// GET /api/projects/:id — project detail with phases & milestones
router.get('/:id', async (req, res) => {
  try {
    const { rows: [project] } = await query(
      `SELECT p.*, c.name AS client_name, c.email AS client_email, c.phone AS client_phone
       FROM projects p
       LEFT JOIN contacts c ON c.id = p.client_id
       WHERE p.id = $1 AND p.company_id = $2`,
      [req.params.id, req.company_id]
    );
    if (!project) return res.status(404).json({ error: 'Projet non trouvé' });

    const [{ rows: phases }, { rows: milestones }, { rows: members }, { rows: docs }] = await Promise.all([
      query(`SELECT * FROM project_phases WHERE project_id = $1 ORDER BY display_order`, [req.params.id]),
      query(`SELECT * FROM project_milestones WHERE project_id = $1 ORDER BY due_date`, [req.params.id]),
      query(
        `SELECT pm.*, u.name, u.email, u.avatar_url, s.name AS sub_name
         FROM project_members pm
         LEFT JOIN users u ON u.id = pm.user_id
         LEFT JOIN subcontractors s ON s.id = pm.subcontractor_id
         WHERE pm.project_id = $1`,
        [req.params.id]
      ),
      query(
        `SELECT id, type, name, file_url, extraction_done, created_at
         FROM project_documents WHERE project_id = $1 ORDER BY created_at DESC`,
        [req.params.id]
      ),
    ]);

    res.json({ ...project, phases, milestones, members, documents: docs });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Erreur serveur' });
  }
});

// POST /api/projects
router.post('/', async (req, res) => {
  const {
    name, description, type, status, address, city, postal_code,
    client_id, lead_id, start_date, end_date, contract_value,
    budget_materials, budget_labor, created_from_project,
  } = req.body;

  if (!name) return res.status(400).json({ error: 'Nom du projet requis' });

  try {
    const { rows: [project] } = await query(
      `INSERT INTO projects
         (company_id, name, description, type, status, address, city, postal_code,
          client_id, lead_id, start_date, end_date, contract_value,
          budget_materials, budget_labor, created_from_project)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15,$16)
       RETURNING *`,
      [
        req.company_id, name, description, type || 'other', status || 'active',
        address, city, postal_code, client_id || null, lead_id || null,
        start_date || null, end_date || null, contract_value || null,
        budget_materials || null, budget_labor || null, created_from_project || null,
      ]
    );

    // If reusing a past project, copy its phases
    if (created_from_project) {
      const { rows: sourcePhases } = await query(
        `SELECT * FROM project_phases WHERE project_id = $1`,
        [created_from_project]
      );
      for (const phase of sourcePhases) {
        await query(
          `INSERT INTO project_phases (project_id, name, display_order, color, status)
           VALUES ($1,$2,$3,$4,'not_started')`,
          [project.id, phase.name, phase.display_order, phase.color]
        );
      }
    }

    res.status(201).json(project);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Erreur serveur' });
  }
});

// PATCH /api/projects/:id
router.patch('/:id', async (req, res) => {
  const allowed = ['name','description','type','status','address','city','postal_code',
    'start_date','end_date','contract_value','budget_materials','budget_labor','progress_pct','notes'];
  const updates = Object.fromEntries(
    Object.entries(req.body).filter(([k]) => allowed.includes(k))
  );
  if (!Object.keys(updates).length) {
    return res.status(400).json({ error: 'Aucun champ valide fourni' });
  }

  const setClause = Object.keys(updates).map((k, i) => `${k} = $${i + 1}`).join(', ');
  const values = [...Object.values(updates), req.params.id, req.company_id];

  try {
    const { rows: [project] } = await query(
      `UPDATE projects SET ${setClause}, updated_at = NOW()
       WHERE id = $${values.length - 1} AND company_id = $${values.length}
       RETURNING *`,
      values
    );
    if (!project) return res.status(404).json({ error: 'Projet non trouvé' });
    res.json(project);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Erreur serveur' });
  }
});

// DELETE /api/projects/:id
router.delete('/:id', async (req, res) => {
  try {
    const { rowCount } = await query(
      `DELETE FROM projects WHERE id = $1 AND company_id = $2`,
      [req.params.id, req.company_id]
    );
    if (!rowCount) return res.status(404).json({ error: 'Projet non trouvé' });
    res.json({ success: true });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Erreur serveur' });
  }
});

// POST /api/projects/:id/reset-portal-token — regenerate the public portal link
router.post('/:id/reset-portal-token', async (req, res) => {
  try {
    const { rows: [project] } = await query(
      `UPDATE projects SET portal_token = gen_random_uuid()
       WHERE id = $1 AND company_id = $2
       RETURNING portal_token`,
      [req.params.id, req.company_id]
    );
    if (!project) return res.status(404).json({ error: 'Projet non trouvé' });
    res.json({ portal_token: project.portal_token });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Erreur serveur' });
  }
});

// POST /api/projects/:id/phases
router.post('/:id/phases', async (req, res) => {
  const { name, display_order, color, start_date, end_date } = req.body;
  try {
    const { rows: [phase] } = await query(
      `INSERT INTO project_phases (project_id, name, display_order, color, start_date, end_date)
       VALUES ($1,$2,$3,$4,$5,$6) RETURNING *`,
      [req.params.id, name, display_order ?? 0, color || '#F26522', start_date || null, end_date || null]
    );
    res.status(201).json(phase);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Erreur serveur' });
  }
});

// PATCH /api/projects/:id/phases/:phaseId
router.patch('/:id/phases/:phaseId', async (req, res) => {
  const allowed = ['name','status','color','start_date','end_date','actual_start','actual_end','progress_pct','display_order'];
  const updates = Object.fromEntries(Object.entries(req.body).filter(([k]) => allowed.includes(k)));
  const setClause = Object.keys(updates).map((k, i) => `${k} = $${i + 1}`).join(', ');
  const values = [...Object.values(updates), req.params.phaseId];
  try {
    const { rows: [phase] } = await query(
      `UPDATE project_phases SET ${setClause}, updated_at = NOW()
       WHERE id = $${values.length} RETURNING *`,
      values
    );
    res.json(phase);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Erreur serveur' });
  }
});

// GET /api/projects/:id/portal-messages — contractor reads client feedback
router.get('/:id/portal-messages', async (req, res) => {
  try {
    const { rows: [p] } = await query(
      `SELECT id FROM projects WHERE id = $1 AND company_id = $2`,
      [req.params.id, req.company_id]
    );
    if (!p) return res.status(404).json({ error: 'Projet introuvable' });
    const { rows } = await query(
      `SELECT id, author_name, content, created_at
       FROM portal_messages WHERE project_id = $1 ORDER BY created_at DESC`,
      [req.params.id]
    );
    res.json(rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Erreur serveur' });
  }
});

export default router;
