import { useMemo, useRef, useState } from 'react';
import { Calendar, Columns, GanttChart, LayoutGrid, List, Map as MapIcon, Plus, Settings2, SlidersHorizontal } from 'lucide-react';
import { ALL_KPIS, PROJECT_VIEW_OPTIONS } from './projectUtils';

const ICONS = {
  list: List,
  kanban: Columns,
  gantt: GanttChart,
  calendar: Calendar,
  portfolio: LayoutGrid,
  map: MapIcon,
};

export default function ProjectsToolbar({ view, onChangeView, activeKpis, onToggleKpi, onNew, onOpenPipeline }) {
  const [showKpiPanel, setShowKpiPanel] = useState(false);
  const kpiPanelRef = useRef(null);
  const activeGroups = useMemo(() => ['finances', 'planning', 'equipe'], []);

  return (
    <div className="flex items-center justify-between mb-6 gap-3 flex-wrap">
      <h1 className="text-xl font-bold text-gray-900">Projets</h1>
      <div className="flex items-center gap-2">
        <div className="flex bg-gray-100 rounded-lg p-0.5">
          {PROJECT_VIEW_OPTIONS.map(({ key, label, icon }) => {
            const Icon = ICONS[icon];
            return (
              <button
                key={key}
                className={`flex items-center gap-1 text-xs px-2.5 py-1.5 rounded-md transition-colors ${view === key ? 'bg-white shadow-sm text-gray-900 font-medium' : 'text-gray-400'}`}
                onClick={() => onChangeView(key)}
              >
                <Icon size={13} /> {label}
              </button>
            );
          })}
        </div>

        {view === 'list' && (
          <div className="relative" ref={kpiPanelRef}>
            <button
              className={`btn-secondary text-xs flex items-center gap-1 ${showKpiPanel ? 'bg-orange-50 border-brand text-brand' : ''}`}
              onClick={() => setShowKpiPanel((open) => !open)}
              title="Colonnes KPI"
            >
              <SlidersHorizontal size={13} /> KPI
            </button>
            {showKpiPanel && (
              <div style={{ position: 'absolute', right: 0, top: '110%', zIndex: 50, background: '#fff', borderRadius: 12, border: '1px solid #E8EAED', boxShadow: '0 8px 30px rgba(0,0,0,0.12)', padding: '12px 14px', minWidth: 200 }}>
                <p style={{ fontSize: 11, fontWeight: 700, color: '#9CA3AF', textTransform: 'uppercase', letterSpacing: '.06em', marginBottom: 8 }}>
                  Métriques par ligne
                </p>
                {activeGroups.map((group) => {
                  const groupLabel = { finances: 'Finances', planning: 'Planning', equipe: 'Équipe' }[group];
                  const groupKpis = ALL_KPIS.filter((kpi) => kpi.group === group);
                  return (
                    <div key={group} style={{ marginBottom: 10 }}>
                      <p style={{ fontSize: 10, fontWeight: 700, color: '#D1D5DB', textTransform: 'uppercase', letterSpacing: '.05em', marginBottom: 4 }}>{groupLabel}</p>
                      {groupKpis.map((kpi) => (
                        <label key={kpi.key} style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '4px 2px', cursor: 'pointer', fontSize: 12, color: '#374151' }}>
                          <input type="checkbox" checked={activeKpis.includes(kpi.key)} onChange={() => onToggleKpi(kpi.key)} style={{ accentColor: '#E8794E' }} />
                          {kpi.label}
                        </label>
                      ))}
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}

        <button className="btn-secondary text-xs flex items-center gap-1" onClick={onOpenPipeline} title="Gérer le pipeline">
          <Settings2 size={13} /> Pipeline
        </button>

        <button className="btn-primary" onClick={onNew}>
          <Plus size={15} /> Nouveau projet
        </button>
      </div>
    </div>
  );
}
