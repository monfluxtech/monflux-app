import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Calendar, Clock, MapPin, Plus } from 'lucide-react';
import { getProjectAddress, getProjectDateRange, getProjectTitle } from './projectUtils';

export default function KanbanView({ projects, pipeline, stageMap, onChangeStage, onNew }) {
  const navigate = useNavigate();
  const [draggedId, setDraggedId] = useState(null);
  const [overStage, setOverStage] = useState(null);

  const onDragStart = (id) => (event) => {
    event.dataTransfer.effectAllowed = 'move';
    setDraggedId(id);
  };

  const onDragEnd = () => {
    setDraggedId(null);
    setOverStage(null);
  };

  const onDragOver = (key) => (event) => {
    event.preventDefault();
    event.dataTransfer.dropEffect = 'move';
    setOverStage(key);
  };

  const onDrop = (key) => (event) => {
    event.preventDefault();
    if (draggedId) onChangeStage(draggedId, key);
    setDraggedId(null);
    setOverStage(null);
  };

  return (
    <div className="flex gap-3 overflow-x-auto pb-4" style={{ minHeight: 440 }}>
      {pipeline.map((stage) => {
        const stageProjects = projects.filter((project) => project.status === stage.key);
        const isOver = overStage === stage.key;

        return (
          <div
            key={stage.key}
            className={`flex-shrink-0 w-60 rounded-2xl p-2 transition-colors border ${isOver ? 'border-brand/40 bg-orange-50/40' : 'border-transparent bg-gray-100/60'}`}
            onDragOver={onDragOver(stage.key)}
            onDrop={onDrop(stage.key)}
            onDragLeave={() => setOverStage(null)}
          >
            <div className="flex items-center gap-2 px-2 py-1.5 mb-2">
              <div className="w-2.5 h-2.5 rounded-full flex-shrink-0" style={{ background: stage.color }} />
              <p className="text-xs font-bold text-gray-700 truncate flex-1">{stage.label}</p>
              <span className="text-[11px] text-gray-400 bg-white rounded-full px-1.5 py-0.5 font-medium">{stageProjects.length}</span>
            </div>
            <div className="space-y-2">
              {stageProjects.map((project) => (
                <div
                  key={project.id}
                  draggable
                  onDragStart={onDragStart(project.id)}
                  onDragEnd={onDragEnd}
                  className={`bg-white rounded-xl p-3 shadow-sm cursor-grab active:cursor-grabbing border border-gray-100 hover:border-brand/30 transition-all ${draggedId === project.id ? 'opacity-40 scale-95' : ''}`}
                  onClick={() => navigate(`/projets/${project.id}`)}
                >
                  <p className="text-sm font-semibold text-gray-900 mb-1 truncate">{getProjectTitle(project)}</p>
                  {getProjectAddress(project) && (
                    <p className="text-[11px] text-gray-400 truncate flex items-center gap-1">
                      <MapPin size={9} />
                      {getProjectAddress(project)}
                    </p>
                  )}
                  {getProjectDateRange(project) && (
                    <p className="text-[10px] text-gray-300 truncate mb-1.5 flex items-center gap-1">
                      <Calendar size={9} />
                      {getProjectDateRange(project)}
                    </p>
                  )}
                  <div className="flex items-center justify-between gap-2">
                    {project.contract_value ? (
                      <span className="text-xs font-bold text-brand">{Number(project.contract_value).toLocaleString('fr-CA')}$</span>
                    ) : (
                      <span />
                    )}
                    {project.end_date && !stage.terminal && (() => {
                      const days = Math.ceil((new Date(project.end_date) - Date.now()) / 86400000);
                      return (
                        <span className={`text-[10px] font-medium flex items-center gap-0.5 flex-shrink-0 ${days < 0 ? 'text-red-400' : days <= 7 ? 'text-orange-400' : 'text-gray-300'}`}>
                          <Clock size={9} />
                          {days < 0 ? `${Math.abs(days)}j` : `${days}j`}
                        </span>
                      );
                    })()}
                  </div>
                  {!stage.terminal && project.progress_pct > 0 && (
                    <div className="mt-2 h-1 bg-gray-100 rounded-full">
                      <div className="h-full rounded-full" style={{ width: `${project.progress_pct}%`, background: stage.color }} />
                    </div>
                  )}
                </div>
              ))}
              <button className="w-full text-xs text-gray-300 py-2 rounded-xl border border-dashed border-gray-200 hover:border-brand/40 hover:text-brand transition-colors" onClick={onNew}>
                <Plus size={11} className="inline mr-0.5" /> Nouveau
              </button>
            </div>
          </div>
        );
      })}
    </div>
  );
}
