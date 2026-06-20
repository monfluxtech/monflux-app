import { useEffect, useState, useCallback, useRef, useMemo } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import Layout from '../components/Layout';
import SlideOver from '../components/SlideOver';
import { projects as projectsApi, ai as aiApi } from '../api';
import { useConfigStore } from '../store';
import { useT } from '../hooks/useT';
import { DEFAULT_PIPELINE } from '../config/modules';
import { Plus, Loader2, MapPin, Calendar, DollarSign, Pencil, Trash2, ChevronRight, Search, Clock, List, Map as MapIcon, TrendingUp, Settings2, ArrowUp, ArrowDown, Check, X, GanttChart, Columns, Sparkles } from 'lucide-react';

const num = (v) => Number(v) || 0;
const money = (v) => num(v).toLocaleString('fr-CA', { maximumFractionDigits: 0 }) + '$';
// Marge théorique = commande − (budgets + coûts métiers estimés). Réelle = facturé − (punch + dépenses).
const theoMargin = (p) => num(p.contract_value) - (num(p.budget_materials) + num(p.budget_labor) + num(p.trades_estimated_cost));
const realMargin = (p) => num(p.invoiced_real) - (num(p.labor_cost_real) + num(p.expenses_real));

// Load Leaflet from CDN once (no npm dependency, no API key needed)
let leafletPromise = null;
function loadLeaflet() {
  if (typeof window !== 'undefined' && window.L) return Promise.resolve(window.L);
  if (leafletPromise) return leafletPromise;
  leafletPromise = new Promise((resolve, reject) => {
    const css = document.createElement('link');
    css.rel = 'stylesheet';
    css.href = 'https://unpkg.com/leaflet@1.9.4/dist/leaflet.css';
    document.head.appendChild(css);
    const script = document.createElement('script');
    script.src = 'https://unpkg.com/leaflet@1.9.4/dist/leaflet.js';
    script.onload = () => resolve(window.L);
    script.onerror = reject;
    document.body.appendChild(script);
  });
  return leafletPromise;
}

function MapView({ projects, onGeocodeAll, geocoding, stageMap }) {
  const navigate = useNavigate();
  const mapEl = useRef(null);
  const mapRef = useRef(null);
  const layerRef = useRef(null);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    let cancelled = false;
    loadLeaflet().then((L) => {
      if (cancelled || !mapEl.current || mapRef.current) return;
      mapRef.current = L.map(mapEl.current, { scrollWheelZoom: false }).setView([46.81, -71.21], 6);
      L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '© OpenStreetMap', maxZoom: 19,
      }).addTo(mapRef.current);
      layerRef.current = L.layerGroup().addTo(mapRef.current);
      setReady(true);
    }).catch(() => {});
    return () => { cancelled = true; };
  }, []);

  useEffect(() => {
    if (!ready || !window.L || !layerRef.current) return;
    const L = window.L;
    layerRef.current.clearLayers();
    const located = projects.filter(p => p.latitude && p.longitude);
    const bounds = [];
    located.forEach((p) => {
      const lat = Number(p.latitude), lng = Number(p.longitude);
      const color = stageMap?.[p.status]?.color || '#94a3b8';
      const icon = L.divIcon({
        className: '',
        html: `<div style="width:18px;height:18px;border-radius:50%;background:${color};border:3px solid #fff;box-shadow:0 1px 4px rgba(0,0,0,.35)"></div>`,
        iconSize: [18, 18], iconAnchor: [9, 9],
      });
      const m = L.marker([lat, lng], { icon });
      m.bindTooltip(`${p.name}${p.contract_value ? ` · ${Number(p.contract_value).toLocaleString('fr-CA')}$` : ''}`, { direction: 'top', offset: [0, -8] });
      m.on('click', () => navigate(`/projets/${p.id}`));
      m.addTo(layerRef.current);
      bounds.push([lat, lng]);
    });
    if (bounds.length) mapRef.current.fitBounds(bounds, { padding: [40, 40], maxZoom: 13 });
  }, [ready, projects, navigate]);

  const located = projects.filter(p => p.latitude && p.longitude).length;
  const missing = projects.filter(p => p.address && (!p.latitude || !p.longitude)).length;

  return (
    <div>
      <div className="flex items-center justify-between mb-3 text-xs text-gray-500">
        <span>{located} chantier(s) localisé(s){missing > 0 ? ` · ${missing} sans position` : ''}</span>
        {missing > 0 && (
          <button className="btn-secondary text-xs py-1" onClick={onGeocodeAll} disabled={geocoding}>
            {geocoding ? <Loader2 size={12} className="animate-spin"/> : <MapPin size={12}/>}
            Localiser {missing} chantier{missing > 1 ? 's' : ''}
          </button>
        )}
      </div>
      <div ref={mapEl} style={{ height: 520, borderRadius: 16, overflow: 'hidden', zIndex: 0 }} className="border border-gray-100" />
      {located === 0 && (
        <p className="text-center text-sm text-gray-400 mt-3">
          Aucun chantier localisé. Ajoutez une adresse aux projets puis cliquez « Localiser ».
        </p>
      )}
    </div>
  );
}

// ── Gantt portefeuille — toutes les durées de projets sur une ligne de temps ───
function GanttPortfolio({ projects, stageMap }) {
  const navigate = useNavigate();
  const withDates = projects
    .filter(p => p.start_date || p.end_date)
    .sort((a, b) => new Date(a.start_date || a.end_date) - new Date(b.start_date || b.end_date));

  if (!withDates.length) {
    return (
      <div className="card text-center py-14">
        <GanttChart size={32} className="text-gray-200 mx-auto mb-3"/>
        <p className="text-sm text-gray-400">Aucun projet avec des dates de début/fin définies.</p>
        <p className="text-xs text-gray-300 mt-1">Ajoutez des dates aux projets pour les voir ici.</p>
      </div>
    );
  }

  const allDates = withDates.flatMap(p => [p.start_date, p.end_date].filter(Boolean)).map(d => new Date(d));
  const refStart = new Date(Math.min(...allDates)); refStart.setDate(refStart.getDate() - 7);
  const refEnd = new Date(Math.max(...allDates)); refEnd.setDate(refEnd.getDate() + 14);
  const totalMs = refEnd - refStart || 1;
  const pct = (d) => Math.max(0, Math.min(100, (new Date(d) - refStart) / totalMs * 100));
  const barWidth = (s, e) => Math.max(1, pct(e) - pct(s));
  const todayPct = pct(new Date());

  const months = [];
  const cur = new Date(refStart.getFullYear(), refStart.getMonth(), 1);
  while (cur <= refEnd) { months.push(new Date(cur)); cur.setMonth(cur.getMonth() + 1); }

  return (
    <div className="card overflow-x-auto">
      <div style={{ minWidth: 560 }}>
        {/* Month headers */}
        <div className="flex mb-2 ml-52">
          {months.map((m, i) => {
            const left = pct(m);
            const nextM = new Date(m.getFullYear(), m.getMonth() + 1, 1);
            const w = Math.min(pct(nextM), 100) - left;
            return (
              <div key={i} className="text-[11px] text-gray-300 border-l border-gray-100 pl-1 flex-shrink-0" style={{ width: `${Math.max(w, 0)}%`, minWidth: 28 }}>
                {m.toLocaleDateString('fr-CA', { month: 'short', year: '2-digit' })}
              </div>
            );
          })}
        </div>
        {/* Project rows */}
        <div className="relative ml-52">
          <div className="absolute top-0 bottom-0 w-px bg-brand/60 z-10" style={{ left: `${todayPct}%` }} title="Aujourd'hui"/>
          {withDates.map(p => {
            const start = p.start_date ? new Date(p.start_date) : new Date();
            const end = p.end_date ? new Date(p.end_date) : new Date(start.getTime() + 30 * 86400000);
            const color = stageMap[p.status]?.color || '#94a3b8';
            const pLeft = pct(start);
            const pW = barWidth(start, end);
            const prog = p.progress_pct || 0;
            return (
              <div key={p.id} className="flex items-center mb-2 gap-2 -ml-52 group cursor-pointer" onClick={() => navigate(`/projets/${p.id}`)}>
                <div className="w-52 text-xs font-medium text-gray-700 truncate pr-3 text-right flex-shrink-0 group-hover:text-brand transition-colors">{p.name}</div>
                <div className="flex-1 relative h-7">
                  <div
                    className="absolute h-full rounded-full overflow-hidden flex items-center"
                    style={{ left: `${pLeft}%`, width: `${pW}%`, minWidth: 4, background: color + '22', border: `1.5px solid ${color}` }}
                    title={`${p.name} · ${stageMap[p.status]?.label || p.status}${p.contract_value ? ' · ' + Number(p.contract_value).toLocaleString('fr-CA') + '$' : ''}`}
                  >
                    <div className="h-full rounded-full absolute left-0 top-0" style={{ width: `${prog}%`, background: color + '55' }}/>
                    {pW > 6 && prog > 0 && (
                      <span className="relative text-xs font-semibold z-10 px-2 truncate" style={{ color }}>{prog}%</span>
                    )}
                  </div>
                </div>
                <span className="text-[11px] text-gray-400 flex-shrink-0 w-16 text-right truncate">{stageMap[p.status]?.label || ''}</span>
              </div>
            );
          })}
        </div>
        <p className="text-[11px] text-gray-300 text-right mt-2">
          {withDates.length}/{projects.length} projets avec dates
        </p>
      </div>
    </div>
  );
}

// ── Vue Kanban — colonnes par état du pipeline, drag-and-drop ─────────────────
function KanbanView({ projects, pipeline, stageMap, onChangeStage, onNew }) {
  const navigate = useNavigate();
  const [draggedId, setDraggedId] = useState(null);
  const [overStage, setOverStage] = useState(null);

  const onDragStart = (id) => (e) => {
    e.dataTransfer.effectAllowed = 'move';
    setDraggedId(id);
  };
  const onDragEnd = () => { setDraggedId(null); setOverStage(null); };
  const onDragOver = (key) => (e) => { e.preventDefault(); e.dataTransfer.dropEffect = 'move'; setOverStage(key); };
  const onDrop = (key) => (e) => {
    e.preventDefault();
    if (draggedId) onChangeStage(draggedId, key);
    setDraggedId(null); setOverStage(null);
  };

  return (
    <div className="flex gap-3 overflow-x-auto pb-4" style={{ minHeight: 440 }}>
      {pipeline.map(stage => {
        const stageProjects = projects.filter(p => p.status === stage.key);
        const isOver = overStage === stage.key;
        return (
          <div
            key={stage.key}
            className={`flex-shrink-0 w-60 rounded-2xl p-2 transition-colors border ${
              isOver ? 'border-brand/40 bg-orange-50/40' : 'border-transparent bg-gray-100/60'
            }`}
            onDragOver={onDragOver(stage.key)}
            onDrop={onDrop(stage.key)}
            onDragLeave={() => setOverStage(null)}
          >
            <div className="flex items-center gap-2 px-2 py-1.5 mb-2">
              <div className="w-2.5 h-2.5 rounded-full flex-shrink-0" style={{ background: stage.color }}/>
              <p className="text-xs font-bold text-gray-700 truncate flex-1">{stage.label}</p>
              <span className="text-[11px] text-gray-400 bg-white rounded-full px-1.5 py-0.5 font-medium">{stageProjects.length}</span>
            </div>
            <div className="space-y-2">
              {stageProjects.map(p => (
                <div
                  key={p.id}
                  draggable
                  onDragStart={onDragStart(p.id)}
                  onDragEnd={onDragEnd}
                  className={`bg-white rounded-xl p-3 shadow-sm cursor-grab active:cursor-grabbing border border-gray-100 hover:border-brand/30 transition-all ${
                    draggedId === p.id ? 'opacity-40 scale-95' : ''
                  }`}
                  onClick={() => navigate(`/projets/${p.id}`)}
                >
                  <p className="text-sm font-semibold text-gray-900 mb-1 truncate">{p.name}</p>
                  {p.address && (
                    <p className="text-[11px] text-gray-400 truncate mb-1.5 flex items-center gap-1">
                      <MapPin size={9}/>{p.address}
                    </p>
                  )}
                  <div className="flex items-center justify-between gap-2">
                    {p.contract_value
                      ? <span className="text-xs font-bold text-brand">{Number(p.contract_value).toLocaleString('fr-CA')}$</span>
                      : <span/>}
                    {p.end_date && !stage.terminal && (() => {
                      const days = Math.ceil((new Date(p.end_date) - Date.now()) / 86400000);
                      return (
                        <span className={`text-[10px] font-medium flex items-center gap-0.5 flex-shrink-0 ${days < 0 ? 'text-red-400' : days <= 7 ? 'text-orange-400' : 'text-gray-300'}`}>
                          <Clock size={9}/>{days < 0 ? `${Math.abs(days)}j` : `${days}j`}
                        </span>
                      );
                    })()}
                  </div>
                  {!stage.terminal && (p.progress_pct > 0) && (
                    <div className="mt-2 h-1 bg-gray-100 rounded-full">
                      <div className="h-full rounded-full" style={{ width: `${p.progress_pct}%`, background: stage.color }}/>
                    </div>
                  )}
                </div>
              ))}
              <button
                className="w-full text-xs text-gray-300 py-2 rounded-xl border border-dashed border-gray-200 hover:border-brand/40 hover:text-brand transition-colors"
                onClick={onNew}
              >
                <Plus size={11} className="inline mr-0.5"/> Nouveau
              </button>
            </div>
          </div>
        );
      })}
    </div>
  );
}

const EMPTY = { name:'', address:'', city:'', start_date:'', end_date:'', contract_value:'', description:'' };

const slugify = (str) => (str || '').toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '')
  .replace(/[^a-z0-9]+/g, '_').replace(/^_|_$/g, '') || 'etat';

// Éditeur du pipeline — renommer, recolorer, réordonner, ajouter/retirer des états.
function PipelineManager({ pipeline, onSave, onClose }) {
  const [stages, setStages] = useState(() => pipeline.map((s) => ({ ...s })));
  const [saving, setSaving] = useState(false);
  const upd = (i, patch) => setStages((s) => s.map((st, idx) => idx === i ? { ...st, ...patch } : st));
  const move = (i, dir) => setStages((s) => {
    const j = i + dir; if (j < 0 || j >= s.length) return s;
    const next = [...s]; [next[i], next[j]] = [next[j], next[i]]; return next;
  });
  const remove = (i) => setStages((s) => s.filter((_, idx) => idx !== i));
  const add = () => setStages((s) => [...s, { key: '', label: 'Nouvel état', color: '#94a3b8' }]);

  const save = async () => {
    setSaving(true);
    const seen = new Set();
    const cleaned = stages.filter((st) => (st.label || '').trim()).map((st) => {
      let key = st.key && /^[a-z0-9_]+$/.test(st.key) ? st.key : slugify(st.label);
      const base = key; let n = 1;
      while (seen.has(key)) key = `${base}_${n++}`;
      seen.add(key);
      return { key, label: st.label.trim(), color: st.color || '#94a3b8', ...(st.terminal ? { terminal: true } : {}) };
    });
    if (cleaned.length) await onSave(cleaned);
    setSaving(false);
    onClose();
  };

  return (
    <SlideOver
      title="Gérer le pipeline"
      subtitle="Personnalise les états par lesquels tes projets passent"
      onClose={onClose}
      footer={
        <div className="flex gap-2">
          <button type="button" className="btn-secondary flex-1" onClick={onClose}>Annuler</button>
          <button type="button" className="btn-primary flex-1" onClick={save} disabled={saving}>
            {saving && <Loader2 size={14} className="animate-spin" />} Enregistrer
          </button>
        </div>
      }
    >
      <div className="space-y-2">
        {stages.map((st, i) => (
          <div key={i} className="flex items-center gap-2 p-2 rounded-xl border border-gray-100 bg-gray-50">
            <div className="flex flex-col">
              <button type="button" onClick={() => move(i, -1)} disabled={i === 0} className="text-gray-300 hover:text-gray-600 disabled:opacity-30"><ArrowUp size={13} /></button>
              <button type="button" onClick={() => move(i, 1)} disabled={i === stages.length - 1} className="text-gray-300 hover:text-gray-600 disabled:opacity-30"><ArrowDown size={13} /></button>
            </div>
            <input type="color" value={st.color || '#94a3b8'} onChange={(e) => upd(i, { color: e.target.value })} className="w-7 h-7 rounded cursor-pointer flex-shrink-0 border border-gray-200" title="Couleur" />
            <input className="input flex-1 py-1 text-sm" value={st.label} onChange={(e) => upd(i, { label: e.target.value })} placeholder="Nom de l'état" />
            <label className="flex items-center gap-1 text-[10px] text-gray-400 flex-shrink-0" title="État final (projet terminé)">
              <input type="checkbox" checked={!!st.terminal} onChange={(e) => upd(i, { terminal: e.target.checked })} /> fin
            </label>
            <button type="button" onClick={() => remove(i)} className="text-gray-300 hover:text-red-500 flex-shrink-0"><X size={14} /></button>
          </div>
        ))}
        <button type="button" onClick={add} className="w-full flex items-center justify-center gap-1 py-2 text-sm text-brand border border-dashed border-brand/40 rounded-xl hover:bg-orange-50">
          <Plus size={14} /> Ajouter un état
        </button>
        <p className="text-xs text-gray-400 pt-1">L'ordre définit la progression. Coche « fin » pour les états où le projet est clos (rangé dans « Terminés »).</p>
      </div>
    </SlideOver>
  );
}

function ProjectModal({ project, onClose, onSave }) {
  const t = useT();
  const [form, setForm] = useState(project ? {
    name: project.name || '', address: project.address || '', city: project.city || '',
    start_date: project.start_date ? project.start_date.slice(0, 10) : '',
    end_date: project.end_date ? project.end_date.slice(0, 10) : '',
    contract_value: project.contract_value || '', description: project.description || '',
  } : { ...EMPTY });
  const [saving, setSaving] = useState(false);
  const [generatingPhases, setGeneratingPhases] = useState(false);
  const [error, setError] = useState(null);
  const f = k => e => setForm(p => ({ ...p, [k]: e.target.value }));

  const submit = async (e) => {
    e.preventDefault();
    setError(null);
    setSaving(true);
    try {
      const payload = {
        name: form.name, address: form.address || null, city: form.city || null,
        description: form.description || null,
        start_date: form.start_date || null, end_date: form.end_date || null,
        contract_value: form.contract_value || null,
      };
      const res = project
        ? await projectsApi.update(project.id, payload)
        : await projectsApi.create(payload);
      const proj = res?.data ?? res;
      if (!proj?.id) throw new Error('Réponse invalide du serveur');

      // On création avec description → générer phases IA en arrière-plan
      if (!project && form.description) {
        setGeneratingPhases(true);
        try {
          const { data: aiRes } = await aiApi.generatePhases({
            description: form.description,
            start_date: form.start_date || null,
          });
          if (aiRes?.phases?.length) {
            for (const [i, ph] of aiRes.phases.entries()) {
              await projectsApi.addPhase(proj.id, {
                name: ph.name,
                display_order: ph.order ?? i,
                color: ph.color || null,
                notes: ph.description || null,
              });
            }
          }
        } catch {} finally { setGeneratingPhases(false); }
      }

      onSave(proj, !!project);
    } catch (err) {
      setError(err?.response?.data?.error || err?.message || 'Erreur lors de la création');
    } finally { setSaving(false); }
  };

  return (
    <SlideOver
      title={project ? 'Modifier le projet' : 'Nouveau projet'}
      subtitle={project ? project.name : 'Créer un nouveau chantier'}
      onClose={onClose}
      footer={
        <div className="flex gap-2">
          <button type="button" className="btn-secondary flex-1" onClick={onClose}>Annuler</button>
          <button type="submit" form="project-form" className="btn-primary flex-1" disabled={saving || generatingPhases}>
            {(saving || generatingPhases) && <Loader2 size={14} className="animate-spin"/>}
            {generatingPhases ? 'Phases IA…' : saving ? 'Création…' : project ? 'Enregistrer' : 'Créer'}
          </button>
        </div>
      }
    >
      <form id="project-form" onSubmit={submit} className="space-y-3">
        {error && <div className="bg-red-50 border border-red-200 text-red-700 text-xs rounded-lg px-3 py-2">{error}</div>}
        <div><label className="label">{t('project_name')} *</label><input className="input" value={form.name} onChange={f('name')} required /></div>
        <div>
          <label className="label flex items-center gap-1">
            {t('project_desc')}
            <span className="ml-1 text-[10px] text-brand font-medium flex items-center gap-0.5"><Sparkles size={9}/>{t('ai_phases')}</span>
          </label>
          <textarea className="input resize-none" rows={3} placeholder={t('project_desc') + '…'} value={form.description} onChange={f('description')} />
        </div>
        <div><label className="label">{t('address')}</label><input className="input" placeholder="123 rue Principale" value={form.address} onChange={f('address')} /></div>
        <div><label className="label">{t('city')}</label><input className="input" placeholder="Montréal" value={form.city} onChange={f('city')} /></div>
        <div className="grid grid-cols-2 gap-3">
          <div><label className="label">{t('start_date')}</label><input className="input" type="date" value={form.start_date} onChange={f('start_date')} /></div>
          <div><label className="label">{t('end_date')}</label><input className="input" type="date" value={form.end_date} onChange={f('end_date')} /></div>
        </div>
        <div><label className="label">{t('contract_value')}</label><input className="input" type="number" value={form.contract_value} onChange={f('contract_value')} /></div>
      </form>
    </SlideOver>
  );
}

export default function Projets() {
  const t = useT();
  const [searchParams] = useSearchParams();
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showNew, setShowNew] = useState(searchParams.get('new') === '1');
  const [editItem, setEditItem] = useState(null);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [cityFilter, setCityFilter] = useState('');
  const [managerFilter, setManagerFilter] = useState('');
  const [valueMin, setValueMin] = useState('');
  const [valueMax, setValueMax] = useState('');
  const [showFilters, setShowFilters] = useState(false);
  const [pipeOpen, setPipeOpen] = useState(false);
  const navigate = useNavigate();

  // Sélecteurs individuels (éviter de retourner un nouvel objet → boucle de rendu).
  const storePipeline = useConfigStore((s) => s.pipeline);
  const loadCfg = useConfigStore((s) => s.load);
  const setPipeline = useConfigStore((s) => s.setPipeline);
  const pipeline = (storePipeline && storePipeline.length) ? storePipeline : DEFAULT_PIPELINE;
  const stageMap = useMemo(() => Object.fromEntries(pipeline.map((s) => [s.key, s])), [pipeline]);
  const isTerminal = (p) => !!stageMap[p.status]?.terminal;

  const load = async () => {
    setLoading(true);
    try { const {data} = await projectsApi.list(); setItems(data); }
    catch {} finally { setLoading(false); }
  };

  useEffect(() => { load(); loadCfg(); }, []);

  const changeStage = async (id, status) => {
    setItems((i) => i.map((p) => p.id === id ? { ...p, status } : p));
    try { await projectsApi.update(id, { status }); } catch {}
  };

  const handleSave = (data, isEdit) => {
    if (isEdit) setItems(i=>i.map(p=>p.id===data.id?{...p,...data}:p));
    else { setItems(i=>[data,...i]); navigate(`/projets/${data.id}`); }
    setShowNew(false); setEditItem(null);
  };

  const del = async (id) => {
    if (!confirm('Supprimer ce projet ?')) return;
    await projectsApi.delete(id);
    setItems(i=>i.filter(p=>p.id!==id));
  };

  const filtered = items.filter(p => {
    const q = search.toLowerCase();
    const matchSearch = !q || p.name?.toLowerCase().includes(q) || p.address?.toLowerCase().includes(q) || p.city?.toLowerCase().includes(q) || p.description?.toLowerCase().includes(q) || p.project_manager?.toLowerCase().includes(q);
    const matchStatus = !statusFilter || p.status === statusFilter;
    const matchCity = !cityFilter || (p.city || p.address || '').toLowerCase().includes(cityFilter.toLowerCase());
    const matchManager = !managerFilter || (p.project_manager || '').toLowerCase().includes(managerFilter.toLowerCase());
    const matchValueMin = !valueMin || Number(p.contract_value) >= Number(valueMin);
    const matchValueMax = !valueMax || Number(p.contract_value) <= Number(valueMax);
    return matchSearch && matchStatus && matchCity && matchManager && matchValueMin && matchValueMax;
  });
  const active = filtered.filter(p => !isTerminal(p));
  const others = filtered.filter(p => isTerminal(p));

  const [sliderProject, setSliderProject] = useState(null);
  const [view, setView] = useState('list');
  const [geocoding, setGeocoding] = useState(false);

  const saveProgress = useCallback(async (id, pct) => {
    setItems(i => i.map(p => p.id === id ? { ...p, progress_pct: pct } : p));
    try { await projectsApi.update(id, { progress_pct: pct }); } catch {}
  }, []);

  // Geocode all projects that have an address but no coordinates (rate-limited for Nominatim)
  const geocodeAll = useCallback(async () => {
    const missing = items.filter(p => p.address && (!p.latitude || !p.longitude));
    if (!missing.length) return;
    setGeocoding(true);
    for (const p of missing) {
      try {
        const { data } = await projectsApi.geocode(p.id);
        setItems(i => i.map(pr => pr.id === p.id ? { ...pr, latitude: data.latitude, longitude: data.longitude } : pr));
      } catch {}
      await new Promise(r => setTimeout(r, 1100)); // respect Nominatim ~1 req/s
    }
    setGeocoding(false);
  }, [items]);

  const ProjectCard = ({ p }) => {
    const pct = p.progress_pct || 0;
    const st = stageMap[p.status] || {};
    const color = st.color || '#94a3b8';
    const isEditing = sliderProject === p.id;

    const daysLeft = p.end_date && !st.terminal
      ? Math.ceil((new Date(p.end_date) - Date.now()) / 86400000)
      : null;

    return (
      <div className="card hover:shadow-md transition-shadow" onClick={() => { if (!isEditing) navigate(`/projets/${p.id}`); }}>
        <div className="flex items-center gap-4 cursor-pointer">
          <div className="w-2 h-10 rounded-full flex-shrink-0" style={{ background: color }}/>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-0.5">
              <p className="font-medium text-gray-900 text-sm truncate">{p.name}</p>
              <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full flex-shrink-0" style={{ background: `${color}1a`, color }}>{st.label || p.status}</span>
              {daysLeft !== null && daysLeft <= 7 && (
                <span className={`text-[10px] font-semibold flex items-center gap-0.5 ${daysLeft < 0 ? 'text-red-500' : 'text-orange-500'}`}>
                  <Clock size={9}/>{daysLeft < 0 ? `${Math.abs(daysLeft)}j retard` : `${daysLeft}j`}
                </span>
              )}
            </div>
            <div className="flex gap-3 text-xs text-gray-400 flex-wrap mb-1.5">
              {p.address && <span className="flex items-center gap-1"><MapPin size={11}/>{p.address}</span>}
              {p.start_date && <span className="flex items-center gap-1"><Calendar size={11}/>{new Date(p.start_date).toLocaleDateString('fr-CA')}</span>}
              {p.contract_value && <span className="flex items-center gap-1"><DollarSign size={11}/>{Number(p.contract_value).toLocaleString('fr-CA')}$</span>}
              {(() => {
                const hasReal = num(p.invoiced_real) > 0;
                const m = hasReal ? realMargin(p) : theoMargin(p);
                const rev = hasReal ? num(p.invoiced_real) : num(p.contract_value);
                if (!rev && !m) return null;
                const pos = m >= 0;
                return (
                  <span className={`flex items-center gap-1 font-medium ${pos ? 'text-green-600' : 'text-red-500'}`} title={hasReal ? 'Marge réelle' : 'Marge théorique'}>
                    <TrendingUp size={11}/>{money(m)}{rev > 0 ? ` · ${Math.round((m / rev) * 100)}%` : ''}
                    <span className="text-gray-300 font-normal">{hasReal ? 'réel' : 'prév.'}</span>
                  </span>
                );
              })()}
            </div>
            {!st.terminal && (
              <div
                className="flex items-center gap-2 group"
                onClick={e => { e.stopPropagation(); setSliderProject(isEditing ? null : p.id); }}
              >
                <div className="relative flex-1 h-2 bg-gray-100 rounded-full cursor-pointer group-hover:h-3 transition-all">
                  <div className="h-full rounded-full transition-all" style={{ width: `${pct}%`, background: color }}/>
                </div>
                <span className="text-xs font-medium w-8 text-right flex-shrink-0 group-hover:underline" style={{ color }}>{pct}%</span>
              </div>
            )}
          </div>
          <div className="flex items-center gap-1 flex-shrink-0" onClick={e => e.stopPropagation()}>
            <select
              value={p.status}
              onChange={e => changeStage(p.id, e.target.value)}
              className="text-xs border border-gray-200 rounded-lg px-1.5 py-1 text-gray-600 bg-white hover:border-gray-300 cursor-pointer max-w-[8.5rem]"
              title="Changer l'état"
            >
              {pipeline.map(s => <option key={s.key} value={s.key}>{s.label}</option>)}
              {!stageMap[p.status] && <option value={p.status}>{p.status}</option>}
            </select>
            <button className="btn-ghost p-1.5 text-gray-400 hover:text-blue-500" onClick={() => setEditItem(p)}><Pencil size={13}/></button>
            <button className="btn-ghost p-1.5 text-gray-400 hover:text-red-500" onClick={() => del(p.id)}><Trash2 size={13}/></button>
            <ChevronRight size={14} className="text-gray-300 ml-1"/>
          </div>
        </div>

        {/* Inline progress editor */}
        {isEditing && (
          <div className="mt-3 pt-3 border-t border-gray-100" onClick={e => e.stopPropagation()}>
            <div className="flex items-center gap-3">
              <span className="text-xs text-gray-500 flex-shrink-0">Avancement</span>
              <input
                type="range" min="0" max="100" step="5"
                defaultValue={pct}
                className="flex-1 accent-brand"
                onChange={e => setItems(i => i.map(pr => pr.id === p.id ? { ...pr, progress_pct: Number(e.target.value) } : pr))}
                onMouseUp={e => { saveProgress(p.id, Number(e.target.value)); setSliderProject(null); }}
                onTouchEnd={e => { saveProgress(p.id, Number(e.target.value)); setSliderProject(null); }}
              />
              <span className="text-sm font-bold w-10 text-right flex-shrink-0" style={{ color }}>{pct}%</span>
            </div>
            <div className="flex gap-1.5 mt-2">
              {[0, 25, 50, 75, 100].map(v => (
                <button key={v} className={`flex-1 text-xs py-1 rounded-lg border transition-colors ${pct === v ? 'border-brand text-brand bg-orange-50 font-semibold' : 'border-gray-200 text-gray-400 hover:border-gray-300'}`}
                  onClick={() => { saveProgress(p.id, v); setSliderProject(null); }}>
                  {v}%
                </button>
              ))}
            </div>
          </div>
        )}
      </div>
    );
  };

  return (
    <Layout>
      <div className="p-6 max-w-5xl mx-auto">
        <div className="flex items-center justify-between mb-6 gap-3 flex-wrap">
          <h1 className="text-xl font-bold text-gray-900">Projets</h1>
          <div className="flex items-center gap-2">
            {/* List / Kanban / Gantt / Map toggle */}
            <div className="flex bg-gray-100 rounded-lg p-0.5">
              {[
                { key: 'list',   icon: <List size={13}/>,       label: 'Liste' },
                { key: 'kanban', icon: <Columns size={13}/>,    label: 'Kanban' },
                { key: 'gantt',  icon: <GanttChart size={13}/>, label: 'Gantt' },
                { key: 'map',    icon: <MapIcon size={13}/>,    label: 'Carte' },
              ].map(({ key, icon, label }) => (
                <button
                  key={key}
                  className={`flex items-center gap-1 text-xs px-2.5 py-1.5 rounded-md transition-colors ${view===key?'bg-white shadow-sm text-gray-900 font-medium':'text-gray-400'}`}
                  onClick={() => setView(key)}
                >{icon} {label}</button>
              ))}
            </div>
            <button className="btn-secondary" onClick={()=>setPipeOpen(true)} title="Personnaliser le pipeline"><Settings2 size={15}/> Pipeline</button>
            <button className="btn-primary" onClick={()=>setShowNew(true)}><Plus size={15}/> Nouveau projet</button>
          </div>
        </div>

        {showNew && <ProjectModal onClose={()=>setShowNew(false)} onSave={handleSave}/>}
        {editItem && <ProjectModal project={editItem} onClose={()=>setEditItem(null)} onSave={handleSave}/>}
        {pipeOpen && <PipelineManager pipeline={pipeline} onSave={setPipeline} onClose={()=>setPipeOpen(false)}/>}

        {/* Search + filter bar */}
        <div className="flex gap-2 mb-2 flex-wrap">
          <div className="relative flex-1 min-w-48">
            <Search size={13} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-300"/>
            <input className="input pl-8" placeholder="Rechercher…" value={search} onChange={e=>setSearch(e.target.value)}/>
          </div>
          <select className="input w-auto text-sm" value={statusFilter} onChange={e=>setStatusFilter(e.target.value)}>
            <option value="">{t('all_statuses')}</option>
            {pipeline.map((s) => <option key={s.key} value={s.key}>{s.label}</option>)}
          </select>
          <button className={`btn-secondary text-xs px-3 ${showFilters ? 'bg-orange-50 border-brand text-brand' : ''}`} onClick={()=>setShowFilters(o=>!o)}>
            {t('filters')} {(cityFilter||managerFilter||valueMin||valueMax) ? <span className="ml-1 w-4 h-4 bg-brand text-white rounded-full text-[10px] flex items-center justify-center inline-flex">{[cityFilter,managerFilter,valueMin,valueMax].filter(Boolean).length}</span> : null}
          </button>
        </div>
        {showFilters && (
          <div className="flex gap-2 mb-4 flex-wrap bg-gray-50 rounded-xl p-3">
            <div className="flex-1 min-w-32">
              <label className="label text-[11px]">{t('filter_city')}</label>
              <input className="input text-xs" placeholder="Montréal…" value={cityFilter} onChange={e=>setCityFilter(e.target.value)}/>
            </div>
            <div className="flex-1 min-w-32">
              <label className="label text-[11px]">{t('filter_manager')}</label>
              <input className="input text-xs" placeholder="Nom…" value={managerFilter} onChange={e=>setManagerFilter(e.target.value)}/>
            </div>
            <div className="flex-1 min-w-28">
              <label className="label text-[11px]">{t('filter_value_min')}</label>
              <input className="input text-xs" type="number" placeholder="0" value={valueMin} onChange={e=>setValueMin(e.target.value)}/>
            </div>
            <div className="flex-1 min-w-28">
              <label className="label text-[11px]">{t('filter_value_max')}</label>
              <input className="input text-xs" type="number" placeholder="∞" value={valueMax} onChange={e=>setValueMax(e.target.value)}/>
            </div>
            {(cityFilter||managerFilter||valueMin||valueMax) && (
              <div className="flex items-end">
                <button className="btn-ghost text-xs text-red-400" onClick={()=>{setCityFilter('');setManagerFilter('');setValueMin('');setValueMax('');}}>
                  {t('clear_filters')}
                </button>
              </div>
            )}
          </div>
        )}

        {loading ? (
          <div className="flex items-center gap-2 text-gray-400 py-8"><Loader2 size={16} className="animate-spin"/> Chargement…</div>
        ) : view === 'map' ? (
          <MapView projects={filtered} onGeocodeAll={geocodeAll} geocoding={geocoding} stageMap={stageMap} />
        ) : view === 'kanban' ? (
          <KanbanView
            projects={filtered}
            pipeline={pipeline}
            stageMap={stageMap}
            onChangeStage={changeStage}
            onNew={() => setShowNew(true)}
          />
        ) : view === 'gantt' ? (
          <GanttPortfolio projects={filtered} stageMap={stageMap} />
        ) : filtered.length === 0 ? (
          <div className="text-center py-12 text-gray-400 text-sm">{items.length === 0 ? 'Aucun projet. Créez-en un!' : 'Aucun projet ne correspond à votre recherche.'}</div>
        ) : (
          <>
            {/* Portefeuille — synthèse rentabilité */}
            {filtered.length > 0 && (() => {
              const totContract = filtered.reduce((s, p) => s + num(p.contract_value), 0);
              const totInvoiced = filtered.reduce((s, p) => s + num(p.invoiced_real), 0);
              const totReal = filtered.reduce((s, p) => s + realMargin(p), 0);
              const totTheo = filtered.reduce((s, p) => s + theoMargin(p), 0);
              const stat = (label, val, color) => (
                <div className="flex-1 min-w-[110px]">
                  <p className="text-xs text-gray-400">{label}</p>
                  <p className={`text-lg font-bold ${color || 'text-gray-900'}`}>{money(val)}</p>
                </div>
              );
              return (
                <div className="card mb-5 flex flex-wrap gap-4">
                  {stat('Valeur portefeuille', totContract)}
                  {stat('Facturé', totInvoiced)}
                  {stat('Marge théorique', totTheo, totTheo >= 0 ? 'text-green-600' : 'text-red-500')}
                  {stat('Marge réelle', totReal, totReal >= 0 ? 'text-green-600' : 'text-red-500')}
                </div>
              );
            })()}
            {active.length > 0 && (
              <div className="mb-6">
                <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-2">En cours ({active.length})</p>
                <div className="grid gap-3">{active.map(p=><ProjectCard key={p.id} p={p}/>)}</div>
              </div>
            )}
            {others.length > 0 && (
              <div>
                <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-2">Terminés ({others.length})</p>
                <div className="grid gap-3">{others.map(p=><ProjectCard key={p.id} p={p}/>)}</div>
              </div>
            )}
          </>
        )}
      </div>
    </Layout>
  );
}
