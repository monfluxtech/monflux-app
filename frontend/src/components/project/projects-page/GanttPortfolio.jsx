import { useNavigate } from 'react-router-dom';
import { GanttChart } from 'lucide-react';
import { getProjectAddress, getProjectDateRange, getProjectTitle } from './projectUtils';

export default function GanttPortfolio({ projects, stageMap }) {
  const navigate = useNavigate();
  const withDates = projects
    .filter((project) => project.start_date || project.end_date)
    .sort((a, b) => new Date(a.start_date || a.end_date) - new Date(b.start_date || b.end_date));

  if (!withDates.length) {
    return (
      <div className="card text-center py-14">
        <GanttChart size={32} className="text-gray-200 mx-auto mb-3" />
        <p className="text-sm text-gray-400">Aucun projet avec des dates de début/fin définies.</p>
        <p className="text-xs text-gray-300 mt-1">Ajoutez des dates aux projets pour les voir ici.</p>
      </div>
    );
  }

  const allDates = withDates.flatMap((project) => [project.start_date, project.end_date].filter(Boolean)).map((date) => new Date(date));
  const today = new Date();
  const minDate = new Date(Math.min(...allDates, today));
  const maxDate = new Date(Math.max(...allDates, today));
  const refStart = new Date(minDate.getFullYear(), minDate.getMonth(), 1);
  const refEnd = new Date(maxDate.getFullYear(), maxDate.getMonth() + 1, 0);
  const totalMs = Math.max(refEnd - refStart, 1);

  const months = [];
  const current = new Date(refStart);
  while (current <= refEnd) {
    months.push(new Date(current));
    current.setMonth(current.getMonth() + 1);
  }

  const ROW_HEIGHT = 56;
  const LABEL_WIDTH = 250;
  const timelineWidth = Math.max(960, months.length * 220);
  const xAt = (date) => Math.max(0, Math.min(timelineWidth, ((new Date(date) - refStart) / totalMs) * timelineWidth));
  const widthBetween = (start, end) => Math.max(10, xAt(end) - xAt(start));
  const todayX = xAt(today);

  return (
    <div style={{ background: '#fff', borderRadius: 14, border: '1px solid #E8EAED', overflow: 'hidden' }}>
      <div style={{ overflowX: 'auto' }}>
        <div style={{ width: LABEL_WIDTH + timelineWidth, minWidth: LABEL_WIDTH + timelineWidth, padding: '0 0 16px' }}>
          <div style={{ display: 'flex', marginLeft: LABEL_WIDTH, borderBottom: '1px solid #F0F2F4', background: '#FAFAFA' }}>
            {months.map((month, index) => {
              const nextMonth = new Date(month.getFullYear(), month.getMonth() + 1, 1);
              const width = Math.max(36, xAt(nextMonth) - xAt(month));
              return (
                <div
                  key={index}
                  style={{ width, minWidth: 36, padding: '7px 0 7px 10px', borderLeft: '1px solid #E8EAED', flexShrink: 0 }}
                >
                  <span style={{ fontSize: 11, fontWeight: 700, color: '#9CA3AF', textTransform: 'uppercase', letterSpacing: '.06em' }}>
                    {month.toLocaleDateString('fr-CA', { month: 'short' })}{' '}
                    <span style={{ fontWeight: 400, opacity: 0.6 }}>{month.getFullYear()}</span>
                  </span>
                </div>
              );
            })}
          </div>

          <div style={{ position: 'relative' }}>
            {months.map((month, index) => (
              <div
                key={index}
                style={{
                  position: 'absolute',
                  top: 0,
                  bottom: 0,
                  left: LABEL_WIDTH + xAt(month),
                  width: 1,
                  background: index === 0 ? 'transparent' : '#F0F2F4',
                  pointerEvents: 'none',
                }}
              />
            ))}

            <div
              style={{
                position: 'absolute',
                top: 0,
                bottom: 0,
                left: LABEL_WIDTH + todayX,
                width: 2,
                background: '#F26522',
                opacity: 0.7,
                pointerEvents: 'none',
                zIndex: 4,
              }}
            >
              <span
                style={{
                  position: 'absolute',
                  top: 4,
                  left: 4,
                  fontSize: 9,
                  fontWeight: 800,
                  color: '#F26522',
                  background: '#FFF0E8',
                  borderRadius: 3,
                  padding: '1px 4px',
                  whiteSpace: 'nowrap',
                }}
              >
                Aujourd&apos;hui
              </span>
            </div>

            {withDates.map((project, rowIndex) => {
              const start = project.start_date ? new Date(project.start_date) : new Date();
              const end = project.end_date ? new Date(project.end_date) : new Date(start.getTime() + 30 * 86400000);
              const color = stageMap[project.status]?.color || '#6366f1';
              const left = xAt(start);
              const width = widthBetween(start, end);
              const progress = project.progress_pct || 0;
              const even = rowIndex % 2 === 0;

              return (
                <div
                  key={project.id}
                  onClick={() => navigate(`/projets/${project.id}`)}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    height: ROW_HEIGHT,
                    cursor: 'pointer',
                    background: even ? '#FAFAFA' : '#fff',
                    borderBottom: '1px solid #F5F7F9',
                    transition: 'background .1s',
                  }}
                  onMouseEnter={(event) => {
                    event.currentTarget.style.background = '#FFF4EE';
                  }}
                  onMouseLeave={(event) => {
                    event.currentTarget.style.background = even ? '#FAFAFA' : '#fff';
                  }}
                >
                  <div
                    style={{
                      width: LABEL_WIDTH,
                      flexShrink: 0,
                      padding: '0 16px 0 20px',
                      display: 'flex',
                      flexDirection: 'column',
                      justifyContent: 'center',
                      gap: 2,
                      borderRight: '1px solid #E8EAED',
                    }}
                  >
                    <span style={{ fontSize: 12, fontWeight: 700, color: '#15171C', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                      {getProjectTitle(project)}
                    </span>
                    {getProjectAddress(project) && (
                      <span style={{ fontSize: 10, color: '#9CA3AF', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                        {getProjectAddress(project)}
                      </span>
                    )}
                    <span style={{ fontSize: 10, color: '#B0B3BA', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                      {getProjectDateRange(project) || stageMap[project.status]?.label || project.status}
                    </span>
                  </div>

                  <div style={{ flex: 1, position: 'relative', height: '100%', padding: '10px 0' }}>
                    <div
                      style={{
                        position: 'absolute',
                        top: 10,
                        bottom: 10,
                        left,
                        width,
                        minWidth: 10,
                        borderRadius: 6,
                        background: color + '18',
                        border: `2px solid ${color}`,
                        overflow: 'hidden',
                        display: 'flex',
                        alignItems: 'center',
                      }}
                      title={`${getProjectTitle(project)} · du ${new Date(start).toLocaleDateString('fr-CA')} au ${new Date(end).toLocaleDateString('fr-CA')}${project.contract_value ? ' · ' + Number(project.contract_value).toLocaleString('fr-CA') + ' $' : ''}`}
                    >
                      {progress > 0 && (
                        <div style={{ position: 'absolute', inset: 0, width: `${progress}%`, background: color + '45', borderRadius: 4 }} />
                      )}
                      {width > 110 && (
                        <span style={{ position: 'relative', display: 'flex', flexDirection: 'column', gap: 1, fontSize: 10, color, paddingLeft: 8, overflow: 'hidden', maxWidth: '92%' }}>
                          <span style={{ fontWeight: 700, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                            {getProjectTitle(project)}
                            {progress > 0 && <span style={{ opacity: 0.7 }}> · {progress}%</span>}
                          </span>
                          {getProjectAddress(project) && (
                            <span style={{ fontSize: 9, color: '#6B7280', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                              {getProjectAddress(project)}
                            </span>
                          )}
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>

          <div style={{ display: 'flex', justifyContent: 'space-between', padding: '10px 20px 0', borderTop: '1px solid #F0F2F4' }}>
            <span style={{ fontSize: 11, color: '#C4C8CE' }}>
              {withDates.length}/{projects.length} projet{projects.length > 1 ? 's' : ''} avec dates
            </span>
            <span style={{ fontSize: 11, color: '#C4C8CE' }}>
              {new Date(refStart).toLocaleDateString('fr-CA', { month: 'long', year: 'numeric' })} — {new Date(refEnd).toLocaleDateString('fr-CA', { month: 'long', year: 'numeric' })}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}
