import express from 'express';
import { query } from '../db.js';
import { authenticateToken, resolveCompany } from '../middleware/auth.js';
const router = express.Router();
router.use(authenticateToken, resolveCompany);

const toIsoOrNull = (value) => {
  if (!value) return null;
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return null;
  return date.toISOString();
};

const hoursBetween = (clockIn, clockOut) => {
  if (!clockIn || !clockOut) return null;
  const diff = new Date(clockOut).getTime() - new Date(clockIn).getTime();
  if (!Number.isFinite(diff) || diff < 0) return null;
  return Number((diff / 3600000).toFixed(2));
};

router.post('/start', async (req, res) => {
  const { project_id, worker_name, phase_name, notes, clock_in, clock_out, hours_total } = req.body || {};
  if (!project_id) return res.status(400).json({ error: 'Projet requis' });
  try {
    const { rows: [project] } = await query(
      `SELECT id FROM projects WHERE id = $1 AND company_id = $2`,
      [project_id, req.company_id]
    );
    if (!project) return res.status(404).json({ error: 'Projet non trouvé' });

    const resolvedWorkerName = String(worker_name || req.user?.name || '').trim() || null;
    const clockInIso = toIsoOrNull(clock_in) || new Date().toISOString();
    const clockOutIso = toIsoOrNull(clock_out);
    const manualHours = Number(hours_total);
    const resolvedHours = Number.isFinite(manualHours)
      ? Number(manualHours.toFixed(2))
      : hoursBetween(clockInIso, clockOutIso);
    const { rows: [timesheet] } = await query(
      `INSERT INTO timesheets (
         company_id, project_id, user_id, worker_name, phase_name, notes, clock_in, clock_out, hours_total, method
       )
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,'manual')
       RETURNING *`,
      [
        req.company_id,
        project_id,
        req.user.userId || null,
        resolvedWorkerName,
        phase_name || null,
        notes || null,
        clockInIso,
        clockOutIso,
        resolvedHours,
      ]
    );
    res.status(201).json(timesheet);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Erreur serveur' });
  }
});

router.get('/', async (req, res) => {
  const { project_id, from, to } = req.query;
  let sql = `SELECT t.*, p.name AS project_name, p.address AS project_address,
               u.name AS user_name, s.name AS sub_name
             FROM timesheets t
             LEFT JOIN projects p ON p.id = t.project_id
             LEFT JOIN users u ON u.id = t.user_id
             LEFT JOIN subcontractors s ON s.id = t.subcontractor_id
             WHERE t.company_id = $1`;
  const params = [req.company_id];
  if (project_id) { params.push(project_id); sql += ` AND t.project_id = $${params.length}`; }
  if (from)        { params.push(from);       sql += ` AND t.clock_in >= $${params.length}`; }
  if (to)          { params.push(to);         sql += ` AND t.clock_in <= $${params.length}`; }
  sql += ' ORDER BY t.clock_in DESC';
  const { rows } = await query(sql, params);
  res.json(rows);
});

router.patch('/:id', async (req, res) => {
  const { worker_name, phase_name, notes, clock_in, clock_out, hours_total } = req.body || {};
  try {
    const { rows: [existing] } = await query(
      `SELECT * FROM timesheets WHERE id = $1 AND company_id = $2`,
      [req.params.id, req.company_id]
    );
    if (!existing) return res.status(404).json({ error: 'Punch introuvable' });

    const hasClockIn = Object.prototype.hasOwnProperty.call(req.body || {}, 'clock_in');
    const hasClockOut = Object.prototype.hasOwnProperty.call(req.body || {}, 'clock_out');
    const hasHoursTotal = Object.prototype.hasOwnProperty.call(req.body || {}, 'hours_total');
    const nextClockIn = hasClockIn ? toIsoOrNull(clock_in) : existing.clock_in;
    const nextClockOut = hasClockOut ? toIsoOrNull(clock_out) : existing.clock_out;
    const manualHours = hasHoursTotal ? Number(hours_total) : Number(existing.hours_total);
    const nextHours = Number.isFinite(manualHours)
      ? Number(manualHours.toFixed(2))
      : hoursBetween(nextClockIn, nextClockOut);

    const { rows: [timesheet] } = await query(
      `UPDATE timesheets
          SET worker_name = $1,
              phase_name = $2,
              notes = $3,
              clock_in = $4,
              clock_out = $5,
              hours_total = $6
        WHERE id = $7
          AND company_id = $8
        RETURNING *`,
      [
        String(worker_name || '').trim() || null,
        String(phase_name || '').trim() || null,
        String(notes || '').trim() || null,
        nextClockIn,
        nextClockOut,
        nextHours,
        req.params.id,
        req.company_id,
      ]
    );
    if (!timesheet) return res.status(404).json({ error: 'Punch introuvable' });
    res.json(timesheet);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Erreur serveur' });
  }
});

router.patch('/:id/stop', async (req, res) => {
  const { phase_name, notes } = req.body || {};
  try {
    const { rows: [timesheet] } = await query(
      `UPDATE timesheets
          SET clock_out = NOW(),
              hours_total = ROUND(EXTRACT(EPOCH FROM (NOW() - clock_in)) / 3600.0, 2),
              phase_name = COALESCE($1, phase_name),
              notes = COALESCE($2, notes)
        WHERE id = $3
          AND company_id = $4
          AND clock_out IS NULL
        RETURNING *`,
      [phase_name || null, notes || null, req.params.id, req.company_id]
    );
    if (!timesheet) return res.status(404).json({ error: 'Punch non trouvé ou déjà arrêté' });
    res.json(timesheet);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Erreur serveur' });
  }
});

router.patch('/:id/approve', async (req, res) => {
  const { rows: [t] } = await query(
    `UPDATE timesheets SET approved_by = $1, approved_at = NOW()
     WHERE id = $2 RETURNING *`,
    [req.user.userId, req.params.id]
  );
  res.json(t);
});

export default router;
