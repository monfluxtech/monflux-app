import React, { useState } from 'react';
import { Minus, Paperclip, Plus, Trash2, X } from 'lucide-react';
import ProjectSection from '../../ProjectSection';

const EMPTY_ROW = {
  titre: '',
  description: '',
  source: 'client',
  statut: 'ouverte',
  date_signalement: new Date().toISOString().slice(0, 10),
  responsable: '',
  date_correction: '',
  notes: '',
  attachments: [],
};

// Pièces jointes (photos/vidéos) — même convention URL que le reste de l'app (pas d'upload fichier).
function AttachmentsCell({ attachments, onChange }) {
  const [pending, setPending] = useState('');
  const list = attachments || [];
  const add = () => {
    const url = pending.trim();
    if (!url) return;
    onChange([...list, { url }]);
    setPending('');
  };
  return (
    <div style={{ display: 'grid', gap: 4, minWidth: 150 }}>
      {list.map((att, index) => (
        <div key={index} style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
          <a href={att.url} target="_blank" rel="noreferrer" style={{ fontSize: 10.5, color: '#DC2626', textDecoration: 'none', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', maxWidth: 120, display: 'flex', alignItems: 'center', gap: 3 }}>
            <Paperclip size={10} /> {att.url.replace(/^https?:\/\//, '').slice(0, 22)}
          </a>
          <button type="button" onClick={() => onChange(list.filter((_, i) => i !== index))} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#D1D5DB', padding: 0 }}>
            <X size={10} />
          </button>
        </div>
      ))}
      <input
        value={pending}
        onChange={(e) => setPending(e.target.value)}
        onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); add(); } }}
        onBlur={add}
        placeholder="+ Lien photo/vidéo/pj…"
        style={{ border: 'none', outline: 'none', background: 'transparent', fontFamily: 'inherit', width: '100%', padding: '2px', fontSize: 10.5, color: '#9CA3AF' }}
      />
    </div>
  );
}

const STATUS_OPTIONS = [
  { key: 'ouverte', label: 'Ouverte', color: '#DC2626', bg: '#FEF2F2' },
  { key: 'en_cours', label: 'En cours', color: '#D97706', bg: '#FFFBEB' },
  { key: 'a_approuver', label: 'À approuver', color: '#2563EB', bg: '#EFF6FF' },
  { key: 'fermee', label: 'Fermée', color: '#16A34A', bg: '#F0FDF4' },
];

const SOURCE_OPTIONS = [
  { key: 'client', label: 'Client' },
  { key: 'entrepreneur', label: 'Entrepreneur' },
  { key: 'flo', label: 'Flo / message' },
  { key: 'chantier', label: 'Chantier / photo' },
];

export default function ProjectNonConformitiesSection({
  sectionSummary,
  expanded,
  onToggle,
  sectionGuard,
  project,
  id,
  projectsApi,
  setProject,
}) {
  const fieldAssessment = project.field_assessment || {};
  const rows = fieldAssessment.non_conformites || [];
  const creator = fieldAssessment.non_conformites_draft || EMPTY_ROW;

  const saveFieldAssessment = async (nextFieldAssessment) => {
    await projectsApi.update(id, { field_assessment: nextFieldAssessment });
    setProject((currentProject) => ({ ...currentProject, field_assessment: nextFieldAssessment }));
  };

  const updateCreator = (patch) => saveFieldAssessment({
    ...fieldAssessment,
    non_conformites_draft: { ...creator, ...patch },
  });

  const addRow = async () => {
    if (!creator.titre?.trim()) return;
    await saveFieldAssessment({
      ...fieldAssessment,
      non_conformites: [
        {
          id: `nc-${Date.now()}`,
          ...creator,
        },
        ...rows,
      ],
      non_conformites_draft: EMPTY_ROW,
    });
  };

  const clearCreator = async () => {
    await saveFieldAssessment({
      ...fieldAssessment,
      non_conformites_draft: EMPTY_ROW,
    });
  };

  const updateRow = async (rowId, patch) => {
    await saveFieldAssessment({
      ...fieldAssessment,
      non_conformites: rows.map((row) => row.id === rowId ? { ...row, ...patch } : row),
    });
  };

  const removeRow = async (rowId) => {
    await saveFieldAssessment({
      ...fieldAssessment,
      non_conformites: rows.filter((row) => row.id !== rowId),
    });
  };

  return (
    <ProjectSection
      sectionId="s-nonconformites"
      icon="🚨"
      title="Non-conformités"
      summary={sectionSummary?.summary}
      stats={sectionSummary?.stats}
      expanded={expanded}
      onToggle={onToggle}
      background="#FFF5F5"
      borderTop="1px solid #FECACA"
    >
      {sectionGuard('s-nonconformites')}

      <div style={{ background: '#fff', borderRadius: 14, border: '1px solid #FECACA', overflow: 'hidden' }}>
        <div style={{ overflowX: 'auto', WebkitOverflowScrolling: 'touch' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', minWidth: 1180 }}>
            <thead>
              <tr style={{ background: '#FFF5F5' }}>
                {['Titre', 'Description', 'Source', 'Statut', 'Signalée le', 'Responsable', 'Correction visée', 'Notes', 'Pièces jointes', 'Actions'].map((label) => (
                  <th key={label} style={{ padding: '10px 12px', textAlign: 'left', fontSize: 11, fontWeight: 700, color: '#991B1B', textTransform: 'uppercase', letterSpacing: '.05em', borderBottom: '1px solid #FECACA' }}>
                    {label}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              <tr style={{ background: '#FFFBFB', borderBottom: '2px solid #FECACA' }}>
                <td style={{ padding: '6px 8px' }}><input className="input" value={creator.titre} onChange={(e) => updateCreator({ titre: e.target.value })} placeholder="Première ligne éditable" /></td>
                <td style={{ padding: '6px 8px' }}><input className="input" value={creator.description} onChange={(e) => updateCreator({ description: e.target.value })} placeholder="Ex : Finition autour de l'évier à reprendre" /></td>
                <td style={{ padding: '6px 8px' }}>
                  <select className="input" value={creator.source} onChange={(e) => updateCreator({ source: e.target.value })}>
                    {SOURCE_OPTIONS.map((option) => <option key={option.key} value={option.key}>{option.label}</option>)}
                  </select>
                </td>
                <td style={{ padding: '6px 8px' }}>
                  <select className="input" value={creator.statut} onChange={(e) => updateCreator({ statut: e.target.value })}>
                    {STATUS_OPTIONS.map((option) => <option key={option.key} value={option.key}>{option.label}</option>)}
                  </select>
                </td>
                <td style={{ padding: '6px 8px' }}><input className="input" type="date" value={creator.date_signalement} onChange={(e) => updateCreator({ date_signalement: e.target.value })} /></td>
                <td style={{ padding: '6px 8px' }}><input className="input" value={creator.responsable} onChange={(e) => updateCreator({ responsable: e.target.value })} placeholder="Responsable" /></td>
                <td style={{ padding: '6px 8px' }}><input className="input" type="date" value={creator.date_correction} onChange={(e) => updateCreator({ date_correction: e.target.value })} /></td>
                <td style={{ padding: '6px 8px' }}><input className="input" value={creator.notes} onChange={(e) => updateCreator({ notes: e.target.value })} placeholder="Notes" /></td>
                <td style={{ padding: '6px 8px' }}>
                  <AttachmentsCell attachments={creator.attachments} onChange={(next) => updateCreator({ attachments: next })} />
                </td>
                <td style={{ padding: '6px 8px', textAlign: 'center' }}>
                  <div className="flex items-center justify-center gap-2">
                    <button type="button" className="btn-ghost p-2 text-green-700 hover:text-green-800" title="Ajouter" onClick={addRow}><Plus size={16} /></button>
                    <button type="button" className="btn-ghost p-2 text-gray-400 hover:text-red-500" title="Vider" onClick={clearCreator}><Minus size={16} /></button>
                  </div>
                </td>
              </tr>

              {rows.length === 0 && (
                <tr>
                  <td colSpan={10} style={{ padding: '22px 12px', textAlign: 'center', color: '#9CA3AF', fontSize: 14 }}>
                    Aucune non-conformité enregistrée.
                  </td>
                </tr>
              )}

              {rows.map((row) => {
                const status = STATUS_OPTIONS.find((option) => option.key === row.statut) || STATUS_OPTIONS[0];
                return (
                  <tr key={row.id} style={{ borderBottom: '1px solid #FEE2E2', background: '#fff' }}>
                    <td style={{ padding: '6px 8px' }}><input className="input" value={row.titre || ''} onChange={(e) => updateRow(row.id, { titre: e.target.value })} /></td>
                    <td style={{ padding: '6px 8px' }}><input className="input" value={row.description || ''} onChange={(e) => updateRow(row.id, { description: e.target.value })} /></td>
                    <td style={{ padding: '6px 8px' }}>
                      <select className="input" value={row.source || 'client'} onChange={(e) => updateRow(row.id, { source: e.target.value })}>
                        {SOURCE_OPTIONS.map((option) => <option key={option.key} value={option.key}>{option.label}</option>)}
                      </select>
                    </td>
                    <td style={{ padding: '6px 8px' }}>
                      <select className="input" value={row.statut || 'ouverte'} onChange={(e) => updateRow(row.id, { statut: e.target.value })} style={{ borderColor: `${status.color}55`, background: status.bg, color: status.color, fontWeight: 700 }}>
                        {STATUS_OPTIONS.map((option) => <option key={option.key} value={option.key}>{option.label}</option>)}
                      </select>
                    </td>
                    <td style={{ padding: '6px 8px' }}><input className="input" type="date" value={row.date_signalement || ''} onChange={(e) => updateRow(row.id, { date_signalement: e.target.value })} /></td>
                    <td style={{ padding: '6px 8px' }}><input className="input" value={row.responsable || ''} onChange={(e) => updateRow(row.id, { responsable: e.target.value })} /></td>
                    <td style={{ padding: '6px 8px' }}><input className="input" type="date" value={row.date_correction || ''} onChange={(e) => updateRow(row.id, { date_correction: e.target.value })} /></td>
                    <td style={{ padding: '6px 8px' }}><input className="input" value={row.notes || ''} onChange={(e) => updateRow(row.id, { notes: e.target.value })} /></td>
                    <td style={{ padding: '6px 8px' }}>
                      <AttachmentsCell attachments={row.attachments} onChange={(next) => updateRow(row.id, { attachments: next })} />
                    </td>
                    <td style={{ padding: '6px 8px', textAlign: 'center' }}>
                      <button type="button" className="btn-ghost p-2 text-gray-400 hover:text-red-500" title="Supprimer" onClick={() => removeRow(row.id)}>
                        <Trash2 size={14} />
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </ProjectSection>
  );
}
