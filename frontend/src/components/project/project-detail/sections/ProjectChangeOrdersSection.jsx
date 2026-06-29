import React from 'react';
import { GitBranch, Plus } from 'lucide-react';
import ProjectSection from '../../ProjectSection';

export default function ProjectChangeOrdersSection({
  sectionSummary,
  expanded,
  onToggle,
  sectionGuard,
  setShowExtraForm,
  changeOrdersList,
  money,
}) {
  return (
    <ProjectSection
      sectionId="s-extras"
      icon="⚡"
      title="Demandes de modification"
      summary={sectionSummary?.summary}
      stats={sectionSummary?.stats}
      expanded={expanded}
      onToggle={onToggle}
      background="#FFF7ED"
      borderTop="1px solid #FED7AA"
    >
      {sectionGuard('s-extras')}
      <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: 20 }}>
        <button className="btn-primary text-xs" style={{ background: '#F97316', border: 'none' }} onClick={() => setShowExtraForm(true)}>
          <Plus size={13}/> Nouvelle demande
        </button>
      </div>

      {changeOrdersList.length > 0 ? (
        <div style={{ background: '#fff', borderRadius: 14, border: '1px solid #FED7AA', overflow: 'hidden' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr style={{ background: '#FFF7ED' }}>
                {['N°', 'Titre', 'Montant', 'Statut', 'Date'].map((label, index) => (
                  <th key={index} style={{ padding: '10px 14px', textAlign: 'left', fontSize: 11, fontWeight: 700, color: '#92400E', textTransform: 'uppercase', letterSpacing: '.05em', borderBottom: '1px solid #FED7AA' }}>{label}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {changeOrdersList.map((changeOrder) => {
                const statusColor = { draft:'#9CA3AF', pending_approval:'#F59E0B', approved:'#22C55E', rejected:'#EF4444', completed:'#3B82F6' };
                const statusLabel = { draft:'Brouillon', pending_approval:'En attente', approved:'Approuvé', rejected:'Refusé', completed:'Complété' };
                return (
                  <tr key={changeOrder.id} style={{ borderBottom: '1px solid #FFF7ED' }}>
                    <td style={{ padding: '12px 14px', fontSize: 12, color: '#9CA3AF', fontFamily: 'monospace' }}>#{changeOrder.number || '—'}</td>
                    <td style={{ padding: '12px 14px' }}>
                      <p style={{ margin: 0, fontSize: 13, fontWeight: 600, color: '#15171C' }}>{changeOrder.title}</p>
                      {changeOrder.description && <p style={{ margin: '2px 0 0', fontSize: 11, color: '#9CA3AF' }}>{changeOrder.description}</p>}
                    </td>
                    <td style={{ padding: '12px 14px', fontSize: 13, fontWeight: 700, color: changeOrder.amount > 0 ? '#15171C' : '#9CA3AF' }}>
                      {changeOrder.amount > 0 ? money(changeOrder.amount) : '—'}
                    </td>
                    <td style={{ padding: '12px 14px' }}>
                      <span style={{ fontSize: 11, fontWeight: 700, padding: '3px 10px', borderRadius: 99, background: (statusColor[changeOrder.status] || '#9CA3AF') + '20', color: statusColor[changeOrder.status] || '#9CA3AF', border: `1px solid ${(statusColor[changeOrder.status] || '#9CA3AF')}40` }}>
                        {statusLabel[changeOrder.status] || changeOrder.status}
                      </span>
                    </td>
                    <td style={{ padding: '12px 14px', fontSize: 12, color: '#9CA3AF' }}>
                      {changeOrder.created_at ? new Date(changeOrder.created_at).toLocaleDateString('fr-CA') : '—'}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
          {changeOrdersList.some((changeOrder) => changeOrder.amount > 0) && (
            <div style={{ padding: '10px 14px', background: '#FFFBF5', display: 'flex', justifyContent: 'flex-end', gap: 20 }}>
              <span style={{ fontSize: 12, color: '#92400E' }}>Total extras</span>
              <span style={{ fontSize: 13, fontWeight: 900, color: '#F97316' }}>{money(changeOrdersList.reduce((sum, changeOrder) => sum + Number(changeOrder.amount || 0), 0))}</span>
            </div>
          )}
        </div>
      ) : (
        <div style={{ textAlign: 'center', padding: '28px 0' }}>
          <GitBranch size={28} style={{ color: '#FED7AA', margin: '0 auto 10px' }} />
          <p style={{ fontSize: 13, color: '#9CA3AF', marginBottom: 14 }}>Aucune demande de modification pour ce projet.</p>
          <button className="btn-primary text-xs" style={{ background: '#F97316', border: 'none' }} onClick={() => setShowExtraForm(true)}><Plus size={13}/> Créer la première demande</button>
        </div>
      )}
    </ProjectSection>
  );
}
