import React from 'react';
import { AlertCircle, Camera, Loader2, Mic, Plus, ShieldAlert, Sparkles, StickyNote, Trash2 } from 'lucide-react';
import ProjectSection from '../../ProjectSection';

export default function ProjectMediaSection({
  sectionSummary,
  expanded,
  onToggle,
  BRAND,
  SEV,
  notesSaving,
  notes,
  handleNotesChange,
  showMediaForm,
  setShowMediaForm,
  mediaForm,
  setMediaForm,
  addMedia,
  media,
  setLightboxItem,
  analyzeMedia,
  analyzingMediaId,
  deleteMedia,
}) {
  return (
    <ProjectSection
      sectionId="s-media"
      icon="📷"
      title="Notes et photos"
      summary={sectionSummary?.summary}
      stats={sectionSummary?.stats}
      expanded={expanded}
      onToggle={onToggle}
      background="#F4EFE4"
    >
      <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: 20 }}>
        <button className="btn-secondary text-xs" onClick={() => setShowMediaForm((value) => !value)}><Plus size={13}/> Ajouter</button>
      </div>

      <div style={{ background: '#fff', borderRadius: 12, padding: 16, marginBottom: 20, border: '1px solid #E8EAED' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8 }}>
          <StickyNote size={14} style={{ color: BRAND }} />
          <span style={{ fontSize: 12, fontWeight: 700, color: '#3A3D44' }}>Notes de chantier</span>
          {notesSaving && <span style={{ fontSize: 11, color: '#7C8089', marginLeft: 'auto' }}>Enregistrement…</span>}
        </div>
        <textarea
          className="input resize-none"
          style={{ minHeight: 80 }}
          placeholder="Ajoutez des notes, remarques ou observations…"
          value={notes}
          onChange={(e) => handleNotesChange(e.target.value)}
        />
      </div>

      {showMediaForm && (
        <form onSubmit={addMedia} className="bg-gray-50 rounded-xl p-3 mb-3 space-y-2">
          <div className="flex gap-2">
            {[
              { key: 'note', icon: <StickyNote size={13}/>, label: 'Note' },
              { key: 'voice', icon: <Mic size={13}/>, label: 'Mémo vocal' },
            ].map(({ key, icon, label }) => (
              <button
                key={key}
                type="button"
                className={`flex items-center gap-1 text-xs px-2.5 py-1.5 rounded-lg border transition-colors ${mediaForm.type === key ? 'border-brand bg-orange-50 text-brand' : 'border-gray-200 text-gray-400'}`}
                onClick={() => setMediaForm((form) => ({ ...form, type: key }))}
              >
                {icon} {label}
              </button>
            ))}
          </div>

          {mediaForm.type === 'voice' ? (
            <div>
              <label className="label">Transcription du mémo vocal *</label>
              <textarea className="input" rows={2} value={mediaForm.transcript} onChange={(e) => setMediaForm((form) => ({ ...form, transcript: e.target.value }))} placeholder="Transcrivez ou collez le contenu du mémo… (enregistrement audio à venir)" required/>
            </div>
          ) : (
            <>
              <div>
                <label className="label">Observation ou note *</label>
                <textarea className="input" rows={2} value={mediaForm.caption} onChange={(e) => setMediaForm((form) => ({ ...form, caption: e.target.value }))} placeholder="Ex: Coffrage mal aligné au coin sud-est…"/>
              </div>
              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="label" style={{ margin: 0 }}>Photos (optionnel)</label>
                  <button type="button" className="flex items-center gap-1 text-xs text-brand font-semibold" onClick={() => setMediaForm((form) => ({ ...form, photos: [...form.photos, { url: '' }] }))}>
                    <Plus size={11}/> Ajouter une photo
                  </button>
                </div>
                {mediaForm.photos.map((photo, index) => (
                  <div key={index} className="flex items-center gap-2 mb-1">
                    <input
                      className="input flex-1"
                      value={photo.url}
                      onChange={(e) => setMediaForm((form) => {
                        const photos = [...form.photos];
                        photos[index] = { ...photos[index], url: e.target.value };
                        return { ...form, photos };
                      })}
                      placeholder="URL de la photo…"
                    />
                    {photo.url && <img src={photo.url} alt="" style={{ width: 36, height: 36, objectFit: 'cover', borderRadius: 6, border: '1px solid #E8EAED', flexShrink: 0 }} onError={(event) => { event.target.style.display = 'none'; }}/>}
                    <button type="button" className="text-gray-300 hover:text-red-400" onClick={() => setMediaForm((form) => ({ ...form, photos: form.photos.filter((_, photoIndex) => photoIndex !== index) }))}>
                      <Trash2 size={12}/>
                    </button>
                  </div>
                ))}
              </div>
            </>
          )}
          <div className="flex justify-end">
            <button
              type="submit"
              className="btn-primary text-xs px-4"
              disabled={mediaForm.type === 'voice' ? !mediaForm.transcript.trim() : (!mediaForm.caption.trim() && !mediaForm.photos.some((photo) => photo.url.trim()))}
            >
              Ajouter
            </button>
          </div>
        </form>
      )}

      {media.length > 0 ? (
        <>
          {media.some((item) => item.url || (item.photos && item.photos.length > 0)) && (
            <div style={{ display: 'flex', gap: 12, overflowX: 'auto', paddingBottom: 12, marginBottom: 4, scrollbarWidth: 'thin' }}>
              {media.flatMap((item) => {
                const photoList = item.photos && item.photos.length > 0
                  ? item.photos.map((photo, index) => ({ _key: `${item.id}-${index}`, url: photo.url, caption: item.caption, created_at: item.created_at, _entry: item }))
                  : item.url ? [{ _key: item.id, url: item.url, caption: item.caption, created_at: item.created_at, _entry: item }] : [];
                return photoList;
              }).map((item) => (
                <div key={`gal-${item._key}`} style={{ flexShrink: 0, width: 160, borderRadius: 12, overflow: 'hidden', border: '1px solid #E8EAED', background: '#fff', cursor: 'pointer' }} onClick={() => setLightboxItem(item._entry)}>
                  <img src={item.url} alt={item.caption || ''} style={{ width: '100%', height: 110, objectFit: 'cover', display: 'block' }} onError={(event) => { event.target.parentElement.querySelector('.gal-fallback').style.display = 'grid'; event.target.style.display = 'none'; }}/>
                  <div className="gal-fallback" style={{ width: '100%', height: 110, background: '#F4F6F8', display: 'none', placeItems: 'center', fontSize: 28 }}>📷</div>
                  <div style={{ padding: '8px 10px' }}>
                    <p style={{ fontSize: 11, color: '#7C8089', margin: 0 }}>{new Date(item.created_at).toLocaleDateString('fr-CA', { day: 'numeric', month: 'short' })}</p>
                    <p style={{ fontSize: 12, color: '#15171C', margin: '2px 0 0', overflow: 'hidden', display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical' }}>{item.caption || '—'}</p>
                  </div>
                </div>
              ))}
            </div>
          )}
          <div className="space-y-2">
            {media.map((item) => {
              const analysis = item.ai_analysis;
              const issues = (analysis?.non_conformities?.length || 0) + (analysis?.safety_risks?.length || 0);
              return (
                <div key={item.id} className="border border-gray-100 rounded-xl p-3">
                  <div className="flex items-start gap-3">
                    <div className="flex-shrink-0 cursor-pointer" onClick={() => setLightboxItem(item)}>
                      {item.photos && item.photos.length > 0 ? (
                        <div style={{ display: 'flex', gap: 3 }}>
                          {item.photos.slice(0, 3).map((photo, index) => (
                            <img key={index} src={photo.url} alt="" style={{ width: item.photos.length === 1 ? 56 : 36, height: item.photos.length === 1 ? 56 : 36, objectFit: 'cover', borderRadius: 8, border: '1px solid #E8EAED' }}/>
                          ))}
                          {item.photos.length > 3 && <div style={{ width: 36, height: 36, borderRadius: 8, background: '#F4F6F8', display: 'grid', placeItems: 'center', fontSize: 10, fontWeight: 700, color: '#7C8089', border: '1px solid #E8EAED' }}>+{item.photos.length - 3}</div>}
                        </div>
                      ) : item.url ? (
                        <img src={item.url} alt={item.caption || ''} className="w-14 h-14 rounded-lg object-cover border border-gray-100"/>
                      ) : (
                        <div className="w-14 h-14 rounded-lg bg-gray-50 flex items-center justify-center">{item.type === 'voice' ? <Mic size={18} className="text-gray-300"/> : <StickyNote size={18} className="text-gray-300"/>}</div>
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="badge badge-gray text-[10px]">{item.type === 'voice' ? 'vocal' : item.photos?.length > 0 ? `note · ${item.photos.length} photo${item.photos.length > 1 ? 's' : ''}` : item.url ? 'note · photo' : 'note'}</span>
                        {item.ai_status === 'done' && analysis?.overall_severity && <span className={`badge ${SEV[analysis.overall_severity]?.c || 'badge-gray'} text-[10px]`}>{issues > 0 ? `${issues} point(s)` : 'Conforme'}</span>}
                        <span className="text-[11px] text-gray-300 ml-auto">{item.author_name || ''} · {new Date(item.created_at).toLocaleDateString('fr-CA')}</span>
                      </div>
                      <p className="text-sm text-gray-700 mt-1 truncate">{item.caption || item.transcript || '—'}</p>
                    </div>
                    <div className="flex flex-col gap-1 flex-shrink-0">
                      <button className="btn-ghost text-[11px] py-1 px-2 text-brand" onClick={() => analyzeMedia(item.id)} disabled={analyzingMediaId === item.id}>
                        {analyzingMediaId === item.id ? <Loader2 size={12} className="animate-spin"/> : <Sparkles size={12}/>} Analyser
                      </button>
                      <button className="btn-ghost p-1 text-gray-300 hover:text-red-500 self-end" onClick={() => deleteMedia(item.id)}><Trash2 size={12}/></button>
                    </div>
                  </div>
                  {item.ai_status === 'done' && analysis && (
                    <div className="mt-2 pt-2 border-t border-gray-50 space-y-2">
                      {analysis.summary && <p className="text-xs text-gray-500 italic">{analysis.summary}</p>}
                      {analysis.non_conformities?.length > 0 && (
                        <div>
                          <p className="text-[11px] font-semibold text-gray-500 flex items-center gap-1 mb-1"><AlertCircle size={11} className="text-orange-400"/> Non-conformités</p>
                          {analysis.non_conformities.map((issue, index) => (
                            <div key={index} className="flex items-start gap-2 mb-1">
                              <span className={`badge ${SEV[issue.severity]?.c || 'badge-gray'} text-[9px] mt-0.5 flex-shrink-0`}>{SEV[issue.severity]?.l || issue.severity}</span>
                              <p className="text-xs text-gray-600"><span className="font-medium">{issue.issue}</span>{issue.recommendation ? ` — ${issue.recommendation}` : ''}{issue.reference ? ` (${issue.reference})` : ''}</p>
                            </div>
                          ))}
                        </div>
                      )}
                      {analysis.safety_risks?.length > 0 && (
                        <div>
                          <p className="text-[11px] font-semibold text-gray-500 flex items-center gap-1 mb-1"><ShieldAlert size={11} className="text-red-400"/> Sécurité (CNESST)</p>
                          {analysis.safety_risks.map((risk, index) => (
                            <div key={index} className="flex items-start gap-2 mb-1">
                              <span className={`badge ${SEV[risk.severity]?.c || 'badge-gray'} text-[9px] mt-0.5 flex-shrink-0`}>{SEV[risk.severity]?.l || risk.severity}</span>
                              <p className="text-xs text-gray-600"><span className="font-medium">{risk.risk}</span>{risk.action ? ` — ${risk.action}` : ''}{risk.cnesst_reference ? ` (${risk.cnesst_reference})` : ''}</p>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  )}
                  {item.ai_status === 'error' && <p className="text-[11px] text-red-400 mt-2">Échec de l'analyse. Réessayez.</p>}
                </div>
              );
            })}
          </div>
        </>
      ) : !showMediaForm && (
        <div className="text-center py-5">
          <Camera size={26} className="text-gray-200 mx-auto mb-2"/>
          <p className="text-sm text-gray-400">Aucun média. Ajoutez photos et notes de chantier pour l'analyse IA.</p>
        </div>
      )}
    </ProjectSection>
  );
}
