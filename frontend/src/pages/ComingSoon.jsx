import Layout from '../components/Layout';
import { Sparkles } from 'lucide-react';

// Page stub pour les modules activables dont la vraie page arrive dans un batch
// ultérieur (Contrats → B4, Commandes / Factures d'achat → B6).
export default function ComingSoon({ title = 'Module', batch }) {
  return (
    <Layout>
      <div className="p-6 max-w-3xl mx-auto">
        <h1 className="text-xl font-bold text-gray-900 mb-6">{title}</h1>
        <div className="card flex flex-col items-center justify-center text-center py-16">
          <div className="w-12 h-12 rounded-2xl bg-brand/10 flex items-center justify-center mb-4">
            <Sparkles size={22} className="text-brand" />
          </div>
          <p className="text-base font-semibold text-gray-900 mb-1">Bientôt disponible</p>
          <p className="text-sm text-gray-400 max-w-sm">
            Le module « {title} » est activé sur ton espace. La vue complète arrive
            {batch ? ` au ${batch}` : ' dans une prochaine mise à jour'}. Tu peux le
            masquer en attendant via « Gérer les vues » dans le menu.
          </p>
        </div>
      </div>
    </Layout>
  );
}
