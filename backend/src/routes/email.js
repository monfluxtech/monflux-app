import express from 'express';
import nodemailer from 'nodemailer';
import { query } from '../db.js';
import { authenticateToken, resolveCompany } from '../middleware/auth.js';
import { generateQuotePDF, generateInvoicePDF } from './pdf.js';

const router = express.Router();
router.use(authenticateToken, resolveCompany);

function getTransporter() {
  const { SMTP_HOST, SMTP_PORT, SMTP_USER, SMTP_PASS, SMTP_FROM } = process.env;
  if (!SMTP_HOST || !SMTP_USER || !SMTP_PASS) {
    return null;
  }
  return nodemailer.createTransport({
    host: SMTP_HOST,
    port: Number(SMTP_PORT) || 587,
    secure: Number(SMTP_PORT) === 465,
    auth: { user: SMTP_USER, pass: SMTP_PASS },
  });
}

// POST /api/email/quote/:id
router.post('/quote/:id', async (req, res) => {
  const { to, subject, message } = req.body;
  if (!to) return res.status(400).json({ error: 'Destinataire requis' });

  const transporter = getTransporter();
  if (!transporter) {
    return res.status(503).json({
      error: 'Email non configuré',
      detail: 'Ajoutez SMTP_HOST, SMTP_USER, SMTP_PASS dans les variables d\'environnement Railway.',
    });
  }

  try {
    const { rows: [q] } = await query(
      `SELECT qu.*, c.name AS company_name, c.address AS company_address, c.phone AS company_phone,
              c.email AS company_email, c.gst_number, c.qst_number
       FROM quotes qu
       JOIN companies c ON c.id = qu.company_id
       WHERE qu.id = $1 AND qu.company_id = $2`,
      [req.params.id, req.company_id]
    );
    if (!q) return res.status(404).json({ error: 'Soumission introuvable' });

    const pdfBuffer = await generateQuotePDF(q);
    const fileName = `soumission-${q.id.slice(0, 8)}.pdf`;
    const companyName = q.company_name || 'MONFLUX';

    await transporter.sendMail({
      from: `${companyName} <${process.env.SMTP_FROM || process.env.SMTP_USER}>`,
      to,
      subject: subject || `Soumission ${q.title || q.id.slice(0, 8)} — ${companyName}`,
      text: message || `Bonjour,\n\nVeuillez trouver ci-joint votre soumission.\n\nCordialement,\n${companyName}`,
      attachments: [{ filename: fileName, content: pdfBuffer, contentType: 'application/pdf' }],
    });

    await query(`UPDATE quotes SET sent_at = NOW(), status = CASE WHEN status = 'draft' THEN 'sent' ELSE status END WHERE id = $1`, [q.id]);

    res.json({ ok: true, to, filename: fileName });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Erreur envoi courriel', detail: err.message });
  }
});

// POST /api/email/invoice/:id
router.post('/invoice/:id', async (req, res) => {
  const { to, subject, message } = req.body;
  if (!to) return res.status(400).json({ error: 'Destinataire requis' });

  const transporter = getTransporter();
  if (!transporter) {
    return res.status(503).json({
      error: 'Email non configuré',
      detail: 'Ajoutez SMTP_HOST, SMTP_USER, SMTP_PASS dans les variables d\'environnement Railway.',
    });
  }

  try {
    const { rows: [inv] } = await query(
      `SELECT inv.*, c.name AS company_name, c.address AS company_address, c.phone AS company_phone,
              c.email AS company_email, c.gst_number, c.qst_number
       FROM invoices inv
       JOIN companies c ON c.id = inv.company_id
       WHERE inv.id = $1 AND inv.company_id = $2`,
      [req.params.id, req.company_id]
    );
    if (!inv) return res.status(404).json({ error: 'Facture introuvable' });

    const pdfBuffer = await generateInvoicePDF(inv);
    const fileName = `facture-${inv.invoice_number || inv.id.slice(0, 8)}.pdf`;
    const companyName = inv.company_name || 'MONFLUX';

    await transporter.sendMail({
      from: `${companyName} <${process.env.SMTP_FROM || process.env.SMTP_USER}>`,
      to,
      subject: subject || `Facture ${inv.invoice_number || inv.id.slice(0, 8)} — ${companyName}`,
      text: message || `Bonjour,\n\nVeuillez trouver ci-joint votre facture.\n\nMontant dû : ${Number(inv.amount_due||0).toLocaleString('fr-CA')}$\n\nCordialement,\n${companyName}`,
      attachments: [{ filename: fileName, content: pdfBuffer, contentType: 'application/pdf' }],
    });

    await query(`UPDATE invoices SET sent_at = NOW(), status = CASE WHEN status = 'draft' THEN 'sent' ELSE status END WHERE id = $1`, [inv.id]);

    res.json({ ok: true, to, filename: fileName });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Erreur envoi courriel', detail: err.message });
  }
});

export default router;
