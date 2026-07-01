import React from 'react';
import { Download, ExternalLink, Link2, Loader2, MessageCircle, Shield, Trash2 } from 'lucide-react';
import ProjectSection from '../../ProjectSection';

const EMPTY_FORM = { client_name: '', client_email: '', project_description: '', amount_paid: '', notes: '' };

export default function ProjectQuittancesSection({
  sectionSummary,
  expanded,
  onToggle,
  quittance,
  quittanceForm,
  setQuittanceForm,
  project,
  createQuittance,
  savingQuittance,
  FRONTEND_URL,
  pdf,
  saveQuittance,
  deleteQuittance,
}) {
  const handleCreateKeyDown = (event) => {
    if (event.key === 'Enter') createQuittance(event);
  };

  const handleExistingChange = (key, value) => {
    if (!quittance) return;
    saveQuittance({ ...quittance, [key]: value });
  };

  return (
    <ProjectSection
      sectionId="s-quittances"
      icon="✅"
      title="Quittances"
      summary={sectionSummary?.summary}
      stats={sectionSummary?.stats}
      expanded={expanded}
      onToggle={onToggle}
      background="#E9F3EC"
    >
      <div style={{ border: '1px solid #D1FAE5', borderRadius: 16, overflow: 'hidden', background: '#fff' }}>
        <div style={{ overflowX: 'auto', WebkitOverflowScrolling: 'touch' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', minWidth: 1120 }}>
            <thead>
              <tr style={{ background: '#F0FDF4' }}>
                {['Client', 'Courriel', 'Travaux', 'Montant payé', 'Notes', 'Statut', 'Actions'].map((label, index) => (
                  <th
                    key={label}
                    style={{
                      padding: '10px 12px',
                      textAlign: index === 3 ? 'right' : 'left',
                      fontSize: 11,
                      fontWeight: 700,
                      color: '#166534',
                      textTransform: 'uppercase',
                      letterSpacing: '.05em',
                      borderBottom: '1px solid #D1FAE5',
                    }}
                  >
                    {label}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {!quittance && (
                <tr style={{ background: '#FCFFFC', borderBottom: '2px solid #D1FAE5' }}>
                  <td style={{ padding: '6px 8px' }}>
                    <input className="input" value={quittanceForm.client_name} onChange={(e) => setQuittanceForm((form) => ({ ...form, client_name: e.target.value }))} onKeyDown={handleCreateKeyDown} placeholder={project.client_name || 'Nom du client'} />
                  </td>
                  <td style={{ padding: '6px 8px' }}>
                    <input className="input" type="email" value={quittanceForm.client_email} onChange={(e) => setQuittanceForm((form) => ({ ...form, client_email: e.target.value }))} onKeyDown={handleCreateKeyDown} placeholder={project.client_email || 'Courriel client'} />
                  </td>
                  <td style={{ padding: '6px 8px' }}>
                    <input className="input" value={quittanceForm.project_description} onChange={(e) => setQuittanceForm((form) => ({ ...form, project_description: e.target.value }))} onKeyDown={handleCreateKeyDown} placeholder={project.name || 'Description des travaux'} />
                  </td>
                  <td style={{ padding: '6px 8px' }}>
                    <input className="input text-right" type="number" min="0" step="0.01" value={quittanceForm.amount_paid} onChange={(e) => setQuittanceForm((form) => ({ ...form, amount_paid: e.target.value }))} onKeyDown={handleCreateKeyDown} placeholder={project.contract_value || '0'} />
                  </td>
                  <td style={{ padding: '6px 8px' }}>
                    <input className="input" value={quittanceForm.notes} onChange={(e) => setQuittanceForm((form) => ({ ...form, notes: e.target.value }))} onKeyDown={handleCreateKeyDown} placeholder="Note au client" />
                  </td>
                  <td style={{ padding: '6px 8px' }}>
                    <span className="badge badge-gray">Brouillon</span>
                  </td>
                  <td style={{ padding: '6px 8px', textAlign: 'center' }}>
                    <div className="flex items-center justify-center gap-2">
                      <button type="button" className="btn-ghost p-2 text-green-700 hover:text-green-800" title="Créer la quittance" onClick={(event) => createQuittance(event)} disabled={savingQuittance}>
                        {savingQuittance ? <Loader2 size={16} className="animate-spin" /> : <Shield size={16} />}
                      </button>
                      <button type="button" className="btn-ghost p-2 text-gray-400 hover:text-red-500" title="Vider la ligne" onClick={() => setQuittanceForm(EMPTY_FORM)}>
                        <Trash2 size={14} />
                      </button>
                    </div>
                  </td>
                </tr>
              )}

              {quittance ? (
                <tr style={{ background: '#fff' }}>
                  <td style={{ padding: '6px 8px' }}>
                    <input className="input" value={quittance.client_name || ''} onChange={(e) => handleExistingChange('client_name', e.target.value)} />
                  </td>
                  <td style={{ padding: '6px 8px' }}>
                    <input className="input" type="email" value={quittance.client_email || ''} onChange={(e) => handleExistingChange('client_email', e.target.value)} />
                  </td>
                  <td style={{ padding: '6px 8px' }}>
                    <input className="input" value={quittance.project_description || ''} onChange={(e) => handleExistingChange('project_description', e.target.value)} />
                  </td>
                  <td style={{ padding: '6px 8px' }}>
                    <input className="input text-right" type="number" min="0" step="0.01" value={quittance.amount_paid || ''} onChange={(e) => handleExistingChange('amount_paid', e.target.value)} />
                  </td>
                  <td style={{ padding: '6px 8px' }}>
                    <input className="input" value={quittance.notes || ''} onChange={(e) => handleExistingChange('notes', e.target.value)} />
                  </td>
                  <td style={{ padding: '6px 8px' }}>
                    <span className={`badge ${quittance.status === 'signed' ? 'badge-green' : quittance.status === 'sent' ? 'badge-blue' : 'badge-gray'}`}>
                      {quittance.status === 'signed' ? 'Signée' : quittance.status === 'sent' ? 'Envoyée' : 'Brouillon'}
                    </span>
                  </td>
                  <td style={{ padding: '6px 8px' }}>
                    <div className="flex items-center justify-end gap-2 flex-wrap">
                      <button
                        type="button"
                        className="btn-ghost p-2 text-gray-400 hover:text-brand"
                        title="Copier le lien"
                        onClick={() => navigator.clipboard.writeText(`${FRONTEND_URL}/quittance/${quittance.public_token}`)}
                      >
                        <Link2 size={12} />
                      </button>
                      <a href={`${FRONTEND_URL}/quittance/${quittance.public_token}`} target="_blank" rel="noopener noreferrer" className="btn-ghost p-2 text-gray-400 hover:text-brand" title="Prévisualiser">
                        <ExternalLink size={12} />
                      </a>
                      <a href={pdf.quittanceUrl(quittance.id)} download={`quittance-${quittance.id.slice(0, 8)}.pdf`} className="btn-ghost p-2 text-gray-400 hover:text-brand" title="Télécharger PDF">
                        <Download size={12} />
                      </a>
                      <a
                        href={`https://wa.me/?text=${encodeURIComponent(`Bonjour ${quittance.client_name}, voici votre quittance de fin de travaux à signer : ${FRONTEND_URL}/quittance/${quittance.public_token}`)}`}
                        target="_blank"
                        rel="noreferrer"
                        className="btn-ghost p-2 text-green-600 hover:text-green-700"
                        title="Envoyer par WhatsApp"
                      >
                        <MessageCircle size={12} />
                      </a>
                      <button type="button" className="btn-ghost p-2 text-gray-300 hover:text-red-500" title="Supprimer la quittance" onClick={() => deleteQuittance(quittance.id)}>
                        <Trash2 size={12} />
                      </button>
                    </div>
                  </td>
                </tr>
              ) : (
                <tr>
                  <td colSpan={7} style={{ padding: '18px 12px', textAlign: 'center', color: '#9CA3AF', fontSize: 13 }}>
                    La première ligne sert à générer une quittance directement depuis la fiche projet.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </ProjectSection>
  );
}
