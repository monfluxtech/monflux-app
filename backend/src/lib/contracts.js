const DEFAULT_TEMPLATE_HTML = `
<h1 style="font-size:28px;margin:0 0 10px;color:#15171C;">{{contract_title}}</h1>
<p style="margin:0 0 24px;color:#6B7280;font-size:13px;">Document préparé le {{today_long}} pour le projet <strong>{{project_title}}</strong>.</p>

<table style="width:100%;border-collapse:collapse;margin-bottom:24px;font-size:13px;">
  <tr>
    <td style="padding:10px;border:1px solid #E5E7EB;vertical-align:top;width:50%;">
      <strong>Entrepreneur</strong><br/>
      {{company_name}}<br/>
      {{company_address}}<br/>
      {{company_phone}}<br/>
      {{company_email}}
    </td>
    <td style="padding:10px;border:1px solid #E5E7EB;vertical-align:top;width:50%;">
      <strong>Client</strong><br/>
      {{client_name}}<br/>
      {{client_email}}<br/>
      {{project_address}}
    </td>
  </tr>
</table>

<h2 style="font-size:18px;margin:24px 0 8px;color:#15171C;">1. Objet du contrat</h2>
<p style="margin:0 0 12px;line-height:1.65;color:#374151;">L'entrepreneur s'engage à exécuter les travaux décrits pour le projet <strong>{{project_title}}</strong>, de type <strong>{{work_type}}</strong>, conformément à la soumission {{quote_reference}} et aux conditions du présent contrat.</p>

<h2 style="font-size:18px;margin:24px 0 8px;color:#15171C;">2. Portée des travaux</h2>
<p style="margin:0 0 12px;line-height:1.65;color:#374151;">{{scope_summary}}</p>
{{quote_items_html}}

<h2 style="font-size:18px;margin:24px 0 8px;color:#15171C;">3. Prix et paiement</h2>
<p style="margin:0 0 12px;line-height:1.65;color:#374151;">Le montant du contrat est fixé à <strong>{{quote_total}}</strong>. {{payment_terms_sentence}}</p>
<p style="margin:0 0 12px;line-height:1.65;color:#374151;">Dépôt prévu : <strong>{{deposit_pct}}</strong>.</p>

<h2 style="font-size:18px;margin:24px 0 8px;color:#15171C;">4. Échéancier</h2>
<p style="margin:0 0 12px;line-height:1.65;color:#374151;">Début prévu : <strong>{{start_date}}</strong>. Fin prévue : <strong>{{end_date}}</strong>. Tout ajustement demandé par le client, condition imprévue ou retard de livraison pourra entraîner une révision raisonnable de l'échéancier.</p>

<h2 style="font-size:18px;margin:24px 0 8px;color:#15171C;">5. Conditions générales</h2>
<ul style="margin:0 0 12px 18px;line-height:1.7;color:#374151;">
  <li>Les travaux sont exécutés selon les règles de l'art applicables au Québec.</li>
  <li>Toute modification à la portée des travaux doit faire l'objet d'un avenant approuvé.</li>
  <li>Le client doit assurer un accès raisonnable au chantier pendant toute la durée des travaux.</li>
  <li>Les matériaux et finis sont ceux prévus au devis, sauf équivalent approuvé.</li>
</ul>

<h2 style="font-size:18px;margin:24px 0 8px;color:#15171C;">6. Signature</h2>
<p style="margin:0 0 20px;line-height:1.65;color:#374151;">En signant, les parties reconnaissent avoir lu et accepté le présent contrat.</p>

<table style="width:100%;border-collapse:collapse;margin-top:30px;font-size:13px;">
  <tr>
    <td style="padding-right:24px;vertical-align:top;width:50%;">
      <div style="border-top:1px solid #9CA3AF;padding-top:10px;">{{company_name}}<br/><span style="color:#6B7280;">Entrepreneur</span></div>
    </td>
    <td style="vertical-align:top;width:50%;">
      <div style="border-top:1px solid #9CA3AF;padding-top:10px;">{{client_name}}<br/><span style="color:#6B7280;">Client</span></div>
    </td>
  </tr>
</table>
`;

const INTERIOR_TEMPLATE_HTML = `
<h1 style="font-size:28px;margin:0 0 10px;color:#15171C;">{{contract_title}}</h1>
<p style="margin:0 0 24px;color:#6B7280;font-size:13px;">Projet intérieur résidentiel — {{today_long}}</p>
<p style="margin:0 0 14px;line-height:1.65;color:#374151;">Le présent contrat encadre les travaux de <strong>{{work_type}}</strong> au {{project_address}}, pour le client <strong>{{client_name}}</strong>.</p>
<h2 style="font-size:18px;margin:24px 0 8px;color:#15171C;">Travaux inclus</h2>
<p style="margin:0 0 12px;line-height:1.65;color:#374151;">{{scope_summary}}</p>
{{quote_items_html}}
<h2 style="font-size:18px;margin:24px 0 8px;color:#15171C;">Protection des lieux</h2>
<ul style="margin:0 0 12px 18px;line-height:1.7;color:#374151;">
  <li>Protection minimale des surfaces adjacentes et nettoyage quotidien raisonnable.</li>
  <li>Présence de poussière, bruit et interruptions temporaires normales pour ce type de travaux.</li>
  <li>Les conditions cachées découvertes à l'ouverture peuvent entraîner une révision des coûts et délais.</li>
</ul>
<h2 style="font-size:18px;margin:24px 0 8px;color:#15171C;">Prix, échéancier et paiement</h2>
<p style="margin:0 0 12px;line-height:1.65;color:#374151;">Montant du contrat : <strong>{{quote_total}}</strong>. Début : <strong>{{start_date}}</strong>. Fin prévue : <strong>{{end_date}}</strong>. {{payment_terms_sentence}}</p>
<h2 style="font-size:18px;margin:24px 0 8px;color:#15171C;">Signatures</h2>
<p style="margin:28px 0 0;color:#374151;">Entrepreneur : {{company_name}}<br/>Client : {{client_name}}</p>
`;

const EXTERIOR_TEMPLATE_HTML = `
<h1 style="font-size:28px;margin:0 0 10px;color:#15171C;">{{contract_title}}</h1>
<p style="margin:0 0 24px;color:#6B7280;font-size:13px;">Projet extérieur / enveloppe — {{today_long}}</p>
<p style="margin:0 0 12px;line-height:1.65;color:#374151;">Ce contrat vise les travaux de <strong>{{work_type}}</strong> au {{project_address}}.</p>
<h2 style="font-size:18px;margin:24px 0 8px;color:#15171C;">Portée et exclusions</h2>
<p style="margin:0 0 12px;line-height:1.65;color:#374151;">{{scope_summary}}</p>
{{quote_items_html}}
<ul style="margin:0 0 12px 18px;line-height:1.7;color:#374151;">
  <li>Les travaux extérieurs demeurent sujets aux conditions météo, à la sécurité du chantier et à la disponibilité des matériaux.</li>
  <li>Les travaux correctifs requis à la suite de vices cachés ou de structures déficientes seront traités par avenant.</li>
  <li>Le client est responsable de dégager les accès et de protéger les biens personnels situés dans les zones de travail.</li>
</ul>
<p style="margin:0 0 12px;line-height:1.65;color:#374151;">Montant du contrat : <strong>{{quote_total}}</strong>. {{payment_terms_sentence}}</p>
<p style="margin:28px 0 0;color:#374151;">Entrepreneur : {{company_name}}<br/>Client : {{client_name}}</p>
`;

const SERVICE_TEMPLATE_HTML = `
<h1 style="font-size:28px;margin:0 0 10px;color:#15171C;">{{contract_title}}</h1>
<p style="margin:0 0 20px;color:#6B7280;font-size:13px;">Entente de service — {{today_long}}</p>
<p style="margin:0 0 12px;line-height:1.65;color:#374151;">L'entrepreneur réalisera les interventions suivantes : {{scope_summary}}</p>
{{quote_items_html}}
<p style="margin:0 0 12px;line-height:1.65;color:#374151;">Facturation prévue : <strong>{{quote_total}}</strong>. {{payment_terms_sentence}}</p>
<p style="margin:0 0 12px;line-height:1.65;color:#374151;">Le service sera rendu à l'adresse suivante : <strong>{{project_address}}</strong>.</p>
<p style="margin:28px 0 0;color:#374151;">Entrepreneur : {{company_name}}<br/>Client : {{client_name}}</p>
`;

export function getDefaultContractTemplates() {
  return {
    version: 1,
    default_key: 'general',
    templates: [
      {
        key: 'general',
        label: 'Contrat général',
        description: 'Pour rénovation générale et projets standards.',
        project_types: ['default', 'general', 'renovation', 'renovation_generale'],
        content: DEFAULT_TEMPLATE_HTML.trim(),
      },
      {
        key: 'interior',
        label: 'Contrat intérieur',
        description: 'Cuisine, salle de bain, sous-sol, finition intérieure.',
        project_types: ['cuisine', 'salle_de_bain', 'bathroom', 'kitchen', 'interior', 'interieur', 'sous_sol'],
        content: INTERIOR_TEMPLATE_HTML.trim(),
      },
      {
        key: 'exterior',
        label: 'Contrat extérieur',
        description: 'Toiture, revêtement, terrasse, façade et enveloppe.',
        project_types: ['toiture', 'revetement', 'terrasse', 'exterieur', 'roof', 'roofing', 'facade'],
        content: EXTERIOR_TEMPLATE_HTML.trim(),
      },
      {
        key: 'service',
        label: 'Entente de service',
        description: 'Petits travaux, entretien, interventions ponctuelles.',
        project_types: ['service', 'entretien', 'repair', 'maintenance', 'inspection'],
        content: SERVICE_TEMPLATE_HTML.trim(),
      },
    ],
  };
}

export function normalizeContractTemplates(raw) {
  const defaults = getDefaultContractTemplates();
  const rawTemplates = Array.isArray(raw?.templates) ? raw.templates : [];
  const map = new Map(defaults.templates.map((template) => [template.key, template]));

  rawTemplates.forEach((template) => {
    if (!template?.key) return;
    map.set(template.key, {
      ...map.get(template.key),
      ...template,
      project_types: Array.isArray(template.project_types) ? template.project_types : (map.get(template.key)?.project_types || []),
      content: String(template.content || map.get(template.key)?.content || ''),
    });
  });

  const templates = [...map.values()];
  const defaultKey = raw?.default_key && map.has(raw.default_key) ? raw.default_key : defaults.default_key;
  return { version: 1, default_key: defaultKey, templates };
}

function normalizeTokenKey(value) {
  return String(value || '')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '_')
    .replace(/^_+|_+$/g, '');
}

export function detectContractTemplateKey(project, config) {
  const templates = normalizeContractTemplates(config).templates;
  const haystack = [
    project?.field_assessment?.work_type,
    project?.type,
    project?.name,
    project?.description,
  ]
    .map(normalizeTokenKey)
    .filter(Boolean)
    .join(' ');

  const matched = templates.find((template) => (
    (template.project_types || []).some((projectType) => haystack.includes(normalizeTokenKey(projectType)))
  ));
  return matched?.key || normalizeContractTemplates(config).default_key;
}

function escapeHtml(value) {
  return String(value ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

function formatDate(value, opts = { year: 'numeric', month: 'long', day: 'numeric' }) {
  if (!value) return 'À confirmer';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return 'À confirmer';
  return date.toLocaleDateString('fr-CA', opts);
}

function toMoney(value) {
  return `${Number(value || 0).toLocaleString('fr-CA', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} $`;
}

function buildQuoteItemsHtml(items = []) {
  if (!Array.isArray(items) || !items.length) {
    return '<p style="margin:0 0 12px;line-height:1.65;color:#374151;">Voir la soumission détaillée jointe au dossier pour la ventilation complète des éléments inclus.</p>';
  }
  const rows = items
    .map((item) => `
      <tr>
        <td style="padding:8px;border:1px solid #E5E7EB;">${escapeHtml(item.name || 'Poste')}</td>
        <td style="padding:8px;border:1px solid #E5E7EB;text-align:center;">${escapeHtml(item.qty || 1)}</td>
        <td style="padding:8px;border:1px solid #E5E7EB;text-align:center;">${escapeHtml(item.unit || '')}</td>
        <td style="padding:8px;border:1px solid #E5E7EB;text-align:right;">${toMoney(item.total || (Number(item.qty || 1) * Number(item.unit_price || 0)))}</td>
      </tr>
    `)
    .join('');
  return `
    <table style="width:100%;border-collapse:collapse;margin:12px 0 18px;font-size:13px;">
      <thead>
        <tr style="background:#F9FAFB;">
          <th style="padding:8px;border:1px solid #E5E7EB;text-align:left;">Poste</th>
          <th style="padding:8px;border:1px solid #E5E7EB;text-align:center;">Qté</th>
          <th style="padding:8px;border:1px solid #E5E7EB;text-align:center;">Unité</th>
          <th style="padding:8px;border:1px solid #E5E7EB;text-align:right;">Total</th>
        </tr>
      </thead>
      <tbody>${rows}</tbody>
    </table>
  `.trim();
}

export function buildContractMergeFields({ company, project, quote, client }) {
  const scopeSummary = (
    quote?.notes ||
    project?.description ||
    'Les travaux seront réalisés selon la portée décrite au devis et les décisions approuvées par le client.'
  );
  const address = [project?.address, project?.city, project?.postal_code].filter(Boolean).join(', ') || 'Adresse à confirmer';
  const total = Number(quote?.total || project?.contract_value || 0);
  const depositPct = Number(company?.default_deposit_pct || 0);
  const workType = project?.field_assessment?.work_type || project?.type || 'Projet de construction';
  const paymentTerms = project?.payment_terms || (company?.payment_terms_days ? `Paiement net ${company.payment_terms_days} jours.` : 'Paiement selon entente entre les parties.');

  return {
    contract_title: `Contrat — ${project?.name || quote?.title || 'Projet'}`,
    today_long: formatDate(new Date()),
    company_name: company?.name || 'MONFLUX',
    company_address: [company?.address, company?.city, company?.postal_code].filter(Boolean).join(', '),
    company_phone: company?.phone || '',
    company_email: company?.email || '',
    client_name: client?.name || project?.client_name || 'Client à confirmer',
    client_email: client?.email || project?.client_email || '',
    project_title: project?.name || quote?.title || 'Projet',
    project_address: address,
    work_type: workType,
    start_date: formatDate(project?.start_date),
    end_date: formatDate(project?.end_date),
    quote_total: toMoney(total),
    quote_reference: quote?.title || `#${String(quote?.id || '').slice(0, 8).toUpperCase()}`,
    payment_terms_sentence: paymentTerms,
    deposit_pct: depositPct > 0 ? `${depositPct}%` : 'Aucun dépôt spécifié',
    scope_summary: scopeSummary,
    quote_items_html: buildQuoteItemsHtml(quote?.items || []),
  };
}

export function renderContractTemplate(templateHtml, mergeFields) {
  let result = String(templateHtml || '').trim();
  Object.entries(mergeFields || {}).forEach(([key, value]) => {
    const safeValue = key.endsWith('_html') ? String(value || '') : escapeHtml(value || '');
    result = result.replace(new RegExp(`{{\\s*${key}\\s*}}`, 'g'), safeValue);
  });
  return result;
}

export function buildFallbackFloContractHtml(currentContent, mergeFields) {
  return `
    ${currentContent}
    <h2 style="font-size:18px;margin:24px 0 8px;color:#15171C;">7. Précisions opérationnelles ajoutées par Flo</h2>
    <ul style="margin:0 0 12px 18px;line-height:1.7;color:#374151;">
      <li>Les travaux seront coordonnés selon la réalité du chantier et les accès disponibles.</li>
      <li>Tout écart entre les conditions visibles et la réalité découverte à l'ouverture sera communiqué rapidement au client.</li>
      <li>Les ajustements de portée, de matériaux ou d'échéancier seront documentés avant exécution lorsqu'ils impactent le coût ou le calendrier.</li>
      <li>Projet visé : <strong>${escapeHtml(mergeFields.project_title)}</strong> — type <strong>${escapeHtml(mergeFields.work_type)}</strong>.</li>
    </ul>
  `.trim();
}
