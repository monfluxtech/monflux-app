import React, { useState } from 'react';
import { AlertTriangle, Loader2, Minus, Plus, Trash2, UploadCloud } from 'lucide-react';
import ProjectSection from '../../ProjectSection';

export default function ProjectExpensesSection({
  sectionSummary,
  expanded,
  onToggle,
  sectionGuard,
  project,
  money,
  BRAND,
  EXPENSE_TYPES,
  isExpenseReceiptRequired,
  expenseForm,
  setExpenseForm,
  attachExpenseReceipt,
  setLightboxItem,
  addExpense,
  expenseDrafts,
  updateExpenseDraftField,
  saveExpenseRow,
  savingExpenseId,
  removeExpense,
  extractExpenseFile,
  extractingExpense,
}) {
  const [isDragging, setIsDragging] = useState(false);

  const handleDrop = (e) => {
    e.preventDefault();
    setIsDragging(false);
    const file = e.dataTransfer.files?.[0];
    if (file) extractExpenseFile(file);
  };

  const clearCreatorRow = () => setExpenseForm({
    type: 'supplier_invoice',
    description: '',
    amount: '',
    expense_date: '',
    po_number: '',
    supplier_invoice_number: '',
    receipt_url: '',
    receipt_name: '',
  });

  const handleDraftCommit = (expenseId) => {
    if (savingExpenseId === expenseId) return;
    saveExpenseRow(expenseId);
  };

  return (
    <ProjectSection
      sectionId="s-expenses"
      icon="💸"
      title="Factures fournisseurs"
      summary={sectionSummary?.summary}
      stats={sectionSummary?.stats}
      expanded={expanded}
      onToggle={onToggle}
      background="#F0EBFD"
    >
      {sectionGuard('s-expenses')}
      <div className="flex items-center gap-2 flex-wrap mb-4">
        <span className="badge badge-gray text-xs">{project.expenses?.length || 0} entrée(s)</span>
        <span className="badge badge-gray text-xs">Total {money((project.expenses || []).reduce((sum, expense) => sum + Number(expense.amount || 0), 0))}</span>
      </div>

      {/* Glisser-déposer une facture — extraction IA automatique (description, montant, date, n° facture/BC) */}
      <div
        onDragOver={(e) => { e.preventDefault(); setIsDragging(true); }}
        onDragLeave={() => setIsDragging(false)}
        onDrop={handleDrop}
        style={{
          border: `1.5px dashed ${isDragging ? BRAND : '#D1D5DB'}`,
          background: isDragging ? `${BRAND}0D` : '#FAFAFA',
          borderRadius: 14, padding: '16px 18px', marginBottom: 14,
          display: 'flex', alignItems: 'center', gap: 10, transition: 'all .12s',
        }}
      >
        {extractingExpense ? <Loader2 size={18} className="animate-spin" style={{ color: BRAND, flexShrink: 0 }} /> : <UploadCloud size={18} style={{ color: isDragging ? BRAND : '#9CA3AF', flexShrink: 0 }} />}
        <div style={{ flex: 1 }}>
          <p style={{ margin: 0, fontSize: 12.5, fontWeight: 700, color: '#374151' }}>
            {extractingExpense ? 'Extraction en cours…' : 'Glissez une facture fournisseur ici (PDF ou photo)'}
          </p>
          <p style={{ margin: '2px 0 0', fontSize: 11, color: '#9CA3AF' }}>
            Flo extrait automatiquement fournisseur, montant, date et numéro de facture, et l'ajoute directement en pièce jointe.
          </p>
        </div>
        <label style={{ fontSize: 11.5, fontWeight: 700, color: BRAND, border: `1px solid ${BRAND}55`, borderRadius: 8, padding: '6px 12px', cursor: 'pointer', flexShrink: 0, background: '#fff' }}>
          Parcourir…
          <input type="file" accept="image/*,application/pdf" className="hidden" onChange={(e) => { const file = e.target.files?.[0]; if (file) extractExpenseFile(file); e.target.value = ''; }} />
        </label>
      </div>

      <div style={{ border: '1px solid #E5E7EB', borderRadius: 16, overflow: 'hidden', background: '#fff' }}>
        <div style={{ overflowX: 'auto', WebkitOverflowScrolling: 'touch' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', minWidth: 1060 }}>
            <colgroup>
              <col style={{ width: 140 }}/>
              <col style={{ minWidth: 220 }}/>
              <col style={{ width: 130 }}/>
              <col style={{ width: 130 }}/>
              <col style={{ width: 160 }}/>
              <col style={{ width: 170 }}/>
              <col style={{ width: 120 }}/>
              <col style={{ width: 130 }}/>
            </colgroup>
            <thead>
              <tr>
                {['Type', 'Description', 'Date', 'Bon de commande', 'Facture fournisseur', 'Reçu', 'Montant', 'Actions'].map((label, index) => (
                  <th
                    key={label}
                    style={{
                      padding: '8px 10px',
                      fontSize: 10,
                      fontWeight: 700,
                      color: index === 6 ? BRAND : '#6B7280',
                      textTransform: 'uppercase',
                      letterSpacing: '.05em',
                      borderBottom: '2px solid #E5E7EB',
                      background: '#F9FAFB',
                      textAlign: index === 6 ? 'right' : index === 7 ? 'center' : 'left',
                      whiteSpace: 'nowrap',
                    }}
                  >
                    {label}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              <tr style={{ background: '#FAFAFA', borderBottom: '2px solid #E5E7EB' }}>
                <td style={{ padding: '6px 8px' }}>
                  <select className="input" value={expenseForm.type} onChange={(e) => setExpenseForm((form) => ({ ...form, type: e.target.value }))}>
                    {Object.entries(EXPENSE_TYPES).map(([key, label]) => <option key={key} value={key}>{label}</option>)}
                  </select>
                </td>
                <td style={{ padding: '6px 8px' }}>
                  <input className="input" value={expenseForm.description} onChange={(e) => setExpenseForm((form) => ({ ...form, description: e.target.value }))} placeholder="Fournisseur / détail" />
                </td>
                <td style={{ padding: '6px 8px' }}>
                  <input className="input" type="date" value={expenseForm.expense_date} onChange={(e) => setExpenseForm((form) => ({ ...form, expense_date: e.target.value }))} />
                </td>
                <td style={{ padding: '6px 8px' }}>
                  <input className="input" value={expenseForm.po_number} onChange={(e) => setExpenseForm((form) => ({ ...form, po_number: e.target.value }))} placeholder="BC-001" />
                </td>
                <td style={{ padding: '6px 8px' }}>
                  <input className="input" value={expenseForm.supplier_invoice_number} onChange={(e) => setExpenseForm((form) => ({ ...form, supplier_invoice_number: e.target.value }))} placeholder="INV-2026-001" />
                </td>
                <td style={{ padding: '6px 8px' }}>
                  {expenseForm.type === 'mileage' ? (
                    <span className="text-xs text-gray-400">Non requis</span>
                  ) : (
                    <div className="flex items-center gap-2">
                      <label className="text-[11px] font-medium text-gray-500 hover:text-brand border border-gray-200 rounded-md px-2 py-1 transition-colors cursor-pointer">
                        {expenseForm.receipt_url ? 'Changer' : 'Photo reçu'}
                        <input
                          type="file"
                          accept="image/*"
                          className="hidden"
                          onChange={(e) => {
                            const file = e.target.files?.[0];
                            if (file) attachExpenseReceipt({ file });
                            e.target.value = '';
                          }}
                        />
                      </label>
                      {expenseForm.receipt_url && (
                        <button type="button" className="text-[11px] text-green-700 hover:text-green-800" onClick={() => setLightboxItem({ type: 'photo', url: expenseForm.receipt_url, caption: expenseForm.receipt_name || 'Reçu' })}>
                          Voir
                        </button>
                      )}
                    </div>
                  )}
                </td>
                <td style={{ padding: '6px 8px' }}>
                  <input className="input text-right" type="number" step="0.01" value={expenseForm.amount} onChange={(e) => setExpenseForm((form) => ({ ...form, amount: e.target.value }))} placeholder="0.00" />
                </td>
                <td style={{ padding: '6px 8px', textAlign: 'center' }}>
                  <div className="flex items-center justify-center gap-2">
                    <button type="button" className="btn-ghost p-2 text-green-700 hover:text-green-800" title="Ajouter la ligne" onClick={(e) => addExpense(e)}>
                      <Plus size={16} />
                    </button>
                    <button type="button" className="btn-ghost p-2 text-gray-400 hover:text-gray-600" title="Vider la ligne" onClick={clearCreatorRow}>
                      <Minus size={16} />
                    </button>
                  </div>
                </td>
              </tr>

              {(project.expenses || []).map((expense) => {
                const draft = expenseDrafts[expense.id] || {
                  type: expense.type || 'supplier_invoice',
                  description: expense.description || '',
                  amount: expense.amount ?? '',
                  expense_date: expense.expense_date ? String(expense.expense_date).slice(0, 10) : '',
                  po_number: expense.po_number || '',
                  supplier_invoice_number: expense.supplier_invoice_number || '',
                  receipt_url: expense.receipt_url || '',
                  receipt_name: expense.receipt_name || '',
                };
                const isSupplierInvoice = draft.type === 'supplier_invoice';
                const receiptMissing = isExpenseReceiptRequired(draft.type) && !draft.receipt_url;
                return (
                  <tr key={expense.id} style={{ background: 'white', borderBottom: '1px solid #F3F4F6' }}>
                    <td style={{ padding: '6px 8px' }}>
                      <select className="input" value={draft.type} onChange={(e) => updateExpenseDraftField(expense.id, 'type', e.target.value)} onBlur={() => handleDraftCommit(expense.id)}>
                        {Object.entries(EXPENSE_TYPES).map(([key, label]) => <option key={key} value={key}>{label}</option>)}
                      </select>
                    </td>
                    <td style={{ padding: '6px 8px' }}>
                      <input className="input" value={draft.description} onChange={(e) => updateExpenseDraftField(expense.id, 'description', e.target.value)} onBlur={() => handleDraftCommit(expense.id)} placeholder="Description" />
                    </td>
                    <td style={{ padding: '6px 8px' }}>
                      <input className="input" type="date" value={draft.expense_date} onChange={(e) => updateExpenseDraftField(expense.id, 'expense_date', e.target.value)} onBlur={() => handleDraftCommit(expense.id)} />
                    </td>
                    <td style={{ padding: '6px 8px' }}>
                      <input className="input" value={draft.po_number} onChange={(e) => updateExpenseDraftField(expense.id, 'po_number', e.target.value)} onBlur={() => handleDraftCommit(expense.id)} placeholder="BC-001" />
                    </td>
                    <td style={{ padding: '6px 8px' }}>
                      <div className="flex items-center gap-2">
                        <input className="input" value={draft.supplier_invoice_number} onChange={(e) => updateExpenseDraftField(expense.id, 'supplier_invoice_number', e.target.value)} onBlur={() => handleDraftCommit(expense.id)} placeholder="INV-2026-001" />
                        {isSupplierInvoice && !draft.po_number && <AlertTriangle size={14} className="text-amber-500 flex-shrink-0" title="Sans bon de commande" />}
                      </div>
                    </td>
                    <td style={{ padding: '6px 8px' }}>
                      {draft.type === 'mileage' ? (
                        <span className="text-xs text-gray-400">Non requis</span>
                      ) : (
                        <div className="flex items-center gap-2">
                          <label className={`text-[11px] font-medium border rounded-md px-2 py-1 transition-colors cursor-pointer ${receiptMissing ? 'text-amber-700 border-amber-200 bg-amber-50' : 'text-gray-500 hover:text-brand border-gray-200'}`}>
                            {draft.receipt_url ? 'Changer' : 'Photo reçu'}
                            <input
                              type="file"
                              accept="image/*"
                              className="hidden"
                              onChange={(e) => {
                                const file = e.target.files?.[0];
                                if (file) attachExpenseReceipt({ expenseId: expense.id, file });
                                e.target.value = '';
                              }}
                            />
                          </label>
                          {draft.receipt_url && (
                            <button className="text-[11px] text-green-700 hover:text-green-800" onClick={() => setLightboxItem({ type: 'photo', url: draft.receipt_url, caption: draft.receipt_name || 'Reçu' })}>
                              Voir
                            </button>
                          )}
                        </div>
                      )}
                    </td>
                    <td style={{ padding: '6px 8px' }}>
                      <input className="input text-right" type="number" step="0.01" value={draft.amount} onChange={(e) => updateExpenseDraftField(expense.id, 'amount', e.target.value)} onBlur={() => handleDraftCommit(expense.id)} />
                    </td>
                    <td style={{ padding: '6px 8px', textAlign: 'center' }}>
                      <div className="flex items-center justify-center gap-2">
                        {savingExpenseId === expense.id && <span className="text-[10px] font-semibold text-orange-500">Auto…</span>}
                        <button className="btn-ghost p-1 text-gray-300 hover:text-red-500" onClick={() => removeExpense(expense.id)}><Trash2 size={13} /></button>
                      </div>
                    </td>
                  </tr>
                );
              })}

              {!(project.expenses || []).length && (
                <tr>
                  <td colSpan={8} style={{ padding: '22px 12px', textAlign: 'center', color: '#9CA3AF', fontSize: 14 }}>
                    Aucune facture fournisseur enregistrée.
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
