import express from 'express';
import QRCode from 'qrcode';
import { query } from '../db.js';
import { authenticateToken, resolveCompany } from '../middleware/auth.js';
const router = express.Router();

// GET /api/punch/:token — public QR landing (no auth required)
router.get('/:token', async (req, res) => {
  const { rows: [qr] } = await query(
    `SELECT sq.*, p.name AS project_name, p.address AS project_address
     FROM site_qr_codes sq JOIN projects p ON p.id = sq.project_id
     WHERE sq.token = $1 AND sq.is_active = TRUE`,
    [req.params.token]
  );
  if (!qr) return res.status(404).json({ error: 'QR Code invalide ou inactif' });
  const { rows: phases } = await query(
    `SELECT id, name, trade_name FROM project_phases WHERE project_id = $1 ORDER BY sort_order, created_at`,
    [qr.project_id]
  );
  res.json({ project_name: qr.project_name, project_address: qr.project_address, qr_id: qr.id, token: qr.token, phases });
});

// POST /api/punch/clock-in — clock in via QR
router.post('/clock-in', async (req, res) => {
  const { token, worker_name, worker_phone, gps_lat, gps_lng } = req.body;
  if (!token) return res.status(400).json({ error: 'Token requis' });

  const { rows: [qr] } = await query(
    `SELECT * FROM site_qr_codes WHERE token = $1 AND is_active = TRUE`,
    [token]
  );
  if (!qr) return res.status(404).json({ error: 'QR Code invalide' });

  const user_id = req.headers.authorization ? (await authenticateToken(req, {}, () => {}), req.user?.userId) : null;

  const { rows: [ts] } = await query(
    `INSERT INTO timesheets (company_id, project_id, site_qr_id, user_id, worker_name, worker_phone,
       clock_in, method, gps_lat_in, gps_lng_in)
     VALUES ($1,$2,$3,$4,$5,$6,NOW(),'qr',$7,$8) RETURNING *`,
    [qr.company_id, qr.project_id, qr.id, user_id||null, worker_name||null, worker_phone||null, gps_lat||null, gps_lng||null]
  );
  res.status(201).json({ timesheet_id: ts.id, clocked_in_at: ts.clock_in });
});

// POST /api/punch/clock-out
router.post('/clock-out', async (req, res) => {
  const { timesheet_id, gps_lat, gps_lng, phase_name, remaining_hours_estimate } = req.body;
  const { rows: [ts] } = await query(
    `UPDATE timesheets SET
       clock_out = NOW(),
       gps_lat_out = $1, gps_lng_out = $2,
       hours_total = ROUND(EXTRACT(EPOCH FROM (NOW() - clock_in)) / 3600.0, 2),
       phase_name = $4,
       remaining_hours_estimate = $5
     WHERE id = $3 AND clock_out IS NULL
     RETURNING *`,
    [gps_lat||null, gps_lng||null, timesheet_id, phase_name||null, remaining_hours_estimate||null]
  );
  if (!ts) return res.status(404).json({ error: 'Pointage non trouvé ou déjà terminé' });
  res.json({ clocked_out_at: ts.clock_out, hours_total: ts.hours_total });
});

// POST /api/punch/generate — generate QR for a site (authenticated)
router.post('/generate', authenticateToken, resolveCompany, async (req, res) => {
  const { project_id, label } = req.body;
  const { rows: [qr] } = await query(
    `INSERT INTO site_qr_codes (project_id, company_id, label)
     VALUES ($1,$2,$3) RETURNING *`,
    [project_id, req.company_id, label||null]
  );
  const url = `${process.env.FRONTEND_URL || 'https://monflux-app.vercel.app'}/punch/${qr.token}`;
  const qrDataUrl = await QRCode.toDataURL(url, { width: 512, margin: 2 });
  res.json({ ...qr, url, qr_image: qrDataUrl });
});

export default router;
