import { useEffect, useState, useCallback, useRef, useMemo } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import Layout from '../components/Layout';
import SlideOver from '../components/SlideOver';
import { projects as projectsApi, ai as aiApi } from '../api';
import { useConfigStore } from '../store';
import { useT } from '../hooks/useT';
import { DEFAULT_PIPELINE } from '../config/modules';
import { Plus, Loader2, MapPin, Calendar, DollarSign, Pencil, Trash2, ChevronRight, ChevronLeft, Search, Clock, List, Map as MapIcon, TrendingUp, Settings2, ArrowUp, ArrowDown, Check, X, GanttChart, Columns, Sparkles, LayoutGrid, SlidersHorizontal, ChevronDown } from 'lucide-react';

// Address autocomplete input with Nominatim suggestions (free, no API key)
function AddressInput({ value, onChange, onCityChange, placeholder, className }) {
  const [suggestions, setSuggestions] = useState([]);
  const [searching, setSearching] = useState(false);
  const timerRef = useRef(null);
  const skipBlur = useRef(false);

  const search = (q) => {
    clearTimeout(timerRef.current);
    if (q.length < 4) { setSuggestions([]); return; }
    timerRef.current = setTimeout(async () => {
      setSearching(true);
      try {
        const url = `https://nominatim.openstreetmap.org/search?format=json&addressdetails=1&limit=5&countrycodes=ca&q=${encodeURIComponent(q)}`;
        const resp = await fetch(url, { headers: { 'User-Agent': 'MONFLUX/2.0 (monflux.tech)' } });
        const data = await resp.json();
        setSuggestions(data || []);
      } catch { setSuggestions([]); } finally { setSearching(false); }
    }, 420);
  };

  const selectSuggestion = (s) => {
    skipBlur.current = true;
    const a = s.address || {};
    const street = [a.house_number, a.road].filter(Boolean).join(' ');
    const formatted = street || s.display_name.split(',')[0].trim();
    const city = a.city || a.town || a.village || a.municipality || '';
    onChange(formatted);
    if (onCityChange && city) onCityChange(city);
    setSuggestions([]);
    setTimeout(() => { skipBlur.current = false; }, 200);
  };

  return (
    <div style={{ position: 'relative' }}>
      <input
        className={className}
        placeholder={placeholder}
        value={value}
        onChange={e => { onChange(e.target.value); search(e.target.value); }}
        onBlur={() => { if (!skipBlur.current) setSuggestions([]); }}
        autoComplete="off"
      />
      {(suggestions.length > 0 || searching) && (
        <div style={{ position: 'absolute', top: '100%', left: 0, right: 0, marginTop: 4, background: '#fff', borderRadius: 10, boxShadow: '0 8px 24px rgba(0,0,0,.16)', zIndex: 200, overflow: 'hidden', border: '1px solid #E8EAED' }}>
          {searching && <div style={{ padding: '8px 12px', fontSize: 12, color: '#9CA3AF' }}>Recherche…</div>}
          {suggestions.map((s, i) => {
            const a = s.address || {};
            const street = [a.house_number, a.road].filter(Boolean).join(' ');
            const city = a.city || a.town || a.village || a.municipality || '';
            const postal = a.postcode || '';
            const line1 = street || s.display_name.split(',')[0].trim();
            const line2 = [city, postal].filter(Boolean).join(', ');
            return (
              <div key={i} onMouseDown={() => selectSuggestion(s)}
                style={{ padding: '8px 12px', cursor: 'pointer', borderTop: i > 0 ? '1px solid #F5F7F9' : 'none', background: '#fff', transition: 'background .1s' }}
                onMouseEnter={e => e.currentTarget.style.background = '#FFF4EE'}
                onMouseLeave={e => e.currentTarget.style.background = '#fff'}
              >
                <div style={{ fontSize: 13, fontWeight: 600, color: '#15171C' }}>{line1}</div>
                {line2 && <div style={{ fontSize: 11, color: '#9CA3AF', marginTop: 1 }}>{line2}</div>}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

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
      const label = p.field_assessment?.work_type || p.type || p.name || '—';
      m.bindTooltip(`<b>${label}</b>${p.address ? '<br>' + p.address : ''}${p.contract_value ? '<br>' + Number(p.contract_value).toLocaleString('fr-CA') + ' $' : ''}`, { direction: 'top', offset: [0, -8] });
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
      <div style={{ position: 'relative' }}>
        <div ref={mapEl} style={{ height: 520, borderRadius: 16, overflow: 'hidden', zIndex: 0 }} className="border border-gray-100" />
        {geocoding && (
          <div style={{ position: 'absolute', top: 12, left: '50%', transform: 'translateX(-50%)', background: 'rgba(255,255,255,.92)', borderRadius: 20, padding: '6px 14px', display: 'flex', alignItems: 'center', gap: 6, fontSize: 12, fontWeight: 600, color: '#374151', boxShadow: '0 2px 8px rgba(0,0,0,.12)', zIndex: 999, backdropFilter: 'blur(4px)' }}>
            <Loader2 size={12} className="animate-spin" style={{ color: '#E8794E' }}/> Géolocalisation en cours…
          </div>
        )}
      </div>
      {located === 0 && !geocoding && (
        <p className="text-center text-sm text-gray-400 mt-3">
          {missing > 0 ? 'Géolocalisation en cours — rechargez dans quelques secondes si aucun point n\'apparaît.' : 'Ajoutez une adresse aux projets pour les voir sur la carte.'}
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
  const minD = new Date(Math.min(...allDates));
  const maxD = new Date(Math.max(...allDates));
  // Extend range to full months for a cleaner view
  const refStart = new Date(minD.getFullYear(), minD.getMonth(), 1);
  const refEnd   = new Date(maxD.getFullYear(), maxD.getMonth() + 1, 0);
  const totalMs  = Math.max(refEnd - refStart, 1);
  const pct      = (d) => Math.max(0, Math.min(100, (new Date(d) - refStart) / totalMs * 100));
  const barWidth = (s, e) => Math.max(0.8, pct(e) - pct(s));
  const todayPct = pct(new Date());

  const months = [];
  const cur = new Date(refStart);
  while (cur <= refEnd) { months.push(new Date(cur)); cur.setMonth(cur.getMonth() + 1); }

  const ROW_H = 44;
  const LABEL_W = 200;

  return (
    <div style={{ background: '#fff', borderRadius: 14, border: '1px solid #E8EAED', overflow: 'hidden' }}>
      <div style={{ overflowX: 'auto' }}>
        <div style={{ minWidth: 640, padding: '0 0 16px' }}>

          {/* ── Header months ── */}
          <div style={{ display: 'flex', marginLeft: LABEL_W, borderBottom: '1px solid #F0F2F4', background: '#FAFAFA' }}>
            {months.map((m, i) => {
              const nextM = new Date(m.getFullYear(), m.getMonth() + 1, 1);
              const w = Math.min(pct(nextM), 100) - pct(m);
              return (
                <div key={i} style={{ width: `${Math.max(w, 0)}%`, minWidth: 36, padding: '7px 0 7px 10px', borderLeft: '1px solid #E8EAED', flexShrink: 0 }}>
                  <span style={{ fontSize: 11, fontWeight: 700, color: '#9CA3AF', textTransform: 'uppercase', letterSpacing: '.06em' }}>
                    {m.toLocaleDateString('fr-CA', { month: 'short' })} <span style={{ fontWeight: 400, opacity: 0.6 }}>{m.getFullYear()}</span>
                  </span>
                </div>
              );
            })}
          </div>

          {/* ── Project rows ── */}
          <div style={{ position: 'relative' }}>
            {/* Month grid lines */}
            {months.map((m, i) => (
              <div key={i} style={{ position: 'absolute', top: 0, bottom: 0, left: `calc(${LABEL_W}px + ${pct(m)}%)`, width: 1, background: i === 0 ? 'transparent' : '#F0F2F4', pointerEvents: 'none' }} />
            ))}
            {/* Today line */}
            <div style={{ position: 'absolute', top: 0, bottom: 0, left: `calc(${LABEL_W}px + ${todayPct}%)`, width: 2, background: '#F26522', opacity: 0.7, pointerEvents: 'none', zIndex: 4 }}>
              <span style={{ position: 'absolute', top: 4, left: 4, fontSize: 9, fontWeight: 800, color: '#F26522', background: '#FFF0E8', borderRadius: 3, padding: '1px 4px', whiteSpace: 'nowrap' }}>Aujourd'hui</span>
            </div>

            {withDates.map((p, rowIdx) => {
              const start = p.start_date ? new Date(p.start_date) : new Date();
              const end   = p.end_date   ? new Date(p.end_date)   : new Date(start.getTime() + 30 * 86400000);
              const color = stageMap[p.status]?.color || '#6366f1';
              const pLeft = pct(start);
              const pW    = barWidth(start, end);
              const prog  = p.progress_pct || 0;
              const isEven = rowIdx % 2 === 0;

              return (
                <div
                  key={p.id}
                  onClick={() => navigate(`/projets/${p.id}`)}
                  style={{ display: 'flex', alignItems: 'center', height: ROW_H, cursor: 'pointer', background: isEven ? '#FAFAFA' : '#fff', borderBottom: '1px solid #F5F7F9', transition: 'background .1s' }}
                  onMouseEnter={e => e.currentTarget.style.background = '#FFF4EE'}
                  onMouseLeave={e => e.currentTarget.style.background = isEven ? '#FAFAFA' : '#fff'}
                >
                  {/* Project label */}
                  <div style={{ width: LABEL_W, flexShrink: 0, padding: '0 16px 0 20px', display: 'flex', flexDirection: 'column', justifyContent: 'center', gap: 1, borderRight: '1px solid #E8EAED' }}>
                    <span style={{ fontSize: 12, fontWeight: 700, color: '#15171C', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{p.name}</span>
                    <span style={{ fontSize: 10, color: '#9CA3AF' }}>{stageMap[p.status]?.label || p.status}</span>
                  </div>

                  {/* Gantt track */}
                  <div style={{ flex: 1, position: 'relative', height: '100%', padding: '10px 0' }}>
                    <div
                      style={{ position: 'absolute', top: 10, bottom: 10, left: `${pLeft}%`, width: `${pW}%`, minWidth: 6, borderRadius: 6, background: color + '18', border: `2px solid ${color}`, overflow: 'hidden', display: 'flex', alignItems: 'center' }}
                      title={`${p.name} · du ${new Date(start).toLocaleDateString('fr-CA')} au ${new Date(end).toLocaleDateString('fr-CA')}${p.contract_value ? ' · ' + Number(p.contract_value).toLocaleString('fr-CA') + ' $' : ''}`}
                    >
                      {/* Progress fill */}
                      {prog > 0 && <div style={{ position: 'absolute', inset: 0, width: `${prog}%`, background: color + '45', borderRadius: 4 }} />}
                      {/* Label inside bar */}
                      {pW > 8 && (
                        <span style={{ position: 'relative', fontSize: 10, fontWeight: 700, color, paddingLeft: 6, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', maxWidth: '90%' }}>
                          {p.client_name || p.name}
                          {prog > 0 && <span style={{ opacity: 0.7 }}> · {prog}%</span>}
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>

          <div style={{ display: 'flex', justifyContent: 'space-between', padding: '10px 20px 0', borderTop: '1px solid #F0F2F4' }}>
            <span style={{ fontSize: 11, color: '#C4C8CE' }}>
              {withDates.length}/{projects.length} projet{projects.length > 1 ? 's' : ''} avec dates
            </span>
            <span style={{ fontSize: 11, color: '#C4C8CE' }}>
              {new Date(refStart).toLocaleDateString('fr-CA', { month: 'long', year: 'numeric' })} — {new Date(refEnd).toLocaleDateString('fr-CA', { month: 'long', year: 'numeric' })}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}

// ── Vue Calendrier ─────────────────────────────────────────────────────────────
function CalendarView({ projects, stageMap }) {
  const navigate = useNavigate();
  const today = new Date();
  const [year, setYear] = useState(today.getFullYear());
  const [month, setMonth] = useState(today.getMonth()); // 0-11

  const prevMonth = () => { if (month === 0) { setMonth(11); setYear(y => y - 1); } else setMonth(m => m - 1); };
  const nextMonth = () => { if (month === 11) { setMonth(0); setYear(y => y + 1); } else setMonth(m => m + 1); };

  const firstDay = new Date(year, month, 1).getDay(); // 0=Sun
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const startOffset = (firstDay + 6) % 7; // Mon=0 … Sun=6

  const fmtMonth = new Date(year, month, 1).toLocaleDateString('fr-CA', { month: 'long', year: 'numeric' });

  // Build per-day project map: projects that START or are ACTIVE on that day
  const dayEvents = {};
  projects.forEach(p => {
    if (!p.start_date && !p.end_date) return;
    const start = p.start_date ? new Date(String(p.start_date).slice(0, 10) + 'T00:00') : null;
    const end   = p.end_date   ? new Date(String(p.end_date).slice(0, 10)   + 'T00:00') : start;
    for (let d = 1; d <= daysInMonth; d++) {
      const day = new Date(year, month, d);
      if (start && day >= start && day <= end) {
        if (!dayEvents[d]) dayEvents[d] = [];
        dayEvents[d].push(p);
      }
    }
  });

  const DAYS = ['Lun', 'Mar', 'Mer', 'Jeu', 'Ven', 'Sam', 'Dim'];
  const cells = Array.from({ length: startOffset + daysInMonth }, (_, i) => i < startOffset ? null : i - startOffset + 1);
  // Pad to full 6-row grid
  while (cells.length % 7 !== 0) cells.push(null);

  return (
    <div style={{ background: '#fff', borderRadius: 14, border: '1px solid #E8EAED', overflow: 'hidden' }}>
      {/* Header navigation */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '14px 20px', borderBottom: '1px solid #F0F2F4' }}>
        <button onClick={prevMonth} style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 6, borderRadius: 8, color: '#6B7280', display: 'flex', alignItems: 'center' }}>
          <ChevronLeft size={16}/>
        </button>
        <span style={{ fontSize: 14, fontWeight: 800, color: '#15171C', textTransform: 'capitalize' }}>{fmtMonth}</span>
        <button onClick={nextMonth} style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 6, borderRadius: 8, color: '#6B7280', display: 'flex', alignItems: 'center' }}>
          <ChevronRight size={16}/>
        </button>
      </div>

      {/* Day headers */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7,1fr)', borderBottom: '1px solid #F0F2F4' }}>
        {DAYS.map(d => (
          <div key={d} style={{ padding: '7px 0', textAlign: 'center', fontSize: 10, fontWeight: 800, color: '#9CA3AF', textTransform: 'uppercase', letterSpacing: '.06em', background: '#FAFAFA' }}>{d}</div>
        ))}
      </div>

      {/* Grid */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7,1fr)' }}>
        {cells.map((day, i) => {
          const isToday = day && today.getFullYear() === year && today.getMonth() === month && today.getDate() === day;
          const events = day ? (dayEvents[day] || []) : [];
          return (
            <div key={i} style={{ minHeight: 76, borderRight: '1px solid #F5F7F9', borderBottom: '1px solid #F5F7F9', padding: '5px 4px', background: day ? '#fff' : '#FAFAFA', position: 'relative' }}>
              {day && (
                <>
                  <span style={{ display: 'inline-flex', alignItems: 'center', justifyContent: 'center', width: 22, height: 22, borderRadius: '50%', fontSize: 11, fontWeight: isToday ? 800 : 500, color: isToday ? '#fff' : '#374151', background: isToday ? '#E8794E' : 'transparent', marginBottom: 3 }}>
                    {day}
                  </span>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                    {events.slice(0, 3).map(p => {
                      const color = stageMap[p.status]?.color || '#94a3b8';
                      const label = p.field_assessment?.work_type || p.type || p.name || '—';
                      return (
                        <button key={p.id} onClick={() => navigate(`/projets/${p.id}`)}
                          style={{ display: 'block', width: '100%', textAlign: 'left', fontSize: 9, fontWeight: 700, color, background: color + '18', border: `1px solid ${color}33`, borderRadius: 4, padding: '1px 4px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', cursor: 'pointer' }}
                          title={`${label}${p.address ? ' · ' + p.address : ''}`}
                        >
                          {label}
                        </button>
                      );
                    })}
                    {events.length > 3 && (
                      <span style={{ fontSize: 9, color: '#9CA3AF', paddingLeft: 4 }}>+{events.length - 3}</span>
                    )}
                  </div>
                </>
              )}
            </div>
          );
        })}
      </div>

      {/* Legend */}
      {projects.length > 0 && (
        <div style={{ padding: '8px 16px', borderTop: '1px solid #F0F2F4', display: 'flex', flexWrap: 'wrap', gap: 8 }}>
          {projects.slice(0, 6).map(p => {
            const color = stageMap[p.status]?.color || '#94a3b8';
            const label = p.field_assessment?.work_type || p.type || p.name || '—';
            return (
              <button key={p.id} onClick={() => navigate(`/projets/${p.id}`)}
                style={{ display: 'flex', alignItems: 'center', gap: 4, fontSize: 10, fontWeight: 600, color: '#374151', background: 'none', border: 'none', cursor: 'pointer', padding: '2px 6px', borderRadius: 5 }}
                onMouseEnter={e => e.currentTarget.style.background = '#F3F4F6'}
                onMouseLeave={e => e.currentTarget.style.background = 'none'}
              >
                <span style={{ width: 8, height: 8, borderRadius: '50%', background: color, flexShrink: 0 }}/>
                {label}{p.address ? ` · ${p.address}` : ''}
              </button>
            );
          })}
        </div>
      )}
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

const EMPTY = { work_type:'', address:'', city:'', start_date:'', end_date:'', contract_value:'', description:'' };

const WORK_TYPE_OPTIONS = [
  { group: 'Résidentiel — Intérieur', items: ['Cuisine','Salle de bain','Sous-sol','Planchers','Peinture intérieure','Rénovation complète','Fenêtres et portes','Escaliers','Armoires / cuisines'] },
  { group: 'Résidentiel — Extérieur', items: ['Toiture','Agrandissement','Terrasse / balcon','Paysagement','Fondation','Piscine / spa','Revêtement extérieur','Clôture'] },
  { group: 'Systèmes', items: ['Électricité','Plomberie','Chauffage / climatisation (CVC)','Isolation','Domotique / sécurité'] },
  { group: 'Travaux spécialisés', items: ['Démolition','Excavation','Maçonnerie / béton','Construction neuve','Ingénierie structurelle'] },
  { group: 'Commercial / Institutionnel', items: ['Commercial','Industriel','Institutionnel'] },
  { group: 'Autre', items: ['Autre'] },
];

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
    work_type: project.field_assessment?.work_type || project.type || '',
    address: project.address || '', city: project.city || '',
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
    if (!form.work_type) { return; }
    setError(null);
    setSaving(true);
    try {
      // Nom auto-généré : Type · Adresse · Date début
      const nameParts = [form.work_type, form.address, form.start_date].filter(Boolean);
      const autoName = nameParts.join(' · ') || form.work_type || 'Projet';
      const payload = {
        name: autoName, address: form.address || null, city: form.city || null,
        description: form.description || null,
        start_date: form.start_date || null, end_date: form.end_date || null,
        contract_value: form.contract_value || null,
        field_assessment: { ...(project?.field_assessment || {}), work_type: form.work_type },
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
        <div>
          <label className="label">Type de travaux *</label>
          <select className="input" value={form.work_type} onChange={f('work_type')} required>
            <option value="">— Sélectionner —</option>
            {WORK_TYPE_OPTIONS.map(({ group, items }) => (
              <optgroup key={group} label={group}>
                {items.map(v => <option key={v} value={v}>{v}</option>)}
              </optgroup>
            ))}
          </select>
        </div>
        <div>
          <label className="label flex items-center gap-1">
            Description
            <span className="ml-1 text-[10px] text-brand font-medium flex items-center gap-0.5"><Sparkles size={9}/>{t('ai_phases')}</span>
          </label>
          <textarea className="input resize-none" rows={3} placeholder="Description du chantier…" value={form.description} onChange={f('description')} />
        </div>
        <div>
          <label className="label">{t('address')}</label>
          <AddressInput
            className="input"
            placeholder="123 rue Principale"
            value={form.address}
            onChange={v => setForm(p => ({ ...p, address: v }))}
            onCityChange={city => setForm(p => ({ ...p, city }))}
          />
        </div>
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

// ── Vue Portefeuille ────────────────────────────────────────────────────────────
function PortfolioView({ projects, stageMap, navigate }) {
  const totContract = projects.reduce((s, p) => s + num(p.contract_value), 0);
  const totInvoiced = projects.reduce((s, p) => s + num(p.invoiced_real), 0);
  const totReal     = projects.reduce((s, p) => s + realMargin(p), 0);
  const totTheo     = projects.reduce((s, p) => s + theoMargin(p), 0);
  const active      = projects.filter(p => !stageMap[p.status]?.terminal);
  const done        = projects.filter(p => stageMap[p.status]?.terminal);

  const KPIBar = ({ label, value, total, color }) => {
    const pct = total > 0 ? Math.min(100, Math.round((value / total) * 100)) : 0;
    return (
      <div>
        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 3 }}>
          <span style={{ fontSize: 11, color: '#6B7280' }}>{label}</span>
          <span style={{ fontSize: 11, fontWeight: 700, color }}>{money(value)}</span>
        </div>
        <div style={{ height: 4, background: '#F3F4F6', borderRadius: 2 }}>
          <div style={{ height: '100%', width: `${pct}%`, background: color, borderRadius: 2, transition: 'width .4s' }}/>
        </div>
      </div>
    );
  };

  const fmtD = (d) => {
    if (!d) return null;
    const parsed = new Date(String(d).slice(0, 10) + 'T00:00');
    return isNaN(parsed) ? null : parsed.toLocaleDateString('fr-CA', { day: 'numeric', month: 'short' });
  };

  return (
    <div>
      {/* Barre synthèse */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(140px,1fr))', gap: 12, marginBottom: 20 }}>
        {[
          { label: 'Valeur portefeuille', val: totContract, color: '#374151' },
          { label: 'Facturé',             val: totInvoiced, color: '#2563EB' },
          { label: 'Marge théorique',     val: totTheo,     color: totTheo >= 0 ? '#16A34A' : '#DC2626' },
          { label: 'Marge réelle',        val: totReal,     color: totReal >= 0  ? '#16A34A' : '#DC2626' },
        ].map(({ label, val, color }) => (
          <div key={label} style={{ background: '#fff', border: '1px solid #E8EAED', borderRadius: 12, padding: '14px 16px' }}>
            <p style={{ fontSize: 11, color: '#9CA3AF', marginBottom: 4 }}>{label}</p>
            <p style={{ fontSize: 18, fontWeight: 800, color }}>{money(val)}</p>
          </div>
        ))}
      </div>

      {/* Grille projets */}
      {[{ title: `En cours (${active.length})`, list: active }, { title: `Terminés (${done.length})`, list: done }].map(({ title, list }) =>
        list.length > 0 && (
          <div key={title} style={{ marginBottom: 24 }}>
            <p style={{ fontSize: 11, fontWeight: 700, color: '#9CA3AF', textTransform: 'uppercase', letterSpacing: '.06em', marginBottom: 10 }}>{title}</p>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill,minmax(280px,1fr))', gap: 14 }}>
              {list.map(p => {
                const st = stageMap[p.status] || {};
                const color = st.color || '#94a3b8';
                const pct = p.progress_pct || 0;
                const contract = num(p.contract_value);
                const invoiced = num(p.invoiced_real);
                const margin = invoiced > 0 ? realMargin(p) : theoMargin(p);
                const marginLabel = invoiced > 0 ? 'réelle' : 'prév.';
                const workType = p.field_assessment?.work_type || p.type || null;
                const dateStr = [fmtD(p.start_date), fmtD(p.end_date)].filter(Boolean).join(' → ');
                return (
                  <div key={p.id}
                    onClick={() => navigate(`/projets/${p.id}`)}
                    style={{ background: '#fff', border: '1px solid #E8EAED', borderRadius: 14, padding: '16px', cursor: 'pointer', transition: 'box-shadow .15s' }}
                    onMouseEnter={e => e.currentTarget.style.boxShadow = '0 4px 16px rgba(0,0,0,0.1)'}
                    onMouseLeave={e => e.currentTarget.style.boxShadow = 'none'}
                  >
                    {/* Header */}
                    <div style={{ display: 'flex', alignItems: 'flex-start', gap: 10, marginBottom: 12 }}>
                      <div style={{ width: 4, minHeight: 44, borderRadius: 2, background: color, flexShrink: 0, marginTop: 2 }}/>
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <p style={{ fontSize: 13, fontWeight: 700, color: '#15171C', marginBottom: 2, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                          {workType || p.name}
                        </p>
                        {p.address && <p style={{ fontSize: 11, color: '#9CA3AF', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{p.address}</p>}
                        {dateStr && <p style={{ fontSize: 11, color: '#9CA3AF' }}>{dateStr}</p>}
                      </div>
                      <span style={{ fontSize: 10, fontWeight: 700, padding: '2px 8px', borderRadius: 999, background: `${color}1a`, color, flexShrink: 0 }}>{st.label || p.status}</span>
                    </div>

                    {/* KPI bars */}
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 8, marginBottom: 12 }}>
                      {contract > 0 && <KPIBar label="Contrat" value={contract} total={contract} color="#6366F1"/>}
                      {contract > 0 && invoiced > 0 && <KPIBar label="Facturé" value={invoiced} total={contract} color="#2563EB"/>}
                      {contract > 0 && <KPIBar label={`Marge ${marginLabel}`} value={Math.max(0, margin)} total={contract} color={margin >= 0 ? '#16A34A' : '#DC2626'}/>}
                    </div>

                    {/* Avancement */}
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                      <div style={{ flex: 1, height: 5, background: '#F3F4F6', borderRadius: 3 }}>
                        <div style={{ height: '100%', width: `${pct}%`, background: color, borderRadius: 3 }}/>
                      </div>
                      <span style={{ fontSize: 11, fontWeight: 700, color, flexShrink: 0 }}>{pct}%</span>
                    </div>

                    {/* Manager */}
                    {p.project_manager && (
                      <p style={{ fontSize: 11, color: '#9CA3AF', marginTop: 8 }}>Resp. : {p.project_manager}</p>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        )
      )}

      {projects.length === 0 && (
        <p style={{ textAlign: 'center', color: '#9CA3AF', fontSize: 14, padding: '40px 0' }}>Aucun projet à afficher.</p>
      )}
    </div>
  );
}

export default function Projets() {
  const t = useT();
  const [searchParams] = useSearchParams();
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState(null);
  const [showNew, setShowNew] = useState(searchParams.get('new') === '1');
  const [editItem, setEditItem] = useState(null);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [cityFilter, setCityFilter] = useState('');
  const [managerFilter, setManagerFilter] = useState('');
  const [valueMin, setValueMin] = useState('');
  const [valueMax, setValueMax] = useState('');
  const [workTypeFilter, setWorkTypeFilter] = useState('');
  const [dateFromFilter, setDateFromFilter] = useState('');
  const [dateToFilter, setDateToFilter] = useState('');
  const [progressMinFilter, setProgressMinFilter] = useState('');
  const [showFilters, setShowFilters] = useState(false);
  const [pipeOpen, setPipeOpen] = useState(false);
  const [showKpiPanel, setShowKpiPanel] = useState(false);
  const kpiPanelRef = useRef(null);

  // KPIs actifs par ligne — persistés en localStorage
  const ALL_KPIS = [
    { key: 'contract', label: 'Valeur contrat', group: 'finances' },
    { key: 'invoiced',  label: 'Facturé',         group: 'finances' },
    { key: 'margin',    label: 'Marge',            group: 'finances' },
    { key: 'dates',     label: 'Dates',            group: 'planning' },
    { key: 'progress',  label: 'Avancement %',     group: 'planning' },
    { key: 'manager',   label: 'Responsable',      group: 'equipe' },
  ];
  const [activeKpis, setActiveKpis] = useState(() => {
    try { return JSON.parse(localStorage.getItem('mf_proj_kpis') || '["contract","margin","dates"]'); }
    catch { return ['contract', 'margin', 'dates']; }
  });
  const toggleKpi = (key) => {
    setActiveKpis(prev => {
      const next = prev.includes(key) ? prev.filter(k => k !== key) : [...prev, key];
      localStorage.setItem('mf_proj_kpis', JSON.stringify(next));
      return next;
    });
  };
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
    setLoadError(null);
    try { const {data} = await projectsApi.list(); setItems(data); }
    catch (err) { setLoadError(err?.response?.data?.error || 'Impossible de charger les projets. Vérifiez votre connexion.'); }
    finally { setLoading(false); }
  };

  useEffect(() => { load(); loadCfg(); }, []);

  // Sync project fields updated from ProjectDetail without a full reload
  useEffect(() => {
    const handler = (e) => {
      const { id: projId, ...fields } = e.detail || {};
      if (projId) setItems(prev => prev.map(p => p.id === projId ? { ...p, ...fields } : p));
    };
    window.addEventListener('monflux:project-updated', handler);
    return () => window.removeEventListener('monflux:project-updated', handler);
  }, []);

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
    const matchWorkType = !workTypeFilter || (p.field_assessment?.work_type || p.type || '').toLowerCase().includes(workTypeFilter.toLowerCase());
    const matchDateFrom = !dateFromFilter || (p.start_date && String(p.start_date).slice(0, 10) >= dateFromFilter);
    const matchDateTo = !dateToFilter || (p.end_date && String(p.end_date).slice(0, 10) <= dateToFilter);
    const matchProgressMin = !progressMinFilter || Number(p.progress_pct || 0) >= Number(progressMinFilter);
    return matchSearch && matchStatus && matchCity && matchManager && matchValueMin && matchValueMax && matchWorkType && matchDateFrom && matchDateTo && matchProgressMin;
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

  // Geocode all projects that have an address but no coordinates
  const geocodeAll = useCallback(async () => {
    const missing = items.filter(p => p.address && (!p.latitude || !p.longitude));
    if (!missing.length) return;
    setGeocoding(true);
    for (const p of missing) {
      try {
        const { data } = await projectsApi.geocode(p.id);
        setItems(i => i.map(pr => pr.id === p.id ? { ...pr, latitude: data.latitude, longitude: data.longitude } : pr));
      } catch (err) {
        console.warn(`Géocodage échoué pour "${p.name}":`, err?.response?.data?.error || err.message);
      }
      await new Promise(r => setTimeout(r, 1100)); // respect Nominatim 1 req/s
    }
    setGeocoding(false);
  }, [items]);

  // Auto-géocode quand on arrive sur la vue carte
  useEffect(() => {
    if (view === 'map' && items.some(p => p.address && !p.latitude)) {
      geocodeAll();
    }
  }, [view]); // eslint-disable-line react-hooks/exhaustive-deps

  const ProjectCard = ({ p }) => {
    const pct = p.progress_pct || 0;
    const st = stageMap[p.status] || {};
    const color = st.color || '#94a3b8';
    const isEditing = sliderProject === p.id;

    const daysLeft = p.end_date && !st.terminal
      ? Math.ceil((new Date(p.end_date) - Date.now()) / 86400000)
      : null;

    // Titre composé : type travaux · adresse · dates
    const workType = p.field_assessment?.work_type || p.type || null;
    const fmtDate = (d) => {
      if (!d) return null;
      // slice to YYYY-MM-DD to avoid double T00:00 on DB timestamps
      const parsed = new Date(String(d).slice(0, 10) + 'T00:00');
      return isNaN(parsed) ? null : parsed.toLocaleDateString('fr-CA', { day: 'numeric', month: 'short' });
    };
    const dateStr = p.start_date && p.end_date
      ? `${fmtDate(p.start_date)} – ${fmtDate(p.end_date)}`
      : fmtDate(p.start_date) || fmtDate(p.end_date);
    const titleParts = [workType, p.address, dateStr].filter(Boolean);
    const displayTitle = titleParts.length > 0 ? titleParts.join('  ·  ') : p.name;
    const isAutoTitle = titleParts.length > 0;

    return (
      <div className="card hover:shadow-md transition-shadow" onClick={() => { if (!isEditing) navigate(`/projets/${p.id}`); }}>
        <div className="flex items-center gap-4 cursor-pointer">
          <div className="w-2 h-10 rounded-full flex-shrink-0" style={{ background: color }}/>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-0.5">
              <p className="font-medium text-gray-900 text-sm truncate">{displayTitle}</p>
              <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full flex-shrink-0" style={{ background: `${color}1a`, color }}>{st.label || p.status}</span>
              {daysLeft !== null && daysLeft <= 7 && (
                <span className={`text-[10px] font-semibold flex items-center gap-0.5 ${daysLeft < 0 ? 'text-red-500' : 'text-orange-500'}`}>
                  <Clock size={9}/>{daysLeft < 0 ? `${Math.abs(daysLeft)}j retard` : `${daysLeft}j`}
                </span>
              )}
            </div>
            <div className="flex gap-3 text-xs text-gray-400 flex-wrap mb-1.5">
              {!isAutoTitle && p.address && activeKpis.includes('dates') && <span className="flex items-center gap-1"><MapPin size={11}/>{p.address}</span>}
              {!isAutoTitle && p.start_date && activeKpis.includes('dates') && <span className="flex items-center gap-1"><Calendar size={11}/>{new Date(String(p.start_date).slice(0,10)+'T00:00').toLocaleDateString('fr-CA')}</span>}
              {activeKpis.includes('manager') && p.project_manager && <span className="flex items-center gap-1">👤 {p.project_manager}</span>}
              {activeKpis.includes('contract') && p.contract_value && <span className="flex items-center gap-1"><DollarSign size={11}/>{Number(p.contract_value).toLocaleString('fr-CA')}$</span>}
              {activeKpis.includes('invoiced') && num(p.invoiced_real) > 0 && <span className="flex items-center gap-1 text-blue-500">Fact. {money(num(p.invoiced_real))}</span>}
              {activeKpis.includes('margin') && (() => {
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
            {!st.terminal && activeKpis.includes('progress') && (
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
            {/* Vues toggle */}
            <div className="flex bg-gray-100 rounded-lg p-0.5">
              {[
                { key: 'list',        icon: <List size={13}/>,        label: 'Liste' },
                { key: 'kanban',      icon: <Columns size={13}/>,     label: 'Kanban' },
                { key: 'gantt',       icon: <GanttChart size={13}/>,  label: 'Gantt' },
                { key: 'calendar',    icon: <Calendar size={13}/>,    label: 'Calendrier' },
                { key: 'portefeuille',icon: <LayoutGrid size={13}/>,  label: 'Portefeuille' },
                { key: 'map',         icon: <MapIcon size={13}/>,     label: 'Carte' },
              ].map(({ key, icon, label }) => (
                <button
                  key={key}
                  className={`flex items-center gap-1 text-xs px-2.5 py-1.5 rounded-md transition-colors ${view===key?'bg-white shadow-sm text-gray-900 font-medium':'text-gray-400'}`}
                  onClick={() => setView(key)}
                >{icon} {label}</button>
              ))}
            </div>
            {/* KPI toggle — seulement en vue liste */}
            {view === 'list' && (
              <div className="relative" ref={kpiPanelRef}>
                <button
                  className={`btn-secondary text-xs flex items-center gap-1 ${showKpiPanel ? 'bg-orange-50 border-brand text-brand' : ''}`}
                  onClick={() => setShowKpiPanel(o => !o)}
                  title="Colonnes KPI"
                >
                  <SlidersHorizontal size={13}/> KPI
                </button>
                {showKpiPanel && (
                  <div style={{ position: 'absolute', right: 0, top: '110%', zIndex: 50, background: '#fff', borderRadius: 12, border: '1px solid #E8EAED', boxShadow: '0 8px 30px rgba(0,0,0,0.12)', padding: '12px 14px', minWidth: 200 }}>
                    <p style={{ fontSize: 11, fontWeight: 700, color: '#9CA3AF', textTransform: 'uppercase', letterSpacing: '.06em', marginBottom: 8 }}>Métriques par ligne</p>
                    {['finances', 'planning', 'equipe'].map(grp => {
                      const kpis = ALL_KPIS.filter(k => k.group === grp);
                      const grpLabel = { finances: 'Finances', planning: 'Planning', equipe: 'Équipe' }[grp];
                      return (
                        <div key={grp} style={{ marginBottom: 10 }}>
                          <p style={{ fontSize: 10, fontWeight: 700, color: '#D1D5DB', textTransform: 'uppercase', letterSpacing: '.05em', marginBottom: 4 }}>{grpLabel}</p>
                          {kpis.map(k => (
                            <label key={k.key} style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '4px 2px', cursor: 'pointer', fontSize: 12, color: '#374151' }}>
                              <input type="checkbox" checked={activeKpis.includes(k.key)} onChange={() => toggleKpi(k.key)} style={{ accentColor: '#E8794E' }}/>
                              {k.label}
                            </label>
                          ))}
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            )}
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
            {t('filters')} {[cityFilter,managerFilter,valueMin,valueMax,workTypeFilter,dateFromFilter,dateToFilter,progressMinFilter].filter(Boolean).length > 0 ? <span className="ml-1 w-4 h-4 bg-brand text-white rounded-full text-[10px] flex items-center justify-center inline-flex">{[cityFilter,managerFilter,valueMin,valueMax,workTypeFilter,dateFromFilter,dateToFilter,progressMinFilter].filter(Boolean).length}</span> : null}
          </button>
        </div>
        {showFilters && (
          <div className="flex gap-2 mb-4 flex-wrap bg-gray-50 rounded-xl p-3">
            <div className="flex-1 min-w-32">
              <label className="label text-[11px]">{t('filter_city')}</label>
              <input className="input text-xs" placeholder="Montréal…" value={cityFilter} onChange={e=>setCityFilter(e.target.value)}/>
            </div>
            <div className="flex-1 min-w-32">
              <label className="label text-[11px]">Type de travaux</label>
              <input className="input text-xs" placeholder="Rénovation…" value={workTypeFilter} onChange={e=>setWorkTypeFilter(e.target.value)}/>
            </div>
            <div className="flex-1 min-w-32">
              <label className="label text-[11px]">{t('filter_manager')}</label>
              <input className="input text-xs" placeholder="Nom…" value={managerFilter} onChange={e=>setManagerFilter(e.target.value)}/>
            </div>
            <div className="flex-1 min-w-28">
              <label className="label text-[11px]">Début après</label>
              <input className="input text-xs" type="date" value={dateFromFilter} onChange={e=>setDateFromFilter(e.target.value)}/>
            </div>
            <div className="flex-1 min-w-28">
              <label className="label text-[11px]">Fin avant</label>
              <input className="input text-xs" type="date" value={dateToFilter} onChange={e=>setDateToFilter(e.target.value)}/>
            </div>
            <div className="flex-1 min-w-28">
              <label className="label text-[11px]">{t('filter_value_min')}</label>
              <input className="input text-xs" type="number" placeholder="0" value={valueMin} onChange={e=>setValueMin(e.target.value)}/>
            </div>
            <div className="flex-1 min-w-28">
              <label className="label text-[11px]">{t('filter_value_max')}</label>
              <input className="input text-xs" type="number" placeholder="∞" value={valueMax} onChange={e=>setValueMax(e.target.value)}/>
            </div>
            <div className="flex-1 min-w-28">
              <label className="label text-[11px]">Avancement min (%)</label>
              <input className="input text-xs" type="number" min="0" max="100" placeholder="0" value={progressMinFilter} onChange={e=>setProgressMinFilter(e.target.value)}/>
            </div>
            {[cityFilter,managerFilter,valueMin,valueMax,workTypeFilter,dateFromFilter,dateToFilter,progressMinFilter].some(Boolean) && (
              <div className="flex items-end">
                <button className="btn-ghost text-xs text-red-400" onClick={()=>{setCityFilter('');setManagerFilter('');setValueMin('');setValueMax('');setWorkTypeFilter('');setDateFromFilter('');setDateToFilter('');setProgressMinFilter('');}}>
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
        ) : view === 'calendar' ? (
          <CalendarView projects={filtered} stageMap={stageMap} />
        ) : view === 'portefeuille' ? (
          <PortfolioView projects={filtered} stageMap={stageMap} navigate={navigate} />
        ) : loadError ? (
          <div className="text-center py-12">
            <p className="text-sm text-red-500 font-medium mb-2">Erreur de chargement</p>
            <p className="text-xs text-gray-400 mb-4">{loadError}</p>
            <button className="btn-primary text-xs" onClick={load}>Réessayer</button>
          </div>
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
