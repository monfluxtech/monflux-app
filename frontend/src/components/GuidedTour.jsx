import { useEffect, useState, useRef } from 'react';
import { X, ArrowRight, ArrowLeft } from 'lucide-react';
import { useAuthStore } from '../store';

// Bumper ce numéro quand une nouvelle fonctionnalité mérite d'être présentée.
// Tous les utilisateurs dont la version sauvegardée est inférieure verront le tour.
const TOUR_VERSION = 1;

const STEPS = [
  {
    target: null,
    title: '👋 Bienvenue dans MONFLUX !',
    desc: 'Cette visite guidée te montre les sections principales de l\'application en moins de 2 minutes. Tu peux la relancer à tout moment via le bouton ✦ en bas de la sidebar.',
    position: 'center',
  },
  {
    target: '.app-sidebar',
    title: '🧭 La barre de navigation',
    desc: 'À gauche : toutes les sections de l\'app. Le menu s\'adapte selon ton forfait et tes modules activés.',
    position: 'right',
  },
  {
    target: '[href="/projets"]',
    title: '📁 Projets',
    desc: 'Tous tes chantiers en un coup d\'œil. Vue liste, Kanban, Gantt, Calendrier ou Carte. Clique sur un projet pour voir sa fiche complète.',
    position: 'right',
  },
  {
    target: '[href="/dashboard"]',
    title: '📊 Tableau de bord',
    desc: 'Ton aperçu financier : valeur portefeuille, facturé, marges, délais. Les chiffres se mettent à jour en temps réel.',
    position: 'right',
  },
  {
    target: '[href="/chat"]',
    title: '✨ Florence — ton IA de chantier',
    desc: 'Flo analyse tes projets, génère des soumissions, trouve des sous-traitants et rédige tes courriels. Tu peux aussi lui parler directement depuis n\'importe quelle fiche projet.',
    position: 'right',
  },
  {
    target: null,
    title: '🚀 Tu es prêt !',
    desc: 'C\'est tout ! Explore à ton rythme. Si tu as des questions, demande à Flo — elle est là pour t\'aider. Bonne gestion de chantier !',
    position: 'center',
  },
];

function shouldAutoLaunch() {
  const savedVersion = parseInt(localStorage.getItem('mf_tour_v') || '0', 10);
  // Pending = onboarding vient d'être complété
  if (localStorage.getItem('mf_tour_pending') === '1') return true;
  // Nouvelle version du tour non encore vue
  if (savedVersion < TOUR_VERSION) return true;
  return false;
}

export default function GuidedTour() {
  const { user } = useAuthStore();
  const [step, setStep] = useState(-1);
  const [targetRect, setTargetRect] = useState(null);
  const overlayRef = useRef(null);

  const start = () => setStep(0);

  const stop = () => {
    setStep(-1);
    localStorage.setItem('mf_tour_v', String(TOUR_VERSION));
    localStorage.removeItem('mf_tour_pending');
    localStorage.removeItem('mf_tour_done');
  };

  useEffect(() => {
    // Ne jamais lancer le tour si l'utilisateur n'est pas connecté
    if (!user) return;

    const handler = () => start();
    window.addEventListener('mf:start-tour', handler);

    if (shouldAutoLaunch()) {
      const timer = setTimeout(() => start(), 1400);
      return () => {
        clearTimeout(timer);
        window.removeEventListener('mf:start-tour', handler);
      };
    }

    return () => window.removeEventListener('mf:start-tour', handler);
  }, [user]);

  useEffect(() => {
    if (step < 0 || step >= STEPS.length) return;
    const s = STEPS[step];
    if (!s.target) { setTargetRect(null); return; }
    const el = document.querySelector(s.target);
    if (!el) { setTargetRect(null); return; }
    const rect = el.getBoundingClientRect();
    setTargetRect(rect);
    el.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
  }, [step]);

  if (step < 0 || step >= STEPS.length) return null;

  const s = STEPS[step];
  const isCentered = s.position === 'center' || !targetRect;
  const isLast = step === STEPS.length - 1;

  const popupStyle = isCentered
    ? { position: 'fixed', top: '50%', left: '50%', transform: 'translate(-50%, -50%)', zIndex: 9999 }
    : (() => {
        const top = Math.max(8, Math.min(targetRect.top, window.innerHeight - 240));
        const left = Math.min(targetRect.right + 16, window.innerWidth - 340);
        return { position: 'fixed', top, left, zIndex: 9999 };
      })();

  return (
    <>
      {/* Overlay */}
      <div
        onClick={stop}
        style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.45)', zIndex: 9998, backdropFilter: 'blur(2px)' }}
      />

      {/* Highlight ring */}
      {targetRect && (
        <div style={{
          position: 'fixed',
          top: targetRect.top - 4,
          left: targetRect.left - 4,
          width: targetRect.width + 8,
          height: targetRect.height + 8,
          borderRadius: 12,
          border: '2.5px solid #E8794E',
          boxShadow: '0 0 0 4px rgba(232,121,78,0.25)',
          zIndex: 9999,
          pointerEvents: 'none',
          transition: 'all 0.3s ease',
        }} />
      )}

      {/* Card */}
      <div ref={overlayRef} style={{
        ...popupStyle,
        width: 320,
        background: '#fff',
        borderRadius: 16,
        padding: '20px 20px 16px',
        boxShadow: '0 20px 60px rgba(0,0,0,0.3)',
        border: '1px solid #E8EAED',
      }}>
        <button onClick={stop} style={{ position: 'absolute', top: 12, right: 12, background: 'none', border: 'none', cursor: 'pointer', color: '#9CA3AF', padding: 2 }}>
          <X size={15} />
        </button>

        {/* Barre de progression */}
        <div style={{ display: 'flex', gap: 4, marginBottom: 12 }}>
          {STEPS.map((_, i) => (
            <div key={i} style={{ height: 3, flex: 1, borderRadius: 2, background: i <= step ? '#E8794E' : '#E8EAED', transition: 'background 0.3s' }} />
          ))}
        </div>

        <h3 style={{ fontSize: 15, fontWeight: 800, color: '#15171C', margin: '0 0 8px', lineHeight: 1.3 }}>{s.title}</h3>
        <p style={{ fontSize: 13, color: '#4B5563', margin: '0 0 18px', lineHeight: 1.5 }}>{s.desc}</p>

        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <button
            onClick={() => step > 0 ? setStep(n => n - 1) : stop()}
            style={{ fontSize: 12, fontWeight: 600, color: '#9CA3AF', background: 'none', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 4, padding: 0 }}
          >
            {step > 0 ? <><ArrowLeft size={13}/> Précédent</> : 'Passer la visite'}
          </button>
          <button
            onClick={() => isLast ? stop() : setStep(n => n + 1)}
            style={{ fontSize: 12, fontWeight: 700, color: '#fff', background: '#E8794E', border: 'none', borderRadius: 8, padding: '8px 16px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 5 }}
          >
            {isLast ? 'Terminer ✓' : <><ArrowRight size={13}/> Suivant</>}
          </button>
        </div>
      </div>
    </>
  );
}
