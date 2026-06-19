import express from 'express';
import { query } from '../db.js';
import { authenticateToken, resolveCompany } from '../middleware/auth.js';

const router = express.Router();
router.use(authenticateToken, resolveCompany);

// GET /api/search?q=TERM
router.get('/', async (req, res) => {
  const { q } = req.query;
  if (!q || q.trim().length < 2) return res.json([]);

  const term = `%${q.trim()}%`;
  const cid = req.company_id;

  const [leads, projects, quotes, invoices, contacts, subs] = await Promise.all([
    query(
      `SELECT id, title AS name, 'lead' AS type, status, contact_name AS sub
       FROM leads WHERE company_id=$1
         AND (title ILIKE $2 OR contact_name ILIKE $2 OR contact_phone ILIKE $2)
       ORDER BY created_at DESC LIMIT 5`,
      [cid, term]
    ),
    query(
      `SELECT id, name, 'project' AS type, status, client_name AS sub
       FROM projects WHERE company_id=$1
         AND (name ILIKE $2 OR client_name ILIKE $2 OR address ILIKE $2)
       ORDER BY created_at DESC LIMIT 5`,
      [cid, term]
    ),
    query(
      `SELECT id, title AS name, 'quote' AS type, status, client_name AS sub
       FROM quotes WHERE company_id=$1
         AND (title ILIKE $2 OR client_name ILIKE $2 OR number ILIKE $2)
       ORDER BY created_at DESC LIMIT 4`,
      [cid, term]
    ),
    query(
      `SELECT id, number AS name, 'invoice' AS type, status, client_name AS sub
       FROM invoices WHERE company_id=$1
         AND (number ILIKE $2 OR client_name ILIKE $2)
       ORDER BY created_at DESC LIMIT 4`,
      [cid, term]
    ),
    query(
      `SELECT id, name, 'contact' AS type, 'active' AS status, company AS sub
       FROM contacts WHERE company_id=$1
         AND (name ILIKE $2 OR email ILIKE $2 OR phone ILIKE $2)
       ORDER BY created_at DESC LIMIT 4`,
      [cid, term]
    ),
    query(
      `SELECT id, name, 'subcontractor' AS type, 'active' AS status, specialty AS sub
       FROM subcontractors WHERE company_id=$1
         AND (name ILIKE $2 OR specialty ILIKE $2 OR phone ILIKE $2)
       ORDER BY created_at DESC LIMIT 3`,
      [cid, term]
    ),
  ]);

  const pathFor = (type, id) => {
    if (type === 'project')      return `/projets/${id}`;
    if (type === 'lead')         return '/leads';
    if (type === 'quote')        return '/soumissions';
    if (type === 'invoice')      return '/factures';
    if (type === 'contact')      return '/contacts';
    if (type === 'subcontractor') return '/sous-traitants';
    return '/';
  };

  const all = [
    ...leads.rows, ...projects.rows, ...quotes.rows,
    ...invoices.rows, ...contacts.rows, ...subs.rows,
  ].map(r => ({ ...r, path: pathFor(r.type, r.id) }));

  res.json(all);
});

export default router;
