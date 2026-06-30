import React, { useMemo, useState } from 'react';
import { CheckCircle, ChevronLeft, ChevronRight, Clock3, Minus, Plus, Square, Trash2 } from 'lucide-react';
import ProjectSection from '../../ProjectSection';

const startOfWeek = (date) => {
  const next = new Date(date);
  const day = next.getDay();
  const diff = day === 0 ? -6 : 1 - day;
  next.setHours(0, 0, 0, 0);
  next.setDate(next.getDate() + diff);
  return next;
};

const addDays = (date, days) => {
  const next = new Date(date);
  next.setDate(next.getDate() + days);
  return next;
};

const formatWeekDay = (date) => date.toLocaleDateString('fr-CA', { weekday: 'short', day: 'numeric', month: 'short' });
const formatHours = (value) => {
  const hours = Number(value || 0);
  if (!Number.isFinite(hours) || hours <= 0) return '—';
  const roundedMinutes = Math.round(hours * 60);
  const hh = Math.floor(roundedMinutes / 60);
  const mm = roundedMinutes % 60;
  if (hh && mm) return `${hh}h ${String(mm).padStart(2, '0')}m`;
  if (hh) return `${hh}h`;
  return `${mm}m`;
};

const calcDurationHours = (workDate, startTime, endTime) => {
  if (!workDate || !startTime || !endTime) return '';
  const start = new Date(`${workDate}T${startTime}`);
  const end = new Date(`${workDate}T${endTime}`);
  const diff = end.getTime() - start.getTime();
  if (!Number.isFinite(diff) || diff <= 0) return '';
  return (diff / 3600000).toFixed(2).replace(/\.00$/, '');
};

export default function ProjectPunchSection({
  sectionSummary,
  expanded,
  onToggle,
  sectionGuard,
  activeTs,
  totalPointedHours,
  pendingApprovalTs,
  manualPunchWorkerRef,
  manualPunchForm,
  setManualPunchForm,
  addManualPunch,
  project,
  timesheets,
  timesheetDrafts,
  formatInputDate,
  formatInputTime,
  updateTimesheetDraftField,
  saveTimesheetRow,
  savingTimesheetId,
  stopProjectPunch,
  stoppingPunchId,
  approveTs,
  removeTimesheetRow,
}) {
  const [viewMode, setViewMode] = useState('rows');
  const [weekAnchor, setWeekAnchor] = useState(() => startOfWeek(new Date()));

  const phaseOptions = (project?.phases || []).map((phase) => ({
    key: phase.id || phase.name,
    value: phase.name || '',
    label: phase.name || 'Phase sans nom',
  }));

  const creatorDuration = manualPunchForm.duration_hours || calcDurationHours(manualPunchForm.work_date, manualPunchForm.start_time, manualPunchForm.end_time);

  const updateCreatorField = (key, value) => {
    setManualPunchForm((prev) => {
      const next = { ...prev, [key]: value };
      if (key === 'start_time' || key === 'end_time' || key === 'work_date') {
        const computed = calcDurationHours(next.work_date, next.start_time, next.end_time);
        next.duration_hours = computed || next.duration_hours || '';
      }
      if (key === 'duration_hours' && value) next.end_time = '';
      return next;
    });
  };

  const clearCreatorRow = () => {
    setManualPunchForm((prev) => ({
      ...prev,
      work_date: new Date().toISOString().slice(0, 10),
      start_time: '08:00',
      end_time: '',
      duration_hours: '',
      notes: '',
    }));
  };

  const updateExistingRow = (timesheetId, draft, key, value) => {
    updateTimesheetDraftField(timesheetId, key, value);
    const nextDraft = { ...draft, [key]: value };
    if (key === 'start_time' || key === 'end_time' || key === 'work_date') {
      const computed = calcDurationHours(nextDraft.work_date, nextDraft.start_time, nextDraft.end_time);
      if (computed) updateTimesheetDraftField(timesheetId, 'duration_hours', computed);
    }
    if (key === 'duration_hours' && value) updateTimesheetDraftField(timesheetId, 'end_time', '');
  };

  const weekDays = useMemo(() => Array.from({ length: 7 }, (_, index) => addDays(weekAnchor, index)), [weekAnchor]);

  const weekEntries = useMemo(() => {
    const start = weekAnchor.getTime();
    const end = addDays(weekAnchor, 7).getTime();
    return (timesheets || []).filter((timesheet) => {
      const workDate = timesheet.clock_in ? new Date(timesheet.clock_in).getTime() : NaN;
      return Number.isFinite(workDate) && workDate >= start && workDate < end;
    });
  }, [timesheets, weekAnchor]);

  const weekTotals = useMemo(() => weekDays.map((date) => {
    const dayKey = date.toISOString().slice(0, 10);
    const total = weekEntries.reduce((sum, entry) => {
      const entryKey = (entry.clock_in || '').slice(0, 10);
      if (entryKey !== dayKey) return sum;
      return sum + Number(entry.hours_total || calcDurationHours(dayKey, formatInputTime(entry.clock_in), formatInputTime(entry.clock_out)) || 0);
    }, 0);
    return { dayKey, total };
  }), [weekDays, weekEntries, formatInputTime]);

  const weekRows = useMemo(() => {
    const grouped = new Map();
    weekEntries.forEach((entry) => {
      const rowKey = entry.phase_name || entry.worker_name || entry.user_name || 'Sans phase';
      if (!grouped.has(rowKey)) grouped.set(rowKey, { key: rowKey, label: rowKey, cells: {} });
      const row = grouped.get(rowKey);
      const dayKey = (entry.clock_in || '').slice(0, 10);
      row.cells[dayKey] = (row.cells[dayKey] || 0) + Number(entry.hours_total || 0);
    });
    return Array.from(grouped.values());
  }, [weekEntries]);

  const weekRangeLabel = `${weekDays[0]?.toLocaleDateString('fr-CA', { day: 'numeric', month: 'short' })} → ${weekDays[6]?.toLocaleDateString('fr-CA', { day: 'numeric', month: 'short' })}`;

  return (
    <ProjectSection
      sectionId="s-punch"
      icon="⏱️"
      title="Punch et dépenses"
      summary={sectionSummary?.summary}
      stats={sectionSummary?.stats}
      expanded={expanded}
      onToggle={onToggle}
      background="#E9F3EC"
    >
      {sectionGuard('s-punch')}

      <div className="flex items-center justify-between gap-3 flex-wrap mb-4">
        <div className="flex items-center gap-2 flex-wrap">
          <div className="px-3 py-2 rounded-xl bg-green-50 min-w-[96px] text-center">
            <p className="text-lg font-bold text-green-700">{activeTs.length}</p>
            <p className="text-[11px] text-green-700/80">En cours</p>
          </div>
          <div className="px-3 py-2 rounded-xl bg-gray-50 min-w-[96px] text-center">
            <p className="text-lg font-bold text-gray-900">{totalPointedHours.toFixed(1)}h</p>
            <p className="text-[11px] text-gray-500">Total pointé</p>
          </div>
          <div className="px-3 py-2 rounded-xl bg-amber-50 min-w-[96px] text-center">
            <p className="text-lg font-bold text-amber-700">{pendingApprovalTs.length}</p>
            <p className="text-[11px] text-amber-700/80">À approuver</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => setViewMode('rows')}
            className={`px-3 py-1.5 rounded-full text-xs font-bold border ${viewMode === 'rows' ? 'bg-white text-gray-900 border-gray-300 shadow-sm' : 'bg-transparent text-gray-500 border-transparent'}`}
          >
            Lignes
          </button>
          <button
            type="button"
            onClick={() => setViewMode('week')}
            className={`px-3 py-1.5 rounded-full text-xs font-bold border ${viewMode === 'week' ? 'bg-white text-gray-900 border-gray-300 shadow-sm' : 'bg-transparent text-gray-500 border-transparent'}`}
          >
            Semaine
          </button>
        </div>
      </div>

      {viewMode === 'week' ? (
        <div style={{ border: '1px solid #DCEFE2', borderRadius: 16, overflow: 'hidden', background: '#fff' }}>
          <div className="flex items-center justify-between px-4 py-3 border-b border-gray-100">
            <button type="button" className="btn-ghost p-2" onClick={() => setWeekAnchor((prev) => addDays(prev, -7))}><ChevronLeft size={16} /></button>
            <div className="text-sm font-semibold text-gray-700">{weekRangeLabel}</div>
            <button type="button" className="btn-ghost p-2" onClick={() => setWeekAnchor((prev) => addDays(prev, 7))}><ChevronRight size={16} /></button>
          </div>
          <div style={{ overflowX: 'auto', WebkitOverflowScrolling: 'touch' }}>
            <table style={{ width: '100%', minWidth: 920, borderCollapse: 'collapse' }}>
              <thead>
                <tr style={{ background: '#F9FAFB' }}>
                  <th style={{ padding: '10px 12px', textAlign: 'left', fontSize: 10, fontWeight: 800, color: '#9CA3AF', textTransform: 'uppercase', letterSpacing: '.08em', borderBottom: '1px solid #E5E7EB' }}>Phase / ligne</th>
                  {weekDays.map((date, index) => {
                    const total = weekTotals[index]?.total || 0;
                    const pct = Math.min(100, Math.round((total / Math.max(totalPointedHours || 1, total || 1)) * 100));
                    return (
                      <th key={date.toISOString()} style={{ padding: '10px 12px', minWidth: 110, textAlign: 'left', borderBottom: '1px solid #E5E7EB' }}>
                        <div style={{ fontSize: 11, color: '#6B7280', fontWeight: 700 }}>{formatWeekDay(date)}</div>
                        <div style={{ fontSize: 14, color: '#15171C', fontWeight: 900, marginTop: 2 }}>{formatHours(total)}</div>
                        <div style={{ height: 6, borderRadius: 999, background: '#E5E7EB', marginTop: 6, overflow: 'hidden' }}>
                          <div style={{ width: `${pct}%`, height: '100%', background: '#60A5FA', borderRadius: 999 }} />
                        </div>
                      </th>
                    );
                  })}
                </tr>
              </thead>
              <tbody>
                {weekRows.length > 0 ? weekRows.map((row) => (
                  <tr key={row.key} style={{ borderBottom: '1px solid #F3F4F6' }}>
                    <td style={{ padding: '12px', fontSize: 12.5, fontWeight: 700, color: '#15171C' }}>{row.label}</td>
                    {weekDays.map((date) => {
                      const dayKey = date.toISOString().slice(0, 10);
                      return (
                        <td key={dayKey} style={{ padding: '12px', fontSize: 14, color: '#111827', textAlign: 'center' }}>
                          {row.cells[dayKey] ? formatHours(row.cells[dayKey]) : <span style={{ color: '#D1D5DB' }}>—</span>}
                        </td>
                      );
                    })}
                  </tr>
                )) : (
                  <tr>
                    <td colSpan={8} style={{ padding: '26px 12px', textAlign: 'center', color: '#9CA3AF', fontSize: 14 }}>
                      Aucun punch sur cette semaine.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      ) : (
        <div style={{ border: '1px solid #DCEFE2', borderRadius: 16, overflow: 'hidden', background: '#fff' }}>
          <div style={{ overflowX: 'auto', WebkitOverflowScrolling: 'touch' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', minWidth: 1320 }}>
              <colgroup>
                <col style={{ width: 170 }}/>
                <col style={{ width: 220 }}/>
                <col style={{ minWidth: 220 }}/>
                <col style={{ width: 130 }}/>
                <col style={{ width: 130 }}/>
                <col style={{ width: 130 }}/>
                <col style={{ width: 120 }}/>
                <col style={{ width: 120 }}/>
                <col style={{ width: 170 }}/>
              </colgroup>
              <thead>
                <tr>
                  {['Travailleur', 'Phase', 'Note', 'Date', 'Début', 'Fin', 'Durée', 'État', 'Actions'].map((label, index) => (
                    <th
                      key={label}
                      style={{
                        padding: '8px 10px',
                        fontSize: 10,
                        fontWeight: 700,
                        color: '#6B7280',
                        textTransform: 'uppercase',
                        letterSpacing: '.05em',
                        borderBottom: '2px solid #E5E7EB',
                        background: '#F9FAFB',
                        textAlign: index >= 6 ? 'center' : 'left',
                        whiteSpace: 'nowrap',
                      }}
                    >
                      {label}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                <tr style={{ background: '#F8FAFC', borderBottom: '2px solid #DCEFE2' }}>
                  <td style={{ padding: '6px 8px' }}>
                    <input ref={manualPunchWorkerRef} className="input" value={manualPunchForm.worker_name} onChange={(e) => updateCreatorField('worker_name', e.target.value)} placeholder="Travailleur" />
                  </td>
                  <td style={{ padding: '6px 8px' }}>
                    <select className="input" value={manualPunchForm.phase_name} onChange={(e) => updateCreatorField('phase_name', e.target.value)}>
                      <option value="">Choisir une phase…</option>
                      {phaseOptions.map((phase) => <option key={phase.key} value={phase.value}>{phase.label}</option>)}
                    </select>
                  </td>
                  <td style={{ padding: '6px 8px' }}>
                    <input className="input" value={manualPunchForm.notes} onChange={(e) => updateCreatorField('notes', e.target.value)} placeholder="Note rapide" />
                  </td>
                  <td style={{ padding: '6px 8px' }}>
                    <input className="input" type="date" value={manualPunchForm.work_date} onChange={(e) => updateCreatorField('work_date', e.target.value)} />
                  </td>
                  <td style={{ padding: '6px 8px' }}>
                    <input className="input" type="time" value={manualPunchForm.start_time} onChange={(e) => updateCreatorField('start_time', e.target.value)} />
                  </td>
                  <td style={{ padding: '6px 8px' }}>
                    <input className="input" type="time" value={manualPunchForm.end_time} onChange={(e) => updateCreatorField('end_time', e.target.value)} placeholder="Fin" />
                  </td>
                  <td style={{ padding: '6px 8px' }}>
                    <input className="input text-right" type="number" min="0" step="0.25" value={creatorDuration} onChange={(e) => updateCreatorField('duration_hours', e.target.value)} placeholder="h" />
                  </td>
                  <td style={{ padding: '6px 8px', textAlign: 'center', fontSize: 12, color: '#9CA3AF' }}>Nouveau</td>
                  <td style={{ padding: '6px 8px', textAlign: 'center' }}>
                    <div className="flex items-center justify-center gap-2">
                      <button type="button" className="btn-ghost p-2 text-green-700 hover:text-green-800" title="Ajouter la ligne" onClick={addManualPunch}>
                        <Plus size={16} />
                      </button>
                      <button type="button" className="btn-ghost p-2 text-gray-400 hover:text-gray-600" title="Vider la ligne" onClick={clearCreatorRow}>
                        <Minus size={16} />
                      </button>
                    </div>
                  </td>
                </tr>

                {(timesheets || []).map((timesheet) => {
                  const draft = timesheetDrafts[timesheet.id] || {
                    worker_name: timesheet.worker_name || timesheet.user_name || timesheet.sub_name || '',
                    phase_name: timesheet.phase_name || '',
                    notes: timesheet.notes || '',
                    work_date: formatInputDate(timesheet.clock_in),
                    start_time: formatInputTime(timesheet.clock_in),
                    end_time: formatInputTime(timesheet.clock_out),
                    duration_hours: timesheet.hours_total != null ? String(timesheet.hours_total) : '',
                  };
                  const hours = draft.duration_hours || calcDurationHours(draft.work_date, draft.start_time, draft.end_time);
                  const isActive = !timesheet.clock_out;
                  return (
                    <tr key={timesheet.id} style={{ background: isActive ? '#FFF5F5' : 'white', borderBottom: '1px solid #F3F4F6' }}>
                      <td style={{ padding: '6px 8px' }}>
                        <input className="input" value={draft.worker_name} onChange={(e) => updateExistingRow(timesheet.id, draft, 'worker_name', e.target.value)} placeholder="Travailleur" />
                      </td>
                      <td style={{ padding: '6px 8px' }}>
                        <select className="input" value={draft.phase_name} onChange={(e) => updateExistingRow(timesheet.id, draft, 'phase_name', e.target.value)}>
                          <option value="">Choisir une phase…</option>
                          {phaseOptions.map((phase) => <option key={phase.key} value={phase.value}>{phase.label}</option>)}
                        </select>
                      </td>
                      <td style={{ padding: '6px 8px' }}>
                        <input className="input" value={draft.notes} onChange={(e) => updateExistingRow(timesheet.id, draft, 'notes', e.target.value)} placeholder="Note rapide" />
                      </td>
                      <td style={{ padding: '6px 8px' }}>
                        <input className="input" type="date" value={draft.work_date || ''} onChange={(e) => updateExistingRow(timesheet.id, draft, 'work_date', e.target.value)} />
                      </td>
                      <td style={{ padding: '6px 8px' }}>
                        <input className="input" type="time" value={draft.start_time || ''} onChange={(e) => updateExistingRow(timesheet.id, draft, 'start_time', e.target.value)} />
                      </td>
                      <td style={{ padding: '6px 8px' }}>
                        <input className="input" type="time" value={draft.end_time || ''} onChange={(e) => updateExistingRow(timesheet.id, draft, 'end_time', e.target.value)} placeholder="Fin" />
                      </td>
                      <td style={{ padding: '6px 8px' }}>
                        <input className="input text-right" type="number" min="0" step="0.25" value={hours || ''} onChange={(e) => updateExistingRow(timesheet.id, draft, 'duration_hours', e.target.value)} placeholder="h" />
                      </td>
                      <td style={{ padding: '6px 8px', textAlign: 'center' }}>
                        {isActive ? (
                          <div className="inline-flex items-center gap-1 rounded-full px-2 py-1 text-[11px] font-bold" style={{ background: '#FEF2F2', color: '#DC2626' }}>
                            <Clock3 size={12} />
                            En cours
                          </div>
                        ) : timesheet.approved_at ? (
                          <div className="inline-flex items-center gap-1 rounded-full px-2 py-1 text-[11px] font-bold" style={{ background: '#F0FDF4', color: '#16A34A' }}>
                            <CheckCircle size={12} />
                            Approuvé
                          </div>
                        ) : (
                          <div className="inline-flex items-center gap-1 rounded-full px-2 py-1 text-[11px] font-bold" style={{ background: '#FFFBEB', color: '#D97706' }}>
                            À valider
                          </div>
                        )}
                      </td>
                      <td style={{ padding: '6px 8px', textAlign: 'center' }}>
                        <div className="flex items-center justify-center gap-2 flex-wrap">
                          <button className="text-[11px] font-medium text-gray-500 hover:text-brand border border-gray-200 rounded-md px-2 py-1 transition-colors" onClick={() => saveTimesheetRow(timesheet.id)} disabled={savingTimesheetId === timesheet.id}>
                            {savingTimesheetId === timesheet.id ? 'Enregistrement…' : 'Enregistrer'}
                          </button>
                          {isActive ? (
                            <button className="text-[11px] font-medium text-red-700 hover:text-red-800 border border-red-200 rounded-md px-2 py-1 transition-colors inline-flex items-center gap-1" onClick={() => stopProjectPunch(timesheet)} disabled={stoppingPunchId === timesheet.id}>
                              {stoppingPunchId === timesheet.id ? 'Arrêt…' : <><Square size={10} fill="currentColor" /> Arrêter</>}
                            </button>
                          ) : !timesheet.approved_at ? (
                            <button className="text-[11px] font-medium text-gray-500 hover:text-brand border border-gray-200 rounded-md px-2 py-1 transition-colors" onClick={() => approveTs(timesheet.id)}>
                              Approuver
                            </button>
                          ) : null}
                          <button className="btn-ghost p-1 text-gray-300 hover:text-red-500" title="Supprimer" onClick={() => removeTimesheetRow(timesheet.id)}>
                            <Trash2 size={13} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}

                {!timesheets.length && (
                  <tr>
                    <td colSpan={9} style={{ padding: '26px 12px', textAlign: 'center', color: '#9CA3AF', fontSize: 14 }}>
                      Aucun punch enregistré pour ce projet.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </ProjectSection>
  );
}
