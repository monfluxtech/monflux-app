import React from 'react';
import { Minus, Plus, Trash2 } from 'lucide-react';
import ProjectSection from '../../ProjectSection';

const EMPTY_ROW = {
  type: 'Hypothèque légale',
  beneficiaire: '',
  montant: '',
  date_envoi: '',
  date_limite: '',
  statut: 'à_envoyer',
  notes: '',
};

export default function ProjectDenonciationsSection({
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
  const rows = fieldAssessment.denonciations || [];
  const creator = fieldAssessment.denonciations_draft || EMPTY_ROW;

  const statusOptions = [
    { key: 'à_envoyer', label: 'À envoyer', color: '#D97706', bg: '#FFFBEB' },
    { key: 'envoyée', label: 'Envoyée', color: '#2563EB', bg: '#EFF6FF' },
    { key: 'acceptée', label: 'Acceptée', color: '#16a34a', bg: '#F0FDF4' },
    { key: 'contestée', label: 'Contestée', color: '#DC2626', bg: '#FEF2F2' },
    { key: 'radiée', label: 'Radiée', color: '#6B7280', bg: '#F3F4F6' },
  ];

  const saveFieldAssessment = async (nextFieldAssessment) => {
    await projectsApi.update(id, { field_assessment: nextFieldAssessment });
    setProject((currentProject) => ({ ...currentProject, field_assessment: nextFieldAssessment }));
  };

  const updateCreator = (patch) => saveFieldAssessment({
    ...fieldAssessment,
    denonciations_draft: { ...creator, ...patch },
  });

  const addRow = async () => {
    if (!creator.beneficiaire?.trim()) return;
    await saveFieldAssessment({
      ...fieldAssessment,
      denonciations: [{ id: `den-${Date.now()}`, ...creator }, ...rows],
      denonciations_draft: EMPTY_ROW,
    });
  };

  const clearCreator = async () => {
    await saveFieldAssessment({
      ...fieldAssessment,
      denonciations_draft: EMPTY_ROW,
    });
  };

  const updateRow = async (rowId, patch) => {
    await saveFieldAssessment({
      ...fieldAssessment,
      denonciations: rows.map((row) => row.id === rowId ? { ...row, ...patch } : row),
    });
  };

  const removeRow = async (rowId) => {
    await saveFieldAssessment({
      ...fieldAssessment,
      denonciations: rows.filter((row) => row.id !== rowId),
    });
  };

  return (
    <ProjectSection
      sectionId="s-denonciations"
      icon="⚖️"
      title="Dénonciations"
      summary={sectionSummary?.summary}
      stats={sectionSummary?.stats}
      expanded={expanded}
      onToggle={onToggle}
      background="#FFFDF7"
      borderTop="1px solid #FDE68A"
    >
      {sectionGuard('s-denonciations')}

      <div style={{ background: '#FFFBEB', border: '1px solid #FDE68A', borderRadius: 12, padding: '12px 16px', marginBottom: 18 }}>
        <p style={{ fontSize: 12, color: '#92400E', margin: 0, lineHeight: 1.6 }}>
          <b>Rappel légal :</b> un sous-traitant ou fournisseur peut inscrire une hypothèque légale dans les <b>30 jours</b> suivant la fin des travaux. La dénonciation préalable permet de garder ce suivi visible dans la fiche projet.
        </p>
      </div>

      <div style={{ background: '#fff', borderRadius: 14, border: '1px solid #FDE68A', overflow: 'hidden' }}>
        <div style={{ overflowX: 'auto', WebkitOverflowScrolling: 'touch' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', minWidth: 1180 }}>
            <thead>
              <tr style={{ background: '#FFFDF7' }}>
                {['Type', 'Bénéficiaire', 'Montant', 'Date envoi', 'Date limite', 'Statut', 'Notes', 'Actions'].map((label, index) => (
                  <th
                    key={label}
                    style={{
                      padding: '10px 12px',
                      textAlign: index === 2 ? 'right' : 'left',
                      fontSize: 11,
                      fontWeight: 700,
                      color: '#92400E',
                      textTransform: 'uppercase',
                      letterSpacing: '.05em',
                      borderBottom: '1px solid #FDE68A',
                    }}
                  >
                    {label}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              <tr style={{ background: '#FFFEFA', borderBottom: '2px solid #FDE68A' }}>
                <td style={{ padding: '6px 8px' }}>
                  <select className="input" value={creator.type} onChange={(e) => updateCreator({ type: e.target.value })}>
                    <option>Hypothèque légale</option>
                    <option>Avis de dénonciation</option>
                    <option>Mise en demeure</option>
                    <option>Autre</option>
                  </select>
                </td>
                <td style={{ padding: '6px 8px' }}>
                  <input className="input" value={creator.beneficiaire} onChange={(e) => updateCreator({ beneficiaire: e.target.value })} placeholder="Sous-traitant ou fournisseur" />
                </td>
                <td style={{ padding: '6px 8px' }}>
                  <input className="input text-right" type="number" min="0" step="0.01" value={creator.montant} onChange={(e) => updateCreator({ montant: e.target.value })} placeholder="0.00" />
                </td>
                <td style={{ padding: '6px 8px' }}>
                  <input className="input" type="date" value={creator.date_envoi} onChange={(e) => updateCreator({ date_envoi: e.target.value })} />
                </td>
                <td style={{ padding: '6px 8px' }}>
                  <input className="input" type="date" value={creator.date_limite} onChange={(e) => updateCreator({ date_limite: e.target.value })} />
                </td>
                <td style={{ padding: '6px 8px' }}>
                  <select className="input" value={creator.statut} onChange={(e) => updateCreator({ statut: e.target.value })}>
                    {statusOptions.map((option) => <option key={option.key} value={option.key}>{option.label}</option>)}
                  </select>
                </td>
                <td style={{ padding: '6px 8px' }}>
                  <input className="input" value={creator.notes} onChange={(e) => updateCreator({ notes: e.target.value })} placeholder="Notes de suivi" />
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
                  <td colSpan={8} style={{ padding: '22px 12px', textAlign: 'center', color: '#9CA3AF', fontSize: 14 }}>
                    Aucune dénonciation enregistrée.
                  </td>
                </tr>
              )}

              {rows.map((row) => {
                const status = statusOptions.find((option) => option.key === row.statut) || statusOptions[0];
                return (
                  <tr key={row.id} style={{ borderBottom: '1px solid #FEF3C7', background: '#fff' }}>
                    <td style={{ padding: '6px 8px' }}>
                      <select className="input" value={row.type || 'Hypothèque légale'} onChange={(e) => updateRow(row.id, { type: e.target.value })}>
                        <option>Hypothèque légale</option>
                        <option>Avis de dénonciation</option>
                        <option>Mise en demeure</option>
                        <option>Autre</option>
                      </select>
                    </td>
                    <td style={{ padding: '6px 8px' }}>
                      <input className="input" value={row.beneficiaire || ''} onChange={(e) => updateRow(row.id, { beneficiaire: e.target.value })} />
                    </td>
                    <td style={{ padding: '6px 8px' }}>
                      <input className="input text-right" type="number" min="0" step="0.01" value={row.montant || ''} onChange={(e) => updateRow(row.id, { montant: e.target.value })} />
                    </td>
                    <td style={{ padding: '6px 8px' }}>
                      <input className="input" type="date" value={row.date_envoi || ''} onChange={(e) => updateRow(row.id, { date_envoi: e.target.value })} />
                    </td>
                    <td style={{ padding: '6px 8px' }}>
                      <input className="input" type="date" value={row.date_limite || ''} onChange={(e) => updateRow(row.id, { date_limite: e.target.value })} />
                    </td>
                    <td style={{ padding: '6px 8px' }}>
                      <select className="input" value={row.statut || 'à_envoyer'} onChange={(e) => updateRow(row.id, { statut: e.target.value })} style={{ borderColor: `${status.color}55`, background: status.bg, color: status.color, fontWeight: 700 }}>
                        {statusOptions.map((option) => <option key={option.key} value={option.key}>{option.label}</option>)}
                      </select>
                    </td>
                    <td style={{ padding: '6px 8px' }}>
                      <input className="input" value={row.notes || ''} onChange={(e) => updateRow(row.id, { notes: e.target.value })} />
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
