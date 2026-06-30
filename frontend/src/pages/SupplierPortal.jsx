import { useEffect, useMemo, useState } from 'react';
import { useParams } from 'react-router-dom';
import axios from 'axios';

const api = axios.create({ baseURL: (import.meta.env.VITE_API_BASE || 'http://localhost:5000/api').replace(/\/api$/, '') + '/api' });
const BRAND = '#E8794E';

const STATUS_LABEL = {
  active: 'En cours',
  completed: 'Terminé',
  on_hold: 'En pause',
  cancelled: 'Annulé',
  pending: 'À démarrer',
  planning: 'En planification',
};

const DEFAULT_VISIBILITY = {
  overview: true,
  phases: true,
  timeline: true,
};

export default function SupplierPortal() {
  const { token } = useParams();
  const [project, setProject] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    api.get(`/public/portal/supplier/${token}`)
      .then((r) => {
        setProject(r.data);
        setLoading(false);
      })
      .catch((e) => {
        setError(e.response?.data?.error || 'Lien invalide ou expiré.');
        setLoading(false);
      });
  }, [token]);

  const visibility = useMemo(
    () => ({ ...DEFAULT_VISIBILITY, ...((project?.portal_visibility?.supplier) || {}) }),
    [project?.portal_visibility],
  );

  if (loading) {
    return (
      <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#F7F8FA' }}>
        <div style={{ textAlign: 'center' }}>
          <div style={{ width: 48, height: 48, border: `3px solid ${BRAND}`, borderTopColor: 'transparent', borderRadius: '50%', animation: 'spin 0.8s linear infinite', margin: '0 auto 16px' }} />
          <p style={{ color: '#7C8089', fontSize: 14 }}>Chargement…</p>
        </div>
        <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
      </div>
    );
  }

  if (error) {
    return (
      <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#F7F8FA' }}>
        <div style={{ textAlign: 'center', maxWidth: 360 }}>
          <div style={{ fontSize: 48, marginBottom: 16 }}>🔒</div>
          <h2 style={{ fontSize: 18, fontWeight: 800, color: '#15171C', margin: '0 0 8px' }}>Lien non valide</h2>
          <p style={{ fontSize: 14, color: '#7C8089', lineHeight: 1.6 }}>{error}</p>
          <p style={{ fontSize: 12, color: '#A8AEB6', marginTop: 16 }}>Contactez l’entrepreneur pour obtenir un nouveau lien.</p>
        </div>
      </div>
    );
  }

  const phases = project.phases || [];
  const done = phases.filter((phase) => phase.status === 'completed').length;

  return (
    <div style={{ minHeight: '100vh', background: '#F7F8FA', fontFamily: "'Inter', system-ui, sans-serif" }}>
      <div style={{ background: '#fff', borderBottom: '1px solid #E8EAED', padding: '16px 24px', display: 'flex', alignItems: 'center', gap: 12 }}>
        <div style={{ width: 36, height: 36, borderRadius: 10, background: BRAND, display: 'grid', placeItems: 'center', fontSize: 18, color: '#fff', fontWeight: 900, flexShrink: 0 }}>M</div>
        <div>
          <p style={{ fontSize: 11, color: '#7C8089', margin: 0, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '.08em' }}>Portail fournisseur · MONFLUX</p>
          <p style={{ fontSize: 13, fontWeight: 700, color: '#15171C', margin: 0 }}>{project.name}</p>
        </div>
        <div style={{ marginLeft: 'auto', fontSize: 11, fontWeight: 700, padding: '4px 10px', borderRadius: 99, background: '#FFF1EB', color: BRAND, border: `1px solid ${BRAND}30` }}>
          {STATUS_LABEL[project.status] || project.status}
        </div>
      </div>

      <div style={{ maxWidth: 680, margin: '0 auto', padding: '32px 20px 80px' }}>
        {visibility.overview && (
          <div style={{ background: '#fff', borderRadius: 16, border: '1px solid #E8EAED', padding: 24, marginBottom: 20 }}>
            <h2 style={{ fontSize: 18, fontWeight: 800, color: '#15171C', margin: '0 0 6px' }}>{project.name}</h2>
            {project.address && (
              <p style={{ fontSize: 13, color: '#7C8089', margin: '0 0 16px' }}>📍 {project.address}{project.city ? `, ${project.city}` : ''}</p>
            )}
            {project.description && (
              <p style={{ fontSize: 13, color: '#374151', lineHeight: 1.6, margin: '0 0 16px', padding: '12px 16px', background: '#F9FAFB', borderRadius: 10 }}>{project.description}</p>
            )}
            {visibility.timeline && phases.length > 0 && (
              <div style={{ marginTop: 12 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
                  <span style={{ fontSize: 12, fontWeight: 700, color: '#7C8089' }}>Avancement du projet</span>
                  <span style={{ fontSize: 12, fontWeight: 700, color: BRAND }}>{done}/{phases.length} phases</span>
                </div>
                <div style={{ height: 8, background: '#F0F2F4', borderRadius: 99, overflow: 'hidden' }}>
                  <div style={{ height: '100%', width: `${Math.round((done / phases.length) * 100)}%`, background: BRAND, borderRadius: 99, transition: 'width .6s ease' }} />
                </div>
              </div>
            )}
          </div>
        )}

        {visibility.phases && phases.length > 0 && (
          <div style={{ background: '#fff', borderRadius: 16, border: '1px solid #E8EAED', padding: 24, marginBottom: 20 }}>
            <h3 style={{ fontSize: 15, fontWeight: 800, color: '#15171C', margin: '0 0 16px' }}>Phases du projet</h3>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              {phases.map((phase, index) => {
                const isDone = phase.status === 'completed';
                const isActive = phase.status === 'in_progress';
                return (
                  <div key={phase.id || index} style={{ display: 'flex', alignItems: 'flex-start', gap: 12, padding: '10px 14px', borderRadius: 10, background: isActive ? '#FFF8F5' : '#FAFAFA', border: `1px solid ${isActive ? `${BRAND}40` : '#F0F2F4'}` }}>
                    <div style={{ width: 20, height: 20, borderRadius: '50%', background: isDone ? '#22c55e' : isActive ? BRAND : '#E5E7EB', display: 'grid', placeItems: 'center', flexShrink: 0, marginTop: 1 }}>
                      {isDone ? <span style={{ fontSize: 11, color: '#fff' }}>✓</span> : <span style={{ fontSize: 10, color: isActive ? '#fff' : '#9CA3AF', fontWeight: 700 }}>{index + 1}</span>}
                    </div>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <p style={{ fontSize: 13, fontWeight: 700, color: '#15171C', margin: 0 }}>{phase.name}</p>
                      {visibility.timeline && phase.start_date && phase.end_date && (
                        <p style={{ fontSize: 11, color: '#9CA3AF', margin: '2px 0 0' }}>
                          {new Date(phase.start_date).toLocaleDateString('fr-CA', { day: 'numeric', month: 'short' })} → {new Date(phase.end_date).toLocaleDateString('fr-CA', { day: 'numeric', month: 'short' })}
                        </p>
                      )}
                    </div>
                    <span style={{ fontSize: 11, fontWeight: 700, padding: '2px 8px', borderRadius: 99, background: isDone ? '#DCFCE7' : isActive ? '#FFF1EB' : '#F3F4F6', color: isDone ? '#15803d' : isActive ? BRAND : '#9CA3AF', flexShrink: 0 }}>
                      {isDone ? 'Terminé' : isActive ? 'En cours' : 'À venir'}
                    </span>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        <div style={{ background: `${BRAND}08`, border: `1px solid ${BRAND}25`, borderRadius: 16, padding: 20, textAlign: 'center' }}>
          <div style={{ fontSize: 28, marginBottom: 10 }}>🏢</div>
          <h3 style={{ fontSize: 14, fontWeight: 800, color: BRAND, margin: '0 0 8px' }}>Portail fournisseur</h3>
          <p style={{ fontSize: 13, color: '#7C8089', lineHeight: 1.6, margin: 0 }}>
            Pour toute question sur votre commande ou votre bon de travail,<br />
            contactez directement l’équipe du projet.
          </p>
        </div>
      </div>
    </div>
  );
}
