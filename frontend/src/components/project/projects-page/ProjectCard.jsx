import { ChevronRight, Clock, DollarSign, Pencil, Trash2, TrendingUp } from 'lucide-react';
import { getPlanVsActual, getProjectAddress, getProjectDateRange, getProjectTitle, money, num, realMargin, theoMargin } from './projectUtils';

export default function ProjectCard({
  project,
  pipeline,
  stageMap,
  activeKpis,
  onChangeStage,
  onEdit,
  onDelete,
  onOpen,
}) {
  const stage = stageMap[project.status] || {};
  const color = stage.color || '#94a3b8';
  const daysLeft = project.end_date && !stage.terminal ? Math.ceil((new Date(project.end_date) - Date.now()) / 86400000) : null;

  return (
    <div className="card hover:shadow-md transition-shadow" onClick={() => onOpen(project.id)}>
      <div className="flex items-center gap-4 cursor-pointer">
        <div className="w-2 h-10 rounded-full flex-shrink-0" style={{ background: color }} />
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-0.5">
            <div className="min-w-0 flex-1">
              <p className="font-medium text-gray-900 text-sm truncate">{getProjectTitle(project)}</p>
              {getProjectAddress(project) && <p className="text-xs text-gray-400 truncate">{getProjectAddress(project)}</p>}
              {getProjectDateRange(project) && <p className="text-[11px] text-gray-300 truncate">{getProjectDateRange(project)}</p>}
            </div>
            <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full flex-shrink-0" style={{ background: `${color}1a`, color }}>
              {stage.label || project.status}
            </span>
            {daysLeft !== null && daysLeft <= 7 && (
              <span className={`text-[10px] font-semibold flex items-center gap-0.5 ${daysLeft < 0 ? 'text-red-500' : 'text-orange-500'}`}>
                <Clock size={9} />
                {daysLeft < 0 ? `${Math.abs(daysLeft)}j retard` : `${daysLeft}j`}
              </span>
            )}
          </div>
          <div className="flex gap-3 text-xs text-gray-400 flex-wrap mb-1.5">
            {activeKpis.includes('manager') && project.project_manager && <span className="flex items-center gap-1">👤 {project.project_manager}</span>}
            {activeKpis.includes('contract') && (
              <span className="flex items-center gap-1">
                <DollarSign size={11} />
                Contrat {project.contract_value ? Number(project.contract_value).toLocaleString('fr-CA') + '$' : '—'}
              </span>
            )}
            {activeKpis.includes('invoiced') && <span className="flex items-center gap-1 text-blue-500">Fact. {num(project.invoiced_real) > 0 ? money(num(project.invoiced_real)) : '—'}</span>}
            {activeKpis.includes('margin') && (() => {
              const hasReal = num(project.invoiced_real) > 0;
              const margin = hasReal ? realMargin(project) : theoMargin(project);
              const revenue = hasReal ? num(project.invoiced_real) : num(project.contract_value);
              const positive = margin >= 0;
              return (
                <span className={`flex items-center gap-1 font-medium ${positive ? 'text-green-600' : 'text-red-500'}`} title={hasReal ? 'Marge réelle' : 'Marge théorique'}>
                  <TrendingUp size={11} />
                  {revenue > 0 || margin !== 0 ? `${money(margin)}${revenue > 0 ? ` · ${Math.round((margin / revenue) * 100)}%` : ''}` : 'Marge —'}
                  <span className="text-gray-300 font-normal">{hasReal ? 'réel' : 'prév.'}</span>
                </span>
              );
            })()}
            {activeKpis.includes('plan_actual') && (() => {
              const { planned, actual, delta } = getPlanVsActual(project);
              const tone = delta > 0 ? 'text-orange-500' : delta < 0 ? 'text-green-600' : 'text-gray-400';
              return (
                <span className={`flex items-center gap-1 ${tone}`}>
                  <Clock size={11} />
                  Réel {actual > 0 ? `${actual}h` : '—'} / Prévu {planned > 0 ? `${planned}h` : '—'}
                </span>
              );
            })()}
          </div>
        </div>
        <div className="flex items-center gap-1 flex-shrink-0" onClick={(event) => event.stopPropagation()}>
          <select
            value={project.status}
            onChange={(event) => onChangeStage(project.id, event.target.value)}
            className="text-xs border border-gray-200 rounded-lg px-1.5 py-1 text-gray-600 bg-white hover:border-gray-300 cursor-pointer max-w-[8.5rem]"
            title="Changer l'état"
          >
            {pipeline.map((stageOption) => (
              <option key={stageOption.key} value={stageOption.key}>{stageOption.label}</option>
            ))}
            {!stageMap[project.status] && <option value={project.status}>{project.status}</option>}
          </select>
          <button className="btn-ghost p-1.5 text-gray-400 hover:text-blue-500" onClick={() => onEdit(project)}>
            <Pencil size={13} />
          </button>
          <button className="btn-ghost p-1.5 text-gray-400 hover:text-red-500" onClick={() => onDelete(project.id)}>
            <Trash2 size={13} />
          </button>
          <ChevronRight size={14} className="text-gray-300 ml-1" />
        </div>
      </div>
    </div>
  );
}
