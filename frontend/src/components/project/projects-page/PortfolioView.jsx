import { useNavigate } from 'react-router-dom';
import { money, num, realMargin, theoMargin } from './projectUtils';

export default function PortfolioView({ projects, stageMap }) {
  const navigate = useNavigate();
  const totalContract = projects.reduce((sum, project) => sum + num(project.contract_value), 0);
  const totalInvoiced = projects.reduce((sum, project) => sum + num(project.invoiced_real), 0);
  const totalReal = projects.reduce((sum, project) => sum + realMargin(project), 0);
  const totalTheo = projects.reduce((sum, project) => sum + theoMargin(project), 0);
  const active = projects.filter((project) => !stageMap[project.status]?.terminal);
  const done = projects.filter((project) => stageMap[project.status]?.terminal);

  const KPIBar = ({ label, value, total, color }) => {
    const pct = total > 0 ? Math.min(100, Math.round((value / total) * 100)) : 0;
    return (
      <div>
        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 3 }}>
          <span style={{ fontSize: 11, color: '#6B7280' }}>{label}</span>
          <span style={{ fontSize: 11, fontWeight: 700, color }}>{money(value)}</span>
        </div>
        <div style={{ height: 4, background: '#F3F4F6', borderRadius: 2 }}>
          <div style={{ height: '100%', width: `${pct}%`, background: color, borderRadius: 2, transition: 'width .4s' }} />
        </div>
      </div>
    );
  };

  const fmtDate = (date) => {
    if (!date) return null;
    const parsed = new Date(String(date).slice(0, 10) + 'T00:00');
    return Number.isNaN(parsed.getTime()) ? null : parsed.toLocaleDateString('fr-CA', { day: 'numeric', month: 'short' });
  };

  return (
    <div>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(140px,1fr))', gap: 12, marginBottom: 20 }}>
        {[
          { label: 'Valeur portefeuille', val: totalContract, color: '#374151' },
          { label: 'Facturé', val: totalInvoiced, color: '#2563EB' },
          { label: 'Marge théorique', val: totalTheo, color: totalTheo >= 0 ? '#16A34A' : '#DC2626' },
          { label: 'Marge réelle', val: totalReal, color: totalReal >= 0 ? '#16A34A' : '#DC2626' },
        ].map(({ label, val, color }) => (
          <div key={label} style={{ background: '#fff', border: '1px solid #E8EAED', borderRadius: 12, padding: '14px 16px' }}>
            <p style={{ fontSize: 11, color: '#9CA3AF', marginBottom: 4 }}>{label}</p>
            <p style={{ fontSize: 18, fontWeight: 800, color }}>{money(val)}</p>
          </div>
        ))}
      </div>

      {[{ title: `En cours (${active.length})`, list: active }, { title: `Terminés (${done.length})`, list: done }].map(({ title, list }) => (
        list.length > 0 && (
          <div key={title} style={{ marginBottom: 24 }}>
            <p style={{ fontSize: 11, fontWeight: 700, color: '#9CA3AF', textTransform: 'uppercase', letterSpacing: '.06em', marginBottom: 10 }}>{title}</p>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill,minmax(280px,1fr))', gap: 14 }}>
              {list.map((project) => {
                const stage = stageMap[project.status] || {};
                const color = stage.color || '#94a3b8';
                const progress = project.progress_pct || 0;
                const contract = num(project.contract_value);
                const invoiced = num(project.invoiced_real);
                const margin = invoiced > 0 ? realMargin(project) : theoMargin(project);
                const marginLabel = invoiced > 0 ? 'réelle' : 'prév.';
                const workType = project.field_assessment?.work_type || project.type || null;
                const dateLabel = [fmtDate(project.start_date), fmtDate(project.end_date)].filter(Boolean).join(' → ');

                return (
                  <div
                    key={project.id}
                    onClick={() => navigate(`/projets/${project.id}`)}
                    style={{ background: '#fff', border: '1px solid #E8EAED', borderRadius: 14, padding: '16px', cursor: 'pointer', transition: 'box-shadow .15s' }}
                    onMouseEnter={(event) => {
                      event.currentTarget.style.boxShadow = '0 4px 16px rgba(0,0,0,0.1)';
                    }}
                    onMouseLeave={(event) => {
                      event.currentTarget.style.boxShadow = 'none';
                    }}
                  >
                    <div style={{ display: 'flex', alignItems: 'flex-start', gap: 10, marginBottom: 12 }}>
                      <div style={{ width: 4, minHeight: 44, borderRadius: 2, background: color, flexShrink: 0, marginTop: 2 }} />
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <p style={{ fontSize: 13, fontWeight: 700, color: '#15171C', marginBottom: 2, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                          {workType || project.name}
                        </p>
                        {project.address && <p style={{ fontSize: 11, color: '#9CA3AF', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{project.address}</p>}
                        {dateLabel && <p style={{ fontSize: 11, color: '#9CA3AF' }}>{dateLabel}</p>}
                      </div>
                      <span style={{ fontSize: 10, fontWeight: 700, padding: '2px 8px', borderRadius: 999, background: `${color}1a`, color, flexShrink: 0 }}>
                        {stage.label || project.status}
                      </span>
                    </div>

                    <div style={{ display: 'flex', flexDirection: 'column', gap: 8, marginBottom: 12 }}>
                      {contract > 0 && <KPIBar label="Contrat" value={contract} total={contract} color="#6366F1" />}
                      {contract > 0 && invoiced > 0 && <KPIBar label="Facturé" value={invoiced} total={contract} color="#2563EB" />}
                      {contract > 0 && <KPIBar label={`Marge ${marginLabel}`} value={Math.max(0, margin)} total={contract} color={margin >= 0 ? '#16A34A' : '#DC2626'} />}
                    </div>

                    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                      <div style={{ flex: 1, height: 5, background: '#F3F4F6', borderRadius: 3 }}>
                        <div style={{ height: '100%', width: `${progress}%`, background: color, borderRadius: 3 }} />
                      </div>
                      <span style={{ fontSize: 11, fontWeight: 700, color, flexShrink: 0 }}>{progress}%</span>
                    </div>

                    {project.project_manager && (
                      <p style={{ fontSize: 11, color: '#9CA3AF', marginTop: 8 }}>Resp. : {project.project_manager}</p>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        )
      ))}

      {projects.length === 0 && (
        <p style={{ textAlign: 'center', color: '#9CA3AF', fontSize: 14, padding: '40px 0' }}>Aucun projet à afficher.</p>
      )}
    </div>
  );
}
