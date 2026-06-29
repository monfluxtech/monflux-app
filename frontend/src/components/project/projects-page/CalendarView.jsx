import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { getProjectAddress, getProjectDateRange, getProjectMeta, getProjectTitle } from './projectUtils';

const DAYS_SHORT = ['Lun', 'Mar', 'Mer', 'Jeu', 'Ven', 'Sam', 'Dim'];

export default function CalendarView({ projects, stageMap }) {
  const navigate = useNavigate();
  const today = new Date();
  const [calMode, setCalMode] = useState('month');
  const [cursor, setCursor] = useState({
    year: today.getFullYear(),
    month: today.getMonth(),
    day: today.getDate(),
  });

  const d2 = (day) => String(day).padStart(2, '0');
  const isoDate = (year, month, day) => `${year}-${d2(month + 1)}-${d2(day)}`;
  const fromISO = (value) => new Date(value + 'T00:00');
  const fmtShort = (date) => date.toLocaleDateString('fr-CA', { day: 'numeric', month: 'short' });
  const fmtLong = (date) =>
    date.toLocaleDateString('fr-CA', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' });

  const projectsOnDay = (date) => {
    const iso = isoDate(date.getFullYear(), date.getMonth(), date.getDate());
    return projects.filter((project) => {
      if (!project.start_date && !project.end_date) return false;
      const start = project.start_date ? String(project.start_date).slice(0, 10) : null;
      const end = project.end_date ? String(project.end_date).slice(0, 10) : start;
      return (!start || iso >= start) && (!end || iso <= end);
    });
  };

  const ProjectChip = ({ project, size = 'sm' }) => {
    const color = stageMap[project.status]?.color || '#94a3b8';
    const label = getProjectTitle(project);
    const meta = getProjectMeta(project);
    const address = getProjectAddress(project);
    const dateRange = getProjectDateRange(project);
    const titleSize = size === 'lg' ? 12 : size === 'md' ? 10 : 9;
    const addressSize = size === 'lg' ? 11 : size === 'md' ? 9 : 0;
    const dateSize = size === 'lg' ? 10 : size === 'md' ? 8 : 0;

    return (
      <button
        onClick={() => navigate(`/projets/${project.id}`)}
        style={{
          display: 'flex',
          alignItems: size !== 'sm' ? 'flex-start' : 'center',
          gap: 5,
          width: '100%',
          textAlign: 'left',
          fontSize: titleSize,
          fontWeight: 700,
          color,
          background: color + '18',
          border: `1px solid ${color}33`,
          borderRadius: 5,
          padding: size === 'lg' ? '6px 10px' : size === 'md' ? '4px 6px' : '2px 5px',
          overflow: 'hidden',
          cursor: 'pointer',
        }}
        title={`${label}${meta ? ' · ' + meta : ''}`}
      >
        <span style={{ width: 6, height: 6, borderRadius: '50%', background: color, flexShrink: 0 }} />
        <span style={{ minWidth: 0, display: 'flex', flexDirection: 'column', gap: size !== 'sm' ? 1 : 0, overflow: 'hidden' }}>
          <span style={{ fontSize: titleSize, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{label}</span>
          {size !== 'sm' && address && (
            <span style={{ fontWeight: 400, color: '#9CA3AF', fontSize: addressSize, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
              {address}
            </span>
          )}
          {size !== 'sm' && dateRange && (
            <span style={{ fontWeight: 400, color: '#B0B3BA', fontSize: dateSize, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
              {dateRange}
            </span>
          )}
        </span>
      </button>
    );
  };

  const NavHeader = ({ title, onPrev, onNext }) => (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '12px 16px', borderBottom: '1px solid #F0F2F4' }}>
      <button onClick={onPrev} style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 6, borderRadius: 8, color: '#6B7280', display: 'flex' }}>
        <ChevronLeft size={16} />
      </button>
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 8 }}>
        <span style={{ fontSize: 14, fontWeight: 800, color: '#15171C', textTransform: 'capitalize' }}>{title}</span>
        <div style={{ display: 'flex', gap: 2, background: '#F3F4F6', borderRadius: 8, padding: 2 }}>
          {[['day', 'Jour'], ['week', 'Semaine'], ['month', 'Mois']].map(([key, label]) => (
            <button
              key={key}
              onClick={() => setCalMode(key)}
              style={{
                fontSize: 11,
                fontWeight: 600,
                padding: '4px 10px',
                borderRadius: 6,
                border: 'none',
                cursor: 'pointer',
                background: calMode === key ? '#fff' : 'transparent',
                color: calMode === key ? '#15171C' : '#9CA3AF',
                boxShadow: calMode === key ? '0 1px 4px rgba(0,0,0,.08)' : 'none',
              }}
            >
              {label}
            </button>
          ))}
        </div>
      </div>
      <button onClick={onNext} style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 6, borderRadius: 8, color: '#6B7280', display: 'flex' }}>
        <ChevronRight size={16} />
      </button>
    </div>
  );

  if (calMode === 'day') {
    const date = new Date(cursor.year, cursor.month, cursor.day);
    const isToday = date.toDateString() === today.toDateString();
    const prevDay = () => {
      const next = new Date(date);
      next.setDate(next.getDate() - 1);
      setCursor({ year: next.getFullYear(), month: next.getMonth(), day: next.getDate() });
    };
    const nextDay = () => {
      const next = new Date(date);
      next.setDate(next.getDate() + 1);
      setCursor({ year: next.getFullYear(), month: next.getMonth(), day: next.getDate() });
    };
    const active = projectsOnDay(date);
    const starting = active.filter((project) => project.start_date && String(project.start_date).slice(0, 10) === isoDate(cursor.year, cursor.month, cursor.day));
    const ending = active.filter((project) => project.end_date && String(project.end_date).slice(0, 10) === isoDate(cursor.year, cursor.month, cursor.day));
    const ongoing = active.filter((project) => !starting.includes(project) && !ending.includes(project));

    const Section = ({ emoji, title, items, color }) => (
      <div style={{ padding: '14px 20px', borderBottom: '1px solid #F8FAFC' }}>
        <p style={{ fontSize: 11, fontWeight: 700, color, textTransform: 'uppercase', letterSpacing: '.06em', marginBottom: 8 }}>
          {emoji} {title}
        </p>
        {items.length === 0 ? (
          <p style={{ fontSize: 12, color: '#D1D5DB' }}>Aucun chantier</p>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
            {items.map((project) => (
              <ProjectChip key={project.id} project={project} size="lg" />
            ))}
          </div>
        )}
      </div>
    );

    return (
      <div style={{ background: '#fff', borderRadius: 14, border: '1px solid #E8EAED', overflow: 'hidden' }}>
        <NavHeader title={fmtLong(date)} onPrev={prevDay} onNext={nextDay} />
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', minHeight: 220 }}>
          <div style={{ borderRight: '1px solid #F0F2F4' }}>
            <div style={{ padding: '10px 20px', background: '#FFF7F0', borderBottom: '1px solid #F0F2F4' }}>
              <p style={{ fontSize: 11, fontWeight: 800, color: '#E8794E' }}>🌅 Matin — AM</p>
              <p style={{ fontSize: 10, color: '#9CA3AF' }}>Chantiers démarrant ce matin</p>
            </div>
            <Section emoji="" title="Début de chantier" items={starting} color="#16A34A" />
            <Section emoji="" title="En cours" items={ongoing.slice(0, Math.ceil(ongoing.length / 2))} color="#6366F1" />
          </div>
          <div>
            <div style={{ padding: '10px 20px', background: '#F0F4FF', borderBottom: '1px solid #F0F2F4' }}>
              <p style={{ fontSize: 11, fontWeight: 800, color: '#6366F1' }}>🌆 Après-midi — PM</p>
              <p style={{ fontSize: 10, color: '#9CA3AF' }}>Chantiers se terminant ce soir</p>
            </div>
            <Section emoji="" title="Fin de chantier" items={ending} color="#DC2626" />
            <Section emoji="" title="En cours" items={ongoing.slice(Math.ceil(ongoing.length / 2))} color="#6366F1" />
          </div>
        </div>
        {isToday && (
          <div style={{ padding: '6px 16px', background: '#FFF7F0', fontSize: 11, color: '#E8794E', fontWeight: 600 }}>
            📍 Aujourd&apos;hui · {active.length} chantier{active.length !== 1 ? 's' : ''} actif{active.length !== 1 ? 's' : ''}
          </div>
        )}
      </div>
    );
  }

  if (calMode === 'week') {
    const date = new Date(cursor.year, cursor.month, cursor.day);
    const dow = (date.getDay() + 6) % 7;
    const monday = new Date(date);
    monday.setDate(date.getDate() - dow);
    const weekDays = Array.from({ length: 7 }, (_, index) => {
      const next = new Date(monday);
      next.setDate(monday.getDate() + index);
      return next;
    });
    const prevWeek = () => {
      const next = new Date(monday);
      next.setDate(next.getDate() - 7);
      setCursor({ year: next.getFullYear(), month: next.getMonth(), day: next.getDate() });
    };
    const nextWeek = () => {
      const next = new Date(monday);
      next.setDate(next.getDate() + 7);
      setCursor({ year: next.getFullYear(), month: next.getMonth(), day: next.getDate() });
    };
    const weekTitle = `${fmtShort(monday)} – ${fmtShort(weekDays[6])} ${weekDays[6].getFullYear()}`;
    const periods = [
      { key: 'am', label: 'AM', sub: '6h – 12h', bg: '#FFFBF5' },
      { key: 'pm', label: 'PM', sub: '12h – 18h', bg: '#F5F7FF' },
    ];

    return (
      <div style={{ background: '#fff', borderRadius: 14, border: '1px solid #E8EAED', overflow: 'hidden' }}>
        <NavHeader title={weekTitle} onPrev={prevWeek} onNext={nextWeek} />
        <div style={{ overflowX: 'auto' }}>
          <div style={{ minWidth: 700 }}>
            <div style={{ display: 'grid', gridTemplateColumns: '56px repeat(7,1fr)', borderBottom: '1px solid #F0F2F4' }}>
              <div style={{ background: '#FAFAFA' }} />
              {weekDays.map((day, index) => {
                const isToday = day.toDateString() === today.toDateString();
                return (
                  <div
                    key={index}
                    onClick={() => {
                      setCursor({ year: day.getFullYear(), month: day.getMonth(), day: day.getDate() });
                      setCalMode('day');
                    }}
                    style={{
                      cursor: 'pointer',
                      padding: '8px 4px',
                      textAlign: 'center',
                      background: isToday ? '#FFF7F0' : '#FAFAFA',
                      borderLeft: '1px solid #F0F2F4',
                    }}
                  >
                    <p style={{ fontSize: 10, fontWeight: 700, color: '#9CA3AF', textTransform: 'uppercase' }}>{DAYS_SHORT[index]}</p>
                    <p style={{ fontSize: 13, fontWeight: isToday ? 800 : 500, color: isToday ? '#E8794E' : '#374151', lineHeight: 1.2 }}>{day.getDate()}</p>
                  </div>
                );
              })}
            </div>
            {periods.map((period) => (
              <div key={period.key} style={{ display: 'grid', gridTemplateColumns: '56px repeat(7,1fr)', borderBottom: '1px solid #F5F7FA' }}>
                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '8px 4px', background: '#FAFAFA', borderRight: '1px solid #F0F2F4' }}>
                  <span style={{ fontSize: 10, fontWeight: 800, color: period.key === 'am' ? '#E8794E' : '#6366F1' }}>{period.label}</span>
                  <span style={{ fontSize: 8, color: '#D1D5DB' }}>{period.sub}</span>
                </div>
                {weekDays.map((day, index) => {
                  const events = projectsOnDay(day);
                  return (
                    <div key={index} style={{ minHeight: 108, borderLeft: '1px solid #F0F2F4', padding: '6px 4px', background: period.bg }}>
                      <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                        {events.slice(0, 1).map((project) => (
                          <ProjectChip key={project.id} project={project} size="md" />
                        ))}
                        {events.length > 1 && <span style={{ fontSize: 8, color: '#9CA3AF', paddingLeft: 2 }}>+{events.length - 1}</span>}
                      </div>
                    </div>
                  );
                })}
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  const { year, month } = cursor;
  const prevMonth = () => {
    if (month === 0) setCursor({ year: year - 1, month: 11, day: 1 });
    else setCursor({ year, month: month - 1, day: 1 });
  };
  const nextMonth = () => {
    if (month === 11) setCursor({ year: year + 1, month: 0, day: 1 });
    else setCursor({ year, month: month + 1, day: 1 });
  };
  const firstDay = new Date(year, month, 1).getDay();
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const startOffset = (firstDay + 6) % 7;
  const fmtMonth = new Date(year, month, 1).toLocaleDateString('fr-CA', { month: 'long', year: 'numeric' });
  const dayEventsMap = {};

  projects.forEach((project) => {
    if (!project.start_date && !project.end_date) return;
    const start = project.start_date ? String(project.start_date).slice(0, 10) : null;
    const end = project.end_date ? String(project.end_date).slice(0, 10) : start;
    for (let day = 1; day <= daysInMonth; day += 1) {
      const iso = isoDate(year, month, day);
      if ((!start || iso >= start) && (!end || iso <= end)) {
        dayEventsMap[day] = dayEventsMap[day] || [];
        dayEventsMap[day].push(project);
      }
    }
  });

  return (
    <div style={{ background: '#fff', borderRadius: 14, border: '1px solid #E8EAED', overflow: 'hidden' }}>
      <NavHeader title={fmtMonth} onPrev={prevMonth} onNext={nextMonth} />
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7,1fr)', borderBottom: '1px solid #F0F2F4', background: '#FAFAFA' }}>
        {DAYS_SHORT.map((label) => (
          <div key={label} style={{ padding: '9px 10px', textAlign: 'right', borderLeft: '1px solid #F0F2F4' }}>
            <span style={{ fontSize: 11, fontWeight: 700, color: '#9CA3AF', textTransform: 'uppercase' }}>{label}</span>
          </div>
        ))}
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7,1fr)' }}>
        {Array.from({ length: startOffset }).map((_, index) => (
          <div key={`empty-${index}`} style={{ minHeight: 104, borderRight: '1px solid #F5F7F9', borderBottom: '1px solid #F5F7F9', background: '#FCFCFD' }} />
        ))}
        {Array.from({ length: daysInMonth }, (_, index) => {
          const day = index + 1;
          const events = dayEventsMap[day] || [];
          const isToday = day === today.getDate() && month === today.getMonth() && year === today.getFullYear();
          const currentDate = new Date(year, month, day);
          return (
            <div
              key={day}
              onClick={() => {
                setCursor({ year, month, day });
                setCalMode('day');
              }}
              style={{ minHeight: 104, padding: 8, borderRight: '1px solid #F5F7F9', borderBottom: '1px solid #F5F7F9', cursor: 'pointer' }}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 }}>
                <span
                  style={{
                    width: 26,
                    height: 26,
                    display: 'grid',
                    placeItems: 'center',
                    borderRadius: '50%',
                    fontSize: 11,
                    fontWeight: isToday ? 800 : 600,
                    color: isToday ? '#fff' : '#374151',
                    background: isToday ? '#E8794E' : 'transparent',
                  }}
                >
                  {day}
                </span>
                {currentDate < today && events.length > 0 && (
                  <span style={{ fontSize: 9, color: '#D1D5DB', fontWeight: 700 }}>PASSÉ</span>
                )}
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                {events.slice(0, 2).map((project) => (
                  <ProjectChip key={project.id} project={project} size="md" />
                ))}
                {events.length > 2 && (
                  <span style={{ fontSize: 9, color: '#9CA3AF', fontWeight: 600 }}>
                    +{events.length - 2} autre{events.length - 2 > 1 ? 's' : ''}
                  </span>
                )}
              </div>
            </div>
          );
        })}
        {Array.from({ length: (7 - ((startOffset + daysInMonth) % 7 || 7)) % 7 }).map((_, index) => (
          <div key={`tail-${index}`} style={{ minHeight: 104, borderRight: '1px solid #F5F7F9', borderBottom: '1px solid #F5F7F9', background: '#FCFCFD' }} />
        ))}
      </div>
    </div>
  );
}
