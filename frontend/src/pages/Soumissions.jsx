import { useEffect, useState } from 'react';
import Layout from '../components/Layout';
import { quotes as quotesApi } from '../api';
import { Plus, Loader2, FileText, ExternalLink } from 'lucide-react';

const STATUS_LABEL = { draft:'Brouillon', sent:'Envoyée', viewed:'Vue', signed:'Signée', expired:'Expirée', rejected:'Refusée', converted:'Convertie' };
const STATUS_BADGE = { draft:'badge-gray', sent:'badge-blue', viewed:'badge-yellow', signed:'badge-green', expired:'badge-gray', rejected:'badge-red', converted:'badge-orange' };

export default function Soumissions() {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    quotesApi.list()
      .then(({ data }) => setItems(data))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  return (
    <Layout>
      <div className="p-6 max-w-5xl mx-auto">
        <div className="flex items-center justify-between mb-6">
          <h1 className="text-xl font-bold text-gray-900">Soumissions</h1>
          <button className="btn-primary"><Plus size={15}/> Nouvelle soumission</button>
        </div>

        {loading ? (
          <div className="flex items-center gap-2 text-gray-400 py-8"><Loader2 size={16} className="animate-spin" /> Chargement…</div>
        ) : items.length === 0 ? (
          <div className="text-center py-12">
            <FileText size={36} className="text-gray-200 mx-auto mb-3" />
            <p className="text-gray-400 text-sm">Aucune soumission. Créez-en une depuis un projet ou un lead.</p>
          </div>
        ) : (
          <div className="space-y-2">
            {items.map(q => (
              <div key={q.id} className="card flex items-center gap-4">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    <p className="font-medium text-gray-900 text-sm">{q.title || 'Soumission'}</p>
                    <span className={`badge ${STATUS_BADGE[q.status]}`}>{STATUS_LABEL[q.status]}</span>
                    <span className="badge badge-gray capitalize text-xs">{q.format}</span>
                  </div>
                  <p className="text-xs text-gray-400">
                    {q.total > 0 ? `${Number(q.total).toLocaleString('fr-CA')}$` : 'En cours d\'estimation'}
                    {q.sent_at && ` · Envoyée le ${new Date(q.sent_at).toLocaleDateString('fr-CA')}`}
                    {q.viewed_count > 0 && ` · Vue ${q.viewed_count} fois`}
                  </p>
                </div>
                {q.interactive_token && (
                  <a href={`/soumission/${q.interactive_token}`} target="_blank" rel="noreferrer" className="btn-ghost text-xs py-1">
                    <ExternalLink size={13}/> Voir
                  </a>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </Layout>
  );
}
