import { useState } from 'react';
import { Loader2, Sparkles } from 'lucide-react';
import SlideOver from '../../../components/SlideOver';
import { projects as projectsApi, ai as aiApi } from '../../../api';
import { useT } from '../../../hooks/useT';
import AddressInput from './AddressInput';
import { EMPTY_PROJECT_FORM, WORK_TYPE_OPTIONS } from './projectUtils';

export default function ProjectModal({ project, onClose, onSave }) {
  const t = useT();
  const [form, setForm] = useState(project ? {
    work_type: project.field_assessment?.work_type || project.type || '',
    address: project.address || '',
    city: project.city || '',
    postal_code: project.postal_code || '',
    latitude: project.latitude != null ? Number(project.latitude) : null,
    longitude: project.longitude != null ? Number(project.longitude) : null,
    start_date: project.start_date ? project.start_date.slice(0, 10) : '',
    end_date: project.end_date ? project.end_date.slice(0, 10) : '',
    contract_value: project.contract_value || '',
    description: project.description || '',
  } : { ...EMPTY_PROJECT_FORM });
  const [saving, setSaving] = useState(false);
  const [generatingPhases, setGeneratingPhases] = useState(false);
  const [error, setError] = useState(null);

  const field = (key) => (event) => {
    setForm((current) => ({ ...current, [key]: event.target.value }));
  };

  const submit = async (event) => {
    event.preventDefault();
    if (!form.work_type) return;
    setError(null);
    setSaving(true);

    try {
      const nameParts = [form.work_type, form.address, form.start_date].filter(Boolean);
      const autoName = nameParts.join(' · ') || form.work_type || 'Projet';
      const payload = {
        name: autoName,
        address: form.address || null,
        city: form.city || null,
        postal_code: form.postal_code || null,
        latitude: form.latitude,
        longitude: form.longitude,
        description: form.description || null,
        start_date: form.start_date || null,
        end_date: form.end_date || null,
        contract_value: form.contract_value || null,
        field_assessment: { ...(project?.field_assessment || {}), work_type: form.work_type },
      };

      const response = project ? await projectsApi.update(project.id, payload) : await projectsApi.create(payload);
      const savedProject = response?.data ?? response;
      if (!savedProject?.id) throw new Error('Réponse invalide du serveur');

      if (form.address && (!form.latitude || !form.longitude)) {
        try {
          const { data: geo } = await projectsApi.geocode(savedProject.id);
          savedProject.latitude = geo.latitude;
          savedProject.longitude = geo.longitude;
        } catch {}
      }

      if (!project && form.description) {
        setGeneratingPhases(true);
        try {
          const { data: aiResponse } = await aiApi.generatePhases({
            description: form.description,
            start_date: form.start_date || null,
          });
          if (aiResponse?.phases?.length) {
            for (const [index, phase] of aiResponse.phases.entries()) {
              await projectsApi.addPhase(savedProject.id, {
                name: phase.name,
                display_order: phase.order ?? index,
                color: phase.color || null,
                notes: phase.description || null,
              });
            }
          }
        } catch {} finally {
          setGeneratingPhases(false);
        }
      }

      onSave(savedProject, !!project);
    } catch (err) {
      setError(err?.response?.data?.error || err?.message || 'Erreur lors de la création');
    } finally {
      setSaving(false);
    }
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
            {(saving || generatingPhases) && <Loader2 size={14} className="animate-spin" />}
            {generatingPhases ? 'Phases IA…' : saving ? 'Création…' : project ? 'Enregistrer' : 'Créer'}
          </button>
        </div>
      }
    >
      <form id="project-form" onSubmit={submit} className="space-y-3">
        {error && <div className="bg-red-50 border border-red-200 text-red-700 text-xs rounded-lg px-3 py-2">{error}</div>}
        <div>
          <label className="label">Type de travaux *</label>
          <select id="proj-work-type" name="work_type" className="input" value={form.work_type} onChange={field('work_type')} required>
            <option value="">— Sélectionner —</option>
            {WORK_TYPE_OPTIONS.map(({ group, items }) => (
              <optgroup key={group} label={group}>
                {items.map((item) => (
                  <option key={item} value={item}>{item}</option>
                ))}
              </optgroup>
            ))}
          </select>
        </div>
        <div>
          <label htmlFor="proj-description" className="label flex items-center gap-1">
            Description
            <span className="ml-1 text-[10px] text-brand font-medium flex items-center gap-0.5">
              <Sparkles size={9} />
              {t('ai_phases')}
            </span>
          </label>
          <textarea id="proj-description" name="description" className="input resize-none" rows={3} placeholder="Description du chantier…" value={form.description} onChange={field('description')} />
        </div>
        <div>
          <label htmlFor="proj-address" className="label">{t('address')}</label>
          <AddressInput
            id="proj-address"
            name="address"
            className="input"
            placeholder="123 rue Principale"
            value={form.address}
            onChange={(value) => setForm((current) => ({ ...current, address: value, latitude: null, longitude: null }))}
            onCityChange={(city) => setForm((current) => ({ ...current, city }))}
            onSelect={(selection) => setForm((current) => ({
              ...current,
              address: selection.address || current.address,
              city: selection.city || current.city,
              postal_code: selection.postal_code || current.postal_code,
              latitude: selection.latitude,
              longitude: selection.longitude,
            }))}
          />
        </div>
        <div>
          <label htmlFor="proj-city" className="label">{t('city')}</label>
          <input id="proj-city" name="city" className="input" placeholder="Montréal" value={form.city} onChange={(event) => setForm((current) => ({ ...current, city: event.target.value, latitude: null, longitude: null }))} />
        </div>
        <div>
          <label htmlFor="proj-postal" className="label">Code postal</label>
          <input id="proj-postal" name="postal_code" className="input" placeholder="H7L 1M7" value={form.postal_code || ''} onChange={(event) => setForm((current) => ({ ...current, postal_code: event.target.value, latitude: null, longitude: null }))} />
        </div>
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label htmlFor="proj-start" className="label">{t('start_date')}</label>
            <input id="proj-start" name="start_date" className="input" type="date" value={form.start_date} onChange={field('start_date')} />
          </div>
          <div>
            <label htmlFor="proj-end" className="label">{t('end_date')}</label>
            <input id="proj-end" name="end_date" className="input" type="date" value={form.end_date} onChange={field('end_date')} />
          </div>
        </div>
        <div>
          <label htmlFor="proj-value" className="label">{t('contract_value')}</label>
          <input id="proj-value" name="contract_value" className="input" type="number" value={form.contract_value} onChange={field('contract_value')} />
        </div>
      </form>
    </SlideOver>
  );
}
