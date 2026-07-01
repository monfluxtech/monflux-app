import express from 'express';
import PDFDocument from 'pdfkit';
import { query } from '../db.js';
import { authenticateToken, resolveCompany } from '../middleware/auth.js';

const router = express.Router();
router.use(authenticateToken, resolveCompany);

const BRAND = '#F26522';
const DARK  = '#111827';
const GRAY  = '#6b7280';

function drawLine(doc, y, color = '#e5e7eb') {
  doc.moveTo(50, y).lineTo(545, y).strokeColor(color).lineWidth(0.5).stroke();
}

function header(doc, company, title, number, date) {
  doc.rect(0, 0, 595, 6).fill(BRAND);
  doc.fontSize(20).font('Helvetica-Bold').fillColor(BRAND).text('MONFLUX', 50, 25);
  doc.fontSize(8).font('Helvetica').fillColor(GRAY).text(company?.name || '', 50, 48);
  if (company?.phone) doc.text(company.phone, 50, 58);
  if (company?.email) doc.text(company.email, 50, 68);
  doc.fontSize(22).font('Helvetica-Bold').fillColor(DARK).text(title, 300, 25, { align: 'right', width: 245 });
  doc.fontSize(10).font('Helvetica').fillColor(GRAY).text(`N° ${number}`, 300, 52, { align: 'right', width: 245 });
  doc.text(`Date : ${new Date(date).toLocaleDateString('fr-CA', { year:'numeric', month:'long', day:'numeric' })}`, 300, 65, { align: 'right', width: 245 });
  drawLine(doc, 88);
  return 100;
}

function clientBlock(doc, y, clientName, clientEmail) {
  doc.fontSize(8).font('Helvetica-Bold').fillColor(GRAY).text('FACTURER À', 50, y);
  doc.fontSize(11).font('Helvetica-Bold').fillColor(DARK).text(clientName || 'Client', 50, y + 12);
  if (clientEmail) doc.fontSize(9).font('Helvetica').fillColor(GRAY).text(clientEmail, 50, y + 26);
  return y + 50;
}

const TYPE_LABELS = { material: 'Matériaux', labor: "Main d'œuvre", subcontractor: 'Sous-traitance', other: 'Autre' };
const TYPE_ORDER = ['material', 'labor', 'subcontractor', 'other'];

// Colonnes calculées de droite à gauche à partir du bord droit du tableau (545), pour garantir
// qu'aucune colonne ne dépasse jamais la largeur du tableau — quelle que soit la combinaison de
// colonnes affichées. (L'ancien calcul gauche→droite pouvait dépasser de ~15pt et couper le TOTAL.)
function computeColumns(cols) {
  const TABLE_LEFT = 50, TABLE_RIGHT = 545, PAD = 8, GAP = 6;
  const showQty = cols.has('qty'), showUnit = cols.has('unit'), showPrice = cols.has('unit_price');
  const wQty = 40, wUnit = 42, wPrice = 66, wTotal = 66;

  let cursor = TABLE_RIGHT;
  cursor -= wTotal;
  const xTotal = cursor;
  let xPrice, xUnit, xQty;
  if (showPrice) { cursor -= (GAP + wPrice); xPrice = cursor; }
  if (showUnit)  { cursor -= (GAP + wUnit);  xUnit  = cursor; }
  if (showQty)   { cursor -= (GAP + wQty);   xQty   = cursor; }
  const xDesc = TABLE_LEFT + PAD;
  const wDesc = cursor - GAP - xDesc;

  return { showQty, showUnit, showPrice, xDesc, wDesc, xQty, wQty, xUnit, wUnit, xPrice, wPrice, xTotal, wTotal };
}

// items: liste plate avec un champ `type` (material|labor|subcontractor|other).
// categoryNotes: { [type]: description libre }.
// detailLevel: 'summary' (catégorie + description + total seulement) | 'detailed' (+ chaque ligne numérotée).
function itemsTable(doc, y, items, cols = new Set(['qty', 'unit', 'unit_price']), categoryNotes = {}, detailLevel = 'detailed') {
  const PAGE_BOTTOM = doc.page.height - doc.page.margins.bottom - 100;
  const C = computeColumns(cols);

  const drawHeader = (atY) => {
    doc.rect(50, atY, 495, 20).fill(DARK);
    doc.fontSize(8).font('Helvetica-Bold').fillColor('white');
    doc.text('DESCRIPTION', C.xDesc, atY + 6, { width: C.wDesc, lineBreak: false });
    if (C.showQty)   doc.text('QTÉ',        C.xQty,   atY + 6, { width: C.wQty,   align: 'right', lineBreak: false });
    if (C.showUnit)  doc.text('UNITÉ',      C.xUnit,  atY + 6, { width: C.wUnit,  align: 'left',  lineBreak: false });
    if (C.showPrice) doc.text('PRIX UNIT.', C.xPrice, atY + 6, { width: C.wPrice, align: 'right', lineBreak: false });
    doc.text('TOTAL', C.xTotal, atY + 6, { width: C.wTotal, align: 'right', lineBreak: false });
    return atY + 20;
  };
  const ensureRoom = (needed, atY) => {
    if (atY + needed > PAGE_BOTTOM) { doc.addPage(); return drawHeader(50); }
    return atY;
  };

  y = drawHeader(y);
  let subtotal = 0;
  let zebra = 0;

  const groups = TYPE_ORDER
    .map((type) => ({ type, items: items.filter((it) => (it.type || 'other') === type) }))
    .filter((g) => g.items.length > 0);
  // Items dont le type ne matche aucun des types connus (ne devrait pas arriver, filet de sécurité)
  const knownIds = new Set(groups.flatMap((g) => g.items));
  const orphans = items.filter((it) => !knownIds.has(it));
  if (orphans.length) groups.push({ type: 'other', items: orphans });

  groups.forEach((group) => {
    const groupTotal = group.items.reduce((s, it) => s + (Number(it.qty) || 1) * (Number(it.unit_price) || Number(it.total) || 0), 0);
    const note = categoryNotes?.[group.type];
    const noteHeight = note ? doc.fontSize(8).font('Helvetica').heightOfString(note, { width: 495 - 16 }) : 0;
    const headerHeight = 18 + (note ? noteHeight + 6 : 0);
    y = ensureRoom(headerHeight, y);

    doc.rect(50, y, 495, 18).fill('#EFEFEF');
    doc.fontSize(9).font('Helvetica-Bold').fillColor(DARK)
      .text(TYPE_LABELS[group.type] || 'Autre', 58, y + 5, { width: 300, lineBreak: false });
    doc.text(`${groupTotal.toFixed(2)} $`, C.xTotal, y + 5, { width: C.wTotal, align: 'right', lineBreak: false });
    y += 18;
    if (note) {
      doc.fontSize(8).font('Helvetica-Oblique').fillColor(GRAY).text(note, 58, y + 3, { width: 495 - 16 });
      y = doc.y + 6;
    }

    if (detailLevel !== 'summary') {
      group.items.forEach((item, i) => {
        const desc = item.description || item.name || '';
        const descHeight = doc.fontSize(9).font('Helvetica').heightOfString(desc, { width: C.wDesc });
        const rowHeight = Math.max(16, descHeight + 6);
        y = ensureRoom(rowHeight, y);

        if (zebra % 2 === 1) doc.rect(50, y, 495, rowHeight).fill('#fafafa');
        zebra += 1;
        doc.fontSize(9).font('Helvetica').fillColor(GRAY).text(String(i + 1), C.xDesc, y + 4, { width: 16, lineBreak: false });
        doc.fillColor(DARK).text(desc, C.xDesc + 16, y + 4, { width: C.wDesc - 16 });
        const lineTotal = (Number(item.qty) || 1) * (Number(item.unit_price) || Number(item.total) || 0);
        subtotal += lineTotal;
        if (C.showQty)   doc.text(String(item.qty || 1), C.xQty, y + 4, { width: C.wQty, align: 'right', lineBreak: false });
        if (C.showUnit)  doc.text(item.unit || '', C.xUnit, y + 4, { width: C.wUnit, align: 'left', lineBreak: false });
        if (C.showPrice) doc.text(`${Number(item.unit_price || 0).toFixed(2)} $`, C.xPrice, y + 4, { width: C.wPrice, align: 'right', lineBreak: false });
        doc.text(`${lineTotal.toFixed(2)} $`, C.xTotal, y + 4, { width: C.wTotal, align: 'right', lineBreak: false });
        y += rowHeight;
      });
    } else {
      subtotal += groupTotal;
    }
  });

  return { y, subtotal };
}

function totalsBlock(doc, y, subtotal, tpsPct = 5, tvqPct = 9.975) {
  y += 8;
  const tps = subtotal * tpsPct / 100;
  const tvq = subtotal * tvqPct / 100;
  const total = subtotal + tps + tvq;
  const row = (label, value, bold = false) => {
    doc.fontSize(9).font(bold ? 'Helvetica-Bold' : 'Helvetica').fillColor(bold ? DARK : GRAY);
    doc.text(label, 390, y, { width: 90, align: 'right' });
    doc.text(`${value.toFixed(2)} $`, 470, y, { width: 68, align: 'right' });
    y += 14;
  };
  drawLine(doc, y - 4);
  row('Sous-total', subtotal);
  row(`TPS (${tpsPct}%)`, tps);
  row(`TVQ (${tvqPct}%)`, tvq);
  drawLine(doc, y - 2, BRAND);
  y += 4;
  row('TOTAL', total, true);
  return { y, total };
}

function pdfFooter(doc) {
  // Draw footer on the last page at a safe y (well within bottom margin of 742)
  const pageH = doc.page.height;
  const y = pageH - 90;
  drawLine(doc, y);
  doc.fontSize(7).font('Helvetica').fillColor(GRAY)
    .text('Généré par MONFLUX 2.0 — monflux.tech', 50, y + 6, { align: 'center', width: 495, lineBreak: false });
}

function pdfToBuffer(buildFn) {
  return new Promise((resolve, reject) => {
    const doc = new PDFDocument({ size: 'LETTER', margin: 50 });
    const chunks = [];
    doc.on('data', c => chunks.push(c));
    doc.on('end', () => resolve(Buffer.concat(chunks)));
    doc.on('error', reject);
    buildFn(doc);
    doc.end();
  });
}

export async function generateQuotePDF(q, colsParam) {
  const { rows: items } = await query(
    `SELECT * FROM quote_items WHERE quote_id = $1 AND show_on_quote IS NOT FALSE ORDER BY display_order`, [q.id]
  );
  // Parse visible columns: default = show all
  const DEFAULT_COLS = new Set(['qty', 'unit', 'unit_price']);
  const cols = colsParam
    ? new Set(String(colsParam).split(',').map(s => s.trim()).filter(Boolean))
    : DEFAULT_COLS;
  return pdfToBuffer((doc) => {
    const co = { name: q.co_name || q.company_name, phone: q.co_phone || q.company_phone, email: q.co_email || q.company_email };
    let y = header(doc, co, q.format === 'field_estimate' ? 'FORMULAIRE TERRAIN' : 'SOUMISSION', q.id.slice(0,8).toUpperCase(), q.created_at);
    y = clientBlock(doc, y, q.client_name, q.client_email);
    if (q.title) { doc.fontSize(12).font('Helvetica-Bold').fillColor(DARK).text(q.title, 50, y, { lineBreak: false }); y += 20; }
    if (items.length > 0) {
      const { y: y2, subtotal } = itemsTable(doc, y, items, cols, q.category_notes || {}, q.detail_level || 'detailed');
      totalsBlock(doc, y2, subtotal, q.tps_pct || 5, q.tvq_pct || 9.975);
    } else if (q.budget_min || q.budget_max) {
      doc.fontSize(11).font('Helvetica').fillColor(GRAY).text('Estimation de prix :', 50, y, { lineBreak: false });
      doc.fontSize(16).font('Helvetica-Bold').fillColor(BRAND)
        .text(`${Number(q.budget_min||0).toLocaleString('fr-CA')} $ — ${Number(q.budget_max||0).toLocaleString('fr-CA')} $`, 50, y + 18, { lineBreak: false });
    }
    pdfFooter(doc);
  });
}

export async function generateInvoicePDF(inv, colsParam) {
  const { rows: items } = await query(
    `SELECT * FROM invoice_items WHERE invoice_id = $1 ORDER BY order_idx`, [inv.id]
  );
  const DEFAULT_COLS = new Set(['qty', 'unit', 'unit_price']);
  const cols = colsParam
    ? new Set(String(colsParam).split(',').map(s => s.trim()).filter(Boolean))
    : DEFAULT_COLS;
  return pdfToBuffer((doc) => {
    const co = { name: inv.co_name || inv.company_name, phone: inv.co_phone || inv.company_phone, email: inv.co_email || inv.company_email };
    let y = header(doc, co, 'FACTURE', inv.number, inv.created_at);
    y = clientBlock(doc, y, inv.client_name, inv.client_email);
    if (inv.due_date) {
      doc.fontSize(9).font('Helvetica').fillColor(GRAY)
        .text(`Échéance : ${new Date(inv.due_date).toLocaleDateString('fr-CA', { year:'numeric', month:'long', day:'numeric' })}`, 50, y - 30, { align: 'right', width: 495 });
    }
    const { y: y2, subtotal } = itemsTable(doc, y, items, cols, inv.category_notes || {}, inv.detail_level || 'detailed');
    totalsBlock(doc, y2, subtotal, inv.tps_pct || 5, inv.tvq_pct || 9.975);
    pdfFooter(doc);
  });
}

// GET /api/pdf/quote/:id
router.get('/quote/:id', async (req, res) => {
  const { rows: [q] } = await query(
    `SELECT q.*, c.name AS co_name, c.phone AS co_phone, c.email AS co_email,
            ct.name AS client_name, ct.email AS client_email
     FROM quotes q
     LEFT JOIN companies c ON c.id = q.company_id
     LEFT JOIN leads l ON l.id = q.lead_id
     LEFT JOIN contacts ct ON ct.id = l.contact_id
     WHERE q.id = $1 AND q.company_id = $2`,
    [req.params.id, req.company_id]
  );
  if (!q) return res.status(404).json({ error: 'Soumission non trouvée' });
  try {
    const buf = await generateQuotePDF(q, req.query.cols);
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `inline; filename="soumission-${q.id.slice(0,8)}.pdf"`);
    res.send(buf);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Erreur génération PDF' });
  }
});

// GET /api/pdf/invoice/:id
router.get('/invoice/:id', async (req, res) => {
  const { rows: [inv] } = await query(
    `SELECT i.*, c.name AS co_name, c.phone AS co_phone, c.email AS co_email
     FROM invoices i
     LEFT JOIN companies c ON c.id = i.company_id
     WHERE i.id = $1 AND i.company_id = $2`,
    [req.params.id, req.company_id]
  );
  if (!inv) return res.status(404).json({ error: 'Facture non trouvée' });
  try {
    const buf = await generateInvoicePDF(inv, req.query.cols);
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `inline; filename="facture-${inv.number}.pdf"`);
    res.send(buf);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Erreur génération PDF' });
  }
});

// GET /api/pdf/quittance/:id
router.get('/quittance/:id', async (req, res) => {
  const { rows: [q] } = await query(
    `SELECT qu.*, co.name AS co_name, co.phone AS co_phone, co.email AS co_email, co.address AS co_address,
            p.name AS project_name, p.address AS project_address
     FROM quittances qu
     LEFT JOIN companies co ON co.id = qu.company_id
     LEFT JOIN projects p ON p.id = qu.project_id
     WHERE qu.id = $1 AND qu.company_id = $2`,
    [req.params.id, req.company_id]
  );
  if (!q) return res.status(404).json({ error: 'Quittance non trouvée' });
  try {
    const buf = await pdfToBuffer((doc) => {
      // Header bar
      doc.rect(0, 0, 595, 6).fill(BRAND);
      doc.fontSize(20).font('Helvetica-Bold').fillColor(BRAND).text('MONFLUX', 50, 25);
      doc.fontSize(8).font('Helvetica').fillColor(GRAY).text(q.co_name || '', 50, 48);
      if (q.co_phone) doc.text(q.co_phone, 50, 58);
      if (q.co_email) doc.text(q.co_email, 50, 68);
      doc.fontSize(22).font('Helvetica-Bold').fillColor(DARK).text('QUITTANCE', 300, 25, { align: 'right', width: 245 });
      doc.fontSize(10).font('Helvetica').fillColor(GRAY)
        .text(`Date : ${new Date(q.created_at).toLocaleDateString('fr-CA', { year:'numeric', month:'long', day:'numeric' })}`, 300, 52, { align: 'right', width: 245 });
      if (q.signed_at) {
        doc.text(`Signée le : ${new Date(q.signed_at).toLocaleDateString('fr-CA', { year:'numeric', month:'long', day:'numeric' })}`, 300, 65, { align: 'right', width: 245 });
      }
      drawLine(doc, 88);

      let y = 108;
      // Client block
      doc.fontSize(8).font('Helvetica-Bold').fillColor(GRAY).text('CLIENT', 50, y);
      doc.fontSize(11).font('Helvetica-Bold').fillColor(DARK).text(q.client_name || 'Client', 50, y + 12);
      if (q.client_email) doc.fontSize(9).font('Helvetica').fillColor(GRAY).text(q.client_email, 50, y + 26);
      y += 55;

      // Project block
      if (q.project_name || q.project_address) {
        doc.fontSize(8).font('Helvetica-Bold').fillColor(GRAY).text('PROJET', 300, y - 55);
        doc.fontSize(11).font('Helvetica-Bold').fillColor(DARK).text(q.project_name || '', 300, y - 43);
        if (q.project_address) doc.fontSize(9).font('Helvetica').fillColor(GRAY).text(q.project_address, 300, y - 29);
      }

      drawLine(doc, y);
      y += 18;

      // Main declaration
      doc.fontSize(13).font('Helvetica-Bold').fillColor(DARK)
        .text('DÉCLARATION DE FIN DE TRAVAUX ET QUITTANCE', 50, y, { align: 'center', width: 495 });
      y += 28;

      const amount = q.amount_paid ? `${Number(q.amount_paid).toLocaleString('fr-CA', { minimumFractionDigits: 2 })} $` : null;
      const bodyText = `Je soussigné(e), ${q.client_name || 'le client'}, déclare avoir reçu les travaux effectués${q.project_description ? ` (${q.project_description})` : ''}${amount ? ` pour un montant total de ${amount}` : ''}, et atteste que ces travaux ont été réalisés à ma satisfaction complète.\n\nPar la présente quittance, je libère l'entrepreneur de toute réclamation relative aux travaux mentionnés ci-dessus.`;
      doc.fontSize(10).font('Helvetica').fillColor(DARK).text(bodyText, 50, y, { width: 495, lineGap: 4 });
      y = doc.y + 28;

      if (q.notes) {
        doc.fontSize(8).font('Helvetica-Bold').fillColor(GRAY).text('NOTES', 50, y);
        y += 12;
        doc.fontSize(9).font('Helvetica').fillColor(DARK).text(q.notes, 50, y, { width: 495 });
        y = doc.y + 20;
      }

      // Status badge
      const statusColor = q.status === 'signed' ? '#16a34a' : '#f59e0b';
      const statusLabel = q.status === 'signed' ? '✓ SIGNÉE' : q.status === 'sent' ? 'ENVOYÉE' : 'BROUILLON';
      doc.roundedRect(50, y, 120, 26, 6).fill(q.status === 'signed' ? '#dcfce7' : '#fef3c7');
      doc.fontSize(10).font('Helvetica-Bold').fillColor(statusColor).text(statusLabel, 50, y + 8, { width: 120, align: 'center' });
      y += 50;

      // Signature block
      if (q.signed_at) {
        drawLine(doc, y);
        y += 12;
        doc.fontSize(8).font('Helvetica-Bold').fillColor(GRAY).text('SIGNATURE DU CLIENT', 50, y);
        doc.fontSize(9).font('Helvetica').fillColor(DARK).text(q.client_name || '', 50, y + 14);
        doc.text(`Signé électroniquement le ${new Date(q.signed_at).toLocaleDateString('fr-CA', { year:'numeric', month:'long', day:'numeric' })}`, 50, y + 26);
      }

      pdfFooter(doc);
    });
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `inline; filename="quittance-${q.id.slice(0,8)}.pdf"`);
    res.send(buf);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Erreur génération PDF' });
  }
});

export default router;
