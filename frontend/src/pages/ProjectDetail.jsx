import { useEffect, useState, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import Layout from '../components/Layout';
import { projects as projectsApi, punch as punchApi, timesheets as tsApi, invoices as invoicesApi } from '../api';
import { ArrowLeft, QrCode, Plus, Loader2, MapPin, Calendar, DollarSign, CheckCircle, Pencil, Trash2, StickyNote, Receipt, FileText } from 'lucide-react';

const PS_BADGE = { not_started:'badge-gray', in_progress:'badge-orange', delayed:'badge-red', completed:'badge-green', cancelled:'badge-gray' };
const PS_LABEL = { not_started:'Non démarré', in_progress:'En cours', delayed:'En retard', completed:'Terminé', cancelled:'Annulé' };
const PHASE_COLORS = ['#F26522','#3b82f6','#22c55e','#a855f7','#f59e0b','#ef4444','#14b8a6','#ec4899'];

function GanttChart({ phases, projectStart, projectEnd }) {
  if (!phases || phases.length === 0) return null;

  const refStart = projectStart ? new Date(projectStart) : new Date();
  const refEnd   = projectEnd   ? new Date(projectEnd)   : new Date(refStart.getTime() + 90*86400000);
  const totalMs  = refEnd - refStart || 1;

  const months = [];
  const cur = new Date(refStart.getFullYear(), refStart.getMonth(), 1);
  while (cur <= refEnd) {
    months.push(new Date(cur));
    cur.setMonth(cur.getMonth() + 1);
  }

  const pct = (d) => Math.max(0, Math.min(100, (new Date(d) - refStart) / totalMs * 100));
  const width = (s, e) => Math.max(1, pct(e) - pct(s));

  return (
    <div className="overflow-x-auto">
      <div style={{ minWidth: 480 }}>
        {/* Month headers */}
        <div className="flex mb-1 ml-36">
          {months.map((m, i) => {
            const left = pct(m);
            const nextM = new Date(m.getFullYear(), m.getMonth()+1, 1);
            const w = Math.min(pct(nextM), 100) - left;
            return (
              <div key={i} className="text-xs text-gray-400 border-l border-gray-100 pl-1" style={{ width:`${Math.max(w,0)}%`, minWidth: 30 }}>
                {m.toLocaleDateString('fr-CA',{month:'short'})}
              </div>
            );
          })}
        </div>
        {/* Today line */}
        <div className="relative ml-36">
          <div className="absolute top-0 bottom-0 w-px bg-brand z-10" style={{ left:`${pct(new Date())}%` }}/>
          {phases.map((ph, i) => {
            const s = ph.start_date ? new Date(ph.start_date) : refStart;
            const e = ph.end_date   ? new Date(ph.end_date)   : new Date(s.getTime()+14*86400000);
            const color = ph.color || PHASE_COLORS[i % PHASE_COLORS.length];
            const pct_left  = pct(s);
            const pct_width = width(s, e);
            return (
              <div key={ph.id} className="flex items-center mb-2 gap-2 -ml-36">
                <div className="w-36 text-xs font-medium text-gray-700 truncate pr-2 text-right flex-shrink-0">{ph.name}</div>
                <div className="flex-1 relative h-6">
                  <div
                    className="absolute h-full rounded-full flex items-center px-2 overflow-hidden"
                    style={{ left:`${pct_left}%`, width:`${pct_width}%`, minWidth:4, background:color+'33', border:`1.5px solid ${color}` }}
                  >
                    <div className="h-full rounded-full absolute left-0 top-0" style={{ width:`${ph.progress_pct||0}%`, background:color+'66' }}/>
                    {pct_width > 8 && <span className="relative text-xs font-medium z-10 truncate" style={{color}}>{ph.progress_pct||0}%</span>}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}

function PhaseModal({ projectId, phase, onClose, onSave }) {
  const [form, setForm] = useState(phase ? {
    name:phase.name||'', start_date:phase.start_date?phase.start_date.slice(0,10):'',
    end_date:phase.end_date?phase.end_date.slice(0,10):'', progress_pct:phase.progress_pct||0,
    status:phase.status||'not_started'
  } : { name:'', start_date:'', end_date:'', progress_pct:0, status:'not_started' });
  const [saving, setSaving] = useState(false);
  const f = k => e => setForm(p=>({...p,[k]:e.target.value}));

  const submit = async (e) => {
    e.preventDefault(); setSaving(true);
    try {
      let data;
      if (phase) {
        const res = await projectsApi.updatePhase(projectId, phase.id, form);
        data = res.data;
      } else {
        const res = await projectsApi.addPhase(projectId, form);
        data = res.data;
      }
      onSave(data, !!phase);
    } catch {} finally { setSaving(false); }
  };

  return (
    <div className="fixed inset-0 bg-black/30 z-50 flex items-center justify-center p-4">
      <div className="card w-full max-w-md">
        <h2 className="font-semibold text-gray-900 mb-4">{phase?'Modifier la phase':'Nouvelle phase'}</h2>
        <form onSubmit={submit} className="space-y-3">
          <div><label className="label">Nom *</label><input className="input" value={form.name} onChange={f('name')} required/></div>
          <div className="grid grid-cols-2 gap-3">
            <div><label className="label">Début</label><input className="input" type="date" value={form.start_date} onChange={f('start_date')}/></div>
            <div><label className="label">Fin</label><input className="input" type="date" value={form.end_date} onChange={f('end_date')}/></div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="label">Avancement ({form.progress_pct}%)</label>
              <input className="w-full" type="range" min="0" max="100" value={form.progress_pct} onChange={f('progress_pct')}/>
            </div>
            <div><label className="label">Statut</label>
              <select className="input" value={form.status} onChange={f('status')}>
                {Object.entries(PS_LABEL).map(([k,v])=><option key={k} value={k}>{v}</option>)}
              </select>
            </div>
          </div>
          <div className="flex gap-2 pt-2">
            <button type="button" className="btn-secondary flex-1" onClick={onClose}>Annuler</button>
            <button type="submit" className="btn-primary flex-1" disabled={saving}>{saving&&<Loader2 size={14} className="animate-spin"/>} {phase?'Enregistrer':'Ajouter'}</button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default function ProjectDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [project, setProject] = useState(null);
  const [loading, setLoading] = useState(true);
  const [qrData, setQrData] = useState(null);
  const [genQr, setGenQr] = useState(false);
  const [timesheets, setTimesheets] = useState([]);
  const [showPhase, setShowPhase] = useState(false);
  const [editPhase, setEditPhase] = useState(null);
  const [projectInvoices, setProjectInvoices] = useState([]);
  const [notes, setNotes] = useState('');
  const [notesSaving, setNotesSaving] = useState(false);
  const notesTimer = useRef(null);

  const load = async () => {
    setLoading(true);
    try {
      const [{ data: proj }, { data: ts }, { data: invs }] = await Promise.all([
        projectsApi.get(id),
        tsApi.list({ project_id: id }),
        invoicesApi.list({ project_id: id }),
      ]);
      setProject(proj);
      setTimesheets(ts);
      setProjectInvoices(invs);
      setNotes(proj.notes || '');
    } catch {} finally { setLoading(false); }
  };

  const saveNotes = async (val) => {
    setNotesSaving(true);
    try { await projectsApi.update(id, { notes: val }); }
    catch {} finally { setNotesSaving(false); }
  };

  const handleNotesChange = (val) => {
    setNotes(val);
    clearTimeout(notesTimer.current);
    notesTimer.current = setTimeout(() => saveNotes(val), 1200);
  };

  useEffect(() => { load(); }, [id]);

  const generateQR = async () => {
    setGenQr(true);
    try { const {data} = await punchApi.generate({ project_id:id, label:project?.name }); setQrData(data); }
    catch {} finally { setGenQr(false); }
  };

  const handlePhaseSave = (data, isEdit) => {
    setProject(p => ({
      ...p,
      phases: isEdit
        ? p.phases.map(ph => ph.id === data.id ? data : ph)
        : [...(p.phases||[]), data]
    }));
    setShowPhase(false); setEditPhase(null);
  };

  const printQR = () => {
    if (!qrData) return;
    const w = window.open('', '_blank', 'width=420,height=520');
    w.document.write(`<!DOCTYPE html><html><head><title>QR ${project?.name||''}</title><style>body{margin:0;display:flex;flex-direction:column;align-items:center;justify-content:center;height:100vh;font-family:sans-serif;background:#fff;}img{width:300px;height:300px;}h1{margin-top:16px;font-size:16px;font-weight:700;color:#111;text-align:center;}p{font-size:12px;color:#888;margin:4px 0 0;}</style></head><body><img src="${qrData.qr_image}" alt="QR"/><h1>${project?.name||'Chantier'}</h1><p>Scannez pour pointer</p></body></html>`);
    w.document.close(); w.focus(); w.print();
  };

  if (loading) return <Layout><div className="flex items-center gap-2 text-gray-400 p-8"><Loader2 size={16} className="animate-spin"/> Chargement…</div></Layout>;
  if (!project) return <Layout><div className="p-8 text-red-500">Projet non trouvé</div></Layout>;

  const pct = project.progress_pct || 0;
  const activeTs = timesheets.filter(t=>!t.clock_out);

  return (
    <Layout>
      <div className="p-6 max-w-5xl mx-auto">
        <button className="btn-ghost mb-4 text-sm" onClick={()=>navigate('/projets')}>
          <ArrowLeft size={14}/> Projets
        </button>

        {/* Header */}
        <div className="card mb-4">
          <div className="flex items-start justify-between gap-4">
            <div className="flex-1 min-w-0">
              <h1 className="text-xl font-bold text-gray-900 mb-1">{project.name}</h1>
              <div className="flex flex-wrap gap-3 text-sm text-gray-400">
                {project.address && <span className="flex items-center gap-1"><MapPin size={13}/>{project.address}</span>}
                {project.start_date && <span className="flex items-center gap-1"><Calendar size={13}/>{new Date(project.start_date).toLocaleDateString('fr-CA')}{project.end_date && ` → ${new Date(project.end_date).toLocaleDateString('fr-CA')}`}</span>}
                {project.contract_value && <span className="flex items-center gap-1"><DollarSign size={13}/>{Number(project.contract_value).toLocaleString('fr-CA')}$</span>}
              </div>
            </div>
            <div className="text-right flex-shrink-0">
              <div className="text-3xl font-bold text-brand">{pct}%</div>
              <div className="text-xs text-gray-400">Avancement</div>
            </div>
          </div>
          {/* Overall progress bar */}
          <div className="mt-3 w-full h-2 bg-gray-100 rounded-full">
            <div className="h-full rounded-full bg-brand transition-all" style={{width:`${pct}%`}}/>
          </div>
        </div>

        {/* Stats row */}
        <div className="grid grid-cols-3 gap-3 mb-4">
          <div className="card text-center py-3">
            <p className="text-xl font-bold text-gray-900">{project.phases?.length || 0}</p>
            <p className="text-xs text-gray-400 mt-0.5">Phases</p>
          </div>
          <div className="card text-center py-3">
            <p className="text-xl font-bold text-green-500">{activeTs.length}</p>
            <p className="text-xs text-gray-400 mt-0.5">Pointés maintenant</p>
          </div>
          <div className="card text-center py-3">
            <p className="text-xl font-bold text-gray-900">{timesheets.length}</p>
            <p className="text-xs text-gray-400 mt-0.5">Total pointages</p>
          </div>
        </div>

        {/* Gantt */}
        <div className="card mb-4">
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-semibold text-gray-900 text-sm">Phases & Gantt</h2>
            <button className="btn-secondary text-xs py-1.5" onClick={()=>setShowPhase(true)}>
              <Plus size={13}/> Ajouter une phase
            </button>
          </div>

          {(showPhase || editPhase) && (
            <PhaseModal
              projectId={id}
              phase={editPhase}
              onClose={()=>{setShowPhase(false);setEditPhase(null);}}
              onSave={handlePhaseSave}
            />
          )}

          {project.phases?.length > 0 ? (
            <>
              <GanttChart phases={project.phases} projectStart={project.start_date} projectEnd={project.end_date}/>
              <div className="mt-4 space-y-2">
                {project.phases.map((ph, i) => (
                  <div key={ph.id} className="flex items-center gap-3 py-2 border-b border-gray-50 last:border-0">
                    <div className="w-2.5 h-2.5 rounded-full flex-shrink-0" style={{background: ph.color || PHASE_COLORS[i % PHASE_COLORS.length]}}/>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <p className="text-sm font-medium text-gray-800">{ph.name}</p>
                        <span className={`badge ${PS_BADGE[ph.status]}`}>{PS_LABEL[ph.status]}</span>
                      </div>
                      {ph.start_date && (
                        <p className="text-xs text-gray-400">
                          {new Date(ph.start_date).toLocaleDateString('fr-CA')}
                          {ph.end_date && ` → ${new Date(ph.end_date).toLocaleDateString('fr-CA')}`}
                        </p>
                      )}
                    </div>
                    <div className="flex items-center gap-3">
                      <div className="w-24 h-1.5 bg-gray-100 rounded-full flex-shrink-0">
                        <div className="h-full rounded-full bg-brand" style={{width:`${ph.progress_pct||0}%`}}/>
                      </div>
                      <span className="text-sm font-bold text-brand w-8 text-right">{ph.progress_pct||0}%</span>
                      <button className="btn-ghost p-1 text-gray-300 hover:text-blue-500" onClick={()=>setEditPhase(ph)}><Pencil size={12}/></button>
                    </div>
                  </div>
                ))}
              </div>
            </>
          ) : (
            <div className="text-center py-8">
              <p className="text-sm text-gray-400 mb-3">Aucune phase définie. Ajoutez des phases pour activer le Gantt.</p>
              <button className="btn-primary text-xs" onClick={()=>setShowPhase(true)}><Plus size={13}/> Ajouter une phase</button>
            </div>
          )}
        </div>

        {/* Notes */}
        <div className="card mb-4">
          <div className="flex items-center gap-2 mb-3">
            <StickyNote size={15} className="text-brand" />
            <h2 className="font-semibold text-gray-900 text-sm">Notes de chantier</h2>
            {notesSaving && <span className="text-xs text-gray-400 ml-auto">Enregistrement…</span>}
          </div>
          <textarea
            className="input resize-none"
            style={{ minHeight: 96 }}
            placeholder="Ajoutez des notes, remarques ou observations sur ce projet…"
            value={notes}
            onChange={e => handleNotesChange(e.target.value)}
          />
        </div>

        {/* Factures liées */}
        {projectInvoices.length > 0 && (
          <div className="card mb-4">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <Receipt size={15} className="text-brand" />
                <h2 className="font-semibold text-gray-900 text-sm">Factures ({projectInvoices.length})</h2>
              </div>
              <button className="btn-ghost text-xs py-1 px-2" onClick={() => navigate('/factures')}>Voir tout</button>
            </div>
            <div className="space-y-2">
              {projectInvoices.map(inv => {
                const SB = { draft:'badge-gray', sent:'badge-blue', viewed:'badge-yellow', partial:'badge-orange', paid:'badge-green', overdue:'badge-red', cancelled:'badge-gray' };
                const SL = { draft:'Brouillon', sent:'Envoyée', viewed:'Vue', partial:'Partielle', paid:'Payée', overdue:'En retard', cancelled:'Annulée' };
                return (
                  <div key={inv.id} className="flex items-center gap-3 py-1.5 border-b border-gray-50 last:border-0">
                    <FileText size={13} className="text-gray-300 flex-shrink-0" />
                    <div className="flex-1 min-w-0">
                      <p className="text-sm text-gray-800 truncate">{inv.title || `Facture ${inv.number}`}</p>
                    </div>
                    <span className={`badge ${SB[inv.status]||'badge-gray'} text-xs`}>{SL[inv.status]||inv.status}</span>
                    <p className="text-sm font-semibold text-gray-700 flex-shrink-0">{Number(inv.total||0).toLocaleString('fr-CA')}$</p>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* QR Punch */}
        <div className="card">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2"><QrCode size={15} className="text-brand"/><h2 className="font-semibold text-gray-900 text-sm">Pointage QR</h2></div>
            {!qrData && (
              <button className="btn-secondary text-xs py-1.5" onClick={generateQR} disabled={genQr}>
                {genQr?<Loader2 size={13} className="animate-spin"/>:<Plus size={13}/>} Générer QR
              </button>
            )}
          </div>

          {qrData ? (
            <div className="flex items-start gap-4">
              <img src={qrData.qr_image} alt="QR" className="w-28 h-28 border border-gray-200 rounded-xl flex-shrink-0"/>
              <div>
                <p className="text-sm font-medium text-gray-900 mb-1">Affichez ce QR à l'entrée du chantier</p>
                <p className="text-xs text-gray-400 mb-3">Les travailleurs scannent pour pointer entrée et sortie.</p>
                <button className="btn-primary text-xs py-1.5" onClick={printQR}><QrCode size={13}/> Imprimer le QR</button>
              </div>
            </div>
          ) : (
            <p className="text-sm text-gray-400">Générez un QR unique pour que les travailleurs puissent pointer sur ce chantier.</p>
          )}

          {timesheets.length > 0 && (
            <div className="mt-4 pt-3 border-t border-gray-100">
              <p className="text-xs font-medium text-gray-500 mb-2">Pointages récents</p>
              <div className="space-y-1.5">
                {timesheets.slice(0,5).map(ts=>(
                  <div key={ts.id} className="flex items-center gap-3 text-xs text-gray-600">
                    <CheckCircle size={12} className={ts.clock_out?'text-gray-300':'text-green-500'}/>
                    <span className="font-medium">{ts.user_name||ts.sub_name||ts.worker_name||'Inconnu'}</span>
                    <span className="text-gray-400">{ts.clock_in&&new Date(ts.clock_in).toLocaleString('fr-CA',{month:'short',day:'numeric',hour:'2-digit',minute:'2-digit'})}</span>
                    {ts.hours_total&&<span className="ml-auto font-medium text-gray-700">{ts.hours_total}h</span>}
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </Layout>
  );
}
