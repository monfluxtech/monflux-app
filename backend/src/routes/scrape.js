import express from 'express';
import Anthropic from '@anthropic-ai/sdk';
import { authenticateToken, resolveCompany } from '../middleware/auth.js';

const router = express.Router();
router.use(authenticateToken, resolveCompany);

let _anthropic = null;
const getAnthropic = () => {
  if (!_anthropic) {
    if (!process.env.ANTHROPIC_API_KEY) throw new Error('ANTHROPIC_API_KEY not configured');
    _anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });
  }
  return _anthropic;
};

const APIFY_TOKEN = process.env.APIFY_API_TOKEN;
const APIFY_BASE  = 'https://api.apify.com/v2/acts';

// ─── Home Depot via Apify jupri/homedepot ───────────────────────────────────
async function scrapeHomeDepot(query, maxItems = 8) {
  if (!APIFY_TOKEN) throw new Error('APIFY_API_TOKEN non configuré');

  const url = `${APIFY_BASE}/jupri~homedepot/run-sync-get-dataset-items` +
    `?token=${APIFY_TOKEN}&timeout=90&memory=256&format=json`;

  const res = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      query: [query],
      maxItems,
      country: 'CA',
      language: 'fr',
    }),
    signal: AbortSignal.timeout(100_000),
  });

  if (res.status === 402) throw new Error('Abonnement Apify requis pour jupri/homedepot ($30/mois)');
  if (!res.ok) throw new Error(`Apify HD ${res.status}: ${await res.text().catch(() => '')}`);

  const data = await res.json();
  return (Array.isArray(data) ? data : []).slice(0, maxItems).map(item => ({
    id:           `hd-${item.itemId || item.sku || Math.random().toString(36).slice(2)}`,
    nom:          item.title || item.name || '',
    prix_unitaire: Number(item.price || item.salePrice || item.regularPrice || 0) || null,
    unite:        'un.',
    url_source:   item.url || item.productUrl || `https://www.homedepot.ca/search#q=${encodeURIComponent(query)}`,
    url_image:    item.thumbnail || item.image || '',
    fournisseur:  'Home Depot',
    sku:          item.itemId || item.sku || '',
    disponible:   item.availability !== 'OutOfStock',
    note:         item.description?.slice(0, 120) || '',
    rating:       item.ratingValue || null,
    source_verified: true,
    source_type:  'apify',
  }));
}

// ─── Canadian Tire via Apify PMo1jGg9KMXPkHbGm ──────────────────────────────
async function scrapeCanadianTire(query, maxItems = 6) {
  if (!APIFY_TOKEN) throw new Error('APIFY_API_TOKEN non configuré');

  const url = `${APIFY_BASE}/PMo1jGg9KMXPkHbGm/run-sync-get-dataset-items` +
    `?token=${APIFY_TOKEN}&timeout=90&memory=256&format=json`;

  const res = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ searchQuery: query, maxItems }),
    signal: AbortSignal.timeout(100_000),
  });

  if (!res.ok) throw new Error(`Apify CT ${res.status}`);
  const data = await res.json();

  return (Array.isArray(data) ? data : []).slice(0, maxItems).map(item => ({
    id:           `ct-${item.sku || item.id || Math.random().toString(36).slice(2)}`,
    nom:          item.name || item.title || '',
    prix_unitaire: Number(item.price || item.salePrice || 0) || null,
    unite:        'un.',
    url_source:   item.url || `https://www.canadiantire.ca/fr/search.html#q=${encodeURIComponent(query)}`,
    url_image:    item.image || item.thumbnail || '',
    fournisseur:  'Canadian Tire',
    sku:          item.sku || item.partNumber || '',
    disponible:   item.availability !== 'OutOfStock',
    note:         item.description?.slice(0, 120) || '',
    rating:       item.rating || null,
    source_verified: true,
    source_type:  'apify',
  }));
}

// ─── Rona via leur API JSON interne (Coveo / SLI) ───────────────────────────
async function scrapeRona(query, maxItems = 6) {
  // Rona.ca fait des appels XHR vers leur API search interne — accessible
  // côté serveur car pas de challenge Cloudflare sur les endpoints JSON.
  const endpoints = [
    {
      url: `https://www.rona.ca/api/2.0/json/search?q=${encodeURIComponent(query)}&lang=fr&store=rona&rows=${maxItems}`,
      parse: (d) => (d.results || d.products || d.items || []).map(toRonaItem),
    },
    {
      // Fallback : page de recherche JSON via accept header
      url: `https://www.rona.ca/fr/search?q=${encodeURIComponent(query)}&format=json&rows=${maxItems}`,
      parse: (d) => (d.results || d.products || []).map(toRonaItem),
    },
  ];

  const headers = {
    'User-Agent':      'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/125.0.0.0 Safari/537.36',
    'Accept':          'application/json, text/plain, */*',
    'Accept-Language': 'fr-CA,fr;q=0.9,en;q=0.8',
    'Referer':         'https://www.rona.ca/',
    'X-Requested-With': 'XMLHttpRequest',
  };

  for (const ep of endpoints) {
    try {
      const res = await fetch(ep.url, { headers, signal: AbortSignal.timeout(12_000) });
      if (!res.ok) continue;
      const ct = res.headers.get('content-type') || '';
      if (!ct.includes('json')) continue;
      const data = await res.json();
      const items = ep.parse(data);
      if (items.length > 0) return items.slice(0, maxItems);
    } catch { continue; }
  }
  return []; // Flo prend le relais
}

function toRonaItem(item) {
  return {
    id:           `rona-${item.sku || item.id || item.productId || Math.random().toString(36).slice(2)}`,
    nom:          item.name || item.title || item.productName || '',
    prix_unitaire: Number(item.price || item.salePrice || item.regularPrice || 0) || null,
    unite:        item.unit || 'un.',
    url_source:   item.url ? (item.url.startsWith('http') ? item.url : `https://www.rona.ca${item.url}`) : `https://www.rona.ca/fr/search?q=${encodeURIComponent(item.name||'')}`,
    url_image:    item.image || item.thumbnail || item.imageUrl || '',
    fournisseur:  'Rona',
    sku:          item.sku || item.productId || '',
    disponible:   item.inStock !== false && item.availability !== 'OutOfStock',
    note:         (item.description || item.shortDescription || '').slice(0, 120),
    source_verified: true,
    source_type:  'api',
  };
}

// ─── Enrichissement + validation par Flo (Claude) ───────────────────────────
// Flo filtre les résultats non pertinents et génère les fallbacks vérifiables.
async function floEnrich(anthropic, scrapedItems, query, projectContext) {
  const fa       = projectContext.field_assessment || {};
  const vision   = fa.vision || {};
  const phases   = (projectContext.phases || []).map(p => p.name).filter(Boolean);
  const desc     = projectContext.description || projectContext.name || '';

  // Contexte projet pour la pertinence
  const ctx = [
    desc && `Projet: ${desc}`,
    fa.work_type && `Type: ${fa.work_type}`,
    (vision.inspirations || []).length && `Inspirations: ${vision.inspirations.join(' / ')}`,
    phases.length && `Phases: ${phases.join(', ')}`,
  ].filter(Boolean).join('\n');

  const prompt = `Tu es Florence, IA MONFLUX. Tu reçois des résultats de scraping réels de fournisseurs de construction.

CONTEXTE DU PROJET:
${ctx || '(non précisé)'}

RECHERCHE: "${query}"

RÉSULTATS SCRAPÉS (${scrapedItems.length} items):
${JSON.stringify(scrapedItems.map(i => ({ nom: i.nom, prix: i.prix_unitaire, fournisseur: i.fournisseur, sku: i.sku })), null, 2)}

TES TÂCHES:
1. FILTRE: Identifie les items hors-sujet pour CE projet (ex: si le client garde ses armoires → exclure les portes d'armoires)
2. CATÉGORISE: Regroupe par catégorie de matériau (planchers, plomberie, électricité, finition, etc.)
3. AVERTIS: Si un item est pertinent mais que le contexte suggère qu'il n'est peut-être pas nécessaire, génère un warning
4. COMPLÈTE: Si pour une catégorie essentielle il n'y a AUCUN résultat scrapé, génère 1-2 suggestions avec source_verified=false et précise que le prix est une estimation

Réponds en JSON STRICT:
{
  "categories": [
    {
      "categorie": "Planchers",
      "items": [
        {
          "id": "(reprendre l'id du scraping)",
          "pertinent": true,
          "raison_exclusion": "",
          "note_flo": "Bonne option pour plancher scandinave",
          "categorie": "Planchers"
        }
      ]
    }
  ],
  "warnings": [
    { "message": "Le projet indique que les armoires sont conservées — les portes d'armoire ont été exclues." }
  ],
  "fallbacks": [
    {
      "id": "flo-fallback-1",
      "nom": "Carrelage 12x24 gris mat",
      "prix_unitaire": 4.50,
      "unite": "pi²",
      "fournisseur": "Rona (estimation)",
      "url_source": "https://www.rona.ca/fr/search?q=carrelage+12x24",
      "url_image": "",
      "categorie": "Revêtements de sol",
      "note_flo": "Estimation Flo — vérifier le prix réel sur rona.ca",
      "source_verified": false,
      "source_type": "flo_estimate"
    }
  ]
}`;

  try {
    const msg = await anthropic.messages.create({
      model: process.env.ANTHROPIC_MODEL || 'claude-haiku-4-5-20251001',
      max_tokens: 2048,
      messages: [{ role: 'user', content: prompt }],
    });
    const txt = msg.content[0]?.text || '';
    const m   = txt.match(/\{[\s\S]*\}/);
    if (!m) return { categories: [], warnings: [], fallbacks: [] };
    return JSON.parse(m[0]);
  } catch { return { categories: [], warnings: [], fallbacks: [] }; }
}

// ─── Route principale ────────────────────────────────────────────────────────
router.post('/search', async (req, res) => {
  const {
    query           = '',
    suppliers       = ['homedepot', 'rona'],
    project_context = {},
    max_per_supplier = 8,
  } = req.body;

  const errors     = [];
  const rawItems   = [];
  const startTime  = Date.now();

  // Scraping parallèle de tous les fournisseurs demandés
  await Promise.allSettled([
    suppliers.includes('homedepot') ? scrapeHomeDepot(query, max_per_supplier).then(r => rawItems.push(...r)).catch(e => errors.push({ supplier: 'Home Depot', error: e.message })) : null,
    suppliers.includes('canadiantire') ? scrapeCanadianTire(query, Math.ceil(max_per_supplier / 2)).then(r => rawItems.push(...r)).catch(e => errors.push({ supplier: 'Canadian Tire', error: e.message })) : null,
    suppliers.includes('rona') ? scrapeRona(query, max_per_supplier).then(r => rawItems.push(...r)).catch(e => errors.push({ supplier: 'Rona', error: e.message })) : null,
  ].filter(Boolean));

  // Enrichissement Flo
  let floData = { categories: [], warnings: [], fallbacks: [] };
  try {
    floData = await floEnrich(getAnthropic(), rawItems, query, project_context);
  } catch (e) {
    errors.push({ supplier: 'Flo', error: e.message });
  }

  // Merge : on commence par les items scrapés, on ajoute les métadonnées Flo
  const pertinentIds = new Set();
  const exclusions   = [];
  const categoryMap  = {}; // id → catégorie

  for (const cat of floData.categories || []) {
    for (const fi of cat.items || []) {
      if (fi.pertinent === false) {
        exclusions.push({ id: fi.id, raison: fi.raison_exclusion });
      } else {
        pertinentIds.add(fi.id);
        categoryMap[fi.id] = fi.categorie || cat.categorie;
      }
    }
  }

  // Si Flo n'a pas analysé (erreur), tout est pertinent par défaut
  const useFloFilter = floData.categories.length > 0;
  const finalItems = rawItems
    .filter(it => !useFloFilter || pertinentIds.has(it.id))
    .map(it => ({
      ...it,
      categorie: categoryMap[it.id] || 'Autres',
      note_flo:  (floData.categories.flatMap(c => c.items).find(fi => fi.id === it.id) || {}).note_flo || '',
    }));

  // Ajouter les fallbacks Flo (items sans résultat scraping)
  const allItems = [...finalItems, ...(floData.fallbacks || [])];

  res.json({
    items:          allItems,
    warnings:       floData.warnings || [],
    exclusions,
    errors,
    meta: {
      query,
      scraped_count:   rawItems.length,
      verified_count:  finalItems.filter(i => i.source_verified).length,
      fallback_count:  (floData.fallbacks || []).length,
      duration_ms:     Date.now() - startTime,
      suppliers_tried: suppliers,
    },
  });
});

export default router;
