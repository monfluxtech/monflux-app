import React from 'react';
import { Loader2, Plus, Sparkles } from 'lucide-react';
import ProjectSection from '../../ProjectSection';

export default function ProjectDescriptionSection({
  sectionSummary,
  expanded,
  onToggle,
  project,
  InlineField,
  saveField,
  showClientReply,
  clientReplyText,
  setClientReplyText,
  setShowClientReply,
  setPhotoDragOver,
  media,
  setMedia,
  setLightboxItem,
  setShowCapture,
  BRAND,
  PROJ_API_BASE,
  id,
  planAnalysis,
  planUploadRef,
  analyzePlan,
  planAnalysisLoading,
  saveVisionField,
  setProject,
  generatePreview,
  floGenLoading,
  generatedPreviews,
  setGeneratedPreviews,
}) {
  const fieldAssessment = project.field_assessment || {};
  const vision = fieldAssessment.vision || {};
  const storedAnalysis = fieldAssessment.plan_analysis || planAnalysis;
  const planUrl = fieldAssessment.plan_url;

  const SubLabel = ({ children }) => (
    <p style={{ fontSize: 9.5, fontWeight: 800, textTransform: 'uppercase', letterSpacing: '.1em', color: '#9CA3AF', margin: 0 }}>{children}</p>
  );

  return (
    <ProjectSection
      sectionId="s-description"
      icon="📝"
      title="Descriptif de la demande"
      summary={sectionSummary?.summary}
      stats={sectionSummary?.stats}
      expanded={expanded}
      onToggle={onToggle}
      background="#fff"
      borderTop="1px solid #E8EAED"
    >
      <div style={{ padding: '22px 56px 18px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 8 }}>
          <SubLabel>Descriptif de la demande</SubLabel>
        </div>
        <InlineField
          value={project.description || ''}
          onSave={(value) => saveField('description', value)}
          placeholder="Décris ici la demande du client, la portée des travaux, les contraintes particulières…"
          multiline
          style={{ fontSize: 14, color: '#3F3F46', fontWeight: 400, lineHeight: 1.65, maxWidth: 760 }}
          displayStyle={{ fontSize: 14, color: project.description ? '#3F3F46' : '#B0B3BA', fontWeight: 400, lineHeight: 1.65, maxWidth: 760 }}
        />
        {showClientReply && (
          <div style={{ marginTop: 12, padding: 14, background: '#F8FAFB', borderRadius: 10, border: '1px solid #E8EAED' }}>
            <p style={{ fontSize: 11.5, fontWeight: 700, color: '#4B5563', margin: '0 0 8px' }}>Colle ici la réponse reçue du client — elle remplacera le descriptif actuel.</p>
            <textarea
              value={clientReplyText}
              onChange={(e) => setClientReplyText(e.target.value)}
              placeholder="Copie-colle le courriel ou message du client ici…"
              style={{ width: '100%', minHeight: 100, padding: '10px 12px', border: '1px solid #E0E4E8', borderRadius: 8, fontSize: 13, lineHeight: 1.6, fontFamily: 'inherit', outline: 'none', resize: 'vertical', boxSizing: 'border-box', color: '#15171C' }}
            />
            <div style={{ display: 'flex', gap: 8, marginTop: 8 }}>
              <button
                disabled={!clientReplyText.trim()}
                onClick={async () => { await saveField('description', clientReplyText.trim()); setShowClientReply(false); setClientReplyText(''); }}
                className="btn-primary text-xs"
              >
                Enregistrer comme descriptif
              </button>
              <button onClick={() => { setShowClientReply(false); setClientReplyText(''); }} className="btn-secondary text-xs">Annuler</button>
            </div>
          </div>
        )}
      </div>

      <div
        style={{ padding: '0 56px 22px', borderTop: '1px solid #F4F5F6' }}
        onDragOver={(e) => { e.preventDefault(); setPhotoDragOver(true); }}
        onDragLeave={(e) => { if (!e.currentTarget.contains(e.relatedTarget)) setPhotoDragOver(false); }}
        onDrop={async (e) => {
          e.preventDefault();
          setPhotoDragOver(false);
          const droppedFiles = Array.from(e.dataTransfer.files);
          if (!droppedFiles.length) return;
          const token = localStorage.getItem('token');
          for (const file of droppedFiles) {
            const formData = new FormData();
            formData.append('file', file);
            formData.append('project_id', id);
            formData.append('type', file.type.startsWith('image/') ? 'photo' : file.type.startsWith('video/') ? 'video' : 'document');
            formData.append('caption', file.name);
            try {
              const response = await fetch(`${PROJ_API_BASE}/media`, { method: 'POST', headers: { Authorization: `Bearer ${token}` }, body: formData });
              if (response.ok) {
                const data = await response.json();
                setMedia((currentMedia) => [data, ...currentMedia]);
              }
            } catch {}
          }
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, margin: '14px 0 10px' }}>
          <SubLabel>Photos et documents pré-chantier</SubLabel>
          {(media.length > 0 || (project.documents || []).length > 0) && (
            <span style={{ fontSize: 10, color: '#C4C8CE' }}>{media.length + (project.documents || []).length} fichier{media.length + (project.documents || []).length !== 1 ? 's' : ''}</span>
          )}
        </div>
        <div style={{ display: 'flex', gap: 10, overflowX: 'auto', paddingBottom: 6, WebkitOverflowScrolling: 'touch', scrollbarWidth: 'thin', alignItems: 'flex-start' }}>
          {media.map((item) => (
            <div key={item.id} style={{ flexShrink: 0, width: 120, height: 90, borderRadius: 10, border: '1px solid #E8EAED', overflow: 'hidden', background: '#F4F5F6', position: 'relative', cursor: 'pointer' }} onClick={() => setLightboxItem(item)}>
              {item.type === 'photo' && item.url
                ? <img src={item.url} alt={item.caption || 'Photo'} style={{ width: '100%', height: '100%', objectFit: 'cover' }}/>
                : item.type === 'video'
                  ? <div style={{ width: '100%', height: '100%', display: 'grid', placeItems: 'center', background: '#1C1C1E', color: '#fff', fontSize: 28 }}>▶</div>
                  : <div style={{ width: '100%', height: '100%', display: 'grid', placeItems: 'center', fontSize: 28 }}>📎</div>}
              {item.caption && <div style={{ position: 'absolute', bottom: 0, left: 0, right: 0, background: 'rgba(0,0,0,.55)', color: '#fff', fontSize: 9.5, padding: '3px 6px', textOverflow: 'ellipsis', overflow: 'hidden', whiteSpace: 'nowrap' }}>{item.caption}</div>}
            </div>
          ))}
          {(project.documents || []).map((document) => (
            <div key={document.id} style={{ flexShrink: 0, width: 120, height: 90, borderRadius: 10, border: '1px solid #E8EAED', overflow: 'hidden', background: '#F8FAFB', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 4, cursor: 'pointer', padding: 8, boxSizing: 'border-box' }} onClick={() => setLightboxItem({ ...document, type: 'doc' })}>
              <span style={{ fontSize: 26 }}>📄</span>
              <span style={{ fontSize: 9.5, color: '#4B5563', textAlign: 'center', lineHeight: 1.3, overflow: 'hidden', maxWidth: '100%', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{document.name || document.filename || 'Document'}</span>
            </div>
          ))}
          <button onClick={() => setShowCapture(true)} style={{ flexShrink: 0, width: 90, height: 90, borderRadius: 10, border: '1.5px dashed #D1D5DB', background: '#F9FAFB', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 6, cursor: 'pointer', color: '#9CA3AF', transition: 'all .15s', padding: 0 }}>
            <Plus size={20} strokeWidth={1.5}/>
            <span style={{ fontSize: 9.5 }}>Ajouter</span>
          </button>
        </div>
        {(media.length === 0 && (project.documents || []).length === 0) && (
          <p style={{ fontSize: 11.5, color: '#B0B3BA', margin: '2px 0 0', fontStyle: 'italic' }}>Glisse des fichiers ici ou clique sur + pour ajouter des photos et documents.</p>
        )}
      </div>

      <div style={{ padding: '0 56px 26px', borderTop: '1px solid #F4F5F6' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, margin: '14px 0 12px' }}>
          <SubLabel>Vision</SubLabel>
        </div>

        <div style={{ marginBottom: 16 }}>
          <p style={{ fontSize: 10, fontWeight: 800, textTransform: 'uppercase', letterSpacing: '.08em', color: '#9CA3AF', margin: '0 0 8px' }}>Plans d'architecte et Images d'inspiration</p>
          <input ref={planUploadRef} type="file" accept="image/*,.pdf" style={{ display: 'none' }} onChange={(e) => { const file = e.target.files?.[0]; if (file) analyzePlan(file); e.target.value = ''; }}/>
          <div style={{ display: 'flex', gap: 8, overflowX: 'auto', paddingBottom: 6, WebkitOverflowScrolling: 'touch', scrollbarWidth: 'thin', alignItems: 'flex-start' }}>
            {planUrl && (
              <div style={{ flexShrink: 0, width: 110, height: 82, borderRadius: 9, border: `1.5px solid ${BRAND}40`, background: `${BRAND}06`, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 5, cursor: 'pointer', position: 'relative' }} onClick={() => window.open(planUrl, '_blank')}>
                <span style={{ fontSize: 26 }}>📐</span>
                <span style={{ fontSize: 9.5, color: BRAND, fontWeight: 600 }}>Voir plan ↗</span>
                {planAnalysisLoading && (
                  <div style={{ position: 'absolute', inset: 0, background: 'rgba(255,255,255,.85)', display: 'flex', alignItems: 'center', justifyContent: 'center', borderRadius: 9 }}>
                    <Loader2 size={16} style={{ animation: 'spin 1s linear infinite', color: BRAND }}/>
                  </div>
                )}
              </div>
            )}
            <button onClick={() => planUploadRef.current?.click()} style={{ flexShrink: 0, width: 90, height: 82, borderRadius: 9, border: '1.5px dashed #D1D5DB', background: '#F9FAFB', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 5, cursor: 'pointer', color: '#9CA3AF', padding: 0 }}>
              <Plus size={18} strokeWidth={1.5}/>
              <span style={{ fontSize: 9.5 }}>{planUrl ? 'Remplacer' : 'Plan'}</span>
            </button>
          </div>
        </div>

        <div style={{ marginBottom: 12 }}>
          <p style={{ fontSize: 10, fontWeight: 800, textTransform: 'uppercase', letterSpacing: '.08em', color: '#9CA3AF', margin: '0 0 6px' }}>Style souhaité <span style={{ fontWeight: 500, textTransform: 'none', letterSpacing: 0 }}>(si le client en a un)</span></p>
          <select
            value={vision.style || ''}
            onChange={(e) => {
              const value = e.target.value;
              setProject((currentProject) => ({ ...currentProject, field_assessment: { ...(currentProject.field_assessment || {}), vision: { ...(currentProject.field_assessment?.vision || {}), style: value } } }));
              saveVisionField({ style: value });
            }}
            style={{ padding: '8px 12px', border: '1.5px solid #E0E4E8', borderRadius: 9, fontSize: 12.5, fontFamily: 'inherit', outline: 'none', color: vision.style ? '#15171C' : '#9CA3AF', background: '#fff', minWidth: 220 }}
          >
            <option value="">Non précisé</option>
            <option value="Moderne">Moderne</option>
            <option value="Contemporain">Contemporain</option>
            <option value="Traditionnel">Traditionnel</option>
            <option value="Transitionnel">Transitionnel</option>
            <option value="Rustique / Chalet">Rustique / Chalet</option>
            <option value="Champêtre / Farmhouse">Champêtre / Farmhouse</option>
            <option value="Scandinave">Scandinave</option>
            <option value="Industriel">Industriel</option>
            <option value="Minimaliste">Minimaliste</option>
            <option value="Autre">Autre</option>
          </select>
        </div>

        <div style={{ display: 'flex', gap: 12, alignItems: 'flex-start', marginBottom: 16 }}>
          <textarea
            value={vision.text || ''}
            onChange={(e) => {
              const value = e.target.value;
              setProject((currentProject) => ({ ...currentProject, field_assessment: { ...(currentProject.field_assessment || {}), vision: { ...(currentProject.field_assessment?.vision || {}), text: value } } }));
            }}
            onBlur={(e) => saveVisionField({ text: e.target.value })}
            rows={4}
            placeholder="Décris la vision du projet, le style souhaité, les matériaux envisagés… Colle des liens Pinterest, Houzz, Instagram ou toute référence."
            style={{ flex: 1, padding: '10px 13px', border: '1.5px solid #E0E4E8', borderRadius: 10, fontSize: 13, fontFamily: 'inherit', outline: 'none', resize: 'vertical', color: '#15171C', lineHeight: 1.65 }}
          />
          <button onClick={() => generatePreview(vision.text)} disabled={floGenLoading || !(vision.text || '').trim()} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 5, padding: '12px 14px', borderRadius: 10, border: 'none', background: BRAND, color: '#fff', fontSize: 11, fontWeight: 700, cursor: floGenLoading || !(vision.text || '').trim() ? 'default' : 'pointer', opacity: !(vision.text || '').trim() ? 0.4 : 1, flexShrink: 0, minWidth: 80, alignSelf: 'stretch' }}>
            {floGenLoading ? <Loader2 size={15} style={{ animation: 'spin 1s linear infinite' }}/> : <Sparkles size={15}/>}
            <span style={{ lineHeight: 1.3, textAlign: 'center' }}>{floGenLoading ? 'Génération…' : 'Générer\nprévisualisation'}</span>
          </button>
        </div>

        {storedAnalysis && (
          <div style={{ marginTop: 4 }}>
            {storedAnalysis.general && (
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, marginBottom: 14 }}>
                {[['Superficie', storedAnalysis.general.superficie_totale], ['Pièces', storedAnalysis.general.nb_pieces], ['Style', storedAnalysis.general.style], ['Contraintes', storedAnalysis.general.contraintes_particulieres]].filter(([, value]) => value).map(([label, value]) => (
                  <div key={label} style={{ background: '#F8F9FA', borderRadius: 8, padding: '5px 12px', border: '1px solid #E8EAED' }}>
                    <span style={{ fontSize: 9, fontWeight: 800, color: '#9CA3AF', textTransform: 'uppercase', letterSpacing: '.05em', display: 'block' }}>{label}</span>
                    <span style={{ fontSize: 12, color: '#374151', fontWeight: 600 }}>{value}</span>
                  </div>
                ))}
              </div>
            )}
            {(storedAnalysis.specialisations || []).filter((specialisation) => specialisation.items?.length > 0).map((specialisation) => (
              <div key={specialisation.metier} style={{ marginBottom: 16 }}>
                <p style={{ fontSize: 10.5, fontWeight: 800, color: '#6B7280', textTransform: 'uppercase', letterSpacing: '.06em', margin: '0 0 6px', display: 'flex', alignItems: 'center', gap: 6 }}>
                  <span style={{ display: 'inline-block', width: 6, height: 6, borderRadius: '50%', background: BRAND }}/>
                  {specialisation.metier}
                </p>
                <div style={{ overflowX: 'auto', borderRadius: 8, border: '1px solid #E8EAED' }}>
                  <table style={{ width: '100%', borderCollapse: 'collapse', minWidth: 560 }}>
                    <thead>
                      <tr style={{ background: '#F8F9FA' }}>
                        {['Élément', 'Détail', 'Quantité / mesure', 'Notes chantier'].map((label) => (
                          <th key={label} style={{ padding: '6px 10px', fontSize: 9.5, fontWeight: 700, color: '#6B7280', textAlign: 'left', textTransform: 'uppercase', letterSpacing: '.04em', borderBottom: '1px solid #E8EAED' }}>{label}</th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {specialisation.items.map((item, index) => (
                        <tr key={index} style={{ borderBottom: index < specialisation.items.length - 1 ? '1px solid #F3F4F6' : 'none' }}>
                          <td style={{ padding: '6px 10px', fontSize: 12, fontWeight: 600, color: '#111827' }}>{item.element}</td>
                          <td style={{ padding: '6px 10px', fontSize: 12, color: '#374151' }}>{item.detail}</td>
                          <td style={{ padding: '6px 10px', fontSize: 11.5, color: '#6B7280', whiteSpace: 'nowrap' }}>{item.quantite || '—'}</td>
                          <td style={{ padding: '6px 10px', fontSize: 11, color: '#9CA3AF' }}>{item.notes_chantier || '—'}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            ))}
          </div>
        )}

        {generatedPreviews.length > 0 && (
          <div style={{ marginTop: 16 }}>
            <p style={{ fontSize: 10, fontWeight: 800, textTransform: 'uppercase', letterSpacing: '.08em', color: '#9CA3AF', margin: '0 0 10px' }}>Prévisualisations générées</p>
            <div style={{ display: 'flex', gap: 12, overflowX: 'auto', paddingBottom: 6, WebkitOverflowScrolling: 'touch', scrollbarWidth: 'thin' }}>
              {generatedPreviews.map((preview) => (
                <div key={preview.id} style={{ flexShrink: 0, width: 240, borderRadius: 12, overflow: 'hidden', border: '1px solid #E8EAED', background: '#F8F9FA', position: 'relative' }}>
                  <img src={preview.url} alt={preview.prompt} loading="lazy" style={{ width: '100%', height: 160, objectFit: 'cover', display: 'block' }} onError={(e) => { e.target.style.display = 'none'; }}/>
                  {preview.based_on_photo != null && (
                    <span style={{ position: 'absolute', top: 6, left: 6, fontSize: 9, fontWeight: 700, padding: '2px 7px', borderRadius: 999, color: '#fff', background: preview.based_on_photo ? 'rgba(22,163,74,.85)' : 'rgba(107,114,128,.75)' }}>
                      {preview.based_on_photo ? 'Basé sur ta photo' : 'Sans photo de référence'}
                    </span>
                  )}
                  <div style={{ padding: '8px 10px 9px' }}>
                    <p style={{ fontSize: 10.5, color: '#6B7280', margin: 0, lineHeight: 1.4, display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>{preview.prompt}</p>
                    <div style={{ display: 'flex', gap: 6, marginTop: 6 }}>
                      <a href={preview.url} target="_blank" rel="noreferrer" style={{ fontSize: 10, color: BRAND, fontWeight: 700, textDecoration: 'none' }}>Voir grand ↗</a>
                      <button
                        onClick={() => {
                          const next = generatedPreviews.filter((item) => item.id !== preview.id);
                          setGeneratedPreviews(next);
                          localStorage.setItem(`monflux-gen-previews-${id}`, JSON.stringify(next));
                        }}
                        style={{ fontSize: 10, color: '#D1D5DB', background: 'none', border: 'none', cursor: 'pointer', marginLeft: 'auto' }}
                      >
                        Supprimer
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
        {generatedPreviews.length === 0 && !floGenLoading && (vision.text || '').trim() && (
          <p style={{ fontSize: 11.5, color: '#C4C8CE', fontStyle: 'italic', marginTop: 6 }}>Clique "Générer prévisualisation" pour voir un rendu photoréaliste du résultat final.</p>
        )}
      </div>
    </ProjectSection>
  );
}
