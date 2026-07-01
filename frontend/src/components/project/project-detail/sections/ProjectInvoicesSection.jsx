import React, { useState } from 'react';
import { CheckCircle, Download, Eye, EyeOff, FileText, Loader2, Pencil, Plus, Save, Send, Trash2 } from 'lucide-react';
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

export default function ProjectInvoicesSection({
  sectionSummary,
  expanded,
  onToggle,
  sectionGuard,
  project,
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
  showNewInvoice,
  setShowNewInvoice,
  commitNewRow,
  salesLocked,
  invoicedDescriptions,
  describeQuoteItem,
  invoiceCategoryNotes,
  setInvoiceCategoryNotes,
}) {
  const [manualRow, setManualRow] = useState({});

  const quoteGroups = (quoteBuilderItems || []).reduce((acc, item, index) => {
    const type = item.type || 'other';
    if (!acc[type]) acc[type] = [];
    acc[type].push({ ...item, __key: item.id || `${type}-${index}` });
    return acc;
  }, {});

  const invoicedSet = new Set(invoicedDescriptions || []);
  const isAlreadyInvoiced = (item) => describeQuoteItem && invoicedSet.has(describeQuoteItem(item));

  const commitInvoiceDraft = (invoiceId) => {
    if (savingInvoiceId === invoiceId) return;
    saveInvoiceDraft(invoiceId);
  };

  const isCategoryFullySelected = (type) => {
    const keys = (quoteGroups[type] || []).map((item) => item.__key);
    return keys.length > 0 && keys.every((key) => quoteInvoiceSelection.includes(key));
  };

  const toggleCategorySelection = (type) => {
    const keys = (quoteGroups[type] || []).map((item) => item.__key);
    const allSelected = keys.length > 0 && keys.every((key) => quoteInvoiceSelection.includes(key));
    setQuoteInvoiceSelection((prev) => (
      allSelected ? prev.filter((key) => !keys.includes(key)) : [...new Set([...prev, ...keys])]
    ));
  };

  const commitManualRow = (type) => {
    const draft = manualRow[type];
    if (!draft || !String(draft.name || '').trim()) return;
    const newKey = `${type}-${(quoteBuilderItems || []).length}`;
    commitNewRow(type, draft);
    setQuoteInvoiceSelection((prev) => [...prev, newKey]);
    setManualRow((m) => ({ ...m, [type]: {} }));
  };

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
        <button
          type="button"
          className="btn-primary text-xs"
          style={{ marginLeft: 'auto' }}
          onClick={() => setShowNewInvoice((v) => !v)}
        >
          <Plus size={13} /> {showNewInvoice ? 'Annuler' : 'Créer une facture'}
        </button>
      </div>

      <div style={{ display: 'grid', gap: 16, gridTemplateColumns: 'minmax(0, 1fr)' }}>
        {projectInvoices.length > 0 ? (
          <div style={{ background: '#fff', borderRadius: 14, border: '1px solid #D1FAE5', overflow: 'hidden' }}>
          <div style={{ overflowX: 'auto', WebkitOverflowScrolling: 'touch' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', minWidth: 760 }}>
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
                      <tr style={{ borderBottom: isExpanded ? 'none' : '1px solid #F0FDF4', background: isExpanded ? '#FCFFFC' : '#fff', cursor: 'pointer' }} onClick={() => toggleInvoiceEditor(invoice)}>
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
                          <div style={{ display: 'flex', gap: 6, alignItems: 'center', justifyContent: 'flex-end', flexWrap: 'wrap' }} onClick={(event) => event.stopPropagation()}>
                            <button className="btn-ghost p-1 text-gray-300 hover:text-brand" title={isExpanded ? 'Masquer' : 'Ouvrir'} onClick={() => toggleInvoiceEditor(invoice)}>{isExpanded ? <EyeOff size={13} /> : <Pencil size={13} />}</button>
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
                              <div style={{ display: 'grid', gap: 16, gridTemplateColumns: 'minmax(0, 1fr)' }}>
                                <div>
                                  <p style={{ margin: '0 0 8px', fontSize: 11, fontWeight: 700, color: '#9CA3AF', textTransform: 'uppercase', letterSpacing: '.06em' }}>Édition</p>
                                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 180px', gap: 10, marginBottom: 10 }}>
                                    <input className="input" value={draft.client_name} onChange={(e) => updateInvoiceDraftField(invoice.id, 'client_name', e.target.value)} onBlur={() => commitInvoiceDraft(invoice.id)} placeholder="Nom du client" />
                                    <input className="input" value={draft.client_email} onChange={(e) => updateInvoiceDraftField(invoice.id, 'client_email', e.target.value)} onBlur={() => commitInvoiceDraft(invoice.id)} placeholder="Courriel client" />
                                    <input className="input" type="date" value={draft.due_date} onChange={(e) => updateInvoiceDraftField(invoice.id, 'due_date', e.target.value)} onBlur={() => commitInvoiceDraft(invoice.id)} />
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
                                                  <input className="input" value={item.description} onChange={(e) => updateInvoiceDraftItem(invoice.id, index, 'description', e.target.value)} onBlur={() => commitInvoiceDraft(invoice.id)} placeholder="Ligne de facture" />
                                                </td>
                                                <td style={{ padding: '6px 8px' }}>
                                                  <input className="input text-right" type="number" min="0" step="1" value={item.qty} onChange={(e) => updateInvoiceDraftItem(invoice.id, index, 'qty', e.target.value)} onBlur={() => commitInvoiceDraft(invoice.id)} />
                                                </td>
                                                <td style={{ padding: '6px 8px' }}>
                                                  <input className="input text-right" type="number" min="0" step="0.01" value={item.unit_price} onChange={(e) => updateInvoiceDraftItem(invoice.id, index, 'unit_price', e.target.value)} onBlur={() => commitInvoiceDraft(invoice.id)} />
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
                                </div>

                                {/* Document formaté — aperçu synchronisé en temps réel avec le formulaire ci-dessus */}
                                <div>
                                  <p style={{ margin: '0 0 8px', fontSize: 11, fontWeight: 700, color: '#9CA3AF', textTransform: 'uppercase', letterSpacing: '.06em' }}>Aperçu du document</p>
                                  <div style={{ background: '#fff', border: '1px solid #E5E7EB', borderRadius: 14, padding: '28px 34px', boxShadow: '0 8px 24px rgba(15,23,42,.04)', fontFamily: "'Georgia', serif" }}>
                                    <div style={{ display: 'flex', justifyContent: 'space-between', gap: 16, marginBottom: 22, flexWrap: 'wrap' }}>
                                      <div>
                                        <p style={{ margin: 0, fontSize: 18, fontWeight: 700, color: '#15171C' }}>Facture {invoice.number}</p>
                                        <p style={{ margin: '4px 0 0', fontSize: 12, color: '#9CA3AF' }}>{project.name}</p>
                                      </div>
                                      <div style={{ textAlign: 'right', fontSize: 12.5, color: '#374151', lineHeight: 1.6 }}>
                                        <p style={{ margin: 0, fontWeight: 700 }}>{draft.client_name || 'Client'}</p>
                                        <p style={{ margin: 0, color: '#6B7280' }}>{draft.client_email || ''}</p>
                                        <p style={{ margin: 0, color: '#6B7280' }}>Échéance : {draft.due_date ? new Date(draft.due_date).toLocaleDateString('fr-CA') : '—'}</p>
                                      </div>
                                    </div>
                                    <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13, color: '#374151' }}>
                                      <thead>
                                        <tr style={{ borderBottom: '2px solid #E5E7EB' }}>
                                          <th style={{ textAlign: 'left', padding: '6px 4px', fontWeight: 700 }}>Description</th>
                                          <th style={{ textAlign: 'right', padding: '6px 4px', fontWeight: 700 }}>Qté</th>
                                          <th style={{ textAlign: 'right', padding: '6px 4px', fontWeight: 700 }}>Prix unit.</th>
                                          <th style={{ textAlign: 'right', padding: '6px 4px', fontWeight: 700 }}>Total</th>
                                        </tr>
                                      </thead>
                                      <tbody>
                                        {draftItems.filter((item) => String(item.description || '').trim()).map((item, index) => (
                                          <tr key={`preview-${invoice.id}-${index}`} style={{ borderBottom: '1px solid #F3F4F6' }}>
                                            <td style={{ padding: '8px 4px' }}>{item.description}</td>
                                            <td style={{ padding: '8px 4px', textAlign: 'right' }}>{Number(item.qty) || 0}</td>
                                            <td style={{ padding: '8px 4px', textAlign: 'right' }}>{money(Number(item.unit_price) || 0)}</td>
                                            <td style={{ padding: '8px 4px', textAlign: 'right', fontWeight: 700 }}>{money((Number(item.qty) || 0) * (Number(item.unit_price) || 0))}</td>
                                          </tr>
                                        ))}
                                      </tbody>
                                    </table>
                                    <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: 16 }}>
                                      <div style={{ width: 260, fontSize: 12.5 }}>
                                        <div style={{ display: 'flex', justifyContent: 'space-between', padding: '3px 0', color: '#6B7280' }}><span>Sous-total</span><span>{money(subTotal)}</span></div>
                                        <div style={{ display: 'flex', justifyContent: 'space-between', padding: '3px 0', color: '#6B7280' }}><span>TPS (5%)</span><span>{money(tps)}</span></div>
                                        <div style={{ display: 'flex', justifyContent: 'space-between', padding: '3px 0', color: '#6B7280' }}><span>TVQ (9,975%)</span><span>{money(tvq)}</span></div>
                                        <div style={{ display: 'flex', justifyContent: 'space-between', padding: '8px 0 0', marginTop: 4, borderTop: '2px solid #E5E7EB', fontSize: 15, fontWeight: 700, color: '#15171C' }}><span>Total</span><span style={{ color: BRAND }}>{money(total)}</span></div>
                                      </div>
                                    </div>
                                  </div>
                                </div>

                                <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 8, flexWrap: 'wrap' }}>
                                  <button className="btn-secondary text-xs" onClick={() => toggleInvoiceEditor(invoice)}><EyeOff size={13} /> Masquer</button>
                                  {justSent ? (
                                    <span style={{ fontSize: 11, color: '#22C55E', fontWeight: 700, display: 'flex', alignItems: 'center', gap: 4 }}><CheckCircle size={13} /> Envoyée</span>
                                  ) : (
                                    <button className="btn-secondary text-xs" onClick={() => sendInvoiceEmail(invoice)} disabled={isSending}>
                                      {isSending ? <Loader2 size={13} className="animate-spin" /> : <Send size={13} />} Envoyer
                                    </button>
                                  )}
                                  <button className="btn-primary text-xs" onClick={() => saveInvoiceDraft(invoice.id)} disabled={savingInvoiceId === invoice.id}>
                                    {savingInvoiceId === invoice.id ? <Loader2 size={13} className="animate-spin" /> : <Save size={13} />} Enregistrer
                                  </button>
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
          </div>
        ) : (
          <div style={{ textAlign: 'center', padding: '26px 0', color: '#9CA3AF', fontSize: 13 }}>
            Aucune facture client pour ce projet.
          </div>
        )}

        {showNewInvoice && (
          <div style={{ background: '#fff', borderRadius: 16, border: '1px solid #D1FAE5', padding: 18 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', gap: 12, alignItems: 'center', marginBottom: 12, flexWrap: 'wrap' }}>
              <div>
                <p style={{ margin: 0, fontSize: 15, fontWeight: 800, color: '#15171C' }}>Créer depuis le devis</p>
                <p style={{ margin: '4px 0 0', fontSize: 12, color: '#6B7280' }}>Facture complète ou partielle avec cases à cocher, par catégorie.</p>
              </div>
              <div className="flex items-center gap-2">
                <button type="button" className="btn-secondary text-xs" onClick={() => setQuoteInvoiceSelection((quoteBuilderItems || []).map((item, index) => item.id || `${item.type || 'other'}-${index}`))}>Tout sélectionner</button>
                <button type="button" className="btn-secondary text-xs" onClick={() => setQuoteInvoiceSelection([])}>Tout vider</button>
              </div>
            </div>

            {(quoteBuilderItems || []).length === 0 ? (
              <div style={{ textAlign: 'center', padding: '18px 0', color: '#9CA3AF', fontSize: 12.5 }}>
                Le devis ne contient aucun poste pour le moment.
              </div>
            ) : (
              <div style={{ display: 'grid', gap: 14 }}>
                {Object.entries(quoteGroups).map(([type, items]) => {
                  const iS = { border: 'none', outline: 'none', background: 'transparent', fontFamily: 'inherit', width: '100%', padding: '3px 2px' };
                  const nd = manualRow[type] || {};
                  return (
                    <div key={type} style={{ border: '1px solid #E5E7EB', borderRadius: 12, overflow: 'hidden' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '8px 12px', background: '#F9FAFB' }}>
                        <input
                          type="checkbox"
                          checked={isCategoryFullySelected(type)}
                          onChange={() => toggleCategorySelection(type)}
                          style={{ accentColor: BRAND, cursor: 'pointer' }}
                        />
                        <span style={{ fontSize: 11, fontWeight: 800, color: '#6B7280', textTransform: 'uppercase', letterSpacing: '.05em' }}>
                          {QUOTE_TYPE_LABELS[type] || 'Autre'}
                        </span>
                        <span style={{ fontSize: 10, color: '#9CA3AF' }}>{items.length} poste{items.length !== 1 ? 's' : ''}</span>
                      </div>

                      <div style={{ padding: '8px 12px', borderBottom: '1px solid #F3F4F6' }}>
                        <textarea
                          value={invoiceCategoryNotes?.[type] || ''}
                          onChange={(e) => setInvoiceCategoryNotes((m) => ({ ...m, [type]: e.target.value }))}
                          placeholder={`Description libre de ce qui est facturé pour ${(QUOTE_TYPE_LABELS[type] || 'cette catégorie').toLowerCase()}…`}
                          rows={2}
                          style={{ width: '100%', fontSize: 12, border: '1px solid #E5E7EB', borderRadius: 8, padding: '6px 8px', outline: 'none', resize: 'vertical', fontFamily: 'inherit', color: '#374151', boxSizing: 'border-box' }}
                        />
                      </div>

                      <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                        <colgroup>
                          <col style={{ width: 28 }} />
                          <col style={{ minWidth: 180 }} />
                          <col style={{ width: 70 }} />
                          <col style={{ width: 100 }} />
                          <col style={{ width: 100 }} />
                        </colgroup>
                        <thead>
                          <tr>
                            <th style={{ padding: '5px 6px' }} />
                            <th style={{ padding: '5px 6px', fontSize: 9.5, fontWeight: 700, color: '#6B7280', textTransform: 'uppercase', letterSpacing: '.05em', textAlign: 'left', borderBottom: '2px solid #E5E7EB' }}>Description</th>
                            <th style={{ padding: '5px 6px', fontSize: 9.5, fontWeight: 700, color: '#6B7280', textTransform: 'uppercase', letterSpacing: '.05em', textAlign: 'right', borderBottom: '2px solid #E5E7EB' }}>Qté</th>
                            <th style={{ padding: '5px 6px', fontSize: 9.5, fontWeight: 700, color: '#6B7280', textTransform: 'uppercase', letterSpacing: '.05em', textAlign: 'right', borderBottom: '2px solid #E5E7EB' }}>Prix unit.</th>
                            <th style={{ padding: '5px 6px', fontSize: 9.5, fontWeight: 700, color: '#6B7280', textTransform: 'uppercase', letterSpacing: '.05em', textAlign: 'right', borderBottom: '2px solid #E5E7EB' }}>Total</th>
                          </tr>
                        </thead>
                        <tbody>
                          {items.map((item) => {
                            const lineTotal = (Number(item.qty) || 0) * (Number(item.unit_price) || 0);
                            const checked = quoteInvoiceSelection.includes(item.__key);
                            const invoiced = isAlreadyInvoiced(item);
                            return (
                              <tr key={item.__key} style={{ background: checked ? '#F5F3FF' : 'white', borderBottom: '1px solid #F3F4F6' }}>
                                <td style={{ padding: '4px 6px', textAlign: 'center', verticalAlign: 'middle' }}>
                                  <input
                                    type="checkbox"
                                    checked={checked}
                                    onChange={(e) => setQuoteInvoiceSelection((prev) => e.target.checked ? [...prev, item.__key] : prev.filter((key) => key !== item.__key))}
                                    style={{ accentColor: BRAND, cursor: 'pointer' }}
                                  />
                                </td>
                                <td style={{ padding: '4px 6px', verticalAlign: 'middle' }}>
                                  <span style={{ fontSize: 12.5, color: '#15171C', fontWeight: 500 }}>{item.name || item.description || 'Poste'}</span>
                                  {invoiced && (
                                    <span style={{ marginLeft: 6, fontSize: 9, fontWeight: 700, color: '#B45309', background: '#FFFBEB', border: '1px solid #FDE68A', borderRadius: 4, padding: '1px 5px', whiteSpace: 'nowrap' }}>
                                      Déjà facturé
                                    </span>
                                  )}
                                </td>
                                <td style={{ padding: '4px 6px', textAlign: 'right', fontSize: 12, color: '#374151' }}>{Number(item.qty) || 1}</td>
                                <td style={{ padding: '4px 6px', textAlign: 'right', fontSize: 12, color: '#374151' }}>{money(Number(item.unit_price) || 0)}</td>
                                <td style={{ padding: '4px 6px', textAlign: 'right', fontSize: 12, fontWeight: 700, color: '#15171C' }}>{money(lineTotal)}</td>
                              </tr>
                            );
                          })}
                          <tr style={{ background: '#FAFAFA', borderTop: '2px solid #E5E7EB' }}>
                            <td />
                            <td style={{ padding: '4px 6px' }}>
                              <input value={nd.name || ''} placeholder={`+ Ajouter ${(QUOTE_TYPE_LABELS[type] || 'un item').toLowerCase()}…`}
                                disabled={salesLocked}
                                onChange={(e) => setManualRow((m) => ({ ...m, [type]: { ...m[type], name: e.target.value } }))}
                                onKeyDown={(e) => { if (e.key === 'Enter') commitManualRow(type); }}
                                onBlur={() => commitManualRow(type)}
                                style={{ ...iS, fontSize: 12, color: '#9CA3AF' }} />
                            </td>
                            <td style={{ padding: '4px 6px' }}>
                              <input type="number" value={nd.qty || ''} placeholder="1"
                                disabled={salesLocked}
                                onChange={(e) => setManualRow((m) => ({ ...m, [type]: { ...m[type], qty: e.target.value } }))}
                                style={{ ...iS, fontSize: 11, color: '#9CA3AF', textAlign: 'right' }} />
                            </td>
                            <td style={{ padding: '4px 6px' }}>
                              <input type="number" value={nd.unit_price || ''} placeholder="0"
                                disabled={salesLocked}
                                onChange={(e) => setManualRow((m) => ({ ...m, [type]: { ...m[type], unit_price: e.target.value } }))}
                                style={{ ...iS, fontSize: 11, color: '#9CA3AF', textAlign: 'right' }} />
                            </td>
                            <td />
                          </tr>
                        </tbody>
                      </table>
                    </div>
                  );
                })}
              </div>
            )}

            <div className="flex items-center justify-end gap-2 flex-wrap mt-4">
              <button type="button" className="btn-secondary text-xs" onClick={() => createInvoiceFromQuoteSelection()} disabled={savingInvoice || !(quoteBuilderItems || []).length}>
                Créer facture complète
              </button>
              <button type="button" className="btn-primary text-xs" onClick={() => createInvoiceFromQuoteSelection(quoteInvoiceSelection)} disabled={savingInvoice || !quoteInvoiceSelection.length}>
                {savingInvoice ? <Loader2 size={13} className="animate-spin" /> : <FileText size={13} />} Facturer la sélection
              </button>
            </div>
          </div>
        )}
      </div>
    </ProjectSection>
  );
}
