import { useEffect, useState, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import Layout from '../components/Layout';
import { projects as projectsApi, punch as punchApi, timesheets as tsApi, invoices as invoicesApi, quotes as quotesApi, quittances as quittancesApi, changeOrders as changeOrdersApi } from '../api';
import { ArrowLeft, QrCode, Plus, Loader2, MapPin, Calendar, DollarSign, CheckCircle, Pencil, StickyNote, Receipt, FileText, GitBranch, Shield, Link2, ExternalLink, MessageCircle, Globe, FileEdit, Trash2, Copy, CheckCheck } from 'lucide-react';

const FRONTEND_URL = import.meta.env.VITE_FRONTEND_URL || window.location.origin;

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
  const [projectQuotes, setProjectQuotes] = useState([]);
  const [notes, setNotes] = useState('');
  const [notesSaving, setNotesSaving] = useState(false);
  const notesTimer = useRef(null);
  const [quittance, setQuittance] = useState(null);
  const [showQuittanceForm, setShowQuittanceForm] = useState(false);
  const [quittanceForm, setQuittanceForm] = useState({ client_name:'', client_email:'', project_description:'', amount_paid:'', notes:'' });
  const [savingQuittance, setSavingQuittance] = useState(false);
  const [portalCopied, setPortalCopied] = useState(false);
  const [resettingPortal, setResettingPortal] = useState(false);
  const [changeOrdersList, setChangeOrdersList] = useState([]);
  const [showCOForm, setShowCOForm] = useState(false);
  const [coForm, setCoForm] = useState({ title:'', description:'', amount:'', notes:'' });
  const [savingCO, setSavingCO] = useState(false);
  const [copiedCO, setCopiedCO] = useState(null);
  const [portalMessages, setPortalMessages] = useState([]);

  const load = async () => {
    setLoading(true);
    try {
      const [{ data: proj }, { data: ts }, { data: invs }, { data: qs }, { data: quits }, { data: cos }, { data: msgs }] = await Promise.all([
        projectsApi.get(id),
        tsApi.list({ project_id: id }),
        invoicesApi.list({ project_id: id }),
        quotesApi.list(),
        quittancesApi.list({ project_id: id }),
        changeOrdersApi.list({ project_id: id }),
        projectsApi.getPortalMessages(id).catch(() => ({ data: [] })),
      ]);
      setProject(proj);
      setTimesheets(ts);
      setProjectInvoices(invs);
      setProjectQuotes(qs.filter(q => q.project_id === id));
      setQuittance(quits?.[0] || null);
      setChangeOrdersList(cos || []);
      setPortalMessages(msgs || []);
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

  const createQuittance = async (e) => {
    e.preventDefault();
    setSavingQuittance(true);
    try {
      const { data } = await quittancesApi.create({
        project_id: id,
        client_name: quittanceForm.client_name || project.client_name || '',
        client_email: quittanceForm.client_email || '',
        project_description: quittanceForm.project_description || project.name,
        amount_paid: quittanceForm.amount_paid ? Number(quittanceForm.amount_paid) : (project.contract_value || 0),
        notes: quittanceForm.notes || '',
      });
      setQuittance(data);
      setShowQuittanceForm(false);
    } catch {} finally { setSavingQuittance(false); }
  };

  const resetPortalToken = async () => {
    if (!confirm('Générer un nouveau lien ? L\'ancien lien ne fonctionnera plus.')) return;
    setResettingPortal(true);
    try {
      const { data } = await projectsApi.resetPortalToken(id);
      setProject(p => ({ ...p, portal_token: data.portal_token }));
    } catch {} finally { setResettingPortal(false); }
  };

  const copyPortalLink = () => {
    if (!project.portal_token) return;
    navigator.clipboard.writeText(`${FRONTEND_URL}/portal/${project.portal_token}`);
    setPortalCopied(true); setTimeout(() => setPortalCopied(false), 2000);
  };

  const createChangeOrder = async (e) => {
    e.preventDefault(); setSavingCO(true);
    try {
      const { data } = await changeOrdersApi.create({
        project_id: id, title: coForm.title, description: coForm.description,
        amount: coForm.amount ? Number(coForm.amount) : 0, notes: coForm.notes,
      });
      setChangeOrdersList(l => [data, ...l]);
      setShowCOForm(false); setCoForm({ title:'', description:'', amount:'', notes:'' });
    } catch {} finally { setSavingCO(false); }
  };

  const deleteCO = async (coId) => {
    if (!confirm('Supprimer cette demande de modification ?')) return;
    await changeOrdersApi.delete(coId);
    setChangeOrdersList(l => l.filter(c => c.id !== coId));
  };

  const copyCOLink = (co) => {
    navigator.clipboard.writeText(`${FRONTEND_URL}/modification/${co.public_token}`);
    setCopiedCO(co.id); setTimeout(() => setCopiedCO(null), 2000);
  };

  if (loading) return <Layout><div className="flex items-center gap-2 text-gray-400 p-8"><Loader2 size={16} className="animate-spin"/> Chargement…</div></Layout>;
  if (!project) return <Layout><div className="p-8 text-red-500">Projet non trouvé</div></Layout>;

  const pct = project.progress_pct || 0;
  const activeTs = timesheets.filter(t=>!t.clock_out);

  return (
    <Layout>
      <div className="p-6 max-w-5xl mx-auto">
        <div className="flex items-center justify-between mb-4">
          <button className="btn-ghost text-sm" onClick={()=>navigate('/projets')}>
            <ArrowLeft size={14}/> Projets
          </button>
          <button
            className="btn-secondary text-xs"
            onClick={() => navigate(`/soumissions?new=1&project_id=${id}&title=${encodeURIComponent('Avenant — '+project.name)}`)}
          >
            <GitBranch size={13}/> Créer un avenant
          </button>
        </div>

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

        {/* Soumissions liées */}
        {projectQuotes.length > 0 && (
          <div className="card mb-4">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <FileText size={15} className="text-brand" />
                <h2 className="font-semibold text-gray-900 text-sm">Soumissions & Avenants ({projectQuotes.length})</h2>
              </div>
              <button className="btn-secondary text-xs py-1 px-2" onClick={() => navigate(`/soumissions?new=1&project_id=${id}&title=${encodeURIComponent('Avenant — '+project.name)}`)}><Plus size={12}/> Avenant</button>
            </div>
            {(() => {
              const QSB = { draft:'badge-gray', sent:'badge-blue', viewed:'badge-yellow', signed:'badge-green', expired:'badge-gray', rejected:'badge-red', converted:'badge-orange' };
              const QSL = { draft:'Brouillon', sent:'Envoyée', viewed:'Vue', signed:'Signée', expired:'Expirée', rejected:'Refusée', converted:'Convertie' };
              return (
                <div className="space-y-2">
                  {projectQuotes.map(q => (
                    <div key={q.id} className="flex items-center gap-3 py-1.5 border-b border-gray-50 last:border-0">
                      <div className="flex-1 min-w-0">
                        <p className="text-sm text-gray-800 truncate">{q.title || 'Soumission'}</p>
                      </div>
                      <span className={`badge ${QSB[q.status]||'badge-gray'} text-xs`}>{QSL[q.status]||q.status}</span>
                      {q.total > 0 && <p className="text-sm font-semibold text-gray-700 flex-shrink-0">{Number(q.total).toLocaleString('fr-CA')}$</p>}
                    </div>
                  ))}
                </div>
              );
            })()}
          </div>
        )}

        {/* Quittance */}
        <div className="card mb-4">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <Shield size={15} className="text-brand"/>
              <h2 className="font-semibold text-gray-900 text-sm">Quittance finale</h2>
              <span className="text-xs text-gray-400">— Certificat de satisfaction client (Québec)</span>
            </div>
          </div>

          {!quittance && !showQuittanceForm && (
            <div className="text-center py-6">
              <Shield size={28} className="text-gray-200 mx-auto mb-3"/>
              <p className="text-sm text-gray-400 mb-4">Envoyez une quittance à votre client pour confirmer la fin des travaux et obtenir sa signature électronique.</p>
              <button
                className="btn-primary text-xs"
                onClick={() => {
                  setQuittanceForm({ client_name: project.client_name||'', client_email: project.client_email||'', project_description: project.name||'', amount_paid: project.contract_value||'', notes: '' });
                  setShowQuittanceForm(true);
                }}
              >
                <Shield size={13}/> Générer une quittance
              </button>
            </div>
          )}

          {showQuittanceForm && (
            <form onSubmit={createQuittance} className="space-y-3">
              <div className="grid grid-cols-2 gap-3">
                <div><label className="label">Nom du client *</label><input className="input" value={quittanceForm.client_name} onChange={e=>setQuittanceForm(f=>({...f,client_name:e.target.value}))} required/></div>
                <div><label className="label">Courriel client</label><input className="input" type="email" value={quittanceForm.client_email} onChange={e=>setQuittanceForm(f=>({...f,client_email:e.target.value}))}/></div>
              </div>
              <div><label className="label">Description des travaux</label><textarea className="input resize-none" rows={2} value={quittanceForm.project_description} onChange={e=>setQuittanceForm(f=>({...f,project_description:e.target.value}))}/></div>
              <div className="grid grid-cols-2 gap-3">
                <div><label className="label">Montant payé ($)</label><input className="input" type="number" value={quittanceForm.amount_paid} onChange={e=>setQuittanceForm(f=>({...f,amount_paid:e.target.value}))}/></div>
                <div><label className="label">Note (optionnel)</label><input className="input" value={quittanceForm.notes} onChange={e=>setQuittanceForm(f=>({...f,notes:e.target.value}))}/></div>
              </div>
              <div className="flex gap-2">
                <button type="button" className="btn-secondary flex-1" onClick={()=>setShowQuittanceForm(false)}>Annuler</button>
                <button type="submit" className="btn-primary flex-1" disabled={savingQuittance}>{savingQuittance&&<Loader2 size={13} className="animate-spin"/>} Créer la quittance</button>
              </div>
            </form>
          )}

          {quittance && (
            <div>
              <div className="flex items-center gap-3 mb-3">
                <div className={`w-2 h-2 rounded-full flex-shrink-0 ${quittance.status==='signed'?'bg-green-500':quittance.status==='sent'?'bg-blue-400':'bg-gray-300'}`}/>
                <div className="flex-1">
                  <p className="text-sm font-medium text-gray-800">{quittance.client_name}</p>
                  <p className="text-xs text-gray-400">
                    {quittance.status==='signed'
                      ? `✓ Signée le ${new Date(quittance.signed_at).toLocaleDateString('fr-CA')}`
                      : quittance.status==='sent' ? 'Envoyée — en attente de signature' : 'Brouillon — non envoyée'}
                  </p>
                </div>
                <span className={`badge ${quittance.status==='signed'?'badge-green':quittance.status==='sent'?'badge-blue':'badge-gray'}`}>
                  {quittance.status==='signed'?'Signée':quittance.status==='sent'?'Envoyée':'Brouillon'}
                </span>
              </div>
              {quittance.status !== 'signed' && (
                <div className="flex gap-2 flex-wrap">
                  <button
                    className="btn-secondary text-xs py-1.5"
                    onClick={() => {
                      const url = `${FRONTEND_URL}/quittance/${quittance.public_token}`;
                      navigator.clipboard.writeText(url);
                      alert('Lien copié!');
                    }}
                  >
                    <Link2 size={12}/> Copier le lien client
                  </button>
                  <a
                    href={`${FRONTEND_URL}/quittance/${quittance.public_token}`}
                    target="_blank" rel="noopener noreferrer"
                    className="btn-ghost text-xs py-1.5"
                  >
                    <ExternalLink size={12}/> Prévisualiser
                  </a>
                  <a
                    href={`https://wa.me/?text=${encodeURIComponent(`Bonjour ${quittance.client_name}, voici votre quittance de fin de travaux à signer : ${FRONTEND_URL}/quittance/${quittance.public_token}`)}`}
                    target="_blank" rel="noreferrer"
                    className="btn-ghost text-xs py-1.5 text-green-600 hover:text-green-700"
                    title="Envoyer la quittance par WhatsApp"
                  >
                    <MessageCircle size={12}/> WhatsApp
                  </a>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Client Portal */}
        <div className="card">
          <div className="flex items-center gap-2 mb-3">
            <Globe size={15} className="text-brand"/>
            <h2 className="font-semibold text-gray-900 text-sm">Portail client</h2>
          </div>
          <p className="text-xs text-gray-400 mb-4">Partagez ce lien avec votre client pour qu'il suive l'avancement du chantier en temps réel.</p>

          {project.portal_token ? (
            <div className="space-y-3">
              <div className="bg-gray-50 rounded-xl px-3 py-2 flex items-center gap-2">
                <Globe size={13} className="text-gray-300 flex-shrink-0"/>
                <span className="text-xs text-gray-500 truncate flex-1 font-mono">{FRONTEND_URL}/portal/{project.portal_token}</span>
              </div>
              <div className="flex gap-2 flex-wrap">
                <button
                  className="btn-primary text-xs py-1.5 flex-1"
                  onClick={copyPortalLink}
                >
                  {portalCopied ? <CheckCircle size={13} className="text-green-300"/> : <Link2 size={13}/>}
                  {portalCopied ? 'Copié !' : 'Copier le lien'}
                </button>
                <a
                  href={`${FRONTEND_URL}/portal/${project.portal_token}`}
                  target="_blank" rel="noopener noreferrer"
                  className="btn-secondary text-xs py-1.5"
                  title="Aperçu du portail"
                >
                  <ExternalLink size={13}/> Aperçu
                </a>
                <a
                  href={`https://wa.me/?text=${encodeURIComponent(`Bonjour, voici le lien pour suivre l'avancement de vos travaux en temps réel : ${FRONTEND_URL}/portal/${project.portal_token}`)}`}
                  target="_blank" rel="noopener noreferrer"
                  className="btn-secondary text-xs py-1.5 text-green-600"
                  title="Envoyer par WhatsApp"
                >
                  <MessageCircle size={13}/>
                </a>
                <button
                  className="btn-ghost text-xs py-1.5 text-gray-400"
                  onClick={resetPortalToken}
                  disabled={resettingPortal}
                  title="Générer un nouveau lien (invalide l'ancien)"
                >
                  {resettingPortal ? <Loader2 size={13} className="animate-spin"/> : '↻'}
                </button>
              </div>
            </div>
          ) : (
            <div className="text-center py-4">
              <Globe size={28} className="text-gray-200 mx-auto mb-3"/>
              <p className="text-sm text-gray-400 mb-4">Le lien portail sera disponible au prochain rechargement (migration DB en cours).</p>
            </div>
          )}
        </div>

        {/* Change Orders */}
        <div className="card">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <FileEdit size={15} className="text-brand"/>
              <h2 className="font-semibold text-gray-900 text-sm">Demandes de modification</h2>
              {changeOrdersList.length > 0 && (
                <span className="bg-gray-100 text-gray-500 text-xs rounded-full px-1.5 py-0.5">{changeOrdersList.length}</span>
              )}
            </div>
            <button className="btn-secondary text-xs py-1.5" onClick={()=>setShowCOForm(v=>!v)}>
              <Plus size={13}/> Nouvelle
            </button>
          </div>

          {showCOForm && (
            <form onSubmit={createChangeOrder} className="bg-gray-50 rounded-xl p-4 mb-4 space-y-3">
              <div><label className="label">Titre *</label><input className="input" value={coForm.title} onChange={e=>setCoForm(f=>({...f,title:e.target.value}))} required placeholder="Ex: Ajout d'une salle de bain"/></div>
              <div><label className="label">Description</label><textarea className="input resize-none" rows={2} value={coForm.description} onChange={e=>setCoForm(f=>({...f,description:e.target.value}))} placeholder="Détails des travaux supplémentaires…"/></div>
              <div className="grid grid-cols-2 gap-3">
                <div><label className="label">Montant ($)</label><input className="input" type="number" step="0.01" value={coForm.amount} onChange={e=>setCoForm(f=>({...f,amount:e.target.value}))} placeholder="0"/></div>
                <div><label className="label">Note interne</label><input className="input" value={coForm.notes} onChange={e=>setCoForm(f=>({...f,notes:e.target.value}))}/></div>
              </div>
              <div className="flex gap-2">
                <button type="button" className="btn-secondary flex-1 text-sm" onClick={()=>setShowCOForm(false)}>Annuler</button>
                <button type="submit" className="btn-primary flex-1 text-sm" disabled={savingCO}>{savingCO&&<Loader2 size={13} className="animate-spin"/>} Créer</button>
              </div>
            </form>
          )}

          {changeOrdersList.length === 0 && !showCOForm ? (
            <div className="text-center py-5">
              <FileEdit size={28} className="text-gray-200 mx-auto mb-2"/>
              <p className="text-sm text-gray-400">Aucune demande de modification. Créez-en une pour tout changement de portée de projet.</p>
            </div>
          ) : (
            <div className="space-y-2">
              {changeOrdersList.map(co => {
                const statusColor = co.status==='approved'?'text-green-600':co.status==='rejected'?'text-red-500':co.status==='pending_approval'?'text-blue-500':'text-gray-400';
                const statusLabel = co.status==='approved'?'Approuvée':co.status==='rejected'?'Refusée':co.status==='pending_approval'?'Envoyée':'Brouillon';
                return (
                  <div key={co.id} className="flex items-center gap-3 p-3 rounded-xl bg-gray-50 hover:bg-gray-100 transition-colors">
                    <div className={`w-2 h-2 rounded-full flex-shrink-0 mt-0.5 ${co.status==='approved'?'bg-green-500':co.status==='rejected'?'bg-red-400':co.status==='sent'?'bg-blue-400':'bg-gray-300'}`}/>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-gray-800 truncate">{co.title}</p>
                      <div className="flex items-center gap-2 mt-0.5">
                        <span className={`text-xs font-medium ${statusColor}`}>{statusLabel}</span>
                        {co.amount > 0 && <span className="text-xs text-gray-400">+{Number(co.amount).toLocaleString('fr-CA')}$</span>}
                      </div>
                    </div>
                    <div className="flex gap-1 flex-shrink-0">
                      <button
                        className="p-1.5 rounded-lg text-gray-400 hover:text-brand hover:bg-white transition-colors"
                        title={copiedCO===co.id?'Copié!':'Copier le lien client'}
                        onClick={()=>copyCOLink(co)}
                      >
                        {copiedCO===co.id?<CheckCheck size={13} className="text-green-500"/>:<Copy size={13}/>}
                      </button>
                      <a
                        href={`https://wa.me/?text=${encodeURIComponent(`Bonjour, voici une demande de modification à approuver : ${FRONTEND_URL}/modification/${co.public_token}`)}`}
                        target="_blank" rel="noopener noreferrer"
                        className="p-1.5 rounded-lg text-gray-400 hover:text-green-600 hover:bg-white transition-colors"
                        title="Envoyer par WhatsApp"
                        onClick={async()=>{ if(co.status==='draft') await changeOrdersApi.update(co.id,{status:'pending_approval'}).then(()=>setChangeOrdersList(l=>l.map(c=>c.id===co.id?{...c,status:'pending_approval'}:c))); }}
                      >
                        <MessageCircle size={13}/>
                      </a>
                      <a
                        href={`${FRONTEND_URL}/modification/${co.public_token}`}
                        target="_blank" rel="noopener noreferrer"
                        className="p-1.5 rounded-lg text-gray-400 hover:text-gray-700 hover:bg-white transition-colors"
                        title="Aperçu"
                      >
                        <ExternalLink size={13}/>
                      </a>
                      <button
                        className="p-1.5 rounded-lg text-gray-300 hover:text-red-500 hover:bg-white transition-colors"
                        onClick={()=>deleteCO(co.id)}
                        title="Supprimer"
                      >
                        <Trash2 size={13}/>
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Portal Messages */}
        {portalMessages.length > 0 && (
          <div className="card mt-4">
            <div className="flex items-center gap-2 mb-3">
              <MessageCircle size={15} className="text-brand"/>
              <h2 className="font-semibold text-gray-900 text-sm">Messages du portail client</h2>
              <span className="bg-brand/10 text-brand text-xs rounded-full px-1.5 py-0.5">{portalMessages.length}</span>
            </div>
            <div className="space-y-3">
              {portalMessages.map(msg => (
                <div key={msg.id} className="flex gap-3">
                  <div className="w-7 h-7 rounded-full bg-gray-100 flex items-center justify-center flex-shrink-0">
                    <span className="text-xs font-bold text-gray-500">{(msg.author_name?.[0] || 'C').toUpperCase()}</span>
                  </div>
                  <div className="flex-1 bg-gray-50 rounded-xl px-3 py-2">
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-xs font-semibold text-gray-700">{msg.author_name}</span>
                      <span className="text-xs text-gray-400">
                        {new Date(msg.created_at).toLocaleDateString('fr-CA', { day:'numeric', month:'short', hour:'2-digit', minute:'2-digit' })}
                      </span>
                    </div>
                    <p className="text-sm text-gray-600 leading-snug">{msg.content}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* QR Punch */}
        <div className="card mt-4">
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
