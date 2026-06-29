import React from 'react';
import { CheckCircle, Download, Eye, EyeOff, FileText, Loader2, Pencil, Plus, Save, Send, X } from 'lucide-react';
import ProjectSection from '../../ProjectSection';

export default function ProjectInvoicesSection({
  sectionSummary,
  expanded,
  onToggle,
  sectionGuard,
  setShowNewInvoice,
  showNewInvoice,
  createInvoiceInline,
  newInvoice,
  setNewInvoice,
  project,
  newInvoiceItems,
  setNewInvoiceItems,
  money,
  BRAND,
  savingInvoice,
  projectInvoices,
  sendingInvoiceId,
  invoiceSentId,
  expandedInvoiceId,
  loadingInvoiceId,
  invoiceDrafts,
  invoiceDetails,
  toggleInvoiceEditor,
  pdf,
  sendInvoiceEmail,
  setPreview,
  updateInvoiceDraftField,
  updateInvoiceDraftItem,
  removeInvoiceDraftItem,
  addInvoiceDraftItem,
  saveInvoiceDraft,
  savingInvoiceId,
}) {
  return (
    <ProjectSection
      sectionId="s-invoices"
      icon="🧾"
      title="Factures client"
      summary={sectionSummary?.summary}
      stats={sectionSummary?.stats}
      expanded={expanded}
      onToggle={onToggle}
      background="#E9F3EC"
    >
      {sectionGuard('s-invoices')}
      <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: 20 }}>
        <button className="btn-primary text-xs" onClick={() => setShowNewInvoice((value) => !value)}>
          <Plus size={13}/> Nouvelle facture
        </button>
      </div>

      {showNewInvoice && (
        <form onSubmit={createInvoiceInline} style={{ background: '#fff', borderRadius: 16, border: '1px solid #D1FAE5', padding: 24, marginBottom: 24 }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 }}>
            <h3 style={{ margin: 0, fontSize: 16, fontWeight: 800, color: '#15171C' }}>Nouvelle facture</h3>
            <button type="button" style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#9CA3AF' }} onClick={() => setShowNewInvoice(false)}><X size={16}/></button>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px 16px', marginBottom: 16 }}>
            <div><label className="label">Titre (optionnel)</label><input className="input" value={newInvoice.title} onChange={(e) => setNewInvoice((form) => ({ ...form, title: e.target.value }))} placeholder="Ex : Acompte 50%" /></div>
            <div><label className="label">Date d'échéance</label><input className="input" type="date" value={newInvoice.due_date} onChange={(e) => setNewInvoice((form) => ({ ...form, due_date: e.target.value }))} /></div>
            <div><label className="label">Nom client</label><input className="input" value={newInvoice.client_name} onChange={(e) => setNewInvoice((form) => ({ ...form, client_name: e.target.value }))} placeholder={project.client_name || 'Client'} /></div>
            <div><label className="label">Courriel client</label><input className="input" type="email" value={newInvoice.client_email} onChange={(e) => setNewInvoice((form) => ({ ...form, client_email: e.target.value }))} placeholder={project.client_email || ''} /></div>
          </div>

          <div style={{ marginBottom: 12 }}>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 60px 110px 32px', gap: 6, marginBottom: 6 }}>
              <span className="label" style={{ margin: 0 }}>Description</span>
              <span className="label" style={{ margin: 0 }}>Qté</span>
              <span className="label" style={{ margin: 0 }}>Prix unitaire</span>
              <span/>
            </div>
            {newInvoiceItems.map((item, index) => {
              const lineTotal = (Number(item.qty) || 0) * (Number(item.unit_price) || 0);
              return (
                <div key={index} style={{ display: 'grid', gridTemplateColumns: '1fr 60px 110px 32px', gap: 6, marginBottom: 6, alignItems: 'center' }}>
                  <input className="input" value={item.description} onChange={(e) => setNewInvoiceItems((items) => items.map((currentItem, currentIndex) => currentIndex === index ? { ...currentItem, description: e.target.value } : currentItem))} placeholder="Travaux, matériaux..." required />
                  <input className="input" type="number" min="0" step="1" value={item.qty} onChange={(e) => setNewInvoiceItems((items) => items.map((currentItem, currentIndex) => currentIndex === index ? { ...currentItem, qty: e.target.value } : currentItem))} />
                  <input className="input" type="number" min="0" step="0.01" value={item.unit_price} onChange={(e) => setNewInvoiceItems((items) => items.map((currentItem, currentIndex) => currentIndex === index ? { ...currentItem, unit_price: e.target.value } : currentItem))} placeholder="0.00" required />
                  <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                    {lineTotal > 0 && <span style={{ fontSize: 10, color: '#6B7280', whiteSpace: 'nowrap' }}>{money(lineTotal)}</span>}
                    {newInvoiceItems.length > 1 && <button type="button" style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#EF4444', padding: 2 }} onClick={() => setNewInvoiceItems((items) => items.filter((_, currentIndex) => currentIndex !== index))}><X size={12}/></button>}
                  </div>
                </div>
              );
            })}
            <button type="button" className="btn-ghost text-xs mt-1" onClick={() => setNewInvoiceItems((items) => [...items, { description: '', qty: 1, unit_price: '' }])}>
              <Plus size={12}/> Ajouter une ligne
            </button>
          </div>

          {(() => {
            const subTotal = newInvoiceItems.reduce((acc, item) => acc + (Number(item.qty) || 0) * (Number(item.unit_price) || 0), 0);
            const tps = subTotal * 0.05;
            const tvq = subTotal * 0.09975;
            return subTotal > 0 ? (
              <div style={{ background: '#F0FDF4', borderRadius: 10, padding: '10px 14px', marginBottom: 16, display: 'flex', flexDirection: 'column', gap: 4, alignItems: 'flex-end' }}>
                <div style={{ display: 'flex', gap: 24 }}>
                  <span style={{ fontSize: 12, color: '#6B7280' }}>Sous-total</span>
                  <span style={{ fontSize: 12, fontWeight: 700, color: '#15171C' }}>{money(subTotal)}</span>
                </div>
                <div style={{ display: 'flex', gap: 24 }}>
                  <span style={{ fontSize: 12, color: '#6B7280' }}>TPS (5%)</span>
                  <span style={{ fontSize: 12, color: '#6B7280' }}>{money(tps)}</span>
                </div>
                <div style={{ display: 'flex', gap: 24 }}>
                  <span style={{ fontSize: 12, color: '#6B7280' }}>TVQ (9,975%)</span>
                  <span style={{ fontSize: 12, color: '#6B7280' }}>{money(tvq)}</span>
                </div>
                <div style={{ display: 'flex', gap: 24, borderTop: '1px solid #D1FAE5', paddingTop: 6, marginTop: 2 }}>
                  <span style={{ fontSize: 14, fontWeight: 800, color: '#15171C' }}>Total</span>
                  <span style={{ fontSize: 14, fontWeight: 900, color: BRAND }}>{money(subTotal + tps + tvq)}</span>
                </div>
              </div>
            ) : null;
          })()}

          <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end' }}>
            <button type="button" className="btn-secondary text-xs" onClick={() => setShowNewInvoice(false)}>Annuler</button>
            <button type="submit" className="btn-primary text-xs" disabled={savingInvoice}>
              {savingInvoice ? <Loader2 size={13} className="animate-spin"/> : <FileText size={13}/>} Créer la facture
            </button>
          </div>
        </form>
      )}

      {projectInvoices.length > 0 ? (
        <div style={{ background: '#fff', borderRadius: 14, border: '1px solid #D1FAE5', overflow: 'hidden' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr style={{ background: '#F0FDF4' }}>
                {['N°', 'Client', 'Échéance', 'Total', 'Statut', 'Actions'].map((label, index) => (
                  <th key={index} style={{ padding: '10px 14px', textAlign: 'left', fontSize: 11, fontWeight: 700, color: '#6B7280', textTransform: 'uppercase', letterSpacing: '.05em', borderBottom: '1px solid #D1FAE5' }}>{label}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {projectInvoices.map((invoice) => {
                const statusBorder = { draft:'#9CA3AF', sent:'#3B82F6', viewed:'#F59E0B', partial:'#F97316', paid:'#22C55E', overdue:'#EF4444', cancelled:'#9CA3AF' };
                const statusLabel = { draft:'Brouillon', sent:'Envoyée', viewed:'Vue', partial:'Partielle', paid:'Payée', overdue:'En retard', cancelled:'Annulée' };
                const overdue = invoice.status === 'overdue' || (invoice.due_date && new Date(invoice.due_date) < new Date() && !['paid', 'cancelled'].includes(invoice.status));
                const isSending = sendingInvoiceId === invoice.id;
                const justSent = invoiceSentId === invoice.id;
                const isExpanded = expandedInvoiceId === invoice.id;
                const isLoading = loadingInvoiceId === invoice.id;
                const draft = invoiceDrafts[invoice.id];
                const draftItems = draft?.items || [];
                const subTotal = draftItems.reduce((sum, item) => sum + (Number(item.qty) || 0) * (Number(item.unit_price) || 0), 0);
                const tps = subTotal * 0.05;
                const tvq = subTotal * 0.09975;
                const total = subTotal + tps + tvq;

                return (
                  <React.Fragment key={invoice.id}>
                    <tr style={{ borderBottom: isExpanded ? 'none' : '1px solid #F0FDF4', background: isExpanded ? '#FCFFFC' : 'white' }}>
                      <td style={{ padding: '12px 14px', fontSize: 12, color: '#9CA3AF', fontFamily: 'monospace' }}>#{invoice.number}</td>
                      <td style={{ padding: '12px 14px', fontSize: 12, color: '#6B7280' }}>{invoice.client_name || '—'}</td>
                      <td style={{ padding: '12px 14px', fontSize: 12, color: overdue ? '#EF4444' : '#6B7280', fontWeight: overdue ? 700 : 400 }}>
                        {invoice.due_date ? new Date(invoice.due_date).toLocaleDateString('fr-CA') : '—'}
                      </td>
                      <td style={{ padding: '12px 14px', fontSize: 13, fontWeight: 700, color: '#15171C' }}>{money(invoice.total || 0)}</td>
                      <td style={{ padding: '12px 14px' }}>
                        <span style={{ fontSize: 11, fontWeight: 700, padding: '3px 8px', borderRadius: 99, border: `1px solid ${(statusBorder[invoice.status] || '#9CA3AF')}60`, background: (statusBorder[invoice.status] || '#9CA3AF') + '15', color: statusBorder[invoice.status] || '#9CA3AF' }}>
                          {statusLabel[invoice.status] || invoice.status}
                        </span>
                      </td>
                      <td style={{ padding: '12px 14px' }}>
                        <div style={{ display: 'flex', gap: 6, alignItems: 'center', justifyContent: 'flex-end', flexWrap: 'wrap' }}>
                          <button className="btn-ghost p-1 text-gray-300 hover:text-brand" title="Éditer" onClick={() => toggleInvoiceEditor(invoice)}>{isExpanded ? <EyeOff size={13}/> : <Pencil size={13}/>}</button>
                          <a href={pdf.invoiceUrl(invoice.id)} download={`facture-${invoice.number || invoice.id}.pdf`} className="btn-ghost p-1 text-gray-300 hover:text-brand" title="Générer PDF" style={{ display: 'flex', alignItems: 'center', textDecoration: 'none' }}><Download size={13}/></a>
                          {justSent ? (
                            <span style={{ fontSize: 11, color: '#22C55E', fontWeight: 700, display: 'flex', alignItems: 'center', gap: 3 }}><CheckCircle size={12}/> Envoyée</span>
                          ) : (
                            <button className="btn-ghost p-1" title={`Envoyer à ${invoice.client_email || project.client_email || 'client'}`} onClick={() => sendInvoiceEmail(invoice)} disabled={isSending} style={{ color: '#3B82F6' }}>
                              {isSending ? <Loader2 size={13} className="animate-spin"/> : <Send size={13}/>}
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                    {isExpanded && (
                      <tr style={{ borderBottom: '1px solid #D1FAE5', background: '#FCFFFC' }}>
                        <td colSpan={6} style={{ padding: 16 }}>
                          {isLoading || !draft ? (
                            <div className="flex items-center gap-2 text-gray-400 text-sm"><Loader2 size={14} className="animate-spin" /> Chargement…</div>
                          ) : (
                            <div style={{ display: 'grid', gap: 16 }}>
                              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12, flexWrap: 'wrap' }}>
                                <div>
                                  <p style={{ margin: 0, fontSize: 18, fontWeight: 800, color: '#15171C' }}>Facture {invoice.number}</p>
                                  <p style={{ margin: '4px 0 0', fontSize: 12, color: '#6B7280' }}>Édition directe des lignes, comme dans le devis.</p>
                                </div>
                                <div style={{ display: 'flex', gap: 8, alignItems: 'center', flexWrap: 'wrap' }}>
                                  <button className="btn-secondary text-xs" onClick={() => setPreview({ url: pdf.invoiceUrl(invoice.id), title: `Facture ${invoice.number}` })}><Eye size={13}/> Prévisualiser</button>
                                  <a href={pdf.invoiceUrl(invoice.id)} target="_blank" rel="noreferrer" className="btn-secondary text-xs" style={{ textDecoration: 'none' }}><Download size={13}/> Générer le PDF</a>
                                  <button className="btn-primary text-xs" onClick={() => saveInvoiceDraft(invoice.id)} disabled={savingInvoiceId === invoice.id}>
                                    {savingInvoiceId === invoice.id ? <Loader2 size={13} className="animate-spin"/> : <Save size={13}/>} Enregistrer
                                  </button>
                                </div>
                              </div>

                              <div style={{ border: '1px solid #E5E7EB', borderRadius: 10, overflow: 'hidden' }}>
                                <div style={{ overflowX: 'auto', WebkitOverflowScrolling: 'touch' }}>
                                  <table style={{ width: '100%', borderCollapse: 'collapse', minWidth: 980 }}>
                                    <colgroup>
                                      <col style={{ width: 180 }}/>
                                      <col style={{ minWidth: 220 }}/>
                                      <col style={{ width: 170 }}/>
                                      <col style={{ width: 140 }}/>
                                      <col style={{ minWidth: 280 }}/>
                                      <col style={{ width: 90 }}/>
                                      <col style={{ width: 130 }}/>
                                      <col style={{ width: 130 }}/>
                                      <col style={{ width: 70 }}/>
                                    </colgroup>
                                    <thead>
                                      <tr style={{ background: '#F9FAFB' }}>
                                        {['Client', 'Courriel', 'Échéance', 'Statut', 'Description', 'Qté', 'Prix unit.', 'Total', ''].map((label, index) => (
                                          <th key={label} style={{ padding: '8px 10px', fontSize: 10, fontWeight: 700, color: '#6B7280', textTransform: 'uppercase', letterSpacing: '.05em', borderBottom: '2px solid #E5E7EB', textAlign: index >= 5 && index <= 7 ? 'right' : 'left' }}>{label}</th>
                                        ))}
                                      </tr>
                                    </thead>
                                    <tbody>
                                      <tr style={{ background: '#FCFFFC', borderBottom: '2px solid #E5E7EB' }}>
                                        <td style={{ padding: '6px 8px' }}>
                                          <input className="input" value={draft.client_name} onChange={(e) => updateInvoiceDraftField(invoice.id, 'client_name', e.target.value)} />
                                        </td>
                                        <td style={{ padding: '6px 8px' }}>
                                          <input className="input" value={draft.client_email} onChange={(e) => updateInvoiceDraftField(invoice.id, 'client_email', e.target.value)} />
                                        </td>
                                        <td style={{ padding: '6px 8px' }}>
                                          <input className="input" type="date" value={draft.due_date} onChange={(e) => updateInvoiceDraftField(invoice.id, 'due_date', e.target.value)} />
                                        </td>
                                        <td style={{ padding: '6px 8px' }}>
                                          <select className="input" value={draft.status} onChange={(e) => updateInvoiceDraftField(invoice.id, 'status', e.target.value)}>
                                            {Object.entries(statusLabel).map(([value, label]) => <option key={value} value={value}>{label}</option>)}
                                          </select>
                                        </td>
                                        <td colSpan={5} style={{ padding: '8px 10px', fontSize: 12, color: '#6B7280' }}>
                                          En-tête de facture
                                        </td>
                                      </tr>
                                      {draftItems.map((item, index) => {
                                        const lineTotal = (Number(item.qty) || 0) * (Number(item.unit_price) || 0);
                                        return (
                                          <tr key={`${invoice.id}-${index}`} style={{ borderBottom: '1px solid #F3F4F6' }}>
                                            <td style={{ padding: '6px 8px', background: '#FAFAFA' }} />
                                            <td style={{ padding: '6px 8px', background: '#FAFAFA' }} />
                                            <td style={{ padding: '6px 8px', background: '#FAFAFA' }} />
                                            <td style={{ padding: '6px 8px', background: '#FAFAFA' }} />
                                            <td style={{ padding: '6px 8px' }}>
                                              <input className="input" value={item.description} onChange={(e) => updateInvoiceDraftItem(invoice.id, index, 'description', e.target.value)} placeholder="Travaux, matériaux…" />
                                            </td>
                                            <td style={{ padding: '6px 8px' }}>
                                              <input className="input text-right" type="number" min="0" step="1" value={item.qty} onChange={(e) => updateInvoiceDraftItem(invoice.id, index, 'qty', e.target.value)} />
                                            </td>
                                            <td style={{ padding: '6px 8px' }}>
                                              <input className="input text-right" type="number" min="0" step="0.01" value={item.unit_price} onChange={(e) => updateInvoiceDraftItem(invoice.id, index, 'unit_price', e.target.value)} />
                                            </td>
                                            <td style={{ padding: '6px 8px', textAlign: 'right', fontSize: 12, fontWeight: 700, color: '#15171C', whiteSpace: 'nowrap' }}>{money(lineTotal)}</td>
                                            <td style={{ padding: '6px 8px', textAlign: 'center' }}>
                                              <button onClick={() => removeInvoiceDraftItem(invoice.id, index)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#D1D5DB', fontSize: 16, lineHeight: 1 }}>×</button>
                                            </td>
                                          </tr>
                                        );
                                      })}
                                      <tr style={{ background: '#FAFAFA' }}>
                                        <td colSpan={9} style={{ padding: '8px 10px' }}>
                                          <button type="button" className="btn-ghost text-xs" onClick={() => addInvoiceDraftItem(invoice.id)}><Plus size={12}/> Ajouter une ligne</button>
                                        </td>
                                      </tr>
                                    </tbody>
                                  </table>
                                </div>
                              </div>

                              <div style={{ background: '#F0FDF4', borderRadius: 10, padding: '10px 14px', display: 'flex', flexDirection: 'column', gap: 4, alignItems: 'flex-end' }}>
                                <div style={{ display: 'flex', gap: 24 }}><span style={{ fontSize: 12, color: '#6B7280' }}>Sous-total</span><span style={{ fontSize: 12, fontWeight: 700, color: '#15171C' }}>{money(subTotal)}</span></div>
                                <div style={{ display: 'flex', gap: 24 }}><span style={{ fontSize: 12, color: '#6B7280' }}>TPS (5%)</span><span style={{ fontSize: 12, color: '#6B7280' }}>{money(tps)}</span></div>
                                <div style={{ display: 'flex', gap: 24 }}><span style={{ fontSize: 12, color: '#6B7280' }}>TVQ (9,975%)</span><span style={{ fontSize: 12, color: '#6B7280' }}>{money(tvq)}</span></div>
                                <div style={{ display: 'flex', gap: 24, borderTop: '1px solid #D1FAE5', paddingTop: 6, marginTop: 2 }}><span style={{ fontSize: 14, fontWeight: 800, color: '#15171C' }}>Total</span><span style={{ fontSize: 14, fontWeight: 900, color: BRAND }}>{money(total)}</span></div>
                              </div>
                            </div>
                          )}
                        </td>
                      </tr>
                    )}
                  </React.Fragment>
                );
              })}
            </tbody>
          </table>
          <div style={{ padding: '10px 14px', background: '#F9FFF9', display: 'flex', justifyContent: 'flex-end', gap: 20 }}>
            <span style={{ fontSize: 12, color: '#6B7280' }}>Total facturé</span>
            <span style={{ fontSize: 13, fontWeight: 900, color: '#15171C' }}>{money(projectInvoices.reduce((sum, invoice) => sum + Number(invoice.total || 0), 0))}</span>
          </div>
        </div>
      ) : !showNewInvoice && (
        <div style={{ textAlign: 'center', padding: '32px 0' }}>
          <FileText size={32} style={{ color: '#D1FAE5', margin: '0 auto 12px' }} />
          <p style={{ fontSize: 14, color: '#9CA3AF', marginBottom: 16 }}>Aucune facture pour ce projet.</p>
          <button className="btn-primary text-xs" onClick={() => setShowNewInvoice(true)}><Plus size={13}/> Créer la première facture</button>
        </div>
      )}
    </ProjectSection>
  );
}
