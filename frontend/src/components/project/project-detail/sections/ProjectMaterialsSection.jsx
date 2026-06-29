import React from 'react';
import { Loader2, Sparkles } from 'lucide-react';
import ProjectSection from '../../ProjectSection';

export default function ProjectMaterialsSection({
  sectionSummary,
  expanded,
  onToggle,
  sectionGuard,
  id,
  matFilter,
  setMatFilter,
  matSearchResults,
  matWishlist,
  matSearchQuery,
  setMatSearchQuery,
  fetchMaterialSearch,
  matSearchLoading,
  BRAND,
  matSelected,
  setMatSelected,
  toggleMatWishlist,
  setMatSearchResults,
  salesLocked,
  createChangeRequestFromMaterials,
  ensureQuote,
  quoteBuilderItems,
  setQuoteBuilderItems,
  scheduleQuoteSave,
}) {
  const warnings = (() => {
    try { return JSON.parse(localStorage.getItem(`monflux-mat-warnings-${id}`) || '[]'); } catch { return []; }
  })();
  const displayed = matFilter === 'wishlist' ? matSearchResults.filter((item) => matWishlist.includes(item.id)) : matSearchResults;
  const byCategory = {};
  displayed.forEach((item) => {
    if (!byCategory[item.categorie]) byCategory[item.categorie] = [];
    byCategory[item.categorie].push(item);
  });

  return (
    <ProjectSection
      sectionId="s-materiaux"
      icon="🔍"
      title="Recherche de matériaux"
      summary={sectionSummary?.summary}
      stats={sectionSummary?.stats}
      expanded={expanded}
      onToggle={onToggle}
      background="#F0F5FF"
    >
      {sectionGuard('s-materiaux')}
      <div style={{ display: 'flex', gap: 8, marginBottom: 18, flexWrap: 'wrap' }}>
        <input
          value={matSearchQuery}
          onChange={(e) => setMatSearchQuery(e.target.value)}
          onKeyDown={(e) => { if (e.key === 'Enter') fetchMaterialSearch(matSearchQuery); }}
          placeholder='ex: "plancher de bois", "robinetterie matte noire"… ou laisse vide pour une proposition complète'
          style={{ flex: 1, minWidth: 260, padding: '9px 14px', border: '1px solid #E0E4E8', borderRadius: 9, fontSize: 13, fontFamily: 'inherit', outline: 'none', color: '#15171C' }}
        />
        <button
          onClick={() => fetchMaterialSearch(matSearchQuery)}
          disabled={matSearchLoading}
          style={{ display: 'flex', alignItems: 'center', gap: 7, padding: '9px 18px', borderRadius: 9, border: 'none', background: BRAND, color: '#fff', fontSize: 13, fontWeight: 700, cursor: matSearchLoading ? 'wait' : 'pointer', flexShrink: 0 }}
        >
          {matSearchLoading ? <Loader2 size={14} style={{ animation: 'spin 1s linear infinite' }}/> : <Sparkles size={14}/>}
          {matSearchLoading ? 'Recherche…' : 'Rechercher avec Flo'}
        </button>
        {matSearchResults.length > 0 && (
          <div style={{ display: 'flex', gap: 3, background: '#F3F4F6', borderRadius: 8, padding: 3, alignSelf: 'center' }}>
            {[['all', 'Tout'], ['wishlist', `⭐ Wishlist${matWishlist.length > 0 ? ` (${matWishlist.length})` : ''}`]].map(([value, label]) => (
              <button
                key={value}
                onClick={() => setMatFilter(value)}
                style={{ padding: '5px 12px', borderRadius: 6, border: 'none', fontSize: 11.5, fontWeight: 600, cursor: 'pointer', background: matFilter === value ? '#fff' : 'transparent', color: matFilter === value ? '#111827' : '#9CA3AF', boxShadow: matFilter === value ? '0 1px 3px rgba(0,0,0,.1)' : 'none' }}
              >
                {label}
              </button>
            ))}
          </div>
        )}
      </div>

      {warnings.length > 0 && (
        <div style={{ marginBottom: 18 }}>
          {warnings.map((warning, index) => (
            <div key={index} style={{ display: 'flex', gap: 10, padding: '10px 14px', background: '#FFFBEB', borderRadius: 9, border: '1px solid #FCD34D', marginBottom: 8 }}>
              <span style={{ fontSize: 16, flexShrink: 0 }}>⚠️</span>
              <p style={{ fontSize: 12, color: '#92400E', margin: 0, lineHeight: 1.5 }}>{warning.message}</p>
            </div>
          ))}
        </div>
      )}

      {matSearchLoading ? (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10, alignItems: 'center', padding: '48px 0', color: '#9CA3AF' }}>
          <Loader2 size={26} style={{ animation: 'spin 1s linear infinite', color: BRAND }}/>
          <p style={{ fontSize: 13, margin: 0 }}>Flo recherche les meilleures options chez tes fournisseurs…</p>
        </div>
      ) : Object.keys(byCategory).length > 0 ? (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 22 }}>
          {Object.entries(byCategory).map(([category, items]) => (
            <div key={category}>
              <p style={{ fontSize: 11, fontWeight: 800, textTransform: 'uppercase', letterSpacing: '.07em', color: '#6B7280', margin: '0 0 10px', display: 'flex', alignItems: 'center', gap: 6 }}>
                <span style={{ width: 6, height: 6, borderRadius: '50%', background: BRAND, display: 'inline-block' }}/>
                {category} · {items.length} option{items.length !== 1 ? 's' : ''}
              </p>
              <div style={{ overflowX: 'auto', borderRadius: 10, border: '1px solid #E8EAED' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse', minWidth: 720 }}>
                  <thead>
                    <tr style={{ background: '#F8F9FA' }}>
                      {['☑', '', 'Produit', 'Fournisseur', 'Prix unit.', 'Unité', 'Note Flo', 'Lien', 'Wishlist', ''].map((label, index) => (
                        <th key={index} style={{ padding: '8px 10px', fontSize: 9.5, fontWeight: 700, color: '#6B7280', textAlign: (index === 4 || index === 8) ? 'right' : 'left', textTransform: 'uppercase', letterSpacing: '.04em', borderBottom: '1px solid #E8EAED', whiteSpace: 'nowrap' }}>{label}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {items.map((item, index) => {
                      const inWishlist = matWishlist.includes(item.id);
                      const isSelected = matSelected.has(item.id);
                      return (
                        <tr key={item.id || index} style={{ borderBottom: index < items.length - 1 ? '1px solid #F3F4F6' : 'none', background: isSelected ? '#F0FFF4' : inWishlist ? '#FFFDF5' : 'transparent' }}>
                          <td style={{ padding: '7px 10px', width: 34 }}>
                            <input
                              type="checkbox"
                              checked={isSelected}
                              onChange={() => setMatSelected((selected) => {
                                const next = new Set(selected);
                                next.has(item.id) ? next.delete(item.id) : next.add(item.id);
                                return next;
                              })}
                              style={{ accentColor: BRAND, cursor: 'pointer', width: 15, height: 15 }}
                            />
                          </td>
                          <td style={{ padding: '7px 8px', width: 52 }}>
                            {item.url_image ? (
                              <img src={item.url_image} alt={item.nom} style={{ width: 44, height: 44, objectFit: 'cover', borderRadius: 7, border: '1px solid #E8EAED' }} onError={(e) => { e.target.style.display = 'none'; e.target.nextSibling.style.display = 'grid'; }}/>
                            ) : null}
                            <div style={{ width: 44, height: 44, borderRadius: 7, background: '#F3F4F6', display: item.url_image ? 'none' : 'grid', placeItems: 'center', fontSize: 20 }}>🪵</div>
                          </td>
                          <td style={{ padding: '7px 10px', fontSize: 13, fontWeight: 600, color: '#111827', maxWidth: 200 }}>{item.nom}</td>
                          <td style={{ padding: '7px 10px', whiteSpace: 'nowrap' }}>
                            <div style={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
                              <span style={{ display: 'inline-block', background: '#F3F4F6', borderRadius: 5, padding: '2px 9px', fontSize: 11, fontWeight: 600, color: '#374151' }}>{item.fournisseur}</span>
                              {item.source_verified === false ? (
                                <span style={{ fontSize: 9.5, color: '#D97706', fontWeight: 600 }}>⚠ Estimation Flo</span>
                              ) : item.source_type === 'apify' || item.source_type === 'api' ? (
                                <span style={{ fontSize: 9.5, color: '#16A34A', fontWeight: 600 }}>✓ Prix réel</span>
                              ) : null}
                            </div>
                          </td>
                          <td style={{ padding: '7px 10px', fontSize: 14, fontWeight: 700, color: '#111827', textAlign: 'right', whiteSpace: 'nowrap' }}>
                            {item.prix_unitaire ? `${Number(item.prix_unitaire).toFixed(2)} $` : '—'}
                          </td>
                          <td style={{ padding: '7px 10px', fontSize: 11.5, color: '#9CA3AF' }}>{item.unite || '—'}</td>
                          <td style={{ padding: '7px 10px', fontSize: 11.5, color: '#6B7280', maxWidth: 200 }}>
                            <span style={{ display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>{item.note_flo || item.note || '—'}</span>
                          </td>
                          <td style={{ padding: '7px 10px' }}>
                            {item.url_source ? (
                              <a href={item.url_source} target="_blank" rel="noreferrer" style={{ fontSize: 11.5, color: BRAND, fontWeight: 600, textDecoration: 'none', whiteSpace: 'nowrap' }}>Voir ↗</a>
                            ) : '—'}
                          </td>
                          <td style={{ padding: '7px 10px', textAlign: 'right' }}>
                            <button onClick={() => toggleMatWishlist(item.id)} style={{ background: inWishlist ? '#FEF3C7' : '#F3F4F6', border: inWishlist ? '1.5px solid #FCD34D' : '1.5px solid #E5E7EB', borderRadius: 7, padding: '5px 11px', cursor: 'pointer', fontSize: 14, color: inWishlist ? '#D97706' : '#9CA3AF', fontWeight: 700, transition: 'all .15s' }}>
                              {inWishlist ? '⭐' : '☆'}
                            </button>
                          </td>
                          <td style={{ padding: '7px 8px', textAlign: 'center' }}>
                            <button onClick={() => setMatSearchResults((results) => results.filter((result) => result.id !== item.id))} title="Supprimer ce résultat" style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: 15, color: '#D1D5DB', lineHeight: 1, padding: '2px 4px' }}>×</button>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          ))}

          {matSelected.size > 0 && (
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '12px 16px', background: '#F0FFF4', borderRadius: 10, border: '1px solid #86EFAC', flexWrap: 'wrap' }}>
              <span style={{ fontSize: 13, color: '#15803D', fontWeight: 700 }}>{matSelected.size} article{matSelected.size !== 1 ? 's' : ''} sélectionné{matSelected.size !== 1 ? 's' : ''}</span>
              <button
                onClick={async () => {
                  const selectedItems = matSearchResults.filter((item) => matSelected.has(item.id));
                  if (salesLocked) {
                    const created = await createChangeRequestFromMaterials(selectedItems, 'matériaux sélectionnés');
                    if (created) setMatSelected(new Set());
                    return;
                  }
                  const quote = await ensureQuote();
                  if (!quote) return;
                  const nextItems = [...quoteBuilderItems, ...selectedItems.map((item) => ({
                    type: 'material',
                    name: item.nom,
                    qty: 1,
                    unit: item.unite || 'un.',
                    unit_price: Number(item.prix_unitaire) || 0,
                    url: item.url_source || '',
                    markup: 0,
                    source: 'flo',
                    show_on_quote: true,
                  }))];
                  setQuoteBuilderItems(nextItems);
                  scheduleQuoteSave(nextItems);
                  setMatSelected(new Set());
                }}
                style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '8px 16px', borderRadius: 8, border: 'none', background: '#16A34A', color: '#fff', fontSize: 12, fontWeight: 700, cursor: 'pointer' }}
              >
                → {salesLocked ? 'Ajouter à une demande de changement' : 'Ajouter au devis détaillé'}
              </button>
              <button onClick={() => setMatSelected(new Set())} style={{ fontSize: 11, padding: '4px 10px', borderRadius: 7, border: '1px solid #86EFAC', background: 'transparent', color: '#16A34A', cursor: 'pointer' }}>
                Désélectionner
              </button>
            </div>
          )}

          {matWishlist.length > 0 && (
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '12px 16px', background: '#F5F3FF', borderRadius: 10, border: '1px solid #DDD6FE', flexWrap: 'wrap' }}>
              <span style={{ fontSize: 13, color: BRAND, fontWeight: 700 }}>{matWishlist.length} article{matWishlist.length !== 1 ? 's' : ''} dans la wishlist</span>
              <button
                onClick={async () => {
                  const wishlistItems = matSearchResults.filter((item) => matWishlist.includes(item.id));
                  if (salesLocked) {
                    await createChangeRequestFromMaterials(wishlistItems, 'wishlist matériaux');
                    return;
                  }
                  const quote = await ensureQuote();
                  if (!quote) return;
                  const nextItems = [...quoteBuilderItems, ...wishlistItems.map((item) => ({
                    type: 'material',
                    name: item.nom,
                    qty: 1,
                    unit: item.unite || 'un.',
                    unit_price: Number(item.prix_unitaire) || 0,
                    url: item.url_source || '',
                    markup: 0,
                    source: 'flo',
                    show_on_quote: true,
                  }))];
                  setQuoteBuilderItems(nextItems);
                  scheduleQuoteSave(nextItems);
                }}
                style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '8px 16px', borderRadius: 8, border: 'none', background: BRAND, color: '#fff', fontSize: 12, fontWeight: 700, cursor: 'pointer' }}
              >
                → {salesLocked ? 'Créer une demande de changement' : 'Importer wishlist dans le devis'}
              </button>
              <span style={{ fontSize: 11, color: '#9CA3AF' }}>
                {salesLocked ? 'Le devis est verrouillé : les matériaux partent maintenant en demande de changement.' : 'Ajoutés dans la section Matériaux du devis détaillé.'}
              </span>
            </div>
          )}
        </div>
      ) : (
        <div style={{ textAlign: 'center', padding: '52px 0', color: '#9CA3AF' }}>
          <div style={{ fontSize: 44, marginBottom: 14 }}>🔍</div>
          <p style={{ fontSize: 14, fontWeight: 600, color: '#6B7280', margin: '0 0 6px' }}>Aucun résultat pour l'instant</p>
          <p style={{ fontSize: 12.5, margin: '0 auto', maxWidth: 420, color: '#9CA3AF', lineHeight: 1.6 }}>
            Écris ce que tu cherches ou laisse vide — Flo analyse le projet et propose tout ce qui est nécessaire, en tenant compte des éléments conservés et des contraintes.
          </p>
        </div>
      )}
    </ProjectSection>
  );
}
