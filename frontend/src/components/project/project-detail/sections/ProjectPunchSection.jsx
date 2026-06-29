import React from 'react';
import { CheckCircle } from 'lucide-react';
import ProjectSection from '../../ProjectSection';

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
}) {
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
      <div className="flex items-center gap-2 flex-wrap mb-4">
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
      <div style={{ border: '1px solid #DCEFE2', borderRadius: 10, overflow: 'hidden', background: '#fff' }}>
        <div style={{ overflowX: 'auto', WebkitOverflowScrolling: 'touch' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', minWidth: 1180 }}>
            <colgroup>
              <col style={{ width: 170 }}/>
              <col style={{ width: 210 }}/>
              <col style={{ minWidth: 220 }}/>
              <col style={{ width: 130 }}/>
              <col style={{ width: 145 }}/>
              <col style={{ width: 145 }}/>
              <col style={{ width: 110 }}/>
              <col style={{ width: 140 }}/>
            </colgroup>
            <thead>
              <tr>
                {['Travailleur', 'Phase', 'Note', 'Date', 'Début', 'Fin / durée', 'Durée', 'Actions'].map((label, index) => (
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
                      textAlign: index === 6 ? 'right' : index === 7 ? 'center' : 'left',
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
                  <input ref={manualPunchWorkerRef} className="input" value={manualPunchForm.worker_name} onChange={(e) => setManualPunchForm((prev) => ({ ...prev, worker_name: e.target.value }))} placeholder="Travailleur" />
                </td>
                <td style={{ padding: '6px 8px' }}>
                  <select className="input" value={manualPunchForm.phase_name} onChange={(e) => setManualPunchForm((prev) => ({ ...prev, phase_name: e.target.value }))}>
                    <option value="">Choisir une phase…</option>
                    {(project.phases || []).map((phase) => (
                      <option key={phase.id || phase.name} value={phase.name || ''}>{phase.name || 'Phase sans nom'}</option>
                    ))}
                  </select>
                </td>
                <td style={{ padding: '6px 8px' }}>
                  <input className="input" value={manualPunchForm.notes} onChange={(e) => setManualPunchForm((prev) => ({ ...prev, notes: e.target.value }))} placeholder="Note rapide" />
                </td>
                <td style={{ padding: '6px 8px' }}>
                  <input className="input" type="date" value={manualPunchForm.work_date} onChange={(e) => setManualPunchForm((prev) => ({ ...prev, work_date: e.target.value }))} />
                </td>
                <td style={{ padding: '6px 8px' }}>
                  <input className="input" type="time" value={manualPunchForm.start_time} onChange={(e) => setManualPunchForm((prev) => ({ ...prev, start_time: e.target.value }))} />
                </td>
                <td style={{ padding: '6px 8px' }}>
                  <div className="flex items-center gap-2">
                    <input className="input" type="time" value={manualPunchForm.end_time} onChange={(e) => setManualPunchForm((prev) => ({ ...prev, end_time: e.target.value }))} />
                    <span className="text-[10px] text-gray-400">ou</span>
                    <input className="input text-right" type="number" min="0" step="0.25" value={manualPunchForm.duration_hours} onChange={(e) => setManualPunchForm((prev) => ({ ...prev, duration_hours: e.target.value }))} placeholder="h" />
                  </div>
                </td>
                <td style={{ padding: '6px 8px', textAlign: 'right', fontSize: 12, fontWeight: 700, color: '#111827', whiteSpace: 'nowrap' }}>
                  {manualPunchForm.duration_hours ? `${manualPunchForm.duration_hours}h` : '—'}
                </td>
                <td style={{ padding: '6px 8px', textAlign: 'center' }}>
                  <div className="flex items-center justify-center gap-2">
                    <button
                      className="btn-secondary text-xs"
                      onClick={() => setManualPunchForm((prev) => ({
                        ...prev,
                        work_date: new Date().toISOString().slice(0, 10),
                        start_time: '08:00',
                        end_time: '',
                        duration_hours: '',
                        notes: '',
                      }))}
                    >
                      Vider
                    </button>
                    <button className="btn-primary text-xs" onClick={addManualPunch} disabled={!manualPunchForm.worker_name.trim() || !manualPunchForm.phase_name.trim() || !manualPunchForm.work_date || !manualPunchForm.start_time || (!manualPunchForm.end_time && !manualPunchForm.duration_hours)}>
                      Ajouter
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
                const hours = draft.duration_hours || (timesheet.clock_out ? (Number.isFinite(Number(timesheet.hours_total)) ? Number(timesheet.hours_total).toFixed(2) : ((new Date(timesheet.clock_out) - new Date(timesheet.clock_in)) / 3600000).toFixed(2)) : '');
                return (
                  <tr key={timesheet.id} style={{ background: timesheet.clock_out ? 'white' : '#F0FDF4', borderBottom: '1px solid #F3F4F6' }}>
                    <td style={{ padding: '6px 8px' }}>
                      <input className="input" value={draft.worker_name} onChange={(e) => updateTimesheetDraftField(timesheet.id, 'worker_name', e.target.value)} placeholder="Travailleur" />
                    </td>
                    <td style={{ padding: '6px 8px' }}>
                      <select className="input" value={draft.phase_name} onChange={(e) => updateTimesheetDraftField(timesheet.id, 'phase_name', e.target.value)}>
                        <option value="">Choisir une phase…</option>
                        {(project.phases || []).map((phase) => (
                          <option key={phase.id || phase.name} value={phase.name || ''}>{phase.name || 'Phase sans nom'}</option>
                        ))}
                      </select>
                    </td>
                    <td style={{ padding: '6px 8px' }}>
                      <input className="input" value={draft.notes} onChange={(e) => updateTimesheetDraftField(timesheet.id, 'notes', e.target.value)} placeholder="Note rapide" />
                    </td>
                    <td style={{ padding: '6px 8px' }}>
                      <input className="input" type="date" value={draft.work_date || ''} onChange={(e) => updateTimesheetDraftField(timesheet.id, 'work_date', e.target.value)} />
                    </td>
                    <td style={{ padding: '6px 8px' }}>
                      <input className="input" type="time" value={draft.start_time || ''} onChange={(e) => updateTimesheetDraftField(timesheet.id, 'start_time', e.target.value)} />
                    </td>
                    <td style={{ padding: '6px 8px' }}>
                      <div className="flex items-center gap-2">
                        <input className="input" type="time" value={draft.end_time || ''} onChange={(e) => updateTimesheetDraftField(timesheet.id, 'end_time', e.target.value)} placeholder="Fin" />
                        <span className="text-[10px] text-gray-400">ou</span>
                        <input className="input text-right" type="number" min="0" step="0.25" value={draft.duration_hours || ''} onChange={(e) => updateTimesheetDraftField(timesheet.id, 'duration_hours', e.target.value)} placeholder="h" />
                      </div>
                    </td>
                    <td style={{ padding: '6px 8px', textAlign: 'right', fontSize: 12, fontWeight: 700, color: '#111827', whiteSpace: 'nowrap' }}>
                      {hours ? `${hours}h` : (!timesheet.clock_out ? 'En cours' : '—')}
                    </td>
                    <td style={{ padding: '6px 8px', textAlign: 'center' }}>
                      <div className="flex items-center justify-center gap-2 flex-wrap">
                        <button className="text-[11px] font-medium text-gray-500 hover:text-brand border border-gray-200 rounded-md px-2 py-1 transition-colors" onClick={() => saveTimesheetRow(timesheet.id)} disabled={savingTimesheetId === timesheet.id}>
                          {savingTimesheetId === timesheet.id ? 'Enregistrement…' : 'Enregistrer'}
                        </button>
                        {!timesheet.clock_out ? (
                          <button className="text-[11px] font-medium text-green-700 hover:text-green-800 border border-green-200 rounded-md px-2 py-1 transition-colors" onClick={() => stopProjectPunch(timesheet)} disabled={stoppingPunchId === timesheet.id}>
                            {stoppingPunchId === timesheet.id ? 'Arrêt…' : 'Arrêter'}
                          </button>
                        ) : timesheet.approved_at ? (
                          <CheckCircle size={14} className="text-green-500" title="Approuvé" />
                        ) : (
                          <button className="text-[11px] font-medium text-gray-500 hover:text-brand border border-gray-200 rounded-md px-2 py-1 transition-colors" onClick={() => approveTs(timesheet.id)}>
                            Approuver
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                );
              })}
              {!timesheets.length && (
                <tr>
                  <td colSpan={8} style={{ padding: '26px 12px', textAlign: 'center', color: '#9CA3AF', fontSize: 14 }}>
                    Aucun punch enregistré pour ce projet.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </ProjectSection>
  );
}
