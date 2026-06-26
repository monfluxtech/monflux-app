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
    url_source:   item.url || item.productUrl || `https://www.homedepot.ca/fr/s/${encodeURIComponent(query)}`,
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

// ─── Amazon via Apify igview-owner/amazon-product-data-scraper ──────────────
async function scrapeAmazon(query, maxItems = 6) {
  if (!APIFY_TOKEN) throw new Error('APIFY_API_TOKEN non configuré');
  const url = `${APIFY_BASE}/q0wbO1lB6L73SEax7/run-sync-get-dataset-items` +
    `?token=${APIFY_TOKEN}&timeout=90&memory=256&format=json`;
  const res = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ keyword: query, maxItems, country: 'CA' }),
    signal: AbortSignal.timeout(100_000),
  });
  if (!res.ok) throw new Error(`Apify Amazon ${res.status}`);
  const data = await res.json();
  return (Array.isArray(data) ? data : []).slice(0, maxItems).map(item => ({
    id:            `amz-${item.asin || item.id || Math.random().toString(36).slice(2)}`,
    nom:           item.title || item.name || '',
    prix_unitaire: Number(item.price || item.currentPrice || 0) || null,
    unite:         'un.',
    url_source:    item.url || item.productUrl || `https://www.amazon.ca/s?k=${encodeURIComponent(query)}`,
    url_image:     item.thumbnailImage || item.image || '',
    fournisseur:   'Amazon.ca',
    sku:           item.asin || '',
    disponible:    item.isAvailable !== false,
    note:          (item.description || item.about || '').slice(0, 120),
    rating:        item.rating || null,
    source_verified: true,
    source_type:   'apify',
  }));
}

// ─── Facebook Marketplace via Apify apify/facebook-marketplace-scraper ───────
async function scrapeFacebookMarketplace(query, location = 'Montreal, QC', maxItems = 6) {
  if (!APIFY_TOKEN) throw new Error('APIFY_API_TOKEN non configuré');
  const url = `${APIFY_BASE}/U5DUNxhH3qKt5PnCf/run-sync-get-dataset-items` +
    `?token=${APIFY_TOKEN}&timeout=120&memory=512&format=json`;
  const res = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      startUrls: [{ url: `https://www.facebook.com/marketplace/montreal/search/?query=${encodeURIComponent(query)}` }],
      maxItems,
    }),
    signal: AbortSignal.timeout(130_000),
  });
  if (!res.ok) throw new Error(`Apify FB Marketplace ${res.status}`);
  const data = await res.json();
  return (Array.isArray(data) ? data : []).slice(0, maxItems).map(item => ({
    id:            `fb-${item.id || item.listingId || Math.random().toString(36).slice(2)}`,
    nom:           item.title || item.name || '',
    prix_unitaire: Number(item.price || item.priceAmount || 0) || null,
    unite:         'un.',
    url_source:    item.url || item.listingUrl || 'https://www.facebook.com/marketplace/',
    url_image:     item.image || item.primaryImage || '',
    fournisseur:   'Facebook Marketplace',
    sku:           item.id || item.listingId || '',
    disponible:    true,
    note:          (item.description || item.condition || '').slice(0, 120),
    source_verified: true,
    source_type:   'apify',
  }));
}

// ─── AliExpress via Apify logical_scrapers/aliexpress-scraper ────────────────
async function scrapeAliExpress(query, maxItems = 6) {
  if (!APIFY_TOKEN) throw new Error('APIFY_API_TOKEN non configuré');
  const url = `${APIFY_BASE}/LEqVhe8SqCDdpdXjw/run-sync-get-dataset-items` +
    `?token=${APIFY_TOKEN}&timeout=90&memory=256&format=json`;
  const res = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ searchQuery: query, maxResults: maxItems }),
    signal: AbortSignal.timeout(100_000),
  });
  if (!res.ok) throw new Error(`Apify AliExpress ${res.status}`);
  const data = await res.json();
  return (Array.isArray(data) ? data : []).slice(0, maxItems).map(item => ({
    id:            `ali-${item.id || item.productId || Math.random().toString(36).slice(2)}`,
    nom:           item.title || item.name || '',
    prix_unitaire: Number(item.price || item.salePrice || item.priceMin || 0) || null,
    unite:         'un.',
    url_source:    item.url || item.productUrl || `https://www.aliexpress.com/wholesale?SearchText=${encodeURIComponent(query)}`,
    url_image:     item.image || item.thumbnail || '',
    fournisseur:   'AliExpress',
    sku:           String(item.id || item.productId || ''),
    disponible:    true,
    note:          `⏱ Livraison internationale · ${(item.description || '').slice(0, 80)}`,
    rating:        item.rating || item.starRating || null,
    source_verified: true,
    source_type:   'apify',
  }));
}

// ─── Kijiji via Apify service-paradis/kijiji-crawler ────────────────────────
async function scrapeKijiji(query, maxItems = 6) {
  if (!APIFY_TOKEN) throw new Error('APIFY_API_TOKEN non configuré');
  const url = `${APIFY_BASE}/PtqfxadmY8UUelaYN/run-sync-get-dataset-items` +
    `?token=${APIFY_TOKEN}&timeout=90&memory=256&format=json`;
  const searchUrl = `https://www.kijiji.ca/b-recherche/page-1/${encodeURIComponent(query)}/k0?ad=offering&ll=45.508888,-73.561668&radius=50.0&dc=true`;
  const res = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ startUrls: [{ url: searchUrl }], maxAds: maxItems }),
    signal: AbortSignal.timeout(100_000),
  });
  if (!res.ok) throw new Error(`Apify Kijiji ${res.status}`);
  const data = await res.json();
  return (Array.isArray(data) ? data : []).slice(0, maxItems).map(item => ({
    id:            `kijiji-${item.id || item.adId || Math.random().toString(36).slice(2)}`,
    nom:           item.title || item.name || '',
    prix_unitaire: Number((item.price || '').toString().replace(/[^0-9.]/g, '') || 0) || null,
    unite:         'un.',
    url_source:    item.url || item.adUrl || `https://www.kijiji.ca/b-recherche/page-1/${encodeURIComponent(query)}/k0`,
    url_image:     item.image || item.thumbnail || '',
    fournisseur:   'Kijiji',
    sku:           String(item.id || item.adId || ''),
    disponible:    true,
    note:          (item.description || item.location || '').slice(0, 120),
    source_verified: true,
    source_type:   'apify',
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
      "url_source": "https://www.rona.ca/fr/search?q=carrelage+12x24+gris",
      "url_image": "",
      "categorie": "Revêtements de sol",
      "note_flo": "Estimation Flo — vérifier le prix réel sur rona.ca",
      "source_verified": false,
      "source_type": "flo_estimate"
    }
  ]
}

RÈGLES CRITIQUES pour les url_source dans les fallbacks:
- Si la recherche est en anglais, traduis d'abord le terme en français québécois (ex: "subway tiles" → "carreaux métro", "hardwood floor" → "plancher bois franc")
- Utilise le terme FR dans l'url ET dans le nom du produit
- Home Depot Canada: "https://www.homedepot.ca/fr/s/TERME_FR_ENCODE" (ex: carreaux+m%C3%A9tro)
- Rona: "https://www.rona.ca/fr/search?q=TERME_FR_ENCODE"
- Amazon.ca: "https://www.amazon.ca/s?k=TERME_FR_ENCODE"
- Canac: "https://www.canac.ca/recherche?q=TERME_FR_ENCODE"
- Patrick Morin: "https://www.patrickmorin.com/recherche?q=TERME_FR_ENCODE"
- PAR DÉFAUT si incertain: "https://www.google.com/search?q=TERME_FR_ENCODE+construction+Québec"
- N'invente JAMAIS lowes.ca, réno-dépôt.ca ou un domaine que tu ne connais pas avec certitude absolue
- INTERDIT: toute URL avec un chemin de produit spécifique (ex: /p/12345) — utilise UNIQUEMENT les URLs de recherche ci-dessus
- Le terme doit être encodé URL correctement (espaces → +, accents → %XX)`;

  try {
    const msg = await anthropic.messages.create({
      model: 'claude-sonnet-4-6',
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

  const tasks = [
    suppliers.includes('homedepot')          && scrapeHomeDepot(query, max_per_supplier)                         .then(r => rawItems.push(...r)).catch(e => errors.push({ supplier: 'Home Depot',          error: e.message })),
    suppliers.includes('canadiantire')       && scrapeCanadianTire(query, Math.ceil(max_per_supplier / 2))       .then(r => rawItems.push(...r)).catch(e => errors.push({ supplier: 'Canadian Tire',       error: e.message })),
    suppliers.includes('rona')               && scrapeRona(query, max_per_supplier)                              .then(r => rawItems.push(...r)).catch(e => errors.push({ supplier: 'Rona',               error: e.message })),
    suppliers.includes('amazon')             && scrapeAmazon(query, Math.ceil(max_per_supplier / 2))             .then(r => rawItems.push(...r)).catch(e => errors.push({ supplier: 'Amazon.ca',          error: e.message })),
    suppliers.includes('facebook')           && scrapeFacebookMarketplace(query, 'Montreal, QC', Math.ceil(max_per_supplier / 2)).then(r => rawItems.push(...r)).catch(e => errors.push({ supplier: 'Facebook Marketplace', error: e.message })),
    suppliers.includes('aliexpress')         && scrapeAliExpress(query, Math.ceil(max_per_supplier / 2))         .then(r => rawItems.push(...r)).catch(e => errors.push({ supplier: 'AliExpress',        error: e.message })),
    suppliers.includes('kijiji')             && scrapeKijiji(query, Math.ceil(max_per_supplier / 2))             .then(r => rawItems.push(...r)).catch(e => errors.push({ supplier: 'Kijiji',            error: e.message })),
  ].filter(Boolean);
  await Promise.allSettled(tasks);

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
