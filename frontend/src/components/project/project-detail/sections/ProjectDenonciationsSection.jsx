import React from 'react';
import ProjectSection from '../../ProjectSection';

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
  const denonciations = fieldAssessment.denonciations || [];

  const saveDenonciations = async (next) => {
    const nextFieldAssessment = { ...fieldAssessment, denonciations: next };
    await projectsApi.update(id, { field_assessment: nextFieldAssessment });
    setProject((currentProject) => ({ ...currentProject, field_assessment: nextFieldAssessment }));
  };

  const addDenonciation = () => saveDenonciations([...denonciations, {
    id: Date.now(),
    type: 'Hypothèque légale',
    beneficiaire: '',
    montant: '',
    date_envoi: '',
    date_limite: '',
    statut: 'à_envoyer',
    notes: '',
  }]);

  const updateDenonciation = (index, patch) => {
    const next = denonciations.map((item, itemIndex) => itemIndex === index ? { ...item, ...patch } : item);
    saveDenonciations(next);
  };

  const removeDenonciation = (index) => saveDenonciations(denonciations.filter((_, itemIndex) => itemIndex !== index));

  const statusOptions = [
    { key: 'à_envoyer', label: 'À envoyer', color: '#D97706', bg: '#FFFBEB' },
    { key: 'envoyée', label: 'Envoyée', color: '#2563EB', bg: '#EFF6FF' },
    { key: 'acceptée', label: 'Acceptée', color: '#16a34a', bg: '#F0FDF4' },
    { key: 'contestée', label: 'Contestée', color: '#DC2626', bg: '#FEF2F2' },
    { key: 'radiée', label: 'Radiée', color: '#6B7280', bg: '#F3F4F6' },
  ];

  return (
    <ProjectSection
      sectionId="s-denonciations"
      icon="⚖️"
      title="Dénonciations"
      summary={sectionSummary?.summary}
      stats={sectionSummary?.stats}
      expanded={expanded}
      onToggle={onToggle}
    >
      {sectionGuard('s-denonciations')}

      <div style={{ background: '#FFFBEB', border: '1px solid #FDE68A', borderRadius: 12, padding: '12px 16px', marginBottom: 20 }}>
        <p style={{ fontSize: 12, color: '#92400E', margin: 0, lineHeight: 1.6 }}>
          <b>Rappel :</b> Au Québec, un sous-traitant ou fournisseur peut inscrire une hypothèque légale de la construction dans les <b>30 jours</b> suivant la fin des travaux (art. 2726–2728 C.c.Q.). La dénonciation préalable au propriétaire est requise pour les parties sans contrat direct avec lui.
        </p>
      </div>

      {denonciations.length > 0 && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12, marginBottom: 16 }}>
          {denonciations.map((denonciation, index) => {
            const status = statusOptions.find((item) => item.key === denonciation.statut) || statusOptions[0];
            const isLate = denonciation.date_limite && new Date(denonciation.date_limite) < new Date() && denonciation.statut !== 'radiée';
            return (
              <div key={denonciation.id || index} style={{ background: '#FAFAFA', border: `1px solid ${isLate ? '#FECACA' : '#E8EAED'}`, borderRadius: 12, padding: 16 }}>
                <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap', alignItems: 'flex-end' }}>
                  <div style={{ minWidth: 170 }}>
                    <p style={{ fontSize: 9, fontWeight: 800, color: '#9CA3AF', textTransform: 'uppercase', letterSpacing: '.07em', margin: '0 0 4px' }}>Type</p>
                    <select value={denonciation.type} onChange={(e) => updateDenonciation(index, { type: e.target.value })} style={{ fontSize: 12, border: '1px solid #E0E4E8', borderRadius: 7, padding: '5px 8px', background: '#fff', color: '#15171C', width: '100%' }}>
                      <option>Hypothèque légale</option>
                      <option>Avis de dénonciation</option>
                      <option>Mise en demeure</option>
                      <option>Autre</option>
                    </select>
                  </div>
                  <div style={{ flex: 1, minWidth: 140 }}>
                    <p style={{ fontSize: 9, fontWeight: 800, color: '#9CA3AF', textTransform: 'uppercase', letterSpacing: '.07em', margin: '0 0 4px' }}>Bénéficiaire</p>
                    <input value={denonciation.beneficiaire} onChange={(e) => updateDenonciation(index, { beneficiaire: e.target.value })} placeholder="Sous-traitant ou fournisseur…" style={{ fontSize: 12, border: '1px solid #E0E4E8', borderRadius: 7, padding: '5px 8px', background: '#fff', color: '#15171C', width: '100%', boxSizing: 'border-box' }}/>
                  </div>
                  <div style={{ width: 110 }}>
                    <p style={{ fontSize: 9, fontWeight: 800, color: '#9CA3AF', textTransform: 'uppercase', letterSpacing: '.07em', margin: '0 0 4px' }}>Montant ($)</p>
                    <input type="number" value={denonciation.montant} onChange={(e) => updateDenonciation(index, { montant: e.target.value })} placeholder="0.00" style={{ fontSize: 12, border: '1px solid #E0E4E8', borderRadius: 7, padding: '5px 8px', background: '#fff', color: '#15171C', width: '100%', boxSizing: 'border-box' }}/>
                  </div>
                  <div style={{ width: 128 }}>
                    <p style={{ fontSize: 9, fontWeight: 800, color: '#9CA3AF', textTransform: 'uppercase', letterSpacing: '.07em', margin: '0 0 4px' }}>Date d'envoi</p>
                    <input type="date" value={denonciation.date_envoi} onChange={(e) => updateDenonciation(index, { date_envoi: e.target.value })} style={{ fontSize: 12, border: '1px solid #E0E4E8', borderRadius: 7, padding: '5px 8px', background: '#fff', color: '#15171C', width: '100%', boxSizing: 'border-box' }}/>
                  </div>
                  <div style={{ width: 128 }}>
                    <p style={{ fontSize: 9, fontWeight: 800, color: isLate ? '#DC2626' : '#9CA3AF', textTransform: 'uppercase', letterSpacing: '.07em', margin: '0 0 4px' }}>
                      {isLate ? '⚠ Échéance dépassée' : 'Date limite (30j)'}
                    </p>
                    <input type="date" value={denonciation.date_limite} onChange={(e) => updateDenonciation(index, { date_limite: e.target.value })} style={{ fontSize: 12, border: `1px solid ${isLate ? '#FECACA' : '#E0E4E8'}`, borderRadius: 7, padding: '5px 8px', background: isLate ? '#FEF2F2' : '#fff', color: isLate ? '#DC2626' : '#15171C', fontWeight: isLate ? 700 : 400, width: '100%', boxSizing: 'border-box' }}/>
                  </div>
                  <div style={{ width: 118 }}>
                    <p style={{ fontSize: 9, fontWeight: 800, color: '#9CA3AF', textTransform: 'uppercase', letterSpacing: '.07em', margin: '0 0 4px' }}>Statut</p>
                    <select value={denonciation.statut} onChange={(e) => updateDenonciation(index, { statut: e.target.value })} style={{ fontSize: 11.5, border: `1.5px solid ${status.color}60`, borderRadius: 7, padding: '5px 8px', background: status.bg, color: status.color, fontWeight: 700, width: '100%' }}>
                      {statusOptions.map((option) => <option key={option.key} value={option.key}>{option.label}</option>)}
                    </select>
                  </div>
                  <button onClick={() => removeDenonciation(index)} style={{ width: 30, height: 30, borderRadius: 8, background: '#FEF2F2', border: '1px solid #FECACA', color: '#DC2626', fontSize: 16, display: 'grid', placeItems: 'center', cursor: 'pointer', flexShrink: 0 }}>
                    ×
                  </button>
                </div>
                <input value={denonciation.notes} onChange={(e) => updateDenonciation(index, { notes: e.target.value })} placeholder="Notes — notaire, numéro de dossier, références…" style={{ marginTop: 10, fontSize: 11.5, border: '1px solid #E0E4E8', borderRadius: 7, padding: '5px 10px', background: '#fff', color: '#374151', width: '100%', boxSizing: 'border-box' }}/>
              </div>
            );
          })}
        </div>
      )}

      {denonciations.length === 0 && (
        <div style={{ textAlign: 'center', padding: '28px 0 20px', color: '#C4C8CE' }}>
          <span style={{ fontSize: 34 }}>⚖️</span>
          <p style={{ fontSize: 13, marginTop: 8, marginBottom: 2 }}>Aucune dénonciation pour ce projet.</p>
          <p style={{ fontSize: 11.5 }}>Ajoutez un avis d'hypothèque légale ou de dénonciation à suivre.</p>
        </div>
      )}

      <button onClick={addDenonciation} style={{ fontSize: 12.5, fontWeight: 700, padding: '9px 20px', borderRadius: 10, border: '1.5px dashed #FECACA', background: '#FEF2F2', color: '#DC2626', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 6 }}>
        <span style={{ fontSize: 16, lineHeight: 1 }}>+</span> Ajouter une dénonciation
      </button>
    </ProjectSection>
  );
}
