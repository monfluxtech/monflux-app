import React from 'react';
import { CheckCircle, Download, Eye, FileText, Loader2, Pencil, Plus, Save, Send, Trash2 } from 'lucide-react';
import ProjectSection from '../../ProjectSection';

const QUOTE_TYPE_LABELS = {
  material: 'Matériaux',
  labor: "Main d'œuvre",
  subcontractor: 'Sous-traitance',
  other: 'Autre',
};

const statusLabel = {
  draft: 'Brouillon',
  sent: 'Envoyée',
  viewed: 'Vue',
  partial: 'Partielle',
  paid: 'Payée',
  overdue: 'En retard',
  cancelled: 'Annulée',
};

const statusColor = {
  draft: '#9CA3AF',
  sent: '#3B82F6',
  viewed: '#F59E0B',
  partial: '#F97316',
  paid: '#22C55E',
  overdue: '#EF4444',
  cancelled: '#9CA3AF',
};

export default function ProjectInvoicesSection({
  sectionSummary,
  expanded,
  onToggle,
  sectionGuard,
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
  removeInvoice,
  updateInvoiceStatus,
  updatingInvoiceId,
  quoteBuilderItems,
  quoteInvoiceSelection,
  setQuoteInvoiceSelection,
  createInvoiceFromQuoteSelection,
}) {
  const quoteGroups = (quoteBuilderItems || []).reduce((acc, item, index) => {
    const type = item.type || 'other';
    if (!acc[type]) acc[type] = [];
    acc[type].push({ ...item, __key: item.id || `${type}-${index}` });
    return acc;
  }, {});

  const manualSubtotal = newInvoiceItems.reduce((sum, item) => sum + ((Number(item.qty) || 0) * (Number(item.unit_price) || 0)), 0);
  const manualTps = manualSubtotal * 0.05;
  const manualTvq = manualSubtotal * 0.09975;

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

      <div className="flex items-center gap-2 flex-wrap mb-4">
        <span className="badge badge-gray text-xs">{projectInvoices.length} facture(s)</span>
        <span className="badge badge-gray text-xs">Total {money(projectInvoices.reduce((sum, invoice) => sum + Number(invoice.total || 0), 0))}</span>
      </div>

      <div style={{ display: 'grid', gap: 16 }}>
        <div style={{ background: '#fff', borderRadius: 16, border: '1px solid #D1FAE5', padding: 18 }}>
          <div style={{ display: 'grid', gridTemplateColumns: '1.2fr 1fr 1fr', gap: 10, marginBottom: 14 }}>
            <input className="input" value={newInvoice.client_name} onChange={(e) => setNewInvoice((form) => ({ ...form, client_name: e.target.value }))} placeholder={project.client_name || 'Nom du client'} />
            <input className="input" type="email" value={newInvoice.client_email} onChange={(e) => setNewInvoice((form) => ({ ...form, client_email: e.target.value }))} placeholder={project.client_email || 'Courriel client'} />
            <input className="input" type="date" value={newInvoice.due_date} onChange={(e) => setNewInvoice((form) => ({ ...form, due_date: e.target.value }))} />
          </div>

          <div style={{ border: '1px solid #E5E7EB', borderRadius: 12, overflow: 'hidden' }}>
            <div style={{ overflowX: 'auto', WebkitOverflowScrolling: 'touch' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', minWidth: 760 }}>
                <colgroup>
                  <col style={{ minWidth: 280 }} />
                  <col style={{ width: 90 }} />
                  <col style={{ width: 140 }} />
                  <col style={{ width: 140 }} />
                  <col style={{ width: 100 }} />
                </colgroup>
                <thead>
                  <tr style={{ background: '#F9FAFB' }}>
                    {['Description', 'Qté', 'Prix unit.', 'Total', 'Actions'].map((label, index) => (
                      <th key={label} style={{ padding: '8px 10px', textAlign: index >= 1 && index <= 3 ? 'right' : 'left', fontSize: 10, fontWeight: 700, color: '#6B7280', textTransform: 'uppercase', letterSpacing: '.05em', borderBottom: '1px solid #E5E7EB' }}>
                        {label}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {newInvoiceItems.map((item, index) => {
                    const lineTotal = (Number(item.qty) || 0) * (Number(item.unit_price) || 0);
                    return (
                      <tr key={`new-invoice-${index}`} style={{ borderBottom: '1px solid #F3F4F6', background: index === 0 ? '#FCFFFC' : '#fff' }}>
                        <td style={{ padding: '6px 8px' }}>
                          <input className="input" value={item.description} onChange={(e) => setNewInvoiceItems((rows) => rows.map((row, rowIndex) => rowIndex === index ? { ...row, description: e.target.value } : row))} placeholder={index === 0 ? 'Première ligne de facture éditable' : 'Description'} />
                        </td>
                        <td style={{ padding: '6px 8px' }}>
                          <input className="input text-right" type="number" min="0" step="1" value={item.qty} onChange={(e) => setNewInvoiceItems((rows) => rows.map((row, rowIndex) => rowIndex === index ? { ...row, qty: e.target.value } : row))} />
                        </td>
                        <td style={{ padding: '6px 8px' }}>
                          <input className="input text-right" type="number" min="0" step="0.01" value={item.unit_price} onChange={(e) => setNewInvoiceItems((rows) => rows.map((row, rowIndex) => rowIndex === index ? { ...row, unit_price: e.target.value } : row))} />
                        </td>
                        <td style={{ padding: '6px 8px', textAlign: 'right', fontSize: 12, fontWeight: 700, color: '#15171C' }}>{lineTotal > 0 ? money(lineTotal) : '—'}</td>
                        <td style={{ padding: '6px 8px', textAlign: 'center' }}>
                          <div className="flex items-center justify-center gap-2">
                            <button type="button" className="btn-ghost p-2 text-green-700 hover:text-green-800" title="Ajouter une ligne" onClick={() => setNewInvoiceItems((rows) => [...rows, { description: '', qty: 1, unit_price: '' }])}>
                              <Plus size={16} />
                            </button>
                            <button type="button" className="btn-ghost p-2 text-gray-400 hover:text-red-500" title="Supprimer la ligne" onClick={() => setNewInvoiceItems((rows) => rows.length > 1 ? rows.filter((_, rowIndex) => rowIndex !== index) : [{ description: '', qty: 1, unit_price: '' }])}>
                              <Trash2 size={14} />
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>

          <div style={{ display: 'flex', justifyContent: 'space-between', gap: 12, marginTop: 14, flexWrap: 'wrap' }}>
            <div style={{ display: 'grid', gap: 2, fontSize: 12, color: '#6B7280' }}>
              <span>Sous-total : <strong style={{ color: '#15171C' }}>{money(manualSubtotal)}</strong></span>
              <span>TPS : <strong style={{ color: '#15171C' }}>{money(manualTps)}</strong></span>
              <span>TVQ : <strong style={{ color: '#15171C' }}>{money(manualTvq)}</strong></span>
              <span>Total : <strong style={{ color: BRAND }}>{money(manualSubtotal + manualTps + manualTvq)}</strong></span>
            </div>
            <button type="button" className="btn-primary text-xs" onClick={createInvoiceInline} disabled={savingInvoice}>
              {savingInvoice ? <Loader2 size={13} className="animate-spin" /> : <FileText size={13} />} Créer la facture manuelle
            </button>
          </div>
        </div>

        {(quoteBuilderItems || []).length > 0 && (
          <div style={{ background: '#fff', borderRadius: 16, border: '1px solid #D1FAE5', padding: 18 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', gap: 12, alignItems: 'center', marginBottom: 12, flexWrap: 'wrap' }}>
              <div>
                <p style={{ margin: 0, fontSize: 15, fontWeight: 800, color: '#15171C' }}>Créer depuis le devis</p>
                <p style={{ margin: '4px 0 0', fontSize: 12, color: '#6B7280' }}>Facture complète ou partielle avec cases à cocher.</p>
              </div>
              <div className="flex items-center gap-2">
                <button type="button" className="btn-secondary text-xs" onClick={() => setQuoteInvoiceSelection((quoteBuilderItems || []).map((item, index) => item.id || `${item.type || 'other'}-${index}`))}>Tout sélectionner</button>
                <button type="button" className="btn-secondary text-xs" onClick={() => setQuoteInvoiceSelection([])}>Tout vider</button>
              </div>
            </div>

            <div style={{ display: 'grid', gap: 12 }}>
              {Object.entries(quoteGroups).map(([type, items]) => (
                <div key={type} style={{ border: '1px solid #E5E7EB', borderRadius: 12, overflow: 'hidden' }}>
                  <div style={{ padding: '8px 12px', background: '#F9FAFB', fontSize: 11, fontWeight: 800, color: '#6B7280', textTransform: 'uppercase', letterSpacing: '.05em' }}>
                    {QUOTE_TYPE_LABELS[type] || 'Autre'}
                  </div>
                  <div style={{ display: 'grid' }}>
                    {items.map((item) => {
                      const lineTotal = (Number(item.qty) || 0) * (Number(item.unit_price) || 0);
                      const checked = quoteInvoiceSelection.includes(item.__key);
                      return (
                        <label key={item.__key} style={{ display: 'grid', gridTemplateColumns: '22px 1fr auto', gap: 10, alignItems: 'center', padding: '10px 12px', borderTop: '1px solid #F3F4F6', cursor: 'pointer' }}>
                          <input
                            type="checkbox"
                            checked={checked}
                            onChange={(e) => setQuoteInvoiceSelection((prev) => e.target.checked ? [...prev, item.__key] : prev.filter((key) => key !== item.__key))}
                            style={{ accentColor: BRAND }}
                          />
                          <div>
                            <p style={{ margin: 0, fontSize: 13, fontWeight: 600, color: '#15171C' }}>{item.name || item.description || 'Poste'}</p>
                            <p style={{ margin: '2px 0 0', fontSize: 11, color: '#9CA3AF' }}>{Number(item.qty) || 1} × {money(Number(item.unit_price) || 0)}</p>
                          </div>
                          <strong style={{ fontSize: 12, color: '#15171C' }}>{money(lineTotal)}</strong>
                        </label>
                      );
                    })}
                  </div>
                </div>
              ))}
            </div>

            <div className="flex items-center justify-end gap-2 flex-wrap mt-4">
              <button type="button" className="btn-secondary text-xs" onClick={() => createInvoiceFromQuoteSelection()} disabled={savingInvoice}>
                Créer facture complète
              </button>
              <button type="button" className="btn-primary text-xs" onClick={() => createInvoiceFromQuoteSelection(quoteInvoiceSelection)} disabled={savingInvoice || !quoteInvoiceSelection.length}>
                {savingInvoice ? <Loader2 size={13} className="animate-spin" /> : <FileText size={13} />} Facturer la sélection
              </button>
            </div>
          </div>
        )}

        {projectInvoices.length > 0 ? (
          <div style={{ background: '#fff', borderRadius: 14, border: '1px solid #D1FAE5', overflow: 'hidden' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead>
                <tr style={{ background: '#F0FDF4' }}>
                  {['N°', 'Client', 'Échéance', 'Total', 'Statut', 'Actions'].map((label) => (
                    <th key={label} style={{ padding: '10px 14px', textAlign: 'left', fontSize: 11, fontWeight: 700, color: '#6B7280', textTransform: 'uppercase', letterSpacing: '.05em', borderBottom: '1px solid #D1FAE5' }}>{label}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {projectInvoices.map((invoice) => {
                  const overdue = invoice.status === 'overdue' || (invoice.due_date && new Date(invoice.due_date) < new Date() && !['paid', 'cancelled'].includes(invoice.status));
                  const isSending = sendingInvoiceId === invoice.id;
                  const justSent = invoiceSentId === invoice.id;
                  const isExpanded = expandedInvoiceId === invoice.id;
                  const isLoading = loadingInvoiceId === invoice.id;
                  const isUpdatingStatus = updatingInvoiceId === invoice.id;
                  const draft = invoiceDrafts[invoice.id];
                  const draftItems = draft?.items || [];
                  const subTotal = draftItems.reduce((sum, item) => sum + (Number(item.qty) || 0) * (Number(item.unit_price) || 0), 0);
                  const tps = subTotal * 0.05;
                  const tvq = subTotal * 0.09975;
                  const total = subTotal + tps + tvq;

                  return (
                    <React.Fragment key={invoice.id}>
                      <tr style={{ borderBottom: isExpanded ? 'none' : '1px solid #F0FDF4', background: isExpanded ? '#FCFFFC' : '#fff' }}>
                        <td style={{ padding: '12px 14px', fontSize: 12, color: '#9CA3AF', fontFamily: 'monospace' }}>#{invoice.number}</td>
                        <td style={{ padding: '12px 14px', fontSize: 12, color: '#6B7280' }}>{invoice.client_name || '—'}</td>
                        <td style={{ padding: '12px 14px', fontSize: 12, color: overdue ? '#EF4444' : '#6B7280', fontWeight: overdue ? 700 : 400 }}>{invoice.due_date ? new Date(invoice.due_date).toLocaleDateString('fr-CA') : '—'}</td>
                        <td style={{ padding: '12px 14px', fontSize: 13, fontWeight: 700, color: '#15171C' }}>{money(invoice.total || 0)}</td>
                        <td style={{ padding: '12px 14px' }}>
                          <select className="input" value={invoice.status || 'draft'} onChange={(e) => updateInvoiceStatus(invoice, e.target.value)} disabled={isUpdatingStatus}>
                            {Object.entries(statusLabel).map(([value, label]) => <option key={value} value={value}>{label}</option>)}
                          </select>
                        </td>
                        <td style={{ padding: '12px 14px' }}>
                          <div style={{ display: 'flex', gap: 6, alignItems: 'center', justifyContent: 'flex-end', flexWrap: 'wrap' }}>
                            <button className="btn-ghost p-1 text-gray-300 hover:text-brand" title="Éditer" onClick={() => toggleInvoiceEditor(invoice)}>{isExpanded ? <Eye size={13} /> : <Pencil size={13} />}</button>
                            <button className="btn-ghost p-1 text-gray-300 hover:text-brand" title="Prévisualiser" onClick={() => setPreview({ url: pdf.invoiceUrl(invoice.id), title: `Facture ${invoice.number}` })}><Eye size={13} /></button>
                            <a href={pdf.invoiceUrl(invoice.id)} download={`facture-${invoice.number || invoice.id}.pdf`} className="btn-ghost p-1 text-gray-300 hover:text-brand" title="Télécharger PDF" style={{ display: 'flex', alignItems: 'center', textDecoration: 'none' }}><Download size={13} /></a>
                            {justSent ? (
                              <span style={{ fontSize: 11, color: '#22C55E', fontWeight: 700, display: 'flex', alignItems: 'center', gap: 3 }}><CheckCircle size={12} /> Envoyée</span>
                            ) : (
                              <button className="btn-ghost p-1" title={`Envoyer à ${invoice.client_email || project.client_email || 'client'}`} onClick={() => sendInvoiceEmail(invoice)} disabled={isSending} style={{ color: '#3B82F6' }}>
                                {isSending ? <Loader2 size={13} className="animate-spin" /> : <Send size={13} />}
                              </button>
                            )}
                            <button className="btn-ghost p-1 text-gray-300 hover:text-red-500" title="Supprimer" onClick={() => removeInvoice(invoice.id)}><Trash2 size={13} /></button>
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
                                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 180px', gap: 10 }}>
                                  <input className="input" value={draft.client_name} onChange={(e) => updateInvoiceDraftField(invoice.id, 'client_name', e.target.value)} placeholder="Nom du client" />
                                  <input className="input" value={draft.client_email} onChange={(e) => updateInvoiceDraftField(invoice.id, 'client_email', e.target.value)} placeholder="Courriel client" />
                                  <input className="input" type="date" value={draft.due_date} onChange={(e) => updateInvoiceDraftField(invoice.id, 'due_date', e.target.value)} />
                                </div>

                                <div style={{ border: '1px solid #E5E7EB', borderRadius: 12, overflow: 'hidden' }}>
                                  <div style={{ overflowX: 'auto', WebkitOverflowScrolling: 'touch' }}>
                                    <table style={{ width: '100%', borderCollapse: 'collapse', minWidth: 760 }}>
                                      <thead>
                                        <tr style={{ background: '#F9FAFB' }}>
                                          {['Description', 'Qté', 'Prix unit.', 'Total', 'Actions'].map((label, index) => (
                                            <th key={label} style={{ padding: '8px 10px', textAlign: index >= 1 && index <= 3 ? 'right' : 'left', fontSize: 10, fontWeight: 700, color: '#6B7280', textTransform: 'uppercase', letterSpacing: '.05em', borderBottom: '1px solid #E5E7EB' }}>{label}</th>
                                          ))}
                                        </tr>
                                      </thead>
                                      <tbody>
                                        {draftItems.map((item, index) => {
                                          const lineTotal = (Number(item.qty) || 0) * (Number(item.unit_price) || 0);
                                          return (
                                            <tr key={`${invoice.id}-${index}`} style={{ borderBottom: '1px solid #F3F4F6' }}>
                                              <td style={{ padding: '6px 8px' }}>
                                                <input className="input" value={item.description} onChange={(e) => updateInvoiceDraftItem(invoice.id, index, 'description', e.target.value)} placeholder="Ligne de facture" />
                                              </td>
                                              <td style={{ padding: '6px 8px' }}>
                                                <input className="input text-right" type="number" min="0" step="1" value={item.qty} onChange={(e) => updateInvoiceDraftItem(invoice.id, index, 'qty', e.target.value)} />
                                              </td>
                                              <td style={{ padding: '6px 8px' }}>
                                                <input className="input text-right" type="number" min="0" step="0.01" value={item.unit_price} onChange={(e) => updateInvoiceDraftItem(invoice.id, index, 'unit_price', e.target.value)} />
                                              </td>
                                              <td style={{ padding: '6px 8px', textAlign: 'right', fontSize: 12, fontWeight: 700, color: '#15171C' }}>{lineTotal > 0 ? money(lineTotal) : '—'}</td>
                                              <td style={{ padding: '6px 8px', textAlign: 'center' }}>
                                                <div className="flex items-center justify-center gap-2">
                                                  <button type="button" className="btn-ghost p-2 text-green-700 hover:text-green-800" title="Ajouter une ligne" onClick={() => addInvoiceDraftItem(invoice.id)}>
                                                    <Plus size={16} />
                                                  </button>
                                                  <button type="button" className="btn-ghost p-2 text-gray-400 hover:text-red-500" title="Supprimer la ligne" onClick={() => removeInvoiceDraftItem(invoice.id, index)}>
                                                    <Trash2 size={14} />
                                                  </button>
                                                </div>
                                              </td>
                                            </tr>
                                          );
                                        })}
                                      </tbody>
                                    </table>
                                  </div>
                                </div>

                                <div style={{ display: 'flex', justifyContent: 'space-between', gap: 12, flexWrap: 'wrap' }}>
                                  <div style={{ display: 'grid', gap: 2, fontSize: 12, color: '#6B7280' }}>
                                    <span>Sous-total : <strong style={{ color: '#15171C' }}>{money(subTotal)}</strong></span>
                                    <span>TPS : <strong style={{ color: '#15171C' }}>{money(tps)}</strong></span>
                                    <span>TVQ : <strong style={{ color: '#15171C' }}>{money(tvq)}</strong></span>
                                    <span>Total : <strong style={{ color: BRAND }}>{money(total)}</strong></span>
                                  </div>
                                  <div className="flex items-center gap-2 flex-wrap">
                                    <button className="btn-secondary text-xs" onClick={() => setPreview({ url: pdf.invoiceUrl(invoice.id), title: `Facture ${invoice.number}` })}><Eye size={13} /> Prévisualiser</button>
                                    <button className="btn-primary text-xs" onClick={() => saveInvoiceDraft(invoice.id)} disabled={savingInvoiceId === invoice.id}>
                                      {savingInvoiceId === invoice.id ? <Loader2 size={13} className="animate-spin" /> : <Save size={13} />} Enregistrer
                                    </button>
                                  </div>
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
          </div>
        ) : (
          <div style={{ textAlign: 'center', padding: '26px 0', color: '#9CA3AF', fontSize: 13 }}>
            Aucune facture client pour ce projet.
          </div>
        )}
      </div>
    </ProjectSection>
  );
}
