import React from 'react';
import { Camera, CheckCheck, CheckCircle, Copy, Loader2, Send, Sparkles } from 'lucide-react';
import ProjectSection from '../../ProjectSection';

export default function ProjectEstimationSection(props) {
  const {
    sectionSummaries,
    sectionExpanded,
    toggleProjectSection,
    salesLocked,
    sectionGuard,
    BRAND,
    BRAND_DARK,
    estimTab,
    setEstimTab,
    searchMaterialPrices,
    searchingPrices,
    addLine,
    hasSuggested,
    addSuggestedLines,
    workTypeVal,
    approxLines,
    money,
    updateLine,
    removeLine,
    totalCout,
    totalVente,
    totalMarkup,
    aiEstimNotice,
    setAiEstimNotice,
    floEstimPrompt,
    setFloEstimPrompt,
    sendClientMessage,
    estimatePdfPreview,
    setEstimatePdfPreview,
    estimateSendBusy,
    sendEstimateByEmail,
    estimateCopied,
    copyEstimateToClipboard,
    allVisiteQs,
    visiteAnswers,
    saveVisite,
    visiteAnswered,
    selectedTrades,
    saveTrades,
    TRADES_FOR_SITE_VISIT,
    InlineField,
    project,
    saveField,
    formatCompactDate,
  } = props;

  return (
            <ProjectSection
              sectionId="s-estimation"
              icon="📊"
              title="Estimation approximative"
              summary={sectionSummaries['s-estimation']?.summary}
              stats={sectionSummaries['s-estimation']?.stats}
              expanded={!!sectionExpanded['s-estimation']}
              onToggle={() => toggleProjectSection('s-estimation')}
              background="#E9F3EC"
              bodyStyle={{ opacity: salesLocked ? 0.7 : 1, pointerEvents: salesLocked ? 'none' : 'auto' }}
            >
              {sectionGuard('s-estimation')}

              {/* Bannière profil métier */}
              <div style={{ padding: '10px 16px', background: 'rgba(232,121,78,.08)', border: '1px solid rgba(232,121,78,.2)', borderRadius: 10, marginBottom: 20, fontSize: 13, color: '#92400E', display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
                <Sparkles size={14} color={BRAND}/>
                <span>Adapté à ton profil :</span>
                <b style={{ color: BRAND }}>Entrepreneur général</b>
              </div>

              {/* Onglets — 2 niveaux */}
              <div style={{ marginBottom: 24, display: 'flex', flexDirection: 'column', gap: 3 }}>
                {/* Rangée haute : Message client + Visite sur place */}
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', background: 'rgba(255,255,255,.7)', borderRadius: 12, padding: 3, gap: 2, border: '1px solid rgba(0,0,0,.06)' }}>
                  {[
                    { k: 'voieB', label: '💬 Message client' },
                    { k: 'voieC', label: '🏗 Visite sur place' },
                  ].map(({ k, label }) => (
                    <button key={k} type="button" onClick={() => setEstimTab(k)}
                      style={{ border: 'none', borderRadius: 9, padding: '9px 14px', fontSize: 12.5, fontWeight: 700, cursor: 'pointer', transition: 'all .15s',
                        background: estimTab === k ? '#fff' : 'transparent',
                        color: estimTab === k ? BRAND_DARK : '#7C8089',
                        boxShadow: estimTab === k ? '0 1px 4px rgba(0,0,0,.1)' : 'none',
                      }}>{label}</button>
                  ))}
                </div>
                {/* Rangée basse : Recherche IA Florence */}
                <div style={{ background: 'rgba(255,255,255,.7)', borderRadius: 12, padding: 3, border: '1px solid rgba(0,0,0,.06)' }}>
                  <button type="button" onClick={() => setEstimTab('voieA')}
                    style={{ width: '100%', border: 'none', borderRadius: 9, padding: '9px 14px', fontSize: 12.5, fontWeight: 700, cursor: 'pointer', transition: 'all .15s', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 7,
                      background: estimTab === 'voieA' ? '#fff' : 'transparent',
                      color: estimTab === 'voieA' ? BRAND_DARK : '#7C8089',
                      boxShadow: estimTab === 'voieA' ? '0 1px 4px rgba(0,0,0,.1)' : 'none',
                    }}>
                    <Sparkles size={13} color={estimTab === 'voieA' ? BRAND : '#9CA3AF'}/> Estimation approximative
                  </button>
                </div>
              </div>

              {/* ── Voie A — Tableau d'estimation + IA ── */}
              {estimTab === 'voieA' && (
                <div>
                  <div style={{ background: 'rgba(255,255,255,.9)', borderRadius: 12, border: '1px solid #E8EAED', overflow: 'auto' }}>
                    {/* Entêtes tableau */}
                    <div style={{ display: 'grid', gridTemplateColumns: '1.6fr 1fr 1.3fr 1.3fr 0.7fr 0.75fr 0.85fr 0.55fr 24px', gap: 0, background: '#F8FAFB', borderBottom: '1px solid #E8EAED', padding: '8px 14px', minWidth: 700 }}>
                      {['POSTE','SOURCE','INCLUS','NON INCLUS','DURÉE','COÛT','PRIX VENTE','MARKUP',''].map((h, i) => (
                        <span key={i} style={{ fontSize: 9.5, fontWeight: 800, letterSpacing: '.08em', color: '#9CA3AF', textTransform: 'uppercase' }}>{h}</span>
                      ))}
                    </div>

                    {approxLines.length === 0 && (
                      <div style={{ padding: '28px 20px', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 14, background: 'rgba(248,250,251,.6)' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '12px 18px', background: '#fff', borderRadius: 11, border: `1px solid rgba(232,121,78,.25)`, width: '100%', maxWidth: 520, boxSizing: 'border-box' }}>
                          <Sparkles size={16} color={BRAND}/>
                          <div style={{ flex: 1 }}>
                            <p style={{ fontSize: 12.5, fontWeight: 700, color: '#15171C', margin: 0 }}>Laisser Florence remplir automatiquement</p>
                            <p style={{ fontSize: 11, color: '#7C8089', margin: 0 }}>Florence analyse les projets similaires et les prix Rona, Canac, Home Dépôt, BMR.</p>
                          </div>
                          <button className="btn-primary text-xs" style={{ flexShrink: 0, whiteSpace: 'nowrap' }} onClick={searchMaterialPrices} disabled={searchingPrices}>
                            {searchingPrices ? <Loader2 size={12} className="animate-spin"/> : <Sparkles size={12}/>}
                            {searchingPrices ? 'Analyse…' : 'Rechercher les prix'}
                          </button>
                        </div>
                        <p style={{ fontSize: 12, color: '#9CA3AF', margin: 0 }}>— ou —</p>
                        <div style={{ display: 'flex', gap: 8 }}>
                          <button onClick={addLine} style={{ background: '#fff', border: '1px solid #E0E4E8', borderRadius: 8, cursor: 'pointer', fontSize: 12.5, color: BRAND, fontWeight: 700, padding: '7px 14px' }}>+ Ajouter une ligne vide</button>
                          {hasSuggested && (
                            <button onClick={addSuggestedLines} style={{ background: BRAND, border: 'none', borderRadius: 8, cursor: 'pointer', fontSize: 12.5, color: '#fff', fontWeight: 700, padding: '7px 14px' }}>
                              ✦ Lignes types — {workTypeVal || 'projet'}
                            </button>
                          )}
                        </div>
                      </div>
                    )}

                    {approxLines.map(line => {
                      const markup = (Number(line.cout) > 0 && Number(line.prix_vente) > 0)
                        ? Math.round((Number(line.prix_vente) - Number(line.cout)) / Number(line.cout) * 100) : null;
                      return (
                        <div key={line.id} style={{ display: 'grid', gridTemplateColumns: '1.6fr 1fr 1.3fr 1.3fr 0.7fr 0.75fr 0.85fr 0.55fr 24px', gap: 0, borderBottom: '1px solid #F4F5F6', padding: '5px 14px', alignItems: 'center', minWidth: 700 }}>
                          {[
                            { field:'poste', ph:'Démolition…' },
                            { field:'source', ph:'Historique / fournisseur' },
                            { field:'inclus', ph:'Ce qui est inclus' },
                            { field:'non_inclus', ph:'Non inclus' },
                            { field:'duree', ph:'3 j' },
                            { field:'cout', ph:'0', t:'number' },
                            { field:'prix_vente', ph:'0', t:'number' },
                          ].map(({ field, ph, t }) => (
                            <input key={field} type={t||'text'} value={line[field]||''} onChange={e=>updateLine(line.id,field,e.target.value)} placeholder={ph}
                              style={{ border:'none', background:'transparent', fontSize:12.5, color:'#15171C', padding:'3px 4px 3px 0', outline:'none', width:'100%', minWidth:0, fontFamily:'inherit' }}/>
                          ))}
                          <span style={{ fontSize:11.5, fontWeight:700, color: markup > 0 ? '#16a34a' : '#9CA3AF' }}>{markup !== null ? `+${markup}%` : '—'}</span>
                          <button onClick={() => removeLine(line.id)} style={{ border:'none', background:'none', cursor:'pointer', color:'#C8CACD', padding:0, display:'flex', alignItems:'center' }}><X size={13}/></button>
                        </div>
                      );
                    })}

                    {/* Ligne total */}
                    {approxLines.length > 0 && (
                      <div style={{ display: 'grid', gridTemplateColumns: '1.6fr 1fr 1.3fr 1.3fr 0.7fr 0.75fr 0.85fr 0.55fr 24px', gap: 0, padding: '10px 14px', background: '#F8FAFB', borderTop: '2px solid #E0E4E8', alignItems: 'center', minWidth: 700 }}>
                        <span style={{ fontSize:12, fontWeight:800, color:'#15171C', gridColumn:'1/6' }}>TOTAL · Fourchette : {money(Math.round(totalVente * 0.87))} – {money(Math.round(totalVente * 1.13))}</span>
                        <span style={{ fontSize:13, fontWeight:800, color:'#15171C' }}>{money(totalCout)}</span>
                        <span style={{ fontSize:13, fontWeight:800, color:'#15171C' }}>{money(totalVente)}</span>
                        <span style={{ fontSize:12, fontWeight:800, color: totalMarkup > 0 ? '#16a34a' : '#9CA3AF' }}>+{totalMarkup}%</span>
                        <span/>
                      </div>
                    )}

                    {/* Footer tableau */}
                    {approxLines.length > 0 && (
                      <div style={{ padding: '10px 14px', borderTop: '1px solid #F0F2F4', display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap' }}>
                        <button onClick={addLine} style={{ background:'none', border:'none', cursor:'pointer', fontSize:13, color:BRAND, fontWeight:700, padding:0, display:'flex', alignItems:'center', gap:6 }}>
                          + Ajouter une ligne
                        </button>
                        {hasSuggested && (
                          <button onClick={addSuggestedLines} style={{ background:'none', border:`1px solid rgba(232,121,78,.35)`, borderRadius:7, cursor:'pointer', fontSize:12, color:BRAND, fontWeight:600, padding:'3px 10px', display:'flex', alignItems:'center', gap:5 }}>
                            ✦ Lignes types {workTypeVal ? `— ${workTypeVal}` : ''}
                          </button>
                        )}
                        <button onClick={searchMaterialPrices} disabled={searchingPrices} style={{ marginLeft:'auto', background:'none', border:`1px solid rgba(232,121,78,.35)`, borderRadius:7, cursor:'pointer', fontSize:12, color:BRAND, fontWeight:600, padding:'3px 10px', display:'flex', alignItems:'center', gap:5 }}>
                          {searchingPrices ? <Loader2 size={11} className="animate-spin"/> : <Sparkles size={11}/>}
                          {searchingPrices ? 'Florence analyse…' : 'Demander à Florence'}
                        </button>
                      </div>
                    )}
                  </div>

                  {searchingPrices && (
                    <div style={{ marginTop:10, padding:'12px 16px', background:'rgba(232,121,78,.06)', borderRadius:10, border:`1px solid rgba(232,121,78,.2)`, display:'flex', alignItems:'center', gap:10, fontSize:12.5, color:BRAND }}>
                      <Loader2 size={14} className="animate-spin"/>
                      Florence recherche les prix du marché québécois…
                    </div>
                  )}
                  {aiPriceResult && (
                    <div style={{ marginTop:12, background:'#fff', borderRadius:12, border:'1px solid #E8EAED', overflow:'hidden', fontSize:12.5 }}>

                      {/* Note de Florence */}
                      {aiPriceResult.comments && (
                        <div style={{ padding:'12px 18px', color:'#3A3D44', lineHeight:1.65, borderBottom:'1px solid #F0F2F4' }}>
                          <span style={{ fontSize:9.5, fontWeight:800, textTransform:'uppercase', letterSpacing:'.1em', color:'#9CA3AF', display:'block', marginBottom:5 }}>Note de Florence</span>
                          {aiPriceResult.comments}
                        </div>
                      )}

                      {/* Tableau 3 scénarios */}
                      {aiPriceResult.scenarios?.length > 0 && (
                        <div style={{ borderBottom:'1px solid #F0F2F4' }}>
                          <div style={{ padding:'10px 18px 6px', display:'flex', alignItems:'center', gap:6 }}>
                            <span style={{ fontSize:9.5, fontWeight:800, textTransform:'uppercase', letterSpacing:'.1em', color:'#9CA3AF' }}>3 scénarios de prix</span>
                          </div>
                          <table style={{ width:'100%', borderCollapse:'collapse' }}>
                            <thead>
                              <tr style={{ background:'#F8FAFB', borderBottom:'1px solid #E8EAED' }}>
                                {['Scénario','Description','Coût de revient','Prix de vente','Marge'].map(h => (
                                  <th key={h} style={{ padding:'7px 14px', fontSize:9.5, fontWeight:800, textTransform:'uppercase', letterSpacing:'.08em', color:'#9CA3AF', textAlign:'left', whiteSpace:'nowrap' }}>{h}</th>
                                ))}
                              </tr>
                            </thead>
                            <tbody>
                              {aiPriceResult.scenarios.map((s, i) => {
                                const marge = s.cout > 0 ? Math.round((s.prix_vente - s.cout) / s.cout * 100) : 0;
                                const rowBg = i === 1 ? 'rgba(232,121,78,.04)' : '#fff';
                                const nomColor = i === 0 ? '#6B7280' : i === 1 ? BRAND : '#7C3AED';
                                return (
                                  <tr key={s.nom} style={{ background: rowBg, borderBottom:'1px solid #F4F5F6' }}>
                                    <td style={{ padding:'9px 14px', fontWeight:800, color: nomColor, whiteSpace:'nowrap' }}>{s.nom}</td>
                                    <td style={{ padding:'9px 14px', color:'#4B5563', lineHeight:1.4 }}>{s.description}</td>
                                    <td style={{ padding:'9px 14px', fontWeight:700, color:'#15171C', whiteSpace:'nowrap' }}>{money(s.cout)}</td>
                                    <td style={{ padding:'9px 14px', fontWeight:800, color:'#15171C', whiteSpace:'nowrap' }}>{money(s.prix_vente)}</td>
                                    <td style={{ padding:'9px 14px', fontWeight:700, color:'#16a34a', whiteSpace:'nowrap' }}>+{marge}%</td>
                                  </tr>
                                );
                              })}
                            </tbody>
                          </table>
                        </div>
                      )}

                      {/* Sources cliquables (URLs construites côté client) */}
                      {aiPriceResult.sources?.length > 0 && (
                        <div style={{ padding:'10px 18px 12px' }}>
                          <span style={{ fontSize:9.5, fontWeight:800, textTransform:'uppercase', letterSpacing:'.1em', color:'#9CA3AF', display:'block', marginBottom:7 }}>Références de prix</span>
                          <div style={{ display:'flex', flexWrap:'wrap', gap:6 }}>
                            {aiPriceResult.sources.map((s, i) => (
                              <a key={i} href={s.url} target="_blank" rel="noopener noreferrer"
                                style={{ fontSize:11.5, color:BRAND, fontWeight:600, padding:'4px 11px', background:'rgba(232,121,78,.07)', borderRadius:20, textDecoration:'none', border:`1px solid rgba(232,121,78,.22)`, display:'inline-flex', alignItems:'center', gap:5, transition:'background .15s' }}
                                onMouseEnter={e => e.currentTarget.style.background='rgba(232,121,78,.15)'}
                                onMouseLeave={e => e.currentTarget.style.background='rgba(232,121,78,.07)'}>
                                🔗 {s.label} <span style={{ fontWeight:400, color:'#9CA3AF', fontSize:10.5 }}>· {s.fournisseur}</span>
                              </a>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              )}

              {/* ── Étape 1 — Message client + calculateur au pi²/m² ── */}
              {estimTab === 'voieB' && (
                <div style={{ display:'flex', flexDirection:'column', gap:16 }}>
                  {/* Message prérempli */}
                  <div style={{ background:'rgba(255,255,255,.9)', borderRadius:12, border:'1px solid #E8EAED', overflow:'hidden' }}>
                    <textarea ref={clientMsgRef}
                      key={project.client_name + '|' + project.portal_token}
                      style={{ width:'100%', minHeight:240, padding:'18px 20px', border:'none', fontSize:14, lineHeight:1.7, resize:'vertical', fontFamily:'inherit', background:'transparent', color:'#15171C', outline:'none', display:'block', boxSizing:'border-box' }}
                      defaultValue={`Bonjour ${project.client_name || '[Nom du client]'},\n\nMerci pour votre demande concernant ${project.description || project.name || 'votre projet'}.\n\nPour préparer une estimation approximative, j'aimerais en savoir un peu plus avant de vous faire parvenir un prix :\n\n1. Pouvez-vous décrire brièvement ce que vous souhaitez faire ?\n2. Avez-vous des photos de l'espace actuel (4 angles de chaque pièce) ?\n3. Quelle est la superficie approximative (pi² ou m²) ?\n4. Avez-vous un budget cible en tête ?\n5. Quel est votre échéancier souhaité ?\n${project.portal_token ? `\nVous pouvez suivre l'avancement de votre projet en temps réel via votre portail client :\n${FRONTEND_URL}/portal/${project.portal_token}\n` : ''}\nUne fois ces informations reçues, je pourrai vous transmettre une estimation approximative sous 24–48 h.\n\nN'hésitez pas à répondre à ce message ou à m'appeler au besoin.\n\nCordialement,\n${project.project_manager || '[Votre nom]'}`}
                    />
                    <div style={{ padding:'10px 16px', borderTop:'1px solid #F0F2F4', display:'flex', gap:8, flexWrap:'wrap', background:'#FAFBFC' }}>
                      <button className="btn-secondary text-xs"
                        onClick={() => { setClientMsgCopied(true); setTimeout(() => setClientMsgCopied(false), 2000); navigator.clipboard.writeText(clientMsgRef.current?.value || ''); }}>
                        {clientMsgCopied ? <CheckCheck size={13}/> : <Copy size={13}/>} {clientMsgCopied ? 'Copié !' : 'Copier le message'}
                      </button>
                      <button className="btn-secondary text-xs"
                        onClick={() => { const body = encodeURIComponent(clientMsgRef.current?.value || ''); window.open(`mailto:${project.client_email || ''}?subject=${encodeURIComponent('Demande d\'informations — ' + project.name)}&body=${body}`,'_blank'); }}
                        disabled={!project.client_email}>
                        ✉️ Envoyer par courriel
                      </button>
                      <button className="btn-secondary text-xs"
                        onClick={() => window.open(`sms:${project.client_phone?.replace(/\D/g,'')}?body=${encodeURIComponent(clientMsgRef.current?.value||'')}`, '_blank')}
                        disabled={!project.client_phone}>
                        📱 Par SMS
                      </button>
                    </div>
                  </div>

                  {/* Checklist photos */}
                  <div style={{ background:'rgba(255,255,255,.9)', borderRadius:12, border:'1px solid #E8EAED', padding:'16px 20px' }}>
                    <p style={{ fontSize:12.5, fontWeight:800, color:'#15171C', margin:'0 0 12px', display:'flex', alignItems:'center', gap:8 }}>📷 CHECKLIST PHOTOS DEMANDÉES</p>
                    {['Ensemble de chaque pièce (4 angles)', 'Points d\'eau (évier, douche, WC)', 'Panneau électrique ouvert', 'Sous-sol ou vide sanitaire', 'Toiture / gouttières (de l\'extérieur)'].map((item, i) => (
                      <label key={i} style={{ display:'flex', alignItems:'center', gap:10, fontSize:13, color:'#3A3D44', marginBottom:8, cursor:'pointer' }}>
                        <input type="checkbox" style={{ accentColor:BRAND, width:15, height:15 }}/> {item}
                      </label>
                    ))}
                  </div>

                  {/* Calculateur au pi²/m² */}
                  <div style={{ background:'rgba(255,255,255,.9)', borderRadius:12, border:'1px solid #E8EAED', padding:'18px 20px' }}>
                    <p style={{ fontSize:13, fontWeight:800, color:'#15171C', margin:'0 0 14px', display:'flex', alignItems:'center', gap:8 }}>
                      📐 Calculateur de prix approximatif
                    </p>
                    <div style={{ display:'flex', flexWrap:'wrap', gap:12, alignItems:'flex-end' }}>
                      <div>
                        <p style={{ fontSize:10, fontWeight:700, textTransform:'uppercase', letterSpacing:'.07em', color:'#9CA3AF', margin:'0 0 5px' }}>Unité</p>
                        <div style={{ display:'inline-flex', background:'#F4F5F6', borderRadius:8, padding:2, gap:2 }}>
                          {[['sqft','pi²'],['sqm','m²']].map(([u,lbl]) => (
                            <button key={u} onClick={() => setSqUnit(u)}
                              style={{ border:'none', borderRadius:6, padding:'5px 12px', fontSize:12.5, fontWeight:700, cursor:'pointer', transition:'all .12s',
                                background: sqUnit===u ? '#fff' : 'transparent', color: sqUnit===u ? '#15171C' : '#9CA3AF',
                                boxShadow: sqUnit===u ? '0 1px 3px rgba(0,0,0,.08)' : 'none' }}>{lbl}</button>
                          ))}
                        </div>
                      </div>
                      <div>
                        <p style={{ fontSize:10, fontWeight:700, textTransform:'uppercase', letterSpacing:'.07em', color:'#9CA3AF', margin:'0 0 5px' }}>Tarif par {sqUnit==='sqft'?'pi²':'m²'}</p>
                        <div style={{ display:'flex', alignItems:'center', gap:4 }}>
                          <span style={{ fontSize:13, color:'#9CA3AF' }}>$</span>
                          <input type="number" min="0" step="0.5" value={sqRate} onChange={e=>setSqRate(e.target.value)} placeholder="Ex. 75"
                            style={{ width:90, padding:'6px 10px', border:'1px solid #E8EAED', borderRadius:8, fontSize:13, fontFamily:'inherit', outline:'none', color:'#15171C' }}/>
                        </div>
                      </div>
                      <div>
                        <p style={{ fontSize:10, fontWeight:700, textTransform:'uppercase', letterSpacing:'.07em', color:'#9CA3AF', margin:'0 0 5px' }}>Superficie ({sqUnit==='sqft'?'pi²':'m²'})</p>
                        <input type="number" min="0" value={sqArea} onChange={e=>setSqArea(e.target.value)} placeholder={sqUnit==='sqft'?'Ex. 1 200':'Ex. 110'}
                          style={{ width:110, padding:'6px 10px', border:'1px solid #E8EAED', borderRadius:8, fontSize:13, fontFamily:'inherit', outline:'none', color:'#15171C' }}/>
                      </div>
                      {sqRate && sqArea && Number(sqRate) > 0 && Number(sqArea) > 0 && (() => {
                        const base = Number(sqRate) * Number(sqArea);
                        return (
                          <div style={{ background:`linear-gradient(135deg,#F0A884,${BRAND})`, borderRadius:10, padding:'10px 16px', color:'#fff', minWidth:200 }}>
                            <p style={{ fontSize:10, fontWeight:700, textTransform:'uppercase', letterSpacing:'.07em', color:'rgba(255,255,255,.8)', margin:'0 0 3px' }}>Estimation approximative</p>
                            <p style={{ fontSize:22, fontWeight:900, margin:0 }}>{money(Math.round(base))}</p>
                            <p style={{ fontSize:11, color:'rgba(255,255,255,.85)', margin:'2px 0 0' }}>Fourchette : {money(Math.round(base*.85))} – {money(Math.round(base*1.15))}</p>
                          </div>
                        );
                      })()}
                    </div>
                  </div>
                </div>
              )}

              {/* ── Étape 3 — Visite sur place ── */}
              {estimTab === 'voieC' && (
                <div style={{ display:'flex', flexDirection:'column', gap:12 }}>

                  {/* Question 1 — Corps de métier (multi-select) */}
                  <div style={{ background:'rgba(255,255,255,.9)', borderRadius:12, border:'1px solid #E8EAED', padding:'16px 20px' }}>
                    <div style={{ display:'flex', alignItems:'center', gap:10, marginBottom:12 }}>
                      <span style={{ width:24, height:24, borderRadius:8, background:`${BRAND}22`, color:BRAND, fontWeight:900, fontSize:13, display:'grid', placeItems:'center', flexShrink:0 }}>1</span>
                      <p style={{ fontSize:14, fontWeight:700, color:'#15171C', margin:0 }}>Quels corps de métier sont impliqués ?</p>
                    </div>
                    <div style={{ display:'flex', flexWrap:'wrap', gap:7 }}>
                      {ALL_TRADES.map(t => {
                        const isSelected = selectedTrades.includes(t.key);
                        return (
                          <button key={t.key} type="button"
                            onClick={() => saveTrades(isSelected ? selectedTrades.filter(k=>k!==t.key) : [...selectedTrades, t.key])}
                            style={{ padding:'6px 13px', borderRadius:20, fontSize:12.5, border:'1.5px solid', cursor:'pointer', fontWeight:600, transition:'all .12s',
                              background: isSelected ? BRAND : '#fff',
                              borderColor: isSelected ? BRAND : '#E0E4E8',
                              color: isSelected ? '#fff' : '#3A3D44' }}>
                            {t.emoji} {t.label}
                          </button>
                        );
                      })}
                    </div>
                  </div>

                  {/* Questions universelles + spécifiques au type de travaux */}
                  {allVisiteQs.map((q, qi) => {
                    const curVal = visiteAnswers[q.id] || null;
                    const isAutre = curVal && !q.opts.includes(curVal);
                    return (
                      <div key={q.id} style={{ background:'rgba(255,255,255,.9)', borderRadius:12, border:'1px solid #E8EAED', padding:'16px 20px' }}>
                        <div style={{ display:'flex', alignItems:'center', gap:10, marginBottom:10 }}>
                          <span style={{ width:24, height:24, borderRadius:8, background: curVal ? '#DCFCE7' : `${BRAND}22`, color: curVal ? '#16a34a' : BRAND, fontWeight:900, fontSize:13, display:'grid', placeItems:'center', flexShrink:0 }}>
                            {curVal ? '✓' : qi + 2}
                          </span>
                          <p style={{ fontSize:14, fontWeight:700, color:'#15171C', margin:0 }}>{q.q}</p>
                        </div>
                        <div style={{ display:'flex', flexWrap:'wrap', gap:7 }}>
                          {q.opts.map(opt => (
                            <button key={opt} type="button"
                              onClick={() => saveVisite({ [q.id]: curVal === opt ? null : opt })}
                              style={{ padding:'6px 13px', borderRadius:8, fontSize:12.5, border:'1.5px solid', cursor:'pointer', fontWeight:600, transition:'all .12s',
                                background: curVal === opt ? BRAND : '#fff',
                                borderColor: curVal === opt ? BRAND : '#E0E4E8',
                                color: curVal === opt ? '#fff' : '#3A3D44' }}>
                              {opt}
                            </button>
                          ))}
                          {/* Option Autre */}
                          <button type="button"
                            onClick={() => {
                              if (isAutre) { saveVisite({ [q.id]: null }); setAutreTexts(t => ({ ...t, [q.id]: '' })); }
                              else { setAutreTexts(t => ({ ...t, [q.id]: '' })); saveVisite({ [q.id]: 'Autre' }); }
                            }}
                            style={{ padding:'6px 13px', borderRadius:8, fontSize:12.5, border:'1.5px solid', cursor:'pointer', fontWeight:600, transition:'all .12s',
                              background: isAutre ? BRAND : '#fff',
                              borderColor: isAutre ? BRAND : '#E0E4E8',
                              color: isAutre ? '#fff' : '#3A3D44' }}>
                            Autre
                          </button>
                        </div>
                        {/* Texte libre si Autre sélectionné */}
                        {(isAutre || curVal === 'Autre') && (
                          <div style={{ marginTop:8, display:'flex', gap:6 }}>
                            <input
                              autoFocus
                              value={isAutre && curVal !== 'Autre' ? curVal : (autreTexts[q.id] || '')}
                              onChange={e => setAutreTexts(t => ({ ...t, [q.id]: e.target.value }))}
                              onBlur={e => { if (e.target.value.trim()) saveVisite({ [q.id]: e.target.value.trim() }); }}
                              onKeyDown={e => { if (e.key === 'Enter' && e.target.value.trim()) { saveVisite({ [q.id]: e.target.value.trim() }); e.target.blur(); } }}
                              placeholder="Précisez…"
                              style={{ flex:1, padding:'6px 10px', border:'1px solid #E0E4E8', borderRadius:8, fontSize:12.5, fontFamily:'inherit', outline:'none' }}
                            />
                          </div>
                        )}
                      </div>
                    );
                  })}

                  {/* Superficie + observations */}
                  <div style={{ background:'rgba(255,255,255,.9)', borderRadius:12, border:'1px solid #E8EAED', padding:'16px 20px' }}>
                    <div style={{ display:'flex', alignItems:'center', gap:10, marginBottom:12 }}>
                      <span style={{ width:24, height:24, borderRadius:8, background:`${BRAND}22`, color:BRAND, fontWeight:900, fontSize:13, display:'grid', placeItems:'center', flexShrink:0 }}>{allVisiteQs.length + 2}</span>
                      <p style={{ fontSize:14, fontWeight:700, color:'#15171C', margin:0 }}>Superficie totale à rénover</p>
                    </div>
                    <div style={{ display:'flex', gap:10, alignItems:'center', marginBottom:12 }}>
                      <input type="number" placeholder="Ex. 1 200" className="input" style={{ maxWidth:130 }}
                        value={visiteAnswers.area || ''} onChange={e => saveVisite({ area: e.target.value })}/>
                      <div style={{ display:'inline-flex', background:'#F4F5F6', borderRadius:8, padding:2 }}>
                        {[['sqft','pi²'],['sqm','m²']].map(([u,lbl]) => (
                          <button key={u} onClick={() => saveVisite({ area_unit: u })}
                            style={{ border:'none', borderRadius:6, padding:'4px 10px', fontSize:12, fontWeight:700, cursor:'pointer',
                              background: (visiteAnswers.area_unit||'sqft')===u ? '#fff' : 'transparent',
                              color: (visiteAnswers.area_unit||'sqft')===u ? '#15171C' : '#9CA3AF',
                              boxShadow: (visiteAnswers.area_unit||'sqft')===u ? '0 1px 3px rgba(0,0,0,.08)' : 'none' }}>
                            {lbl}
                          </button>
                        ))}
                      </div>
                    </div>
                    <p style={{ fontSize:13, fontWeight:700, color:'#15171C', margin:'0 0 6px' }}>Observations sur place</p>
                    <textarea className="input resize-none" rows={3} placeholder="Décrivez ce que vous observez…"
                      value={visiteAnswers.notes || ''} onChange={e => saveVisite({ notes: e.target.value })}/>
                  </div>

                  {/* Photos & documents sur place — scroll horizontal */}
                  <div style={{ background:'rgba(255,255,255,.9)', borderRadius:12, border:'1px solid #E8EAED', padding:'16px 20px' }}>
                    <div style={{ display:'flex', alignItems:'center', gap:10, marginBottom:10 }}>
                      <span style={{ width:24, height:24, borderRadius:8, background: media.length ? '#DCFCE7' : `${BRAND}22`, color: media.length ? '#16a34a' : BRAND, fontWeight:900, fontSize:13, display:'grid', placeItems:'center', flexShrink:0 }}>
                        {media.length ? '✓' : <Camera size={13}/>}
                      </span>
                      <p style={{ fontSize:14, fontWeight:700, color:'#15171C', margin:0 }}>Photos & documents sur place</p>
                      <button onClick={() => setShowCapture(true)}
                        style={{ marginLeft:'auto', fontSize:11.5, fontWeight:700, color:BRAND, background:'rgba(232,121,78,.08)', border:`1px solid rgba(232,121,78,.25)`, borderRadius:20, padding:'3px 11px', cursor:'pointer', display:'flex', alignItems:'center', gap:5 }}>
                        <Camera size={11}/> Ajouter
                      </button>
                    </div>
                    <div style={{ display:'flex', gap:10, overflowX:'auto', paddingBottom:4, WebkitOverflowScrolling:'touch', scrollbarWidth:'thin' }}>
                      {media.map(m => (
                        <div key={m.id} style={{ flexShrink:0, width:120, height:90, borderRadius:10, border:'1px solid #E8EAED', overflow:'hidden', background:'#F4F5F6', cursor:'pointer', position:'relative' }}
                          onClick={() => setLightboxItem(m)}>
                          {m.type==='photo' && m.url
                            ? <img src={m.url} alt={m.caption||''} style={{ width:'100%', height:'100%', objectFit:'cover' }}/>
                            : <div style={{ width:'100%', height:'100%', display:'grid', placeItems:'center', fontSize:28 }}>{m.type==='video'?'▶':'📌'}</div>}
                          {m.caption && <div style={{ position:'absolute', bottom:0, left:0, right:0, background:'rgba(0,0,0,.55)', color:'#fff', fontSize:9.5, padding:'3px 6px', textOverflow:'ellipsis', overflow:'hidden', whiteSpace:'nowrap' }}>{m.caption}</div>}
                        </div>
                      ))}
                      {(project.documents || []).map(d => (
                        <div key={d.id} style={{ flexShrink:0, width:120, height:90, borderRadius:10, border:'1px solid #E8EAED', overflow:'hidden', background:'#F8FAFB', display:'flex', flexDirection:'column', alignItems:'center', justifyContent:'center', gap:4, cursor:'pointer', padding:8, boxSizing:'border-box' }}
                          onClick={() => setLightboxItem({ ...d, type:'doc' })}>
                          <span style={{ fontSize:28 }}>📄</span>
                          <span style={{ fontSize:9.5, color:'#4B5563', textAlign:'center', lineHeight:1.3, overflow:'hidden', maxWidth:'100%', textOverflow:'ellipsis', whiteSpace:'nowrap' }}>{d.name||d.filename||'Document'}</span>
                        </div>
                      ))}
                      <div style={{ flexShrink:0, width:90, height:90, borderRadius:10, border:`2px dashed rgba(232,121,78,.35)`, display:'flex', flexDirection:'column', alignItems:'center', justifyContent:'center', gap:4, cursor:'pointer', color:BRAND, background:'rgba(232,121,78,.04)' }}
                        onClick={() => setShowCapture(true)}>
                        <span style={{ fontSize:22 }}>+</span>
                        <span style={{ fontSize:10, fontWeight:700 }}>Ajouter</span>
                      </div>
                    </div>
                  </div>

                  {/* Barre de progression + action */}
                  {visiteAnswered > 0 && (
                    <div style={{ padding:'12px 16px', background:'#E9F8EE', borderRadius:10, display:'flex', alignItems:'center', gap:12 }}>
                      <span style={{ fontSize:20 }}>✅</span>
                      <div style={{ flex:1 }}>
                        <p style={{ fontSize:13, fontWeight:700, color:'#15171C', margin:0 }}>{visiteAnswered} élément{visiteAnswered>1?'s':''} renseigné{visiteAnswered>1?'s':''}</p>
                        <p style={{ fontSize:11.5, color:'#7C8089', margin:0 }}>Retournez à l'Étape 2 pour générer l'estimation avec ces données.</p>
                      </div>
                      <button className="btn-primary text-xs" onClick={() => setEstimTab('voieA')}>
                        <Sparkles size={13}/> Générer l'estimation
                      </button>
                    </div>
                  )}
                </div>
              )}

              {/* ── Envoyer l'estimation au client ── */}
              <div style={{ marginTop: 28, background: 'rgba(255,255,255,.85)', borderRadius: 16, border: '1px solid rgba(0,0,0,.08)', padding: '22px 24px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 16 }}>
                  <div style={{ width: 36, height: 36, borderRadius: 10, background: `${BRAND}18`, display: 'grid', placeItems: 'center', flexShrink: 0 }}>
                    <Send size={16} color={BRAND}/>
                  </div>
                  <div style={{ flex: 1 }}>
                    <p style={{ fontSize: 15, fontWeight: 800, color: '#15171C', margin: 0 }}>Envoyer l'estimation au client</p>
                    <p style={{ fontSize: 12.5, color: '#7C8089', margin: '2px 0 0' }}>Message personnalisé — se met à jour automatiquement avec les données du projet.</p>
                  </div>
                  <button onClick={() => { userEditedEstimMsg.current = false; setEstimMsg(buildEstimMsg(project, aiPriceResult)); }}
                    style={{ fontSize: 11.5, fontWeight: 700, color: '#7C8089', background: '#F4F5F6', border: 'none', borderRadius: 8, padding: '5px 11px', cursor: 'pointer', flexShrink: 0 }}>
                    ↺ Regénérer
                  </button>
                </div>

                {/* Zone de message éditable */}
                <textarea ref={estimMsgRef} value={estimMsg}
                  onChange={e => { userEditedEstimMsg.current = true; setEstimMsg(e.target.value); }}
                  placeholder="Le message se génère automatiquement dès que des informations sont disponibles sur le projet…"
                  style={{ width: '100%', minHeight: 200, padding: '14px 16px', border: '1px solid #E0E4E8', borderRadius: 10, fontSize: 13.5, lineHeight: 1.75, fontFamily: 'inherit', resize: 'vertical', outline: 'none', color: '#15171C', background: '#FAFAFA', boxSizing: 'border-box', marginBottom: 14 }}/>

                {/* Photos de projets similaires */}
                <div style={{ marginBottom: 16 }}>
                  <p style={{ fontSize: 11, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '.08em', color: '#9CA3AF', margin: '0 0 8px' }}>Photos de projets similaires (optionnel)</p>
                  <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', alignItems: 'flex-start' }}>
                    {estimInspoPhotos.map((url, i) => (
                      <div key={i} style={{ position: 'relative', width: 80, height: 64, borderRadius: 8, overflow: 'hidden', border: '1px solid #E8EAED', flexShrink: 0, cursor: 'pointer' }}
                        onClick={() => setLightboxItem({ type: 'photo', url, caption: `Photo inspiration ${i+1}` })}>
                        <img src={url} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }}/>
                        <button onClick={e => { e.stopPropagation(); setEstimInspoPhotos(p => p.filter((_,j) => j !== i)); }}
                          style={{ position: 'absolute', top: 2, right: 2, width: 18, height: 18, borderRadius: '50%', background: 'rgba(0,0,0,.65)', border: 'none', cursor: 'pointer', display: 'grid', placeItems: 'center' }}>
                          <X size={10} color="#fff"/>
                        </button>
                      </div>
                    ))}
                    <div style={{ display: 'flex', gap: 6, alignItems: 'center' }}>
                      <input value={estimInspoInput} onChange={e => setEstimInspoInput(e.target.value)}
                        onKeyDown={e => { if (e.key === 'Enter' && estimInspoInput.trim()) { setEstimInspoPhotos(p => [...p, estimInspoInput.trim()]); setEstimInspoInput(''); } }}
                        placeholder="URL d'une photo…"
                        style={{ padding: '5px 10px', border: '1px solid #E0E4E8', borderRadius: 8, fontSize: 12, fontFamily: 'inherit', outline: 'none', width: 200 }}/>
                      <button onClick={() => { if (estimInspoInput.trim()) { setEstimInspoPhotos(p => [...p, estimInspoInput.trim()]); setEstimInspoInput(''); } }}
                        style={{ padding: '5px 11px', borderRadius: 8, border: 'none', background: BRAND, color: '#fff', fontSize: 12, fontWeight: 700, cursor: 'pointer' }}>
                        + Ajouter
                      </button>
                    </div>
                  </div>
                </div>

                {/* 3 boutons d'envoi */}
                <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginBottom: 20 }}>
                  <button onClick={() => {
                    navigator.clipboard.writeText(estimMsg).then(() => { setEstimMsgCopied(true); setTimeout(() => setEstimMsgCopied(false), 2000); });
                  }}
                    style={{ padding: '8px 16px', borderRadius: 10, border: `1.5px solid ${estimMsgCopied ? '#16a34a' : '#E0E4E8'}`, background: estimMsgCopied ? '#DCFCE7' : '#fff', fontSize: 12.5, fontWeight: 700, color: estimMsgCopied ? '#16a34a' : '#3A3D44', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 6 }}>
                    {estimMsgCopied ? '✓ Copié !' : '⎘ Copier le message'}
                  </button>
                  <button
                    onClick={() => window.open(`mailto:${project.client_email || ''}?subject=${encodeURIComponent(`Estimation — ${project.name || ''}`)}&body=${encodeURIComponent(estimMsg)}`,'_blank')}
                    disabled={!project.client_email}
                    title={!project.client_email ? 'Ajoute un courriel client pour envoyer' : ''}
                    style={{ padding: '8px 16px', borderRadius: 10, border: '1.5px solid #E0E4E8', background: '#fff', fontSize: 12.5, fontWeight: 700, color: project.client_email ? '#3A3D44' : '#B0B3BA', cursor: project.client_email ? 'pointer' : 'not-allowed', display: 'flex', alignItems: 'center', gap: 6 }}>
                    ✉️ Envoyer par courriel
                  </button>
                  <button
                    onClick={() => window.open(`sms:${(project.client_phone||'').replace(/\D/g,'')}?body=${encodeURIComponent(estimMsg)}`,'_blank')}
                    disabled={!project.client_phone}
                    title={!project.client_phone ? 'Ajoute un numéro client pour envoyer' : ''}
                    style={{ padding: '8px 16px', borderRadius: 10, border: '1.5px solid #E0E4E8', background: '#fff', fontSize: 12.5, fontWeight: 700, color: project.client_phone ? '#3A3D44' : '#B0B3BA', cursor: project.client_phone ? 'pointer' : 'not-allowed', display: 'flex', alignItems: 'center', gap: 6 }}>
                    📱 Par SMS
                  </button>
                </div>

                {/* Relances automatiques */}
                <div style={{ borderTop: '1px solid rgba(0,0,0,.07)', paddingTop: 16, display: 'flex', flexDirection: 'column', gap: 14 }}>
                  <p style={{ fontSize: 11, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '.08em', color: '#9CA3AF', margin: 0 }}>Relances automatiques</p>
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: 18, alignItems: 'flex-start' }}>
                    <div>
                      <p style={{ fontSize: 12, color: '#3A3D44', fontWeight: 600, margin: '0 0 7px' }}>Nombre de relances</p>
                      <div style={{ display: 'flex', gap: 5, flexWrap: 'wrap' }}>
                        {[0,1,2,3,4,5,6,7].map(n => (
                          <button key={n} onClick={() => { setRelanceCount(n); saveAssessmentField('relances_count', n); localStorage.setItem(`monflux-relances-count-${id}`, n); }}
                            style={{ width: 32, height: 32, borderRadius: 8, border: `1.5px solid ${relanceCount === n ? BRAND : '#E0E4E8'}`, background: relanceCount === n ? `${BRAND}12` : '#fff', fontSize: 13, fontWeight: 700, color: relanceCount === n ? BRAND : '#7C8089', cursor: 'pointer' }}>
                            {n}
                          </button>
                        ))}
                      </div>
                    </div>
                    {relanceCount > 0 && (
                      <div>
                        <p style={{ fontSize: 12, color: '#3A3D44', fontWeight: 600, margin: '0 0 7px' }}>Fréquence</p>
                        <div style={{ display: 'flex', gap: 5, flexWrap: 'wrap' }}>
                          {[[2,'2 j'],[3,'3 j'],[5,'5 j'],[7,'1 sem.'],[14,'2 sem.'],[30,'1 mois']].map(([v,l]) => (
                            <button key={v} onClick={() => { setRelanceFrequency(v); saveAssessmentField('relances_freq', v); localStorage.setItem(`monflux-relances-freq-${id}`, v); }}
                              style={{ padding: '5px 12px', borderRadius: 8, border: `1.5px solid ${relanceFrequency === v ? BRAND : '#E0E4E8'}`, background: relanceFrequency === v ? `${BRAND}12` : '#fff', fontSize: 12.5, fontWeight: 700, color: relanceFrequency === v ? BRAND : '#7C8089', cursor: 'pointer' }}>
                              {l}
                            </button>
                          ))}
                        </div>
                      </div>
                    )}
                    {relanceCount > 0 && (
                      <div>
                        <p style={{ fontSize: 12, color: '#3A3D44', fontWeight: 600, margin: '0 0 7px' }}>Méthode(s)</p>
                        <div style={{ display: 'flex', gap: 5 }}>
                          {[['email','✉️ Courriel'],['sms','📱 SMS'],['call','📞 Appel']].map(([k,l]) => (
                            <button key={k} onClick={() => {
                              const next = relanceMethods.includes(k) ? relanceMethods.filter(m => m !== k) : [...relanceMethods, k];
                              setRelanceMethods(next);
                              saveAssessmentField('relances_methods', next);
                              localStorage.setItem(`monflux-relances-methods-${id}`, JSON.stringify(next));
                            }}
                              style={{ padding: '5px 13px', borderRadius: 8, border: `1.5px solid ${relanceMethods.includes(k) ? BRAND : '#E0E4E8'}`, background: relanceMethods.includes(k) ? `${BRAND}12` : '#fff', fontSize: 12.5, fontWeight: 700, color: relanceMethods.includes(k) ? BRAND : '#7C8089', cursor: 'pointer' }}>
                              {l}
                            </button>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                  {relanceCount > 0 && relanceMethods.length > 0 && (
                    <div style={{ display: 'inline-flex', alignItems: 'center', gap: 7, padding: '7px 14px', borderRadius: 9, background: '#DCFCE7', border: '1px solid #16a34a33' }}>
                      <CheckCircle size={13} color="#16a34a"/>
                      <span style={{ fontSize: 12.5, fontWeight: 700, color: '#16a34a' }}>
                        {relanceCount} relance{relanceCount > 1 ? 's' : ''} · toutes les {relanceFrequency <= 6 ? `${relanceFrequency} jours` : relanceFrequency <= 13 ? '1 semaine' : relanceFrequency <= 27 ? '2 semaines' : '1 mois'} · {relanceMethods.map(m => m === 'email' ? 'courriel' : m === 'sms' ? 'SMS' : 'appel').join(' + ')}
                      </span>
                    </div>
                  )}
                </div>
              </div>
            </ProjectSection>
  );
}
