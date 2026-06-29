import React from 'react';
import { AlertCircle, CheckCircle, Eye, FileSignature, Loader2, MessageCircle, Save, Send, Sparkles, StickyNote, Trash2 } from 'lucide-react';
import ProjectSection from '../../ProjectSection';

export default function ProjectQuoteSection(props) {
  const {
    sectionSummaries,
    sectionExpanded,
    toggleProjectSection,
    salesLocked,
    quoteMarkup,
    setQuoteMarkup,
    setUiPref,
    showFloQuotePanel,
    setShowFloQuotePanel,
    BRAND,
    floQuoteLoading,
    quoteBuilderQuote,
    quoteSaving,
    floInspirationInput,
    setFloInspirationInput,
    fetchQuoteRecos,
    quoteSelected,
    quoteMassMarkup,
    setQuoteMassMarkup,
    quoteBuilderItems,
    setQuoteBuilderItems,
    scheduleQuoteSave,
    showHideExtraItems,
    setShowHideExtraItems,
    setQuoteSelected,
    quoteSections,
    setQuoteSections,
    quoteStatusBusy,
    quotePdfPreview,
    setQuotePdfPreview,
    pdf,
    downloadQuotePdf,
    createOrRefreshContractDraft,
    contractTemplateConfig,
    selectedContractTemplateKey,
    setSelectedContractTemplateKey,
    saveContractTemplateConfig,
    project,
    quoteForm,
    setQuoteForm,
    saveQuoteForm,
    showContractEditor,
    setShowContractEditor,
    contractDraft,
    setContractDraft,
    saveContractDraft,
    contractSaving,
    quoteSendBusy,
    sendQuoteByEmail,
    quoteCopied,
    copyQuoteLink,
    money,
    preview,
    setPreview,
    contractBusy,
    quoteBuilderStats,
    quoteLineTotal,
    toggleQuoteItemSelection,
    updateQuoteItemField,
    removeQuoteItem,
    duplicateQuoteItem,
    addQuoteItem,
    updateQuoteSectionName,
    toggleQuoteSectionCollapsed,
    addQuoteSection,
    moveQuoteItemToSection,
    quoteSectionOptions,
    toggleQuoteItemOptional,
    toggleQuoteItemVisible,
    quoteVisibleItems,
    quoteHiddenItems,
    quoteContractData,
    saveContractHtml,
    shareContractWhatsapp,
    quotePublicUrl,
    setQuotePublicUrl,
  } = props;

  return (
        <ProjectSection
          sectionId="s-soumission"
          icon="📄"
          title="Devis & contrat"
          summary={sectionSummaries['s-soumission']?.summary}
          stats={sectionSummaries['s-soumission']?.stats}
          expanded={!!sectionExpanded['s-soumission']}
          onToggle={() => toggleProjectSection('s-soumission')}
          background="#fff"
          borderTop="2px solid #E8EAED"
        >
          {salesLocked && (
            <div style={{ marginBottom: 18, padding: '10px 14px', borderRadius: 10, background: '#EFF6FF', border: '1px solid #BFDBFE', color: '#1D4ED8', fontSize: 12.5, fontWeight: 600 }}>
              Le devis, le contrat et l’estimation approximative sont maintenant verrouillés, car le client a signé/accepté.
            </div>
          )}
          <div style={{ display: 'flex', gap: 8, alignItems: 'center', flexShrink: 0, flexWrap: 'wrap', justifyContent: 'flex-end', marginBottom: 20 }}>
              {/* Markup */}
              <div style={{ display: 'flex', alignItems: 'center', gap: 5, background: '#F9FAFB', borderRadius: 8, padding: '5px 11px', border: '1px solid #E8EAED' }}>
                <span style={{ fontSize: 11, color: '#8B919A' }}>Markup</span>
                <input type="number" min="0" max="300" step="1" value={quoteMarkup}
                  disabled={salesLocked}
                  onChange={e => { const v = Number(e.target.value); setQuoteMarkup(v); localStorage.setItem('monflux-quote-markup', v); setUiPref('quote_markup', v); }}
                  style={{ width: 42, fontSize: 13, fontWeight: 700, border: 'none', background: 'transparent', outline: 'none', textAlign: 'right', color: '#15171C', fontFamily: 'inherit' }}/>
                <span style={{ fontSize: 11, color: '#8B919A' }}>%</span>
              </div>
              {/* Flo button */}
              <button disabled={salesLocked} onClick={() => setShowFloQuotePanel(v => !v)}
                style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '7px 14px', borderRadius: 9, border: `1.5px solid ${BRAND}`, background: showFloQuotePanel ? `${BRAND}15` : '#fff', color: BRAND, fontSize: 12, fontWeight: 700, cursor: 'pointer' }}>
                <Sparkles size={12}/>{floQuoteLoading ? 'Analyse…' : 'Flo complète le devis'}
              </button>
              {quoteBuilderQuote?.status === 'sent' && <span className="badge badge-blue text-xs">Envoyée</span>}
              {quoteBuilderQuote?.status === 'signed' && <span className="badge badge-green text-xs">Signée</span>}
              {quoteSaving && <span style={{ fontSize: 11, color: '#9CA3AF' }}>Enreg…</span>}
          </div>

          {/* Panneau Flo */}
          {showFloQuotePanel && (
            <div style={{ background: '#F5F3FF', borderRadius: 12, padding: '16px 20px', marginBottom: 20, border: '1px solid #DDD6FE' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8 }}>
                <Sparkles size={13} style={{ color: BRAND }}/><span style={{ fontSize: 13, fontWeight: 700, color: BRAND }}>Flo complète le devis</span>
              </div>
              <p style={{ fontSize: 12, color: '#6B7280', margin: '0 0 10px', lineHeight: 1.5 }}>
                Collez des URLs d'images d'inspiration (Pinterest, Houzz…) ou décrivez le style. Flo identifie les matériaux, propose des produits disponibles au Québec avec prix et sources, importe les prix convenus avec les sous-traitants de la section Équipe, et ajoute la main d'œuvre basée sur les phases.
              </p>
              <textarea value={floInspirationInput} onChange={e => setFloInspirationInput(e.target.value)}
                placeholder={"https://pinterest.com/pin/…\nhttps://houzz.com/…\nOu décrivez : planchers de bois naturel, comptoirs de quartz blanc, robinetterie matte noire…"}
                rows={3}
                style={{ width: '100%', fontSize: 12, border: '1px solid #DDD6FE', borderRadius: 8, padding: '8px 10px', outline: 'none', resize: 'vertical', fontFamily: 'inherit', background: '#fff', color: '#15171C', boxSizing: 'border-box' }}/>
              <div style={{ display: 'flex', gap: 8, marginTop: 10, alignItems: 'center' }}>
                <button onClick={fetchQuoteRecos} disabled={floQuoteLoading}
                  style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '7px 16px', borderRadius: 8, border: 'none', background: BRAND, color: '#fff', fontSize: 12, fontWeight: 700, cursor: floQuoteLoading ? 'wait' : 'pointer' }}>
                  {floQuoteLoading ? <Loader2 size={12} style={{ animation: 'spin 1s linear infinite' }}/> : <Sparkles size={12}/>}
                  {floQuoteLoading ? 'Analyse en cours…' : 'Analyser et compléter le devis'}
                </button>
                <span style={{ fontSize: 11, color: '#9CA3AF' }}>Les postes existants sont conservés — Flo ajoute uniquement les nouvelles lignes.</span>
              </div>
            </div>
          )}

          {/* Barre multi-select + mass-markup */}
          {quoteSelected.size > 0 && (
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '8px 14px', background: '#F5F3FF', border: '1px solid #DDD6FE', borderRadius: 10, marginBottom: 14, flexWrap: 'wrap' }}>
              <span style={{ fontSize: 12, fontWeight: 700, color: BRAND }}>{quoteSelected.size} ligne(s)</span>
              {/* Mass markup */}
              <div style={{ display: 'flex', alignItems: 'center', gap: 5, background: '#EDE9FE', borderRadius: 7, padding: '3px 10px' }}>
                <span style={{ fontSize: 11, color: BRAND }}>Markup</span>
                <input type="number" min="0" max="300" step="1" value={quoteMassMarkup}
                  disabled={salesLocked}
                  onChange={e => setQuoteMassMarkup(e.target.value)}
                  placeholder="0"
                  style={{ width: 38, fontSize: 12, fontWeight: 700, border: 'none', background: 'transparent', outline: 'none', textAlign: 'right', color: '#15171C', fontFamily: 'inherit' }}/>
                <span style={{ fontSize: 11, color: BRAND }}>%</span>
                <button onClick={() => {
                  if (quoteMassMarkup === '') return;
                  const v = Number(quoteMassMarkup);
                  const next = quoteBuilderItems.map((it, i) => quoteSelected.has(i) ? { ...it, markup: v } : it);
                  setQuoteBuilderItems(next); scheduleQuoteSave(next); setQuoteMassMarkup('');
                }}
                  disabled={salesLocked}
                  style={{ fontSize: 10, padding: '2px 8px', borderRadius: 5, border: 'none', background: BRAND, color: '#fff', fontWeight: 700, cursor: salesLocked ? 'not-allowed' : 'pointer', marginLeft: 4, opacity: salesLocked ? 0.5 : 1 }}>
                  Appliquer
                </button>
              </div>
              <button onClick={() => { [...quoteSelected].sort((a, b) => b - a).forEach(i => removeQuoteItem(i)); setQuoteSelected(new Set()); }}
                disabled={salesLocked}
                style={{ fontSize: 11, padding: '3px 10px', borderRadius: 7, border: '1px solid #FCA5A5', background: '#FFF5F5', color: '#DC2626', fontWeight: 700, cursor: salesLocked ? 'not-allowed' : 'pointer', opacity: salesLocked ? 0.5 : 1 }}>
                Supprimer
              </button>
              <button onClick={() => setQuoteSelected(new Set())}
                style={{ fontSize: 11, padding: '3px 8px', borderRadius: 7, border: '1px solid #E0E4E8', background: '#fff', color: '#8B919A', cursor: 'pointer', marginLeft: 'auto' }}>
                ✕
              </button>
            </div>
          )}

          {/* Tableau devis unifié — style Excel avec groupes repliables */}
          {(() => {
            const typeLabels = { material: 'Matériaux', labor: "Main d'œuvre", subcontractor: 'Sous-traitants', other: 'Autres' };
            const typeIcons  = { material: '🪵', labor: '🔨', subcontractor: '🏗️', other: '📦' };
            const typeUnits  = { labor: 'h', material: 'un.', subcontractor: 'forfait', other: 'un.' };
            const iS = { border: 'none', outline: 'none', background: 'transparent', fontFamily: 'inherit', width: '100%', padding: '3px 2px' };
            const TH = { padding: '5px 6px', fontSize: 9.5, fontWeight: 700, color: '#6B7280', textTransform: 'uppercase', letterSpacing: '.05em', borderBottom: '2px solid #E5E7EB', background: '#F9FAFB', whiteSpace: 'nowrap' };
            const allItems = quoteBuilderItems.map((it, i) => ({ ...it, _i: i }));
            return (
              <div style={{ border: '1px solid #E5E7EB', borderRadius: 10, overflow: 'hidden' }}>
                <div style={{ overflowX: 'auto', WebkitOverflowScrolling: 'touch' }}>
                  <table style={{ width: '100%', borderCollapse: 'collapse', minWidth: 860 }}>
                    <colgroup>
                      <col style={{ width: 28 }}/>{/* checkbox */}
                      <col style={{ minWidth: 180 }}/>{/* description */}
                      <col style={{ width: 60 }}/>{/* qty */}
                      <col style={{ width: 54 }}/>{/* unit */}
                      <col style={{ width: 90 }}/>{/* prix unit */}
                      <col style={{ width: 72 }}/>{/* markup */}
                      <col style={{ width: 100 }}/>{/* total */}
                      <col style={{ width: 84 }}/>{/* source */}
                      <col style={{ width: 24 }}/>{/* delete */}
                    </colgroup>
                    <thead>
                      <tr>
                        <th style={{ ...TH, textAlign: 'center' }}>
                          <input type="checkbox"
                            disabled={salesLocked}
                            checked={allItems.length > 0 && allItems.every(it => quoteSelected.has(it._i))}
                            onChange={e => setQuoteSelected(() => {
                              const n = new Set();
                              if (e.target.checked) allItems.forEach(it => n.add(it._i));
                              return n;
                            })}
                            style={{ accentColor: BRAND, cursor: salesLocked ? 'not-allowed' : 'pointer' }}/>
                        </th>
                        <th style={{ ...TH, textAlign: 'left' }}>Description</th>
                        {/* Colonnes PDF — œil cliquable pour inclure/exclure du PDF client */}
                        <th style={{ ...TH, textAlign: 'right', cursor: 'pointer', userSelect: 'none' }} title="Afficher Qté sur le PDF" onClick={() => togglePdfCol('qty')}>
                          <span style={{ opacity: isPdfColOn('qty') ? 1 : 0.35 }}>Qté {isPdfColOn('qty') ? '👁' : '🙈'}</span>
                        </th>
                        <th style={{ ...TH, textAlign: 'left', cursor: 'pointer', userSelect: 'none' }} title="Afficher Unité sur le PDF" onClick={() => togglePdfCol('unit')}>
                          <span style={{ opacity: isPdfColOn('unit') ? 1 : 0.35 }}>Unité {isPdfColOn('unit') ? '👁' : '🙈'}</span>
                        </th>
                        <th style={{ ...TH, textAlign: 'right', cursor: 'pointer', userSelect: 'none' }} title="Afficher Prix unit. sur le PDF" onClick={() => togglePdfCol('unit_price')}>
                          <span style={{ opacity: isPdfColOn('unit_price') ? 1 : 0.35 }}>Prix unit. {isPdfColOn('unit_price') ? '👁' : '🙈'}</span>
                        </th>
                        <th style={{ ...TH, textAlign: 'right', color: BRAND }}>Markup%</th>
                        <th style={{ ...TH, textAlign: 'right' }}>Total</th>
                        <th style={{ ...TH, textAlign: 'left' }}>Source</th>
                        <th style={{ ...TH }}/>
                      </tr>
                    </thead>
                    <tbody>
                      {['material', 'labor', 'subcontractor', 'other'].map(type => {
                        const typeItems = allItems.filter(it => it.type === type);
                        const nd = quoteNewRow[type] || {};
                        const isCollapsed = quoteCollapsed[type];
                        const sectionTotal = typeItems.reduce((s, it) => {
                          const base = (Number(it.qty) || 1) * (Number(it.unit_price) || 0);
                          return s + base * (1 + (Number(it.markup) || 0) / 100);
                        }, 0);
                        return (
                          <React.Fragment key={type}>
                            {/* Ligne-groupe repliable */}
                            <tr onClick={() => setQuoteCollapsed(m => ({ ...m, [type]: !m[type] }))}
                              style={{ background: '#F3F4F6', cursor: 'pointer', userSelect: 'none' }}>
                              <td style={{ padding: '6px 10px', textAlign: 'center' }}>
                                <span style={{ fontSize: 8, color: '#9CA3AF', display: 'inline-block', transition: 'transform .15s', transform: isCollapsed ? 'rotate(-90deg)' : 'rotate(0deg)' }}>▼</span>
                              </td>
                              <td colSpan={7} style={{ padding: '6px 6px' }}>
                                <span style={{ fontSize: 11, fontWeight: 800, color: '#374151', textTransform: 'uppercase', letterSpacing: '.07em', marginRight: 8 }}>
                                  {typeIcons[type]} {typeLabels[type]}
                                </span>
                                <span style={{ fontSize: 10, color: '#9CA3AF' }}>{typeItems.length} poste{typeItems.length !== 1 ? 's' : ''}</span>
                              </td>
                              <td style={{ padding: '6px 8px', textAlign: 'right', fontSize: 12, fontWeight: 700, color: '#111827', whiteSpace: 'nowrap' }}>
                                {sectionTotal.toLocaleString('fr-CA', { minimumFractionDigits: 2 })} $
                              </td>
                              <td/>
                            </tr>

                            {/* Lignes d'articles */}
                            {!isCollapsed && typeItems.map(it => {
                              const isSel = quoteSelected.has(it._i);
                              const mu = Number(it.markup) || 0;
                              const lineTotal = (Number(it.qty) || 1) * (Number(it.unit_price) || 0) * (1 + mu / 100);
                              return (
                                <tr key={it._i} style={{ background: isSel ? '#F5F3FF' : it.source === 'flo' ? '#F7FFF3' : 'white', borderBottom: '1px solid #F3F4F6' }}>
                                  <td style={{ padding: '2px 4px', textAlign: 'center', verticalAlign: 'middle' }}>
                                    <input type="checkbox" checked={isSel}
                                      disabled={salesLocked}
                                      onChange={() => setQuoteSelected(prev => { const n = new Set(prev); n.has(it._i) ? n.delete(it._i) : n.add(it._i); return n; })}
                                      style={{ accentColor: BRAND, cursor: salesLocked ? 'not-allowed' : 'pointer' }}/>
                                  </td>
                                  <td style={{ padding: '1px 6px', verticalAlign: 'middle' }}>
                                    <input value={it.name} readOnly={salesLocked} onChange={e => updateQuoteItem(it._i, { name: e.target.value })}
                                      placeholder="Description"
                                      style={{ ...iS, fontSize: 12, color: '#111827', fontWeight: it.name ? 500 : 400 }}/>
                                  </td>
                                  <td style={{ padding: '1px 4px', verticalAlign: 'middle' }}>
                                    <input type="number" value={it.qty || ''} readOnly={salesLocked} onChange={e => updateQuoteItem(it._i, { qty: Number(e.target.value) })}
                                      style={{ ...iS, fontSize: 11, color: '#374151', textAlign: 'right' }}/>
                                  </td>
                                  <td style={{ padding: '1px 4px', verticalAlign: 'middle' }}>
                                    <input value={it.unit || ''} readOnly={salesLocked} onChange={e => updateQuoteItem(it._i, { unit: e.target.value })}
                                      placeholder={typeUnits[type]}
                                      style={{ ...iS, fontSize: 11, color: '#6B7280' }}/>
                                  </td>
                                  <td style={{ padding: '1px 4px', verticalAlign: 'middle' }}>
                                    <input type="number" value={it.unit_price || ''} readOnly={salesLocked} onChange={e => updateQuoteItem(it._i, { unit_price: Number(e.target.value) })}
                                      placeholder="0"
                                      style={{ ...iS, fontSize: 11, color: '#374151', textAlign: 'right' }}/>
                                  </td>
                                  <td style={{ padding: '1px 4px', verticalAlign: 'middle' }}>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: 1, justifyContent: 'flex-end' }}>
                                      <input type="number" value={it.markup || ''} readOnly={salesLocked} onChange={e => updateQuoteItem(it._i, { markup: Number(e.target.value) })}
                                        placeholder="0"
                                        style={{ ...iS, fontSize: 11, color: BRAND, textAlign: 'right', width: 36, fontWeight: 600 }}/>
                                      <span style={{ fontSize: 10, color: BRAND, flexShrink: 0 }}>%</span>
                                    </div>
                                  </td>
                                  <td style={{ padding: '2px 8px', verticalAlign: 'middle', textAlign: 'right', fontSize: 12, fontWeight: 700, color: '#111827', whiteSpace: 'nowrap' }}>
                                    {lineTotal.toLocaleString('fr-CA', { minimumFractionDigits: 2 })} $
                                    {it.source === 'flo' && <span style={{ fontSize: 8, color: '#16A34A', marginLeft: 3 }}>✦</span>}
                                  </td>
                                  <td style={{ padding: '1px 4px', verticalAlign: 'middle' }}>
                                    {it.url ? (
                                      <a href={it.url} target="_blank" rel="noreferrer"
                                        style={{ fontSize: 10, color: BRAND, textDecoration: 'none', whiteSpace: 'nowrap' }}>🔗 Source</a>
                                    ) : (
                                      <input value={it.url || ''} readOnly={salesLocked} onChange={e => updateQuoteItem(it._i, { url: e.target.value })}
                                        placeholder="URL"
                                        style={{ ...iS, fontSize: 10, color: '#9CA3AF' }}/>
                                    )}
                                  </td>
                                  <td style={{ padding: '1px 2px', verticalAlign: 'middle', textAlign: 'center' }}>
                                    <button onClick={() => removeQuoteItem(it._i)} disabled={salesLocked}
                                      style={{ background: 'none', border: 'none', cursor: salesLocked ? 'not-allowed' : 'pointer', color: '#D1D5DB', fontSize: 14, lineHeight: 1, padding: '0 3px', opacity: salesLocked ? 0.5 : 1 }}>×</button>
                                  </td>
                                </tr>
                              );
                            })}

                            {/* Ligne d'ajout rapide */}
                            {!isCollapsed && (
                              <tr style={{ background: '#FAFAFA', borderBottom: '2px solid #E5E7EB' }}>
                                <td/>
                                <td style={{ padding: '4px 6px' }}>
                                  <input value={nd.name || ''} placeholder={`+ Ajouter ${typeLabels[type].toLowerCase()}…`}
                                    readOnly={salesLocked}
                                    onChange={e => setQuoteNewRow(m => ({ ...m, [type]: { ...m[type], name: e.target.value } }))}
                                    onKeyDown={e => { if (!salesLocked && e.key === 'Enter') commitNewRow(type, nd); }}
                                    onBlur={() => { if (!salesLocked) commitNewRow(type, nd); }}
                                    style={{ ...iS, fontSize: 12, color: '#9CA3AF' }}/>
                                </td>
                                <td style={{ padding: '4px 4px' }}>
                                  <input type="number" value={nd.qty || ''} placeholder="1"
                                    readOnly={salesLocked}
                                    onChange={e => setQuoteNewRow(m => ({ ...m, [type]: { ...m[type], qty: e.target.value } }))}
                                    style={{ ...iS, fontSize: 11, color: '#9CA3AF', textAlign: 'right' }}/>
                                </td>
                                <td style={{ padding: '4px 4px' }}>
                                  <input value={nd.unit || ''} placeholder={typeUnits[type]}
                                    readOnly={salesLocked}
                                    onChange={e => setQuoteNewRow(m => ({ ...m, [type]: { ...m[type], unit: e.target.value } }))}
                                    style={{ ...iS, fontSize: 11, color: '#9CA3AF' }}/>
                                </td>
                                <td style={{ padding: '4px 4px' }}>
                                  <input type="number" value={nd.unit_price || ''} placeholder="0"
                                    readOnly={salesLocked}
                                    onChange={e => setQuoteNewRow(m => ({ ...m, [type]: { ...m[type], unit_price: e.target.value } }))}
                                    style={{ ...iS, fontSize: 11, color: '#9CA3AF', textAlign: 'right' }}/>
                                </td>
                                <td/><td/><td style={{ padding: '4px 4px' }}>
                                  <input value={nd.url || ''} placeholder="URL"
                                    readOnly={salesLocked}
                                    onChange={e => setQuoteNewRow(m => ({ ...m, [type]: { ...m[type], url: e.target.value } }))}
                                    style={{ ...iS, fontSize: 10, color: '#9CA3AF' }}/>
                                </td>
                                <td/>
                              </tr>
                            )}
                          </React.Fragment>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </div>
            );
          })()}

          {/* Totaux */}
          {quoteBuilderItems.length > 0 && (() => {
            const costRaw   = quoteBuilderItems.reduce((s, it) => s + (Number(it.qty) || 1) * (Number(it.unit_price) || 0), 0);
            const costTotal = quoteBuilderItems.reduce((s, it) => {
              const base = (Number(it.qty) || 1) * (Number(it.unit_price) || 0);
              return s + base * (1 + (Number(it.markup) || 0) / 100);
            }, 0);
            const globalMarkupAmt = costTotal * (quoteMarkup / 100);
            const subtotal  = costTotal + globalMarkupAmt;
            const tps  = subtotal * 0.05;
            const tvq  = subtotal * 0.09975;
            const total = subtotal + tps + tvq;
            const fmt = v => v.toLocaleString('fr-CA', { minimumFractionDigits: 2 }) + ' $';
            const hasPerLineMarkup = quoteBuilderItems.some(it => Number(it.markup) > 0);
            return (
              <div style={{ marginTop: 8, paddingTop: 16, borderTop: '2px solid #E8EAED', display: 'flex', justifyContent: 'flex-end' }}>
                <div style={{ width: 340 }}>
                  {hasPerLineMarkup && (
                    <div style={{ display: 'flex', justifyContent: 'space-between', padding: '3px 0', fontSize: 11, color: '#6B7280' }}>
                      <span>Coût brut</span><span>{fmt(costRaw)}</span>
                    </div>
                  )}
                  <div style={{ display: 'flex', justifyContent: 'space-between', padding: '3px 0', fontSize: 12, color: '#374151' }}>
                    <span>Coût total{hasPerLineMarkup ? ' (avec markups lignes)' : ''}</span><span>{fmt(costTotal)}</span>
                  </div>
                  {/* Global markup */}
                  <div style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '5px 0', borderTop: '1px dashed #E8EAED', marginTop: 4 }}>
                    <span style={{ fontSize: 11, color: '#6B7280', flex: 1 }}>Markup global</span>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 3, background: `${BRAND}10`, borderRadius: 6, padding: '2px 8px' }}>
                      <input type="number" min="0" max="300" step="1" value={quoteMarkup}
                        disabled={salesLocked}
                        onChange={e => { const v = Number(e.target.value); setQuoteMarkup(v); localStorage.setItem('monflux-quote-markup', v); setUiPref('quote_markup', v); }}
                        style={{ width: 40, fontSize: 12, fontWeight: 700, border: 'none', background: 'transparent', outline: 'none', textAlign: 'right', color: BRAND, fontFamily: 'inherit' }}/>
                      <span style={{ fontSize: 11, color: BRAND }}>%</span>
                    </div>
                    {globalMarkupAmt > 0 && <span style={{ fontSize: 12, color: BRAND, fontWeight: 600 }}>+ {fmt(globalMarkupAmt)}</span>}
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', padding: '7px 0 3px', fontSize: 13, fontWeight: 700, color: '#111827', borderTop: '1px solid #E8EAED', marginTop: 2 }}>
                    <span>Sous-total</span><span>{fmt(subtotal)}</span>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', padding: '2px 0', fontSize: 11, color: '#6B7280' }}>
                    <span>TPS (5%)</span><span>{fmt(tps)}</span>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', padding: '2px 0', fontSize: 11, color: '#6B7280' }}>
                    <span>TVQ (9,975%)</span><span>{fmt(tvq)}</span>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', padding: '9px 0 3px', fontSize: 17, fontWeight: 900, color: '#111827', borderTop: '2px solid #E8EAED', marginTop: 6 }}>
                    <span>Total</span><span style={{ color: BRAND }}>{fmt(total)}</span>
                  </div>
                </div>
              </div>
            );
          })()}

          {/* Actions devis */}
          <div style={{ marginTop: 16, display: 'flex', gap: 8, flexWrap: 'wrap' }}>
            {quoteBuilderItems.length > 0 && quoteBuilderQuote?.status !== 'sent' && quoteBuilderQuote?.status !== 'signed' && (
              <button className="btn-primary text-xs py-2" onClick={sendQuoteToClient} disabled={quoteSending || !quoteBuilderQuote}>
                {quoteSending ? <Loader2 size={13} className="animate-spin"/> : <Send size={13}/>} Envoyer au client
              </button>
            )}
            {quoteBuilderQuote && (
              <button className="btn-secondary text-xs py-2" onClick={() => {
                const cols = ['qty','unit','unit_price'].filter(c => isPdfColOn(c)).join(',');
                const url = pdf.quoteUrl(quoteBuilderQuote.id) + (cols ? `&cols=${cols}` : '&cols=qty,unit,unit_price');
                setPreview({ url, title: 'Soumission' });
              }}>
                <Eye size={13}/> Aperçu PDF
              </button>
            )}
            {quoteBuilderQuote?.status === 'sent' && (
              <p className="text-xs text-blue-500 flex items-center gap-1"><CheckCircle size={12}/> Soumission envoyée au client.</p>
            )}
          </div>

          {/* ── Contrat — inline sous le devis ── */}
          <div id="s-contracts" style={{ marginTop: 48, paddingTop: 36, borderTop: '2px dashed #E8EAED' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 20 }}>
              <div style={{ width: 38, height: 38, borderRadius: 10, background: '#F5F3FF', border: '1px solid #DDD6FE', display: 'grid', placeItems: 'center', fontSize: 18, flexShrink: 0 }}>✍️</div>
              <div style={{ flex: 1 }}>
                <h3 style={{ fontSize: 20, fontWeight: 800, color: '#15171C', margin: 0, letterSpacing: '-.01em' }}>Contrat</h3>
                <p style={{ fontSize: 12, color: '#9CA3AF', margin: 0 }}>Document éditable lié automatiquement au type de projet et synchronisé avec le devis</p>
              </div>
              {projectContracts.length > 0 && <span className="badge badge-green text-xs">{projectContracts.length} contrat(s)</span>}
            </div>

            {projectContracts.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '32px 0', color: '#9CA3AF', background: '#FAFAFA', borderRadius: 12, border: '1px dashed #E5E7EB' }}>
                <FileSignature size={24} style={{ margin: '0 auto 8px', color: '#D1D5DB' }}/>
                <p style={{ fontSize: 13, color: '#6B7280', margin: '0 0 4px', fontWeight: 600 }}>
                  {quoteBuilderQuote ? 'Préparation du contrat…' : 'Le contrat sera créé avec le devis'}
                </p>
                <p style={{ fontSize: 12, color: '#9CA3AF', margin: 0 }}>
                  {quoteBuilderQuote ? `Modèle détecté automatiquement : ${selectedContractTemplate?.label || 'Contrat lié au projet'}.` : 'Le contrat apparaîtra automatiquement dès que le devis existe.'}
                </p>
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                {projectContracts.map(c => {
                  const isSending = contractSendingId === c.id;
                  const isOpen = showContractContent === c.id;
                  const isSaving = contractSavingId === c.id;
                  const isEnriching = contractEnrichingId === c.id;
                  const draft = contractDrafts[c.id] || { title: c.title || '', content: normalizeContractHtml(c.content) };
                  const statusColor = { draft: '#6B7280', sent: '#2563EB', signed: '#16A34A', cancelled: '#9CA3AF' };
                  const statusLabel = { draft: 'Brouillon', sent: 'Envoyé', signed: 'Signé ✓', cancelled: 'Annulé' };
                  return (
                    <div key={c.id} style={{ border: '1px solid #E5E7EB', borderRadius: 12, overflow: 'hidden', background: '#fff' }}>
                      {/* En-tête contrat */}
                      <div style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '12px 16px', background: '#FAFAFA', borderBottom: isOpen ? '1px solid #E5E7EB' : 'none' }}>
                        <div style={{ flex: 1 }}>
                          <p style={{ fontSize: 13, fontWeight: 700, color: '#111827', margin: 0 }}>{c.title}</p>
                          <p style={{ fontSize: 11, color: '#9CA3AF', margin: 0 }}>
                            {new Date(c.created_at).toLocaleDateString('fr-CA', { year: 'numeric', month: 'long', day: 'numeric' })}
                            {c.meta?.template_label ? ` · ${c.meta.template_label}` : ''}
                          </p>
                        </div>
                        <span style={{ fontSize: 10, fontWeight: 700, color: statusColor[c.status] || '#6B7280', background: `${statusColor[c.status]}15`, padding: '3px 8px', borderRadius: 6, textTransform: 'uppercase', letterSpacing: '.06em' }}>
                          {statusLabel[c.status] || c.status}
                        </span>
                        <div style={{ display: 'flex', gap: 6 }}>
                          <button className="btn-secondary text-xs py-1" onClick={() => setShowContractContent(isOpen ? null : c.id)}>
                            <Eye size={11}/> {isOpen ? 'Masquer' : 'Ouvrir'}
                          </button>
                          {c.status === 'draft' && (
                            <button className="btn-secondary text-xs py-1" onClick={() => enrichContractWithFlo(c.id)} disabled={isEnriching}>
                              {isEnriching ? <Loader2 size={11} className="animate-spin"/> : <Sparkles size={11}/>} Flo
                            </button>
                          )}
                          {c.status === 'draft' && (
                            <button className="btn-primary text-xs py-1" onClick={() => sendContract(c.id)} disabled={isSending}>
                              {isSending ? <Loader2 size={11} className="animate-spin"/> : <Send size={11}/>} Envoyer
                            </button>
                          )}
                          <button className="btn-ghost text-xs py-1 text-gray-300 hover:text-red-500" onClick={() => deleteContract(c.id)}>
                            <Trash2 size={11}/>
                          </button>
                        </div>
                      </div>
                      {c.status === 'signed' && (
                        <div style={{ padding: '8px 16px', background: '#F0FFF4', borderBottom: isOpen ? '1px solid #E5E7EB' : 'none' }}>
                          <p style={{ fontSize: 11, color: '#16A34A', margin: 0, display: 'flex', alignItems: 'center', gap: 6 }}>
                            <CheckCircle size={11}/> Signé par {c.signer_name} le {new Date(c.signed_at).toLocaleDateString('fr-CA')}
                          </p>
                        </div>
                      )}
                      {/* Contenu du contrat — affiché inline */}
                      {isOpen && (
                        <div style={{ padding: '20px 24px', background: '#FCFCFD' }}>
                          <div style={{ display: 'flex', gap: 10, alignItems: 'center', marginBottom: 14 }}>
                            <input
                              className="input"
                              value={draft.title}
                              onChange={(e) => updateContractDraft(c.id, { title: e.target.value })}
                              placeholder="Titre du contrat"
                              style={{ flex: 1, fontWeight: 700 }}
                            />
                            {c.status === 'draft' && (
                              <button className="btn-primary text-xs" onClick={() => saveContractDraft(c.id)} disabled={isSaving}>
                                {isSaving ? <Loader2 size={12} className="animate-spin"/> : <Save size={12} />} Enregistrer
                              </button>
                            )}
                          </div>
                          <div style={{ background: '#fff', border: '1px solid #E5E7EB', borderRadius: 14, padding: '28px 34px', boxShadow: '0 8px 24px rgba(15,23,42,.04)' }}>
                            <div
                              contentEditable={c.status === 'draft'}
                              suppressContentEditableWarning
                              onInput={(e) => updateContractDraft(c.id, { content: e.currentTarget.innerHTML })}
                              dangerouslySetInnerHTML={{ __html: draft.content }}
                              style={{
                                minHeight: 320,
                                outline: 'none',
                                fontSize: 13,
                                color: '#374151',
                                lineHeight: 1.8,
                                fontFamily: "'Georgia', serif",
                              }}
                            />
                          </div>
                        </div>
                      )}
                      {c.status === 'draft' && (
                        <div style={{ padding: '10px 16px', background: '#FFFBEB', borderTop: '1px solid #FEF3C7', display: 'flex', gap: 8, alignItems: 'flex-start' }}>
                          <AlertCircle size={12} style={{ color: '#D97706', flexShrink: 0, marginTop: 1 }}/>
                          <p style={{ fontSize: 11, color: '#92400E', margin: 0, lineHeight: 1.5 }}>
                            Brouillon modifiable en mode document. Flo peut enrichir le contexte avant l’envoi au client.
                          </p>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </ProjectSection>


  );
}
