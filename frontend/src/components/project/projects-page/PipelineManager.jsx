import { useState } from 'react';
import { ArrowDown, ArrowUp, Loader2, Plus, X } from 'lucide-react';
import SlideOver from '../../../components/SlideOver';
import { slugify } from './projectUtils';

export default function PipelineManager({ pipeline, onSave, onClose }) {
  const [stages, setStages] = useState(() => pipeline.map((stage) => ({ ...stage })));
  const [saving, setSaving] = useState(false);

  const updateStage = (index, patch) => {
    setStages((current) => current.map((stage, stageIndex) => (stageIndex === index ? { ...stage, ...patch } : stage)));
  };

  const moveStage = (index, direction) => {
    setStages((current) => {
      const nextIndex = index + direction;
      if (nextIndex < 0 || nextIndex >= current.length) return current;
      const next = [...current];
      [next[index], next[nextIndex]] = [next[nextIndex], next[index]];
      return next;
    });
  };

  const removeStage = (index) => {
    setStages((current) => current.filter((_, stageIndex) => stageIndex !== index));
  };

  const addStage = () => {
    setStages((current) => [...current, { key: '', label: 'Nouvel état', color: '#94a3b8' }]);
  };

  const save = async () => {
    setSaving(true);
    const seen = new Set();
    const cleaned = stages
      .filter((stage) => (stage.label || '').trim())
      .map((stage) => {
        let key = stage.key && /^[a-z0-9_]+$/.test(stage.key) ? stage.key : slugify(stage.label);
        const base = key;
        let n = 1;
        while (seen.has(key)) key = `${base}_${n++}`;
        seen.add(key);
        return { key, label: stage.label.trim(), color: stage.color || '#94a3b8', ...(stage.terminal ? { terminal: true } : {}) };
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
        {stages.map((stage, index) => (
          <div key={index} className="flex items-center gap-2 p-2 rounded-xl border border-gray-100 bg-gray-50">
            <div className="flex flex-col">
              <button type="button" onClick={() => moveStage(index, -1)} disabled={index === 0} className="text-gray-300 hover:text-gray-600 disabled:opacity-30">
                <ArrowUp size={13} />
              </button>
              <button type="button" onClick={() => moveStage(index, 1)} disabled={index === stages.length - 1} className="text-gray-300 hover:text-gray-600 disabled:opacity-30">
                <ArrowDown size={13} />
              </button>
            </div>
            <input type="color" value={stage.color || '#94a3b8'} onChange={(event) => updateStage(index, { color: event.target.value })} className="w-7 h-7 rounded cursor-pointer flex-shrink-0 border border-gray-200" title="Couleur" />
            <input className="input flex-1 py-1 text-sm" value={stage.label} onChange={(event) => updateStage(index, { label: event.target.value })} placeholder="Nom de l'état" />
            <label className="flex items-center gap-1 text-[10px] text-gray-400 flex-shrink-0" title="État final (projet terminé)">
              <input type="checkbox" checked={!!stage.terminal} onChange={(event) => updateStage(index, { terminal: event.target.checked })} /> fin
            </label>
            <button type="button" onClick={() => removeStage(index)} className="text-gray-300 hover:text-red-500 flex-shrink-0">
              <X size={14} />
            </button>
          </div>
        ))}
        <button type="button" onClick={addStage} className="w-full flex items-center justify-center gap-1 py-2 text-sm text-brand border border-dashed border-brand/40 rounded-xl hover:bg-orange-50">
          <Plus size={14} /> Ajouter un état
        </button>
        <p className="text-xs text-gray-400 pt-1">L'ordre définit la progression. Coche « fin » pour les états où le projet est clos (rangé dans « Terminés »).</p>
      </div>
    </SlideOver>
  );
}
