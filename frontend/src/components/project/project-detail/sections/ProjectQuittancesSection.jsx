import React from 'react';
import { Download, ExternalLink, Link2, Loader2, MessageCircle, Shield } from 'lucide-react';
import ProjectSection from '../../ProjectSection';

export default function ProjectQuittancesSection({
  sectionSummary,
  expanded,
  onToggle,
  quittance,
  showQuittanceForm,
  setShowQuittanceForm,
  quittanceForm,
  setQuittanceForm,
  project,
  createQuittance,
  savingQuittance,
  FRONTEND_URL,
  pdf,
}) {
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
      {!quittance && !showQuittanceForm && (
        <div className="text-center py-6">
          <Shield size={28} className="text-gray-200 mx-auto mb-3"/>
          <p className="text-sm text-gray-400 mb-4">Envoyez une quittance à votre client pour confirmer la fin des travaux et obtenir sa signature électronique.</p>
          <button
            className="btn-primary text-xs"
            onClick={() => {
              setQuittanceForm({ client_name: project.client_name || '', client_email: project.client_email || '', project_description: project.name || '', amount_paid: project.contract_value || '', notes: '' });
              setShowQuittanceForm(true);
            }}
          >
            <Shield size={13}/> Générer une quittance
          </button>
        </div>
      )}

      {showQuittanceForm && (
        <form onSubmit={createQuittance} className="space-y-3">
          <div className="grid grid-cols-2 gap-3">
            <div><label className="label">Nom du client *</label><input className="input" value={quittanceForm.client_name} onChange={(e) => setQuittanceForm((form) => ({ ...form, client_name: e.target.value }))} required/></div>
            <div><label className="label">Courriel client</label><input className="input" type="email" value={quittanceForm.client_email} onChange={(e) => setQuittanceForm((form) => ({ ...form, client_email: e.target.value }))}/></div>
          </div>
          <div><label className="label">Description des travaux</label><textarea className="input resize-none" rows={2} value={quittanceForm.project_description} onChange={(e) => setQuittanceForm((form) => ({ ...form, project_description: e.target.value }))}/></div>
          <div className="grid grid-cols-2 gap-3">
            <div><label className="label">Montant payé ($)</label><input className="input" type="number" value={quittanceForm.amount_paid} onChange={(e) => setQuittanceForm((form) => ({ ...form, amount_paid: e.target.value }))}/></div>
            <div><label className="label">Note (optionnel)</label><input className="input" value={quittanceForm.notes} onChange={(e) => setQuittanceForm((form) => ({ ...form, notes: e.target.value }))}/></div>
          </div>
          <div className="flex gap-2">
            <button type="button" className="btn-secondary flex-1" onClick={() => setShowQuittanceForm(false)}>Annuler</button>
            <button type="submit" className="btn-primary flex-1" disabled={savingQuittance}>{savingQuittance && <Loader2 size={13} className="animate-spin"/>} Créer la quittance</button>
          </div>
        </form>
      )}

      {quittance && (
        <div>
          <div className="flex items-center gap-3 mb-3">
            <div className={`w-2 h-2 rounded-full flex-shrink-0 ${quittance.status === 'signed' ? 'bg-green-500' : quittance.status === 'sent' ? 'bg-blue-400' : 'bg-gray-300'}`}/>
            <div className="flex-1">
              <p className="text-sm font-medium text-gray-800">{quittance.client_name}</p>
              <p className="text-xs text-gray-400">
                {quittance.status === 'signed'
                  ? `✓ Signée le ${new Date(quittance.signed_at).toLocaleDateString('fr-CA')}`
                  : quittance.status === 'sent' ? 'Envoyée — en attente de signature' : 'Brouillon — non envoyée'}
              </p>
            </div>
            <span className={`badge ${quittance.status === 'signed' ? 'badge-green' : quittance.status === 'sent' ? 'badge-blue' : 'badge-gray'}`}>
              {quittance.status === 'signed' ? 'Signée' : quittance.status === 'sent' ? 'Envoyée' : 'Brouillon'}
            </span>
          </div>
          {quittance.status !== 'signed' && (
            <div className="flex gap-2 flex-wrap">
              <button
                className="btn-secondary text-xs py-1.5"
                onClick={() => {
                  const url = `${FRONTEND_URL}/quittance/${quittance.public_token}`;
                  navigator.clipboard.writeText(url);
                  alert('Lien copié!');
                }}
              >
                <Link2 size={12}/> Copier le lien client
              </button>
              <a href={`${FRONTEND_URL}/quittance/${quittance.public_token}`} target="_blank" rel="noopener noreferrer" className="btn-ghost text-xs py-1.5">
                <ExternalLink size={12}/> Prévisualiser
              </a>
              <a href={pdf.quittanceUrl(quittance.id)} download={`quittance-${quittance.id.slice(0, 8)}.pdf`} className="btn-ghost text-xs py-1.5" title="Télécharger PDF">
                <Download size={12}/> PDF
              </a>
              <a
                href={`https://wa.me/?text=${encodeURIComponent(`Bonjour ${quittance.client_name}, voici votre quittance de fin de travaux à signer : ${FRONTEND_URL}/quittance/${quittance.public_token}`)}`}
                target="_blank"
                rel="noreferrer"
                className="btn-ghost text-xs py-1.5 text-green-600 hover:text-green-700"
                title="Envoyer la quittance par WhatsApp"
              >
                <MessageCircle size={12}/> WhatsApp
              </a>
            </div>
          )}
        </div>
      )}
    </ProjectSection>
  );
}
