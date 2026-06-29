import React from 'react';
import { AlertTriangle, Loader2, Plus, Sparkles, X } from 'lucide-react';
import ProjectSection from '../../ProjectSection';

export default function ProjectPipelineSection({
  sectionSummary,
  expanded,
  onToggle,
  showPhase,
  editPhase,
  PhaseModal,
  id,
  project,
  setShowPhase,
  setEditPhase,
  handlePhaseSave,
  GanttChart,
  removePhase,
  reorderPhases,
  renamePhase,
  handleDatesChange,
  projectsApi,
  setProject,
  handleUpdatePhase,
  currentUser,
  handleSelfAssign,
  recommendedPhaseTemplates,
  toTradeLabel,
  projectTypePlaybook,
  projectWorkType,
  BRAND_SOFT,
  BRAND,
  BRAND_BORDER,
  BRAND_DARK,
  adjustPhasesWithAI,
  generatingPhases,
  applyProjectTypePlaybook,
  addingTemplatePhase,
  addTemplatePhase,
  aiNotice,
  setAiNotice,
  aiRecommendations,
  setAiRecommendations,
}) {
  return (
    <ProjectSection
      sectionId="s-pipeline"
      icon="🏗️"
      title="Phases du projet"
      summary={sectionSummary?.summary}
      stats={sectionSummary?.stats}
      expanded={expanded}
      onToggle={onToggle}
      background="#E7EFF4"
    >
      {(showPhase || editPhase) && (
        <PhaseModal
          projectId={id}
          phase={editPhase}
          trades={project.trades || []}
          onClose={() => { setShowPhase(false); setEditPhase(null); }}
          onSave={handlePhaseSave}
        />
      )}

      <div style={{ background: '#fff', borderRadius: 16, border: '1px solid rgba(0,0,0,.07)', overflow: 'hidden', marginBottom: 16 }}>
        {project.phases?.length > 0 ? (
          <GanttChart
            phases={project.phases}
            projectStart={project.start_date}
            projectEnd={project.end_date}
            trades={project.trades}
            onDeletePhase={removePhase}
            onEditPhase={(phase) => setEditPhase(phase)}
            onReorderPhases={reorderPhases}
            onRenamePhase={renamePhase}
            onDatesChange={handleDatesChange}
            onAddPhase={async (name) => {
              if (!name) { setShowPhase(true); return; }
              try {
                const { data } = await projectsApi.addPhase(id, { name, status: 'not_started', display_order: (project.phases?.length || 0) });
                setProject((currentProject) => ({ ...currentProject, phases: [...(currentProject.phases || []), data] }));
              } catch (error) { console.error('addPhaseInline', error); }
            }}
            onUpdatePhase={handleUpdatePhase}
            currentUserName={currentUser?.name || currentUser?.email || null}
            onSelfAssign={handleSelfAssign}
          />
        ) : (() => {
          const existing = new Set((project.phases || []).map((phase) => phase.name?.toLowerCase()));
          const available = recommendedPhaseTemplates.map((template) => ({ ...template, trade_name: toTradeLabel(template.trade_name) })).filter((template) => !existing.has(template.name.toLowerCase()));
          const hasPlaybook = Boolean(projectTypePlaybook?.phases?.length);
          const bulkLabel = projectWorkType || 'ce projet';
          return (
            <div style={{ padding: '28px 24px', textAlign: 'center' }}>
              <div style={{ width: 40, height: 40, borderRadius: 12, background: BRAND_SOFT, display: 'grid', placeItems: 'center', margin: '0 auto 12px' }}>
                <Sparkles size={18} color={BRAND}/>
              </div>
              <p style={{ fontSize: 14, fontWeight: 800, color: '#15171C', margin: '0 0 4px' }}>Aucune phase pour le moment</p>
              <p style={{ fontSize: 12, color: '#9CA3AF', margin: '0 0 18px' }}>Génère un planning complet avec Flo ou ajoute les étapes recommandées.</p>
              <div style={{ display: 'flex', justifyContent: 'center', gap: 8, marginBottom: 16, flexWrap: 'wrap' }}>
                <button onClick={adjustPhasesWithAI} disabled={generatingPhases} style={{ display: 'inline-flex', alignItems: 'center', gap: 6, padding: '9px 18px', borderRadius: 9, border: 'none', background: BRAND, color: '#fff', fontSize: 12, fontWeight: 700, cursor: 'pointer' }}>
                  {generatingPhases ? <Loader2 size={12} className="animate-spin"/> : <Sparkles size={12}/>}
                  {generatingPhases ? 'Génération…' : 'Générer avec Flo'}
                </button>
                {hasPlaybook && (
                  <button onClick={() => applyProjectTypePlaybook({ replaceExisting: false, source: 'manual' })} disabled={addingTemplatePhase === '__batch__'} style={{ display: 'inline-flex', alignItems: 'center', gap: 6, padding: '9px 18px', borderRadius: 9, border: `1.5px solid ${BRAND_BORDER}`, background: BRAND_SOFT, color: BRAND_DARK, fontSize: 12, fontWeight: 700, cursor: 'pointer' }}>
                    {addingTemplatePhase === '__batch__' ? <Loader2 size={12} className="animate-spin"/> : <Plus size={12}/>}
                    {`Ajouter les étapes de ${bulkLabel}`}
                  </button>
                )}
              </div>
              {available.length > 0 && (
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: 5, justifyContent: 'center' }}>
                  {available.slice(0, 8).map((template) => (
                    <button key={template.name} onClick={() => addTemplatePhase(template)} disabled={addingTemplatePhase === template.name} style={{ display: 'flex', alignItems: 'center', gap: 4, padding: '5px 10px', borderRadius: 7, border: '1.5px solid #E0E4E8', background: '#FAFAFA', fontSize: 11, fontWeight: 600, color: '#3A3D44', cursor: 'pointer' }}>
                      <Plus size={9}/>{template.name}
                    </button>
                  ))}
                </div>
              )}
            </div>
          );
        })()}

        {(() => {
          if (!project.phases?.length) return null;
          const existing = new Set((project.phases || []).map((phase) => phase.name?.toLowerCase()));
          const available = recommendedPhaseTemplates.map((template) => ({ ...template, trade_name: toTradeLabel(template.trade_name) })).filter((template) => !existing.has(template.name.toLowerCase()));
          const hasPlaybook = Boolean(projectTypePlaybook?.phases?.length);
          const bulkLabel = projectWorkType || 'ce projet';
          if (!available.length) return null;
          return (
            <div style={{ borderTop: '1px solid #F4F5F6', padding: '10px 16px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 6, flexWrap: 'wrap' }}>
                <span style={{ fontSize: 9.5, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '.07em', color: '#9CA3AF' }}>
                  {hasPlaybook ? `Étapes recommandées · ${bulkLabel}` : 'Phases suggérées'}
                </span>
                {hasPlaybook && (
                  <button onClick={() => applyProjectTypePlaybook({ replaceExisting: false, source: 'manual' })} disabled={addingTemplatePhase === '__batch__'} style={{ display: 'inline-flex', alignItems: 'center', gap: 4, padding: '4px 10px', borderRadius: 7, border: `1px solid ${BRAND_BORDER}`, background: BRAND_SOFT, color: BRAND_DARK, fontSize: 11, fontWeight: 700, cursor: 'pointer', marginLeft: 'auto' }}>
                    {addingTemplatePhase === '__batch__' ? <Loader2 size={9} className="animate-spin"/> : <Plus size={9}/>}
                    {`Ajouter toutes les étapes de ${bulkLabel}`}
                  </button>
                )}
              </div>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 5 }}>
                {available.map((template) => (
                  <button key={template.name} onClick={() => addTemplatePhase(template)} disabled={addingTemplatePhase === template.name || addingTemplatePhase === '__batch__'} style={{ display: 'flex', alignItems: 'center', gap: 4, padding: '5px 10px', borderRadius: 7, border: '1.5px solid #E0E4E8', background: addingTemplatePhase === template.name ? '#F4F5F6' : '#FAFAFA', fontSize: 11, fontWeight: 600, color: '#3A3D44', cursor: 'pointer' }}>
                    {addingTemplatePhase === template.name ? <Loader2 size={9} className="animate-spin"/> : <Plus size={9} color={BRAND}/>}
                    {template.name}
                  </button>
                ))}
              </div>
            </div>
          );
        })()}

        <div style={{ borderTop: '1px solid #F4F5F6', padding: '14px 18px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap' }}>
            <div style={{ width: 28, height: 28, borderRadius: 8, background: BRAND, display: 'grid', placeItems: 'center', flexShrink: 0 }}>
              <Sparkles size={13} color="#fff"/>
            </div>
            <div style={{ flex: 1, minWidth: 200 }}>
              <p style={{ fontSize: 12.5, fontWeight: 800, color: '#15171C', margin: 0 }}>
                {project.phases?.length > 0 ? 'Ajuster le planning avec Flo' : 'Générer les phases avec Flo'}
              </p>
              <p style={{ fontSize: 11, color: '#7C8089', margin: '1px 0 0' }}>
                {project.phases?.length > 0 ? 'Flo recalcule les dates, l’ordre logique et les durées ouvrables, en tenant compte des jours fériés du Québec.' : 'Flo analyse le contexte et construit un planning adapté au chantier réel.'}
              </p>
            </div>
            <button onClick={adjustPhasesWithAI} disabled={generatingPhases} style={{ padding: '7px 14px', borderRadius: 9, border: 'none', background: BRAND, fontSize: 12, fontWeight: 700, color: '#fff', cursor: generatingPhases ? 'wait' : 'pointer', flexShrink: 0, display: 'flex', alignItems: 'center', gap: 5 }}>
              {generatingPhases ? <Loader2 size={11} className="animate-spin"/> : <Sparkles size={11}/>}
              {generatingPhases ? 'Ajustement…' : project.phases?.length > 0 ? 'Ajuster avec Flo' : 'Générer avec Flo'}
            </button>
          </div>
          {aiNotice && (
            <div className="bg-amber-50 border border-amber-200 rounded-xl px-3 py-2 mt-3 flex items-center gap-2">
              <AlertTriangle size={14} className="text-amber-500 flex-shrink-0"/>
              <p className="text-xs text-amber-700">{aiNotice}</p>
              <button className="ml-auto text-amber-400 hover:text-amber-600" onClick={() => setAiNotice('')}><X size={13}/></button>
            </div>
          )}
          {aiRecommendations.length > 0 && (
            <div style={{ marginTop: 12, borderTop: '1px solid #F4F5F6', paddingTop: 10 }}>
              <p style={{ fontSize: 10, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '.07em', color: '#9CA3AF', margin: '0 0 8px', display: 'flex', alignItems: 'center', gap: 5 }}>
                <Sparkles size={10}/> Conseils de Flo
              </p>
              <ul style={{ margin: 0, padding: 0, listStyle: 'none', display: 'flex', flexDirection: 'column', gap: 5 }}>
                {aiRecommendations.map((recommendation, index) => (
                  <li key={index} style={{ display: 'flex', gap: 6, fontSize: 11.5, color: '#3A3D44', lineHeight: 1.4 }}>
                    <span style={{ color: BRAND, flexShrink: 0, fontWeight: 800 }}>›</span>
                    {recommendation}
                  </li>
                ))}
              </ul>
              <button onClick={() => setAiRecommendations([])} style={{ marginTop: 6, fontSize: 10, color: '#C0C4CC', background: 'transparent', border: 'none', cursor: 'pointer', padding: 0 }}>
                Masquer les conseils
              </button>
            </div>
          )}
        </div>
      </div>
    </ProjectSection>
  );
}
