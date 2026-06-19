import { useEffect, useState, useCallback, useRef } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import Layout from '../components/Layout';
import SlideOver from '../components/SlideOver';
import { projects as projectsApi } from '../api';
import { Plus, Loader2, MapPin, Calendar, DollarSign, Pencil, Trash2, ChevronRight, Search, Clock, List, Map as MapIcon, TrendingUp } from 'lucide-react';

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

function MapView({ projects, onGeocodeAll, geocoding }) {
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
      const color = SC[p.status] || '#94a3b8';
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

const SB = { active:'badge-green', lead:'badge-gray', quote:'badge-yellow', on_hold:'badge-blue', completed:'badge-gray', cancelled:'badge-red' };
const SL = { active:'Actif', lead:'Lead', quote:'Soumission', on_hold:'En pause', completed:'Terminé', cancelled:'Annulé' };
const SC = { active:'#22c55e', lead:'#94a3b8', quote:'#f59e0b', on_hold:'#6366f1', completed:'#22c55e', cancelled:'#ef4444' };
const EMPTY = { name:'', address:'', start_date:'', end_date:'', contract_value:'' };

function ProjectModal({ project, onClose, onSave }) {
  const [form, setForm] = useState(project ? {
    name:project.name||'', address:project.address||'',
    start_date:project.start_date?project.start_date.slice(0,10):'',
    end_date:project.end_date?project.end_date.slice(0,10):'',
    contract_value:project.contract_value||''
  } : {...EMPTY});
  const [saving, setSaving] = useState(false);
  const f = k => e => setForm(p=>({...p,[k]:e.target.value}));

  const submit = async (e) => {
    e.preventDefault(); setSaving(true);
    try {
      const payload = { name:form.name, address:form.address, start_date:form.start_date||null, end_date:form.end_date||null, contract_value:form.contract_value||null };
      const {data} = project ? await projectsApi.update(project.id, payload) : await projectsApi.create(payload);
      onSave(data, !!project);
    } catch {} finally { setSaving(false); }
  };

  return (
    <SlideOver
      title={project ? 'Modifier le projet' : 'Nouveau projet'}
      subtitle={project ? project.name : 'Créer un nouveau chantier'}
      onClose={onClose}
      footer={
        <div className="flex gap-2">
          <button type="button" className="btn-secondary flex-1" onClick={onClose}>Annuler</button>
          <button type="submit" form="project-form" className="btn-primary flex-1" disabled={saving}>{saving&&<Loader2 size={14} className="animate-spin"/>} {project?'Enregistrer':'Créer'}</button>
        </div>
      }
    >
      <form id="project-form" onSubmit={submit} className="space-y-3">
        <div><label className="label">Nom du projet *</label><input className="input" value={form.name} onChange={f('name')} required/></div>
        <div><label className="label">Adresse du chantier</label><input className="input" placeholder="123 rue Principale, Montréal" value={form.address} onChange={f('address')}/></div>
        <div className="grid grid-cols-2 gap-3">
          <div><label className="label">Début</label><input className="input" type="date" value={form.start_date} onChange={f('start_date')}/></div>
          <div><label className="label">Fin prévue</label><input className="input" type="date" value={form.end_date} onChange={f('end_date')}/></div>
        </div>
        <div><label className="label">Valeur du contrat ($)</label><input className="input" type="number" value={form.contract_value} onChange={f('contract_value')}/></div>
      </form>
    </SlideOver>
  );
}

export default function Projets() {
  const [searchParams] = useSearchParams();
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showNew, setShowNew] = useState(searchParams.get('new') === '1');
  const [editItem, setEditItem] = useState(null);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const navigate = useNavigate();

  const load = async () => {
    setLoading(true);
    try { const {data} = await projectsApi.list(); setItems(data); }
    catch {} finally { setLoading(false); }
  };

  useEffect(() => { load(); }, []);

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
    const matchSearch = !q || p.name?.toLowerCase().includes(q) || p.address?.toLowerCase().includes(q);
    const matchStatus = !statusFilter || p.status === statusFilter;
    return matchSearch && matchStatus;
  });
  const active = filtered.filter(p=>p.status==='active');
  const others = filtered.filter(p=>p.status!=='active');

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
    const color = SC[p.status] || '#94a3b8';
    const isEditing = sliderProject === p.id;

    const daysLeft = p.end_date && p.status === 'active'
      ? Math.ceil((new Date(p.end_date) - Date.now()) / 86400000)
      : null;

    return (
      <div className="card hover:shadow-md transition-shadow" onClick={() => { if (!isEditing) navigate(`/projets/${p.id}`); }}>
        <div className="flex items-center gap-4 cursor-pointer">
          <div className="w-2 h-10 rounded-full flex-shrink-0" style={{ background: color }}/>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-0.5">
              <p className="font-medium text-gray-900 text-sm truncate">{p.name}</p>
              <span className={`badge ${SB[p.status]}`}>{SL[p.status]}</span>
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
            {p.status === 'active' && (
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
            {/* List / Map toggle */}
            <div className="flex bg-gray-100 rounded-lg p-0.5">
              <button
                className={`flex items-center gap-1 text-xs px-2.5 py-1.5 rounded-md transition-colors ${view==='list'?'bg-white shadow-sm text-gray-900 font-medium':'text-gray-400'}`}
                onClick={()=>setView('list')}
              ><List size={13}/> Liste</button>
              <button
                className={`flex items-center gap-1 text-xs px-2.5 py-1.5 rounded-md transition-colors ${view==='map'?'bg-white shadow-sm text-gray-900 font-medium':'text-gray-400'}`}
                onClick={()=>setView('map')}
              ><MapIcon size={13}/> Carte</button>
            </div>
            <button className="btn-primary" onClick={()=>setShowNew(true)}><Plus size={15}/> Nouveau projet</button>
          </div>
        </div>

        {showNew && <ProjectModal onClose={()=>setShowNew(false)} onSave={handleSave}/>}
        {editItem && <ProjectModal project={editItem} onClose={()=>setEditItem(null)} onSave={handleSave}/>}

        {/* Search + filter bar */}
        <div className="flex gap-2 mb-4 flex-wrap">
          <div className="relative flex-1 min-w-48">
            <Search size={13} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-300"/>
            <input className="input pl-8" placeholder="Rechercher par nom ou adresse…" value={search} onChange={e=>setSearch(e.target.value)}/>
          </div>
          <select className="input w-auto text-sm" value={statusFilter} onChange={e=>setStatusFilter(e.target.value)}>
            <option value="">Tous les statuts</option>
            {Object.entries(SL).map(([k,v]) => <option key={k} value={k}>{v}</option>)}
          </select>
        </div>

        {loading ? (
          <div className="flex items-center gap-2 text-gray-400 py-8"><Loader2 size={16} className="animate-spin"/> Chargement…</div>
        ) : view === 'map' ? (
          <MapView projects={filtered} onGeocodeAll={geocodeAll} geocoding={geocoding} />
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
                <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-2">Autres ({others.length})</p>
                <div className="grid gap-3">{others.map(p=><ProjectCard key={p.id} p={p}/>)}</div>
              </div>
            )}
          </>
        )}
      </div>
    </Layout>
  );
}
