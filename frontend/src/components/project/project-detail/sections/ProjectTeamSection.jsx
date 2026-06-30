import React from 'react';
import { Loader2, Sparkles } from 'lucide-react';
import ProjectSection from '../../ProjectSection';

export default function ProjectTeamSection(props) {
  const {
    sectionSummaries,
    sectionExpanded,
    toggleProjectSection,
    floMergePending,
    applyFloRecos,
    showFloPanel,
    tradeRecos,
    loadingTradeRecos,
    BRAND,
    fetchTradeRecos,
    tradeResourcesMap,
    addFloRecoToTeam,
    project,
    fmtDate,
    setEditPhase,
    addInternalPerson,
    addExternalPerson,
    removePerson,
    updatePerson,
    saveResourceRows,
    openConformiteBadge,
    setOpenConformiteBadge,
    availableEmployeeOptions,
    availableSubcontractorOptions,
    quoteBuilderItems,
    setQuoteBuilderItems,
    scheduleQuoteSave,
    money,
  } = props;
  const formatTeamDate = fmtDate || ((d) => (d ? new Date(d).toLocaleDateString('fr-CA', { month: 'short', day: 'numeric' }) : null));

  return (
        <ProjectSection
          sectionId="s-equipe"
          icon="🤝"
          title="Équipe et conformité"
          summary={sectionSummaries['s-equipe']?.summary}
          stats={sectionSummaries['s-equipe']?.stats}
          expanded={!!sectionExpanded['s-equipe']}
          onToggle={() => toggleProjectSection('s-equipe')}
          background="#F5F0FF"
        >

          {/* Bannière confirmation merge/reset */}
          {floMergePending && (
            <div style={{ display:'flex', alignItems:'center', gap:10, padding:'12px 16px', borderRadius:11, background:'#FFFBEB', border:'1.5px solid #FDE68A', marginBottom:16 }}>
              <Sparkles size={14} color="#D97706"/>
              <p style={{ fontSize:12, fontWeight:700, color:'#92400E', margin:0, flex:1 }}>Des données existent déjà dans le tableau. Que faire ?</p>
              <button onClick={() => applyFloRecos(floMergePending, 'merge')}
                style={{ padding:'5px 13px', borderRadius:7, border:'1.5px solid #D97706', background:'#fff', color:'#D97706', fontSize:11, fontWeight:800, cursor:'pointer' }}>
                ✓ Ajouter aux existants
              </button>
              <button onClick={() => applyFloRecos(floMergePending, 'reset')}
                style={{ padding:'5px 13px', borderRadius:7, border:'none', background:'#D97706', color:'#fff', fontSize:11, fontWeight:800, cursor:'pointer' }}>
                🔄 Repartir de zéro
              </button>
            </div>
          )}

          {/* Panneau résultats Flo */}
          {showFloPanel && (() => {
            const typeConf = {
              internal: { label:'Employé interne',    color:'#7C3AED', bg:'#F5F3FF', border:'#DDD6FE', icon:'🏠' },
              known:    { label:'Sous-traitant connu',color:'#D97706', bg:'#FFFBEB', border:'#FDE68A', icon:'⭐' },
              new:      { label:'Nouveau',            color:'#2563EB', bg:'#EFF6FF', border:'#BFDBFE', icon:'🔍' },
            };
            const hasRecos = tradeRecos && Object.keys(tradeRecos).length > 0;
            return (
              <div style={{ background:'#fff', borderRadius:14, border:'1px solid #E0D5FF', padding:'16px 20px', marginBottom:20 }}>
                <div style={{ display:'flex', alignItems:'center', gap:8, marginBottom: hasRecos ? 14 : 4 }}>
                  <Sparkles size={13} color={BRAND}/>
                  <p style={{ fontSize:12, fontWeight:700, color:'#3A3D44', margin:0, flex:1 }}>Recommandations Flo — ajoutées automatiquement au tableau</p>
                  <button onClick={() => fetchTradeRecos(null)} disabled={loadingTradeRecos}
                    style={{ display:'flex', alignItems:'center', gap:5, padding:'4px 11px', borderRadius:8, border:`1.5px solid ${BRAND}`, background:`${BRAND}10`, fontSize:10.5, fontWeight:700, color:BRAND, cursor:'pointer' }}>
                    {loadingTradeRecos ? <Loader2 size={9} className="animate-spin"/> : <Sparkles size={9}/>}
                    {loadingTradeRecos ? 'Analyse…' : '↺ Rafraîchir'}
                  </button>
                </div>
                {loadingTradeRecos && (
                  <div style={{ display:'flex', alignItems:'center', gap:8, padding:'8px 0', color:'#9CA3AF' }}>
                    <Loader2 size={13} className="animate-spin"/> <span style={{ fontSize:12 }}>Flo analyse les corps de métier…</span>
                  </div>
                )}
                {!loadingTradeRecos && !hasRecos && tradeRecos && (
                  <p style={{ fontSize:11.5, color:'#9CA3AF', fontStyle:'italic', margin:0 }}>Aucune correspondance — ajoute des phases dans le Gantt pour que Flo sache quels corps de métier sont requis.</p>
                )}
                {hasRecos && Object.entries(tradeRecos).map(([tradeName, recos]) => (
                  <div key={tradeName} style={{ marginBottom:12 }}>
                    <p style={{ fontSize:10, fontWeight:800, color:'#9CA3AF', textTransform:'uppercase', letterSpacing:'.07em', margin:'0 0 6px' }}>{tradeName}</p>
                    <div style={{ display:'flex', flexDirection:'column', gap:4 }}>
                      {(recos||[]).map((r, i) => {
                        const tc = typeConf[r.type] || typeConf.new;
                        const siteHref = r.source_url || (r.website ? (r.website.startsWith('http') ? r.website : `https://${r.website}`) : null);
                        const alreadyAdded = (tradeResourcesMap[tradeName]?.internal||[]).concat(tradeResourcesMap[tradeName]?.external||[]).some(p => (typeof p === 'string' ? p : p.name) === r.name);
                        return (
                          <div key={i} style={{ display:'flex', alignItems:'center', gap:8, padding:'6px 10px', borderRadius:8, background:tc.bg, border:`1px solid ${tc.border}` }}>
                            <span style={{ fontSize:13, flexShrink:0 }}>{tc.icon}</span>
                            <div style={{ flex:1, minWidth:0 }}>
                              <span style={{ fontSize:12, fontWeight:700, color:'#15171C' }}>{r.name}</span>
                              {r.note && <span style={{ fontSize:10.5, color:'#6B7280', marginLeft:6 }}>{r.note}</span>}
                            </div>
                            {r.phone && <a href={`tel:${r.phone}`} style={{ fontSize:10, color:'#2563EB', fontWeight:700, textDecoration:'none', background:'#EFF6FF', borderRadius:5, padding:'2px 7px', flexShrink:0 }}>📞</a>}
                            {r.email && <a href={`mailto:${r.email}`} style={{ fontSize:10, color:'#2563EB', fontWeight:700, textDecoration:'none', background:'#EFF6FF', borderRadius:5, padding:'2px 7px', flexShrink:0 }}>✉</a>}
                            {siteHref && <a href={siteHref} target="_blank" rel="noopener noreferrer" style={{ fontSize:10, color:tc.color, fontWeight:700, textDecoration:'none', background:'#fff', border:`1px solid ${tc.border}`, borderRadius:5, padding:'2px 7px', flexShrink:0 }}>↗</a>}
                            {alreadyAdded
                              ? <span style={{ fontSize:10, color:'#16A34A', fontWeight:700, padding:'2px 7px', flexShrink:0 }}>✓ Ajouté</span>
                              : <button onClick={() => addFloRecoToTeam(tradeName, r)} style={{ fontSize:10, fontWeight:800, color:'#fff', background:tc.color, border:'none', borderRadius:5, padding:'2px 8px', cursor:'pointer', flexShrink:0 }}>+</button>
                            }
                          </div>
                        );
                      })}
                    </div>
                  </div>
                ))}
              </div>
            );
          })()}

          {(() => {
            const phases = project.phases || [];
            const phaseTradeNames = [...new Set(phases.map((ph) => ph.trade_name).filter(Boolean))];
            const tradesFromProject = project.trades || [];
            const rowNames = [...new Set([
              ...tradesFromProject.map((trade) => trade.trade).filter(Boolean),
              ...phaseTradeNames,
            ])];

            if (!rowNames.length) return null;

            // Statuts séparés : interne vs externe
            const internalStatuses = [
              { key: 'prequalifie_flo', label: '⭐ Pré-qualifié Flo', color: '#7C3AED', bg: '#F5F3FF' },
              { key: 'a_contacter',     label: 'À contacter',         color: '#E8794E', bg: '#FFF1EB' },
              { key: 'contacte',        label: 'Contacté',            color: '#F59E0B', bg: '#FFF7E8' },
              { key: 'disponible',      label: 'Disponible',          color: '#3B82F6', bg: '#EFF6FF' },
              { key: 'en_negociation',  label: 'En négociation',      color: '#D97706', bg: '#FFFBEB' },
              { key: 'confirme',        label: 'Confirmé',            color: '#16A34A', bg: '#ECFDF3' },
              { key: 'refuse',          label: 'Refusé',              color: '#DC2626', bg: '#FFF5F5' },
              { key: 'termine',         label: 'Terminé',             color: '#6B7280', bg: '#F9FAFB' },
            ];
            const externalStatuses = [
              { key: 'prequalifie_flo', label: '⭐ Pré-qualifié Flo', color: '#7C3AED', bg: '#F5F3FF' },
              { key: 'a_contacter',     label: 'À contacter',         color: '#E8794E', bg: '#FFF1EB' },
              { key: 'contacte',        label: 'Contacté',            color: '#F59E0B', bg: '#FFF7E8' },
              { key: 'soumis',          label: 'Soumission reçue',    color: '#3B82F6', bg: '#EFF6FF' },
              { key: 'en_negociation',  label: 'En négociation',      color: '#D97706', bg: '#FFFBEB' },
              { key: 'accepte',         label: 'Accepté',             color: '#16A34A', bg: '#ECFDF3' },
              { key: 'refuse',          label: 'Refusé',              color: '#DC2626', bg: '#FFF5F5' },
              { key: 'termine',         label: 'Terminé',             color: '#6B7280', bg: '#F9FAFB' },
            ];
            // Légende unique (union) pour le filtre
            const allStatuses = [...new Map([...internalStatuses, ...externalStatuses].map(s => [s.key, s])).values()];

            const parsePersons = (arr) => (arr || []).map(p =>
              typeof p === 'string'
                ? { name: p, status: 'a_contacter', phone: '', email: '', location: '' }
                : { phone: '', email: '', location: '', ...p }
            );

            const isDateExpired = (d) => d && new Date(d) < new Date();
            // Only fail if explicitly unchecked OR if a date was entered and is expired
            const isCertFail = (c) => {
              if (!c || (c.ok === undefined && !c.validite && !c.lastCheck)) return false;
              if (c.ok === false) return true;
              if (c.ok === true && c.validite && isDateExpired(c.validite)) return true;
              return false;
            };
            const isPersonNonConforme = (cert, personStatus) => {
              if (personStatus === 'a_contacter') return false;
              return isCertFail(cert?.rbq) || isCertFail(cert?.ccq) || isCertFail(cert?.insurance);
            };
            const personKey = (tn, type, pi) => `${tn}||${type}||${pi}`;

            const hS = { fontSize: 9.5, fontWeight: 800, textTransform: 'uppercase', letterSpacing: '.07em', color: '#A8AEB6' };

            // Badge conformité dépliable — vert/ambre/rouge — remplace les 3 checkboxes séparées
            const renderConformiteBadge = (cert, openKey, setOpenKey, type, pi) => {
              const certs = [
                { key: 'rbq',       label: 'RBQ',       color: '#7C3AED' },
                { key: 'ccq',       label: 'CCQ',       color: '#2563EB' },
                { key: 'insurance', label: 'Assurance', color: '#059669' },
              ];
              const isOpen = openKey === `${type}||${pi}`;

              // Compute overall status
              const statuses = certs.map(({ key }) => {
                const c = cert[key] || {};
                if (isCertFail(c)) return 'red';
                if (c.ok === true && !isDateExpired(c.validite)) return 'green';
                return 'amber';
              });
              const overall = statuses.some(s => s === 'red') ? 'red'
                : statuses.every(s => s === 'green') ? 'green'
                : 'amber';
              const badgeColor = overall === 'green' ? '#16A34A' : overall === 'red' ? '#DC2626' : '#D97706';
              const badgeBg    = overall === 'green' ? '#F0FDF4' : overall === 'red' ? '#FFF5F5' : '#FFFBEB';
              const badgeLabel = overall === 'green' ? '✓ Conforme' : overall === 'red' ? '✗ Non conforme' : '⚠ À vérifier';
              const nOk = statuses.filter(s => s === 'green').length;

              return (
                <div>
                  {/* Pill badge — click to toggle */}
                  <button
                    onClick={() => setOpenKey(isOpen ? null : `${type}||${pi}`)}
                    style={{ display: 'inline-flex', alignItems: 'center', gap: 5, padding: '3px 9px', borderRadius: 999, border: `1.5px solid ${badgeColor}40`, background: badgeBg, color: badgeColor, fontSize: 9.5, fontWeight: 800, cursor: 'pointer' }}
                  >
                    {badgeLabel}
                    <span style={{ fontSize: 8.5, opacity: 0.7 }}>{nOk}/3</span>
                    <span style={{ fontSize: 8 }}>{isOpen ? '▲' : '▼'}</span>
                  </button>

                  {/* Expanded detail rows */}
                  {isOpen && (
                    <div style={{ marginTop: 6, display: 'flex', flexDirection: 'column', gap: 4 }}>
                      {certs.map(({ key, label, color }) => {
                        const c = cert[key] || {};
                        const expired = c.ok === true && isDateExpired(c.validite);
                        const fail = isCertFail(c);
                        const sc = c.ok && !expired ? color : fail ? '#DC2626' : '#C4C8CE';
                        return (
                          <div key={key} style={{ display: 'flex', alignItems: 'center', gap: 5, padding: '5px 8px', background: '#FAFAFA', borderRadius: 7, border: `1px solid ${sc}20` }}>
                            <input type="checkbox" checked={!!c.ok} onChange={e => updateCert(type, pi, key, 'ok', e.target.checked)}
                              style={{ accentColor: sc, width: 12, height: 12, cursor: 'pointer', flexShrink: 0 }}/>
                            <span style={{ fontSize: 10, fontWeight: 700, color: sc, width: 52, flexShrink: 0 }}>{label}</span>
                            {expired && <span style={{ fontSize: 8, fontWeight: 800, color: '#fff', background: '#DC2626', borderRadius: 3, padding: '1px 4px', flexShrink: 0 }}>EXP</span>}
                            <input type="date" value={c.validite || ''} onChange={e => updateCert(type, pi, key, 'validite', e.target.value)}
                              title="Expiration" style={{ fontSize: 9, border: `1px solid ${expired ? '#DC2626' : '#E8EAED'}`, borderRadius: 5, padding: '2px 4px', color: expired ? '#DC2626' : '#6B7280', background: expired ? '#FFF5F5' : '#fff', flex: 1 }}/>
                            <input type="date" value={c.lastCheck || ''} onChange={e => updateCert(type, pi, key, 'lastCheck', e.target.value)}
                              title="Dernière vérif." style={{ fontSize: 9, border: '1px solid #E8EAED', borderRadius: 5, padding: '2px 4px', color: '#6B7280', background: '#fff', flex: 1 }}/>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>
              );
            };

            // Grid partagé (en-têtes + lignes détail)
            const COLS = '215px 2fr 145px 1.4fr 1.4fr';

            return (
              <div style={{ background: '#fff', borderRadius: 14, border: '1px solid rgba(0,0,0,.07)', overflow: 'hidden', marginTop: 0 }}>
                <div style={{ padding: '14px 20px 10px', borderBottom: '1px solid #F1F3F5' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 10 }}>
                    <div style={{ width: 36, height: 36, borderRadius: 11, background: '#FFF4EC', display: 'grid', placeItems: 'center', fontSize: 18 }}>👷</div>
                    <div>
                      <p style={{ fontSize: 15, fontWeight: 800, color: '#15171C', margin: 0 }}>Corps de métier & équipe</p>
                      <p style={{ fontSize: 11.5, color: '#8B919A', margin: '2px 0 0' }}>Ressources internes et externes par métier, avec suivi de conformité (RBQ / CCQ / Assurance).</p>
                    </div>
                  </div>
                  {/* ── Filtres ── */}
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>

                    {/* Ligne 1 : statut + À trouver */}
                    <div style={{ display: 'flex', alignItems: 'center', gap: 6, flexWrap: 'wrap' }}>
                      <span style={{ fontSize: 9.5, fontWeight: 700, color: '#A8AEB6', textTransform: 'uppercase', letterSpacing: '.05em', marginRight: 4, width: 50, flexShrink: 0 }}>Statut</span>
                      <button onClick={() => setTradeStatusFilter(null)}
                        style={{ padding: '3px 10px', borderRadius: 999, border: `1.5px solid ${!tradeStatusFilter ? '#15171C' : '#E0E4E8'}`, background: !tradeStatusFilter ? '#15171C' : '#fff', color: !tradeStatusFilter ? '#fff' : '#9CA3AF', fontSize: 10.5, fontWeight: 700, cursor: 'pointer' }}>
                        Tous
                      </button>
                      <button onClick={() => setTradeStatusFilter(tradeStatusFilter === 'a_trouver' ? null : 'a_trouver')}
                        style={{ padding: '3px 10px', borderRadius: 999, border: `1.5px solid ${tradeStatusFilter === 'a_trouver' ? '#DC2626' : '#FCA5A5'}`, background: tradeStatusFilter === 'a_trouver' ? '#FFF5F5' : '#fff', color: tradeStatusFilter === 'a_trouver' ? '#DC2626' : '#FCA5A5', fontSize: 10.5, fontWeight: 700, cursor: 'pointer' }}>
                        🔍 À trouver
                      </button>
                      {allStatuses.map(s => (
                        <button key={s.key} onClick={() => setTradeStatusFilter(tradeStatusFilter === s.key ? null : s.key)}
                          style={{ padding: '3px 10px', borderRadius: 999, border: `1.5px solid ${tradeStatusFilter === s.key ? s.color : s.color + '50'}`, background: tradeStatusFilter === s.key ? s.bg : '#fff', color: tradeStatusFilter === s.key ? s.color : s.color + 'CC', fontSize: 10.5, fontWeight: 700, cursor: 'pointer' }}>
                          {s.label}
                        </button>
                      ))}
                    </div>

                    {/* Ligne 2 : type d'employé (toggle) + date deadline */}
                    <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap' }}>
                      {/* Type d'employé */}
                      <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                        <span style={{ fontSize: 9.5, fontWeight: 700, color: '#A8AEB6', textTransform: 'uppercase', letterSpacing: '.05em', width: 50, flexShrink: 0 }}>Type</span>
                        {[
                          { key: null,       label: 'Tous',           icon: '👥' },
                          { key: 'internal', label: 'Employé',        icon: '👤', color: '#7C3AED', bg: '#F5F3FF', border: '#DDD6FE' },
                          { key: 'external', label: 'Sous-traitant',  icon: '🏗️', color: '#0369A1', bg: '#F0F9FF', border: '#BAE6FD' },
                        ].map(opt => {
                          const isActive = tradeTypeFilter === opt.key;
                          return (
                            <button key={String(opt.key)} onClick={() => setTradeTypeFilter(opt.key)}
                              style={{ padding: '3px 10px', borderRadius: 999, border: `1.5px solid ${isActive ? (opt.border || '#15171C') : '#E0E4E8'}`, background: isActive ? (opt.bg || '#15171C') : '#fff', color: isActive ? (opt.color || '#fff') : '#9CA3AF', fontSize: 10.5, fontWeight: 700, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 4 }}>
                              <span>{opt.icon}</span> {opt.label}
                            </button>
                          );
                        })}
                      </div>

                      {/* Séparateur */}
                      <div style={{ width: 1, height: 18, background: '#E8EAED', flexShrink: 0 }}/>

                      {/* Filtre calendrier — deadline avant */}
                      <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                        <span style={{ fontSize: 9.5, fontWeight: 700, color: '#A8AEB6', textTransform: 'uppercase', letterSpacing: '.05em', flexShrink: 0 }}>Deadline ≤</span>
                        <input type="date" value={tradeDateFilter} onChange={e => setTradeDateFilter(e.target.value)}
                          style={{ fontSize: 11, border: '1.5px solid #E0E4E8', borderRadius: 8, padding: '3px 8px', color: tradeDateFilter ? '#15171C' : '#9CA3AF', background: tradeDateFilter ? '#FFFBEB' : '#fff', cursor: 'pointer', outline: 'none' }}/>
                        {tradeDateFilter && (
                          <button onClick={() => setTradeDateFilter('')}
                            style={{ fontSize: 10, color: '#9CA3AF', background: 'none', border: 'none', cursor: 'pointer', padding: '2px 4px' }}>✕</button>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* ── Barre mass-actions ── */}
                  {tradePersonSelected.size > 0 && (() => {
                    const selArr = [...tradePersonSelected];
                    const massUpdateStatus = (newStatus) => {
                      const updatedMap = { ...tradeResourcesMap };
                      selArr.forEach(pk => {
                        const [tn, tp, piStr] = pk.split('||');
                        const pi2 = parseInt(piStr);
                        if (!updatedMap[tn]) return;
                        const arr = [...(updatedMap[tn][tp] || [])];
                        if (arr[pi2]) arr[pi2] = { ...arr[pi2], status: newStatus };
                        updatedMap[tn] = { ...updatedMap[tn], [tp]: arr };
                      });
                      saveTradeResources(updatedMap);
                      setTradePersonSelected(new Set());
                    };
                    const massDelete = () => {
                      const updatedMap = { ...tradeResourcesMap };
                      const grouped = {};
                      selArr.forEach(pk => {
                        const [tn, tp, piStr] = pk.split('||');
                        if (!grouped[tn]) grouped[tn] = {};
                        if (!grouped[tn][tp]) grouped[tn][tp] = new Set();
                        grouped[tn][tp].add(parseInt(piStr));
                      });
                      Object.entries(grouped).forEach(([tn, types]) => {
                        Object.entries(types).forEach(([tp, indices]) => {
                          updatedMap[tn] = { ...updatedMap[tn], [tp]: (updatedMap[tn]?.[tp] || []).filter((_, i) => !indices.has(i)) };
                        });
                      });
                      saveTradeResources(updatedMap);
                      setTradePersonSelected(new Set());
                    };
                    return (
                      <div style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '7px 16px', background: '#F5F3FF', borderTop: '1px solid #DDD6FE', borderBottom: '1px solid #DDD6FE', flexWrap: 'wrap' }}>
                        <span style={{ fontSize: 11, fontWeight: 700, color: BRAND }}>
                          {tradePersonSelected.size} sélectionné(s)
                        </span>
                        <span style={{ fontSize: 10, color: '#9CA3AF' }}>— Changer statut :</span>
                        {allStatuses.map(s => (
                          <button key={s.key} onClick={() => massUpdateStatus(s.key)}
                            style={{ fontSize: 9.5, padding: '2px 8px', borderRadius: 999, border: `1px solid ${s.color}55`, background: s.bg, color: s.color, fontWeight: 700, cursor: 'pointer' }}>
                            {s.label}
                          </button>
                        ))}
                        <button onClick={massDelete}
                          style={{ marginLeft: 'auto', fontSize: 10.5, padding: '3px 10px', borderRadius: 7, border: '1px solid #FCA5A5', background: '#FFF5F5', color: '#DC2626', fontWeight: 700, cursor: 'pointer' }}>
                          Supprimer
                        </button>
                        <button onClick={() => setTradePersonSelected(new Set())}
                          style={{ fontSize: 10, padding: '3px 8px', borderRadius: 7, border: '1px solid #E0E4E8', background: '#fff', color: '#8B919A', cursor: 'pointer' }}>
                          ✕ Désélectionner
                        </button>
                      </div>
                    );
                  })()}
                </div>

                <div style={{ overflowX: 'auto', WebkitOverflowScrolling: 'touch' }}>
                  <div style={{ minWidth: 1160 }}>

                    {/* ── En-têtes ── */}
                    <div style={{ display: 'grid', gridTemplateColumns: COLS, borderBottom: '2px solid #E8EAED', background: '#FAFAFA' }}>
                      <div style={{ padding: '7px 12px 7px 20px', borderRight: '1px solid #EAECEF' }}><span style={hS}>Personne & contact</span></div>
                      <div style={{ padding: '7px 12px', borderRight: '1px solid #EAECEF' }}><span style={hS}>💬 Message</span></div>
                      <div style={{ padding: '7px 12px', borderRight: '1px solid #EAECEF' }}><span style={hS}>✅ Réponse</span></div>
                      <div style={{ padding: '7px 12px', borderRight: '1px solid #EAECEF' }}><span style={hS}>🔒 Conformité</span></div>
                      <div style={{ padding: '7px 12px' }}><span style={hS}>📄 Bon de commande</span></div>
                    </div>

                    {/* ── Lignes par corps de métier ── */}
                    {rowNames.filter(tradeName => {
                      if (tradeStatusFilter !== 'a_trouver') return true;
                      const rawR = tradeResourcesMap[tradeName] || {};
                      const intCount = (rawR.internal || []).length;
                      const extCount = (rawR.external || []).length;
                      return intCount + extCount === 0;
                    }).map((tradeName, idx) => {
                      // Phase liée si trade_name exact OU si le nom de la phase mentionne ce corps de métier
                      const tradeKeywords = tradeName.toLowerCase().split(/[\s,\/&+]+/).filter(w => w.length >= 4);
                      const tradePhases = phases.filter(ph => {
                        if (ph.trade_name?.toLowerCase() === tradeName.toLowerCase()) return true;
                        const pn = (ph.name || '').toLowerCase();
                        return tradeKeywords.length > 0 && tradeKeywords.some(kw => pn.includes(kw));
                      });
                      const tradeHours  = tradePhases.reduce((sum, ph) => sum + (Number(ph.duration_hours) || 0), 0);
                      const sortedPh    = [...tradePhases].filter(ph => ph.start_date).sort((a, b) => a.start_date.localeCompare(b.start_date));
                      const minDate     = sortedPh[0]?.start_date;
                      const maxDate     = sortedPh[sortedPh.length - 1]?.end_date || sortedPh[sortedPh.length - 1]?.start_date;
                      const rawRes      = tradeResourcesMap[tradeName] || { internal: [], external: [] };
                      const resources   = { internal: parsePersons(rawRes.internal), external: parsePersons(rawRes.external) };

                      const updateResources = (type, newList) => {
                        const updated = { ...tradeResourcesMap, [tradeName]: { ...rawRes, [type]: newList } };
                        saveTradeResources(updated);
                      };

                      const updatePersonField = (type, pi, field, value) => {
                        updateResources(type, resources[type].map((p, i) => i === pi ? { ...p, [field]: value } : p));
                      };

                      const cycleStatus = (type, pi) => {
                        const statusList = type === 'internal' ? internalStatuses : externalStatuses;
                        const list = resources[type];
                        const cur  = statusList.findIndex(s => s.key === (list[pi]?.status || 'a_contacter'));
                        const next = statusList[(cur + 1) % statusList.length];
                        updateResources(type, list.map((p, i) => i === pi ? { ...p, status: next.key } : p));
                      };

                      const updateCert = (type, pi, certKey, field, val) => {
                        const key = personKey(tradeName, type, pi);
                        const cur = tradeConformite[key] || { rbq: {}, ccq: {}, insurance: {} };
                        const updated = { ...tradeConformite, [key]: { ...cur, [certKey]: { ...cur[certKey], [field]: val } } };
                        saveTradeConformite(updated);
                      };

                      const renderPersonSection = (type) => {
                        // Masquer toute la section si le filtre type ne correspond pas
                        if (tradeTypeFilter && tradeTypeFilter !== type) return null;

                        const list        = resources[type];
                        const statusList  = type === 'internal' ? internalStatuses : externalStatuses;
                        const typeColor   = type === 'internal' ? '#7C3AED' : '#2563EB';
                        const typeIcon    = type === 'internal' ? '👤' : '🏗️';
                        const typeLabel   = type === 'internal' ? 'Employé' : 'Sous-traitant';
                        const inputKey    = `${tradeName}_add_${type}`;
                        const confirmedKey = type === 'internal' ? 'confirme' : 'accepte';

                        let visibleList = (tradeStatusFilter && tradeStatusFilter !== 'a_trouver')
                          ? list.filter(p => (p.status || 'a_contacter') === tradeStatusFilter)
                          : list;
                        // Filtre date : ne garder que les personnes avec deadline <= date sélectionnée
                        if (tradeDateFilter) {
                          visibleList = visibleList.filter(p => p.responseDeadline && p.responseDeadline <= tradeDateFilter);
                        }

                        return (
                          <div>
                            {/* Plus de sous-header INTERNE/EXTERNE — le type est indiqué en badge inline sur chaque ligne */}
                            {visibleList.map((person) => {
                              const pi           = list.indexOf(person);
                              const pKey         = personKey(tradeName, type, pi);
                              const cert         = tradeConformite[pKey] || { rbq: {}, ccq: {}, insurance: {} };
                              const pStatus      = person.status || 'a_contacter';
                              const isAC         = pStatus === 'a_contacter';
                              const isConfirmed  = pStatus === confirmedKey;
                              const nonConf      = isPersonNonConforme(cert, pStatus);
                              const pStat        = statusList.find(s => s.key === pStatus) || statusList[0];
                              const msgData      = tradePersonMsgs[pKey] || {};
                              const isLoadingMsg = !!msgData.loading;
                              const isLoadingFlo = !!loadingFloPersonCheck[pKey];
                              const isLoadingPO  = !!msgData.poLoading;
                              const isExpanded   = !!tradePersonExpanded[pKey];

                              const infoInput = (field, placeholder, icon) => (
                                <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                                  <span style={{ fontSize: 10, color: '#C4C8CE', flexShrink: 0 }}>{icon}</span>
                                  <input value={person[field] || ''} onChange={e => updatePersonField(type, pi, field, e.target.value)}
                                    placeholder={placeholder}
                                    style={{ fontSize: 11, border: 'none', outline: 'none', background: 'transparent', color: '#5A5E6A', width: '100%', padding: 0 }}/>
                                </div>
                              );

                              const certOk = cert.rbq?.ok && cert.ccq?.ok && cert.insurance?.ok;
                              const isSel = tradePersonSelected.has(pKey);
                              const toggleSel = (e) => {
                                e.stopPropagation();
                                setTradePersonSelected(prev => {
                                  const next = new Set(prev);
                                  next.has(pKey) ? next.delete(pKey) : next.add(pKey);
                                  return next;
                                });
                              };

                              return (
                                <div key={pi}>
                                  {/* ── Ligne compacte : checkbox + nom + deadline + pipeline ── */}
                                  <div style={{ borderTop: '1px solid #F4F5F6', background: isSel ? '#F5F3FF' : nonConf ? '#FFF5F5' : 'transparent' }}>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '3px 10px 3px 8px' }}>
                                      {/* Checkbox */}
                                      <input type="checkbox" checked={isSel} onChange={toggleSel} onClick={e => e.stopPropagation()}
                                        style={{ width: 13, height: 13, accentColor: BRAND, flexShrink: 0, cursor: 'pointer' }}/>
                                      {/* Caret */}
                                      <span style={{ fontSize: 8, color: '#C4C8CE', flexShrink: 0, width: 8, cursor: 'pointer' }}
                                        onClick={() => setTradePersonExpanded(m => ({ ...m, [pKey]: !m[pKey] }))}>
                                        {isExpanded ? '▼' : '▶'}
                                      </span>
                                      {/* Nom cliquable */}
                                      <span style={{ fontSize: 12, fontWeight: 700, color: nonConf ? '#DC2626' : '#15171C', minWidth: 55, maxWidth: 115, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', flexShrink: 0, cursor: 'pointer' }}
                                        onClick={() => setTradePersonExpanded(m => ({ ...m, [pKey]: !m[pKey] }))}>
                                        {person.name}
                                      </span>
                                      {/* Badge Employé / Sous-traitant */}
                                      <span style={{ fontSize: 8.5, fontWeight: 700, color: typeColor, background: `${typeColor}12`, border: `1px solid ${typeColor}30`, borderRadius: 5, padding: '1px 5px', flexShrink: 0, whiteSpace: 'nowrap' }}>
                                        {typeLabel}
                                      </span>
                                      {nonConf && <span style={{ fontSize: 8, fontWeight: 800, color: '#DC2626', flexShrink: 0 }}>⚠</span>}
                                      {/* Deadline */}
                                      {person.responseDeadline && (
                                        <span style={{ fontSize: 9, color: '#F59E0B', fontWeight: 600, flexShrink: 0, whiteSpace: 'nowrap' }}>
                                          📅 {person.responseDeadline}
                                        </span>
                                      )}
                                      {/* Pipeline stepper — s'étire */}
                                      <div style={{ display: 'flex', alignItems: 'center', flex: 1, gap: 0, overflow: 'auto', scrollbarWidth: 'none' }}>
                                        {statusList.map((s, si) => {
                                          const curIdx = statusList.findIndex(x => x.key === pStatus);
                                          const isPast = si < curIdx;
                                          const isCur  = s.key === pStatus;
                                          return (
                                            <React.Fragment key={s.key}>
                                              {si > 0 && <div style={{ flex: '0 0 6px', height: 1, background: isPast ? '#D1D5DB' : '#EAECEF' }}/>}
                                              <button onClick={e => { e.stopPropagation(); updateResources(type, resources[type].map((p2, i2) => i2 === pi ? { ...p2, status: s.key } : p2)); }}
                                                style={{ fontSize: 9, fontWeight: isCur ? 800 : 500, padding: '1px 6px', borderRadius: 999, border: `1px solid ${isCur ? s.color : isPast ? s.color + '44' : '#EAECEF'}`, background: isCur ? s.bg : 'transparent', color: isCur ? s.color : isPast ? s.color + 'AA' : '#C4C8CE', cursor: 'pointer', whiteSpace: 'nowrap', flexShrink: 0 }}>
                                                {isPast ? '✓ ' : ''}{s.label}
                                              </button>
                                            </React.Fragment>
                                          );
                                        })}
                                      </div>
                                      {/* Badges compact */}
                                      {msgData.disponible && (
                                        <span style={{ fontSize: 9, fontWeight: 700, color: msgData.disponible === 'oui' ? '#16A34A' : '#DC2626', flexShrink: 0 }}>
                                          {msgData.disponible === 'oui' ? '✓' : '✗'}
                                        </span>
                                      )}
                                      {pStatus !== 'a_contacter' && (
                                        <span style={{ fontSize: 9, fontWeight: 700, color: nonConf ? '#DC2626' : certOk ? '#16A34A' : '#C4C8CE', flexShrink: 0 }} title="Conformité">
                                          {nonConf ? '⚠' : certOk ? '✓C' : '—C'}
                                        </span>
                                      )}
                                      {msgData.po && <span style={{ fontSize: 9, color: '#16A34A', flexShrink: 0 }} title="Bon de commande">📄</span>}
                                      <button onClick={e => { e.stopPropagation(); updateResources(type, resources[type].filter((_, i) => i !== pi)); }}
                                        style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#D1D5DB', fontSize: 14, lineHeight: 1, padding: '0 1px', flexShrink: 0 }}>×</button>
                                    </div>
                                  </div>

                                  {/* ── Détail éditable (accordéon) ── */}
                                  {isExpanded && (
                                    <div style={{ display: 'grid', gridTemplateColumns: COLS, background: '#FAFAFA', borderTop: '1px solid #F1F3F5', borderBottom: '1px solid #EAECEF' }}>

                                      {/* Col 1 : Personne */}
                                      <div style={{ padding: '10px 12px 10px 16px', borderRight: '1px solid #EAECEF', display: 'flex', flexDirection: 'column', gap: 4 }}>
                                        <p style={{ fontSize: 13, fontWeight: 700, color: nonConf ? '#DC2626' : '#15171C', margin: 0 }}>{person.name}</p>
                                        {infoInput('phone',    'Téléphone',   '📞')}
                                        {infoInput('email',    'Courriel',    '✉')}
                                        {infoInput('location', 'Localisation','📍')}
                                        <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                                          <span style={{ fontSize: 11 }}>📅</span>
                                          <input type="date"
                                            value={person.responseDeadline || ''}
                                            onChange={e => updateResources(type, resources[type].map((p2, i2) => i2 === pi ? { ...p2, responseDeadline: e.target.value } : p2))}
                                            title="Date limite de réponse"
                                            style={{ fontSize: 10.5, border: 'none', outline: 'none', background: 'transparent', color: person.responseDeadline ? '#F59E0B' : '#C4C8CE', padding: 0, cursor: 'pointer', fontFamily: 'inherit' }}/>
                                        </div>
                                        {nonConf && <span style={{ fontSize: 9, fontWeight: 800, color: '#DC2626' }}>⚠ NON CONFORME</span>}
                                      </div>

                                      {/* Col 2 : Message */}
                                      <div style={{ padding: '10px 12px', borderRight: '1px solid #EAECEF', display: 'flex', flexDirection: 'column', gap: 5, position: 'relative' }}>
                                        <button onClick={() => generateContactMessage(tradeName, person, type, pKey)} disabled={isLoadingMsg}
                                          style={{ position: 'absolute', top: 8, right: 10, display: 'flex', alignItems: 'center', gap: 4, padding: '3px 8px', borderRadius: 6, border: `1px solid ${BRAND}30`, background: isLoadingMsg ? '#F9F9F9' : `${BRAND}08`, color: BRAND, fontSize: 9.5, fontWeight: 700, cursor: isLoadingMsg ? 'wait' : 'pointer', zIndex: 1 }}>
                                          {isLoadingMsg ? <Loader2 size={9} className="animate-spin"/> : <Sparkles size={9}/>}
                                          {isLoadingMsg ? 'Génère…' : '🔄 Régénérer'}
                                        </button>
                                        <textarea
                                          value={msgData.msg || ''}
                                          onChange={e => setTradePersonMsgs(m => ({ ...m, [pKey]: { ...m[pKey], msg: e.target.value } }))}
                                          rows={4}
                                          placeholder="Le message est généré automatiquement à l'ajout…"
                                          style={{ width: '100%', fontSize: 11.5, lineHeight: 1.6, color: '#3A3D44', border: '1px solid #EAECEF', borderRadius: 8, padding: '7px 9px', paddingTop: 30, resize: 'vertical', fontFamily: 'inherit', background: '#fff', outline: 'none', boxSizing: 'border-box' }}
                                        />
                                        <div style={{ display: 'flex', gap: 5, flexWrap: 'wrap' }}>
                                          {msgData.msg && (
                                            <button onClick={() => navigator.clipboard?.writeText(msgData.msg)}
                                              style={{ display: 'flex', alignItems: 'center', gap: 4, padding: '3px 8px', borderRadius: 6, border: '1.5px solid #E0E4E8', background: '#fff', fontSize: 10, fontWeight: 700, color: '#5A5E6A', cursor: 'pointer' }}>
                                              📋 Copier
                                            </button>
                                          )}
                                          {person.email && msgData.msg && (
                                            <a href={`mailto:${person.email}?subject=${encodeURIComponent(`Projet ${project.name || ''}`)}&body=${encodeURIComponent(msgData.msg)}`}
                                              style={{ display: 'flex', alignItems: 'center', gap: 4, padding: '3px 8px', borderRadius: 6, border: '1.5px solid #2563EB33', background: '#EFF6FF', fontSize: 10, fontWeight: 700, color: '#2563EB', textDecoration: 'none' }}>
                                              ✉ Envoyer
                                            </a>
                                          )}
                                        </div>
                                      </div>

                                      {/* Col 3 : Réponse */}
                                      <div style={{ padding: '10px 12px', borderRight: '1px solid #EAECEF', display: 'flex', flexDirection: 'column', gap: 5 }}>
                                        {[
                                          { label: type === 'internal' ? 'Disponible ✓' : 'Intéressé ✓', val: 'oui', color: '#16A34A', bg: '#ECFDF3' },
                                          { label: type === 'internal' ? 'Indisponible ✗' : 'Pas intéressé ✗', val: 'non', color: '#DC2626', bg: '#FFF5F5' },
                                        ].map(opt => (
                                          <button key={opt.val}
                                            onClick={() => setTradePersonMsgs(m => ({ ...m, [pKey]: { ...m[pKey], disponible: opt.val } }))}
                                            style={{ width: '100%', padding: '4px 6px', borderRadius: 7, border: `1.5px solid ${msgData.disponible === opt.val ? opt.color : '#E0E4E8'}`, background: msgData.disponible === opt.val ? opt.bg : '#fff', fontSize: 10, fontWeight: 700, color: msgData.disponible === opt.val ? opt.color : '#9CA3AF', cursor: 'pointer', textAlign: 'center' }}>
                                            {opt.label}
                                          </button>
                                        ))}
                                        {type === 'external' && (
                                          <div style={{ marginTop: 2 }}>
                                            <span style={{ fontSize: 9, fontWeight: 700, color: '#A8AEB6', textTransform: 'uppercase', letterSpacing: '.05em' }}>Prix soumis</span>
                                            <input value={msgData.prix || ''} onChange={e => setTradePersonMsgs(m => ({ ...m, [pKey]: { ...m[pKey], prix: e.target.value } }))}
                                              placeholder="ex. 4 500 $"
                                              style={{ width: '100%', marginTop: 3, fontSize: 11, border: '1.5px solid #E0E4E8', borderRadius: 7, padding: '4px 7px', outline: 'none', color: '#3A3D44', boxSizing: 'border-box' }}/>
                                            {msgData.prix && msgData.disponible === 'oui' && (
                                              <button onClick={() => cycleStatus(type, pi)}
                                                style={{ width: '100%', marginTop: 5, padding: '4px 7px', borderRadius: 7, border: 'none', background: '#16A34A', color: '#fff', fontSize: 9.5, fontWeight: 800, cursor: 'pointer' }}>
                                                ✓ Accepter → {externalStatuses.find(s => s.key === 'accepte')?.label}
                                              </button>
                                            )}
                                          </div>
                                        )}
                                      </div>

                                      {/* Col 4 : Conformité */}
                                      <div style={{ padding: '10px 12px', borderRight: '1px solid #EAECEF', display: 'flex', flexDirection: 'column', gap: 6 }}>
                                        {isAC ? (
                                          <span style={{ fontSize: 10, color: '#D4D6DA', fontStyle: 'italic' }}>Après contact</span>
                                        ) : (
                                          <>
                                            {renderConformiteBadge(cert, openConformiteBadge, setOpenConformiteBadge, type, pi)}
                                            <button onClick={() => floCheckPersonConformite(tradeName, person, type, pi)} disabled={isLoadingFlo}
                                              style={{ display: 'flex', alignItems: 'center', gap: 4, padding: '3px 8px', borderRadius: 6, border: `1.5px solid ${BRAND}30`, background: isLoadingFlo ? '#F9F9F9' : `${BRAND}08`, color: BRAND, fontSize: 9, fontWeight: 700, cursor: isLoadingFlo ? 'wait' : 'pointer' }}>
                                              {isLoadingFlo ? <Loader2 size={9} className="animate-spin"/> : <Sparkles size={9}/>}
                                              {isLoadingFlo ? 'Vérif…' : 'Flo — Vérifier'}
                                            </button>
                                            {cert.floNotes && (
                                              <p style={{ fontSize: 9, color: '#6B7280', margin: 0, lineHeight: 1.4, fontStyle: 'italic' }}>
                                                {cert.floNotes}
                                                {cert.floDate && <span style={{ display: 'block', fontSize: 8.5, color: '#B0B4BB', marginTop: 2 }}>{cert.floDate}</span>}
                                              </p>
                                            )}
                                          </>
                                        )}
                                      </div>

                                      {/* Col 5 : Bon de commande */}
                                      <div style={{ padding: '10px 12px', display: 'flex', flexDirection: 'column', gap: 6 }}>
                                        {isConfirmed ? (
                                          msgData.po ? (
                                            <>
                                              <div style={{ background: '#F0FDF4', border: '1px solid #86EFAC', borderRadius: 9, padding: '9px 11px' }}>
                                                <span style={{ fontSize: 9, fontWeight: 800, color: '#16A34A', textTransform: 'uppercase', letterSpacing: '.05em', display: 'block', marginBottom: 3 }}>📄 BON DE COMMANDE</span>
                                                <p style={{ fontSize: 10.5, color: '#6B7280', margin: 0, lineHeight: 1.4 }}>
                                                  {msgData.poNum && <span style={{ fontWeight: 700, color: '#15171C' }}>{msgData.poNum} · </span>}
                                                  {msgData.po.slice(0, 70).replace(/\*\*/g, '')}…
                                                </p>
                                              </div>
                                              <button onClick={() => openPOWindow(msgData.po, person.name, msgData.poNum || `PO-000000`)}
                                                style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 5, padding: '7px 10px', borderRadius: 8, border: 'none', background: '#15171C', color: '#fff', fontSize: 10.5, fontWeight: 700, cursor: 'pointer', width: '100%' }}>
                                                📄 Ouvrir / Imprimer PDF
                                              </button>
                                              <div style={{ display: 'flex', gap: 4 }}>
                                                {person.email && (
                                                  <a href={`mailto:${person.email}?subject=${encodeURIComponent(`Bon de commande ${msgData.poNum || ''} — ${project.name || 'Projet'}`)}&body=${encodeURIComponent(msgData.po)}`}
                                                    style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 4, padding: '4px 8px', borderRadius: 7, border: '1.5px solid #2563EB33', background: '#EFF6FF', fontSize: 10, fontWeight: 700, color: '#2563EB', textDecoration: 'none' }}>
                                                    ✉ Envoyer
                                                  </a>
                                                )}
                                                <button onClick={() => generatePO(tradeName, person, type, pKey, msgData.prix, minDate, maxDate)} disabled={isLoadingPO}
                                                  style={{ display: 'flex', alignItems: 'center', gap: 3, padding: '4px 9px', borderRadius: 7, border: `1px solid ${BRAND}30`, background: `${BRAND}08`, fontSize: 10, fontWeight: 700, color: BRAND, cursor: isLoadingPO ? 'wait' : 'pointer' }}>
                                                  {isLoadingPO ? <Loader2 size={9} className="animate-spin"/> : '🔄'} Régén.
                                                </button>
                                              </div>
                                            </>
                                          ) : (
                                            <button onClick={() => generatePO(tradeName, person, type, pKey, msgData.prix, minDate, maxDate)} disabled={isLoadingPO}
                                              style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 5, padding: '9px 10px', borderRadius: 9, border: 'none', background: isLoadingPO ? '#F0F0F0' : '#16A34A', color: '#fff', fontSize: 10.5, fontWeight: 700, cursor: isLoadingPO ? 'wait' : 'pointer', width: '100%' }}>
                                              {isLoadingPO ? <Loader2 size={10} className="animate-spin"/> : '📄'}
                                              {isLoadingPO ? 'Génération…' : 'Générer bon de commande'}
                                            </button>
                                          )
                                        ) : (
                                          <span style={{ fontSize: 10, color: '#D4D6DA', fontStyle: 'italic' }}>
                                            Disponible quand {type === 'internal' ? 'confirmé' : 'accepté'}
                                          </span>
                                        )}
                                      </div>

                                    </div>
                                  )}
                                </div>
                              );
                            })}

                            {/* Ajout personne */}
                            {!tradeStatusFilter && (
                              <div style={{ display: 'flex', alignItems: 'center', padding: '7px 12px 7px 16px', borderTop: list.length ? '1px solid #F4F5F6' : 'none' }}>
                                <span style={{ fontSize: 9, color: '#C4C8CE', fontWeight: 700, textTransform: 'uppercase', width: 50, flexShrink: 0 }}>{typeIcon}</span>
                                <input
                                  value={tradeResInput[inputKey] || ''}
                                  onChange={e => setTradeResInput(m => ({ ...m, [inputKey]: e.target.value }))}
                                  onKeyDown={e => {
                                    if (e.key === 'Enter' && (tradeResInput[inputKey] || '').trim()) {
                                      e.preventDefault();
                                      const newPerson = { name: tradeResInput[inputKey].trim(), status: 'a_contacter', phone: '', email: '', location: '' };
                                      const newList = [...resources[type], newPerson];
                                      updateResources(type, newList);
                                      const newPKey = personKey(tradeName, type, newList.length - 1);
                                      // Ouvrir la ligne + auto-générer message
                                      setTradePersonExpanded(m => ({ ...m, [newPKey]: true }));
                                      setTradeResInput(m => ({ ...m, [inputKey]: '' }));
                                      generateContactMessage(tradeName, newPerson, type, newPKey);
                                    }
                                  }}
                                  placeholder={`+ Ajouter ${type === 'internal' ? 'un employé' : 'un sous-traitant'} — Entrée pour confirmer`}
                                  style={{ flex: 1, border: 'none', outline: 'none', fontSize: 11.5, color: typeColor, background: 'transparent', padding: 0, fontWeight: 600 }}
                                />
                              </div>
                            )}
                          </div>
                        );
                      };

                      return (
                        <div key={tradeName} style={{ borderTop: idx > 0 ? '2px solid #EAECEF' : 'none' }}>
                          {/* Barre header du corps de métier */}
                          <div style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '8px 14px 8px 16px', background: '#FAFAFA', borderBottom: '1px solid #F1F3F5', flexWrap: 'wrap' }}>
                            <span style={{ width: 8, height: 8, borderRadius: '50%', background: tradePhases[0]?.color || BRAND, flexShrink: 0 }}/>
                            <p style={{ fontSize: 13, fontWeight: 800, color: '#15171C', margin: 0 }}>{tradeName}</p>
                            {tradeHours > 0 && (
                              <span style={{ fontSize: 10.5, fontWeight: 700, color: BRAND, background: `${BRAND}12`, borderRadius: 999, padding: '1px 7px' }}>
                                {tradeHours % 1 === 0 ? tradeHours : tradeHours.toFixed(1)} h
                              </span>
                            )}
                            <div style={{ display: 'flex', gap: 5, flexWrap: 'wrap', marginLeft: 2 }}>
                              {tradePhases.map(phase => {
                                const phStart = phase.start_date ? formatTeamDate(phase.start_date) : null;
                                const phEnd   = phase.end_date   ? formatTeamDate(phase.end_date)   : null;
                                const phH     = phase.duration_hours ? `${Number(phase.duration_hours) % 1 === 0 ? Number(phase.duration_hours) : Number(phase.duration_hours).toFixed(1)} h` : null;
                                const dateStr = phStart
                                  ? ` (${phStart}${phEnd && phEnd !== phStart ? ` → ${phEnd}` : ''}${phH ? ` · ${phH}` : ''})`
                                  : phH ? ` (${phH})` : '';
                                return (
                                  <span key={phase.id} onClick={() => setEditPhase(phase)}
                                    style={{ fontSize: 10, fontWeight: 700, color: phase.color || BRAND, background: `${phase.color || BRAND}18`, borderRadius: 999, padding: '2px 8px', cursor: 'pointer' }}>
                                    {phase.name}{dateStr}
                                  </span>
                                );
                              })}
                              {!tradePhases.length && <span style={{ fontSize: 10, color: '#B0B4BB' }}>Aucune phase liée</span>}
                            </div>
                          </div>

                          {renderPersonSection('internal')}
                          {renderPersonSection('external')}
                        </div>
                      );
                    })}

                  </div>{/* fin minWidth */}
                </div>{/* fin overflow-x */}
              </div>
            );
          })()}



        </ProjectSection>


  );
}
