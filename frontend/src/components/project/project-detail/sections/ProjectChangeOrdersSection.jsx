import React, { useEffect, useState } from 'react';
import { Loader2, Paperclip, Plus, Trash2, X } from 'lucide-react';
import ProjectSection from '../../ProjectSection';

const STATUS_OPTIONS = {
  draft: 'Brouillon',
  pending_approval: 'En attente',
  approved: 'Approuvé',
  rejected: 'Refusé',
  completed: 'Complété',
};

const STATUS_COLORS = {
  draft: '#9CA3AF',
  pending_approval: '#F59E0B',
  approved: '#22C55E',
  rejected: '#EF4444',
  completed: '#3B82F6',
};

const EMPTY_ROW = { title: '', description: '', amount: '', notes: '', status: 'draft', attachments: [] };

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
    <div style={{ display: 'grid', gap: 4, minWidth: 160 }}>
      {list.map((att, index) => (
        <div key={index} style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
          <a href={att.url} target="_blank" rel="noreferrer" style={{ fontSize: 10.5, color: '#EA580C', textDecoration: 'none', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', maxWidth: 130, display: 'flex', alignItems: 'center', gap: 3 }}>
            <Paperclip size={10} /> {att.url.replace(/^https?:\/\//, '').slice(0, 24)}
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

export default function ProjectChangeOrdersSection({
  sectionSummary,
  expanded,
  onToggle,
  sectionGuard,
  changeOrdersList,
  money,
  createChangeOrderRow,
  saveChangeOrderRow,
  removeChangeOrderRow,
}) {
  const [creator, setCreator] = useState(EMPTY_ROW);
  const [drafts, setDrafts] = useState({});
  const [savingId, setSavingId] = useState(null);

  useEffect(() => {
    setDrafts(Object.fromEntries((changeOrdersList || []).map((item) => [item.id, {
      title: item.title || '',
      description: item.description || '',
      amount: item.amount ?? '',
      notes: item.notes || '',
      status: item.status || 'draft',
      attachments: item.attachments || [],
    }])));
  }, [changeOrdersList]);

  const createRow = async () => {
    if (!creator.title.trim()) return;
    setSavingId('new');
    try {
      await createChangeOrderRow(creator);
      setCreator(EMPTY_ROW);
    } finally {
      setSavingId(null);
    }
  };

  const saveRow = async (changeOrderId) => {
    const draft = drafts[changeOrderId];
    if (!draft?.title?.trim()) return;
    setSavingId(changeOrderId);
    try {
      await saveChangeOrderRow(changeOrderId, draft);
    } finally {
      setSavingId(null);
    }
  };

  const handleCommit = (changeOrderId) => {
    if (savingId === changeOrderId) return;
    saveRow(changeOrderId);
  };

  const handleCreatorKeyDown = (event) => {
    if (event.key === 'Enter') {
      event.preventDefault();
      createRow();
    }
  };

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

      <div style={{ background: '#fff', borderRadius: 14, border: '1px solid #FED7AA', overflow: 'hidden' }}>
        <div style={{ overflowX: 'auto', WebkitOverflowScrolling: 'touch' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', minWidth: 980 }}>
            <colgroup>
              <col style={{ width: 200 }} />
              <col style={{ minWidth: 240 }} />
              <col style={{ width: 120 }} />
              <col style={{ width: 160 }} />
              <col style={{ minWidth: 200 }} />
              <col style={{ width: 170 }} />
              <col style={{ width: 120 }} />
            </colgroup>
            <thead>
              <tr style={{ background: '#FFF7ED' }}>
                {['Titre', 'Description', 'Montant', 'Statut', 'Notes', 'Pièces jointes', 'Actions'].map((label, index) => (
                  <th key={label} style={{ padding: '10px 12px', textAlign: index === 2 ? 'right' : 'left', fontSize: 11, fontWeight: 700, color: '#92400E', textTransform: 'uppercase', letterSpacing: '.05em', borderBottom: '1px solid #FED7AA' }}>
                    {label}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              <tr style={{ background: '#FFFBF5', borderBottom: '2px solid #FED7AA' }}>
                <td style={{ padding: '6px 8px' }}>
                  <input className="input" value={creator.title} onChange={(e) => setCreator((row) => ({ ...row, title: e.target.value }))} onKeyDown={handleCreatorKeyDown} placeholder="Première ligne éditable" />
                </td>
                <td style={{ padding: '6px 8px' }}>
                  <input className="input" value={creator.description} onChange={(e) => setCreator((row) => ({ ...row, description: e.target.value }))} onKeyDown={handleCreatorKeyDown} placeholder="Description du changement" />
                </td>
                <td style={{ padding: '6px 8px' }}>
                  <input className="input text-right" type="number" min="0" step="0.01" value={creator.amount} onChange={(e) => setCreator((row) => ({ ...row, amount: e.target.value }))} onKeyDown={handleCreatorKeyDown} placeholder="0.00" />
                </td>
                <td style={{ padding: '6px 8px' }}>
                  <select className="input" value={creator.status} onChange={(e) => setCreator((row) => ({ ...row, status: e.target.value }))}>
                    {Object.entries(STATUS_OPTIONS).map(([value, label]) => <option key={value} value={value}>{label}</option>)}
                  </select>
                </td>
                <td style={{ padding: '6px 8px' }}>
                  <input className="input" value={creator.notes} onChange={(e) => setCreator((row) => ({ ...row, notes: e.target.value }))} onKeyDown={handleCreatorKeyDown} placeholder="Notes internes / portail" />
                </td>
                <td style={{ padding: '6px 8px' }}>
                  <AttachmentsCell attachments={creator.attachments} onChange={(next) => setCreator((row) => ({ ...row, attachments: next }))} />
                </td>
                <td style={{ padding: '6px 8px', textAlign: 'center' }}>
                  <div className="flex items-center justify-center gap-2">
                    <button type="button" className="btn-ghost p-2 text-green-700 hover:text-green-800" title="Ajouter la demande" onClick={createRow} disabled={savingId === 'new'}>
                      {savingId === 'new' ? <Loader2 size={16} className="animate-spin" /> : <Plus size={16} />}
                    </button>
                    <button type="button" className="btn-ghost p-2 text-gray-400 hover:text-red-500" title="Vider la ligne" onClick={() => setCreator(EMPTY_ROW)}>
                      <Trash2 size={14} />
                    </button>
                  </div>
                </td>
              </tr>

              {(changeOrdersList || []).map((changeOrder) => {
                const draft = drafts[changeOrder.id] || EMPTY_ROW;
                const color = STATUS_COLORS[draft.status] || '#9CA3AF';
                return (
                  <tr key={changeOrder.id} style={{ borderBottom: '1px solid #FFF7ED', background: '#fff' }}>
                    <td style={{ padding: '6px 8px' }}>
                      <input className="input" value={draft.title} onChange={(e) => setDrafts((rows) => ({ ...rows, [changeOrder.id]: { ...draft, title: e.target.value } }))} onBlur={() => handleCommit(changeOrder.id)} />
                    </td>
                    <td style={{ padding: '6px 8px' }}>
                      <input className="input" value={draft.description} onChange={(e) => setDrafts((rows) => ({ ...rows, [changeOrder.id]: { ...draft, description: e.target.value } }))} onBlur={() => handleCommit(changeOrder.id)} />
                    </td>
                    <td style={{ padding: '6px 8px' }}>
                      <input className="input text-right" type="number" min="0" step="0.01" value={draft.amount} onChange={(e) => setDrafts((rows) => ({ ...rows, [changeOrder.id]: { ...draft, amount: e.target.value } }))} onBlur={() => handleCommit(changeOrder.id)} />
                    </td>
                    <td style={{ padding: '6px 8px' }}>
                      <div style={{ display: 'grid', gap: 6 }}>
                        <select className="input" value={draft.status} onChange={(e) => setDrafts((rows) => ({ ...rows, [changeOrder.id]: { ...draft, status: e.target.value } }))} onBlur={() => handleCommit(changeOrder.id)}>
                          {Object.entries(STATUS_OPTIONS).map(([value, label]) => <option key={value} value={value}>{label}</option>)}
                        </select>
                        <span style={{ fontSize: 10, fontWeight: 700, color, background: `${color}15`, border: `1px solid ${color}35`, borderRadius: 999, padding: '2px 8px', justifySelf: 'start' }}>
                          {STATUS_OPTIONS[draft.status] || draft.status}
                        </span>
                      </div>
                    </td>
                    <td style={{ padding: '6px 8px' }}>
                      <input className="input" value={draft.notes} onChange={(e) => setDrafts((rows) => ({ ...rows, [changeOrder.id]: { ...draft, notes: e.target.value } }))} onBlur={() => handleCommit(changeOrder.id)} />
                    </td>
                    <td style={{ padding: '6px 8px' }}>
                      <AttachmentsCell
                        attachments={draft.attachments}
                        onChange={(next) => {
                          setDrafts((rows) => ({ ...rows, [changeOrder.id]: { ...draft, attachments: next } }));
                          saveChangeOrderRow(changeOrder.id, { ...draft, attachments: next });
                        }}
                      />
                    </td>
                    <td style={{ padding: '6px 8px', textAlign: 'center' }}>
                      <div className="flex items-center justify-center gap-2">
                        {savingId === changeOrder.id && <Loader2 size={13} className="animate-spin text-orange-500" />}
                        <button type="button" className="btn-ghost p-2 text-gray-400 hover:text-red-500" title="Supprimer" onClick={() => removeChangeOrderRow(changeOrder.id)}>
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

        {(changeOrdersList || []).some((item) => Number(item.amount || 0) > 0) && (
          <div style={{ padding: '10px 14px', background: '#FFFBF5', display: 'flex', justifyContent: 'flex-end', gap: 20 }}>
            <span style={{ fontSize: 12, color: '#92400E' }}>Total changements</span>
            <span style={{ fontSize: 13, fontWeight: 900, color: '#F97316' }}>{money((changeOrdersList || []).reduce((sum, item) => sum + Number(item.amount || 0), 0))}</span>
          </div>
        )}
      </div>
    </ProjectSection>
  );
}
