import { useEffect, useState } from 'react';
import Layout from '../components/Layout';
import { invoices as invoicesApi } from '../api';
import { Plus, Loader2, Receipt } from 'lucide-react';

const STATUS_LABEL = { draft:'Brouillon', sent:'Envoyée', viewed:'Vue', partial:'Partielle', paid:'Payée', overdue:'En retard', cancelled:'Annulée', void:'Void' };
const STATUS_BADGE = { draft:'badge-gray', sent:'badge-blue', viewed:'badge-yellow', partial:'badge-orange', paid:'badge-green', overdue:'badge-red', cancelled:'badge-gray', void:'badge-gray' };

export default function Factures() {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('');

  const load = async () => {
    setLoading(true);
    try {
      const { data } = await invoicesApi.list(filter ? { status: filter } : {});
      setItems(data);
    } catch {} finally { setLoading(false); }
  };

  useEffect(() => { load(); }, [filter]);

  const totalOverdue = items.filter(i => i.status === 'overdue').reduce((s, i) => s + Number(i.amount_due||0), 0);

  return (
    <Layout>
      <div className="p-6 max-w-5xl mx-auto">
        <div className="flex items-center justify-between mb-6">
          <h1 className="text-xl font-bold text-gray-900">Factures</h1>
          <button className="btn-primary"><Plus size={15}/> Nouvelle facture</button>
        </div>

        {totalOverdue > 0 && (
          <div className="mb-4 px-4 py-3 bg-red-50 border border-red-200 rounded-xl flex items-center gap-3">
            <div className="flex-1">
              <p className="text-sm font-semibold text-red-700">Factures en retard</p>
              <p className="text-xs text-red-500">{Number(totalOverdue).toLocaleString('fr-CA')}$ en attente de paiement</p>
            </div>
            <button className="btn-danger text-xs py-1.5" onClick={() => setFilter('overdue')}>Voir</button>
          </div>
        )}

        <div className="flex gap-2 mb-4 flex-wrap">
          {['','sent','overdue','paid'].map(s => (
            <button key={s} className={`btn ${filter===s?'btn-primary':'btn-secondary'} py-1 px-3 text-xs`} onClick={() => setFilter(s)}>
              {s ? STATUS_LABEL[s] : 'Toutes'}
            </button>
          ))}
        </div>

        {loading ? (
          <div className="flex items-center gap-2 text-gray-400 py-8"><Loader2 size={16} className="animate-spin" /> Chargement…</div>
        ) : items.length === 0 ? (
          <div className="text-center py-12">
            <Receipt size={36} className="text-gray-200 mx-auto mb-3" />
            <p className="text-gray-400 text-sm">Aucune facture trouvée.</p>
          </div>
        ) : (
          <div className="space-y-2">
            {items.map(inv => (
              <div key={inv.id} className="card flex items-center gap-4">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    <p className="font-medium text-gray-900 text-sm">{inv.number} — {inv.client_name}</p>
                    <span className={`badge ${STATUS_BADGE[inv.status]}`}>{STATUS_LABEL[inv.status]}</span>
                  </div>
                  <p className="text-xs text-gray-400">
                    Total: {Number(inv.total).toLocaleString('fr-CA')}$
                    {inv.amount_due > 0 && ` · Dû: ${Number(inv.amount_due).toLocaleString('fr-CA')}$`}
                    {inv.due_date && ` · Échéance: ${new Date(inv.due_date).toLocaleDateString('fr-CA')}`}
                  </p>
                </div>
                <div className="text-right">
                  <p className="font-bold text-gray-900 text-sm">{Number(inv.total).toLocaleString('fr-CA')}$</p>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </Layout>
  );
}
