import { useEffect, useState } from 'react';
import { X, ArrowRight, ArrowLeft } from 'lucide-react';
import { useAuthStore } from '../store';

const TOUR_VERSION = 1;

const STEPS = [
  {
    target: null,
    title: 'Salut, moi c\'est Flo 👋',
    desc: 'Je suis ton assistante IA intégrée à MONFLUX. Je vais te faire faire le tour en 2 minutes — tu pourras me retrouver en tout temps dans l\'application pour analyser tes projets ou générer des documents.',
    position: 'center',
  },
  {
    target: '.app-sidebar',
    title: 'Ton espace de navigation',
    desc: 'Ce panneau te donne accès à toutes les sections de l\'app. Il s\'adapte à ton métier et à ce qu\'on a configuré ensemble lors de l\'onboarding — tu ne vois que ce qui est pertinent pour toi.',
    position: 'right',
  },
  {
    target: '[href="/projets"]',
    title: 'Tes chantiers',
    desc: 'Tous tes projets en cours et à venir, en un seul endroit. Tu peux les voir en liste, Kanban, Gantt, Calendrier ou sur une carte — comme tu préfères travailler.',
    position: 'right',
  },
  {
    target: '[href="/dashboard"]',
    title: 'Ton tableau de bord',
    desc: 'Une vue centralisée de ce qui compte pour toi — projets actifs, alertes et indicateurs clés. Son contenu s\'adapte à ton rôle dans l\'équipe, tout le monde ne voit pas la même chose.',
    position: 'right',
  },
  {
    target: '[href="/chat"]',
    title: 'Comment je travaille avec toi',
    desc: 'Tu me parles ici directement — je lis tes projets, génère des soumissions, trouve des sous-traitants et rédige tes courriels. Essaie : « Résume mes chantiers actifs ».',
    position: 'right',
  },
  {
    target: null,
    title: 'C\'est parti ! 🚀',
    desc: 'Tu peux relancer ce tour en tout temps depuis le bas du menu. Et si tu as une question, tu sais où me trouver. Bonne gestion !',
    position: 'center',
  },
];

function shouldAutoLaunch() {
  const savedVersion = parseInt(localStorage.getItem('mf_tour_v') || '0', 10);
  if (localStorage.getItem('mf_tour_pending') === '1') return true;
  if (savedVersion < TOUR_VERSION) return true;
  return false;
}

export default function GuidedTour() {
  const { user } = useAuthStore();
  const [step, setStep] = useState(-1);
  const [targetRect, setTargetRect] = useState(null);

  const start = () => setStep(0);

  const stop = () => {
    setStep(-1);
    localStorage.setItem('mf_tour_v', String(TOUR_VERSION));
    localStorage.removeItem('mf_tour_pending');
    localStorage.removeItem('mf_tour_done');
  };

  useEffect(() => {
    if (!user) return;
    const handler = () => start();
    window.addEventListener('mf:start-tour', handler);
    if (shouldAutoLaunch()) {
      const timer = setTimeout(() => start(), 1400);
      return () => { clearTimeout(timer); window.removeEventListener('mf:start-tour', handler); };
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
  const total = STEPS.length;

  const popupStyle = isCentered
    ? { position: 'fixed', top: '50%', left: '50%', transform: 'translate(-50%, -50%)', zIndex: 9999 }
    : (() => {
        const gap = 20;
        const popW = 300;
        const top = Math.max(8, Math.min(targetRect.top, window.innerHeight - 260));
        let left = targetRect.right + gap;
        if (left + popW > window.innerWidth - 8) left = targetRect.left - popW - gap;
        return { position: 'fixed', top, left: Math.max(8, left), zIndex: 9999 };
      })();

  return (
    <>
      {/* Overlay: full-screen for centered steps, spotlight ring for targeted steps */}
      {isCentered ? (
        <div
          onClick={stop}
          style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.48)', zIndex: 9998 }}
        />
      ) : targetRect && (
        /* Spotlight ring — box-shadow darkens everything OUTSIDE, element stays clear */
        <div style={{
          position: 'fixed',
          top: targetRect.top - 6,
          left: targetRect.left - 6,
          width: targetRect.width + 12,
          height: targetRect.height + 12,
          borderRadius: 10,
          border: '2px solid #E8794E',
          boxShadow: '0 0 0 100vmax rgba(0,0,0,0.52), 0 0 0 4px rgba(232,121,78,0.18)',
          animation: 'tour-spotlight-pulse 2s ease-in-out infinite',
          zIndex: 9998,
          pointerEvents: 'none',
        }} />
      )}

      {/* Card */}
      <div style={{
        ...popupStyle,
        width: 300,
        background: '#fff',
        borderRadius: 16,
        padding: '18px 18px 14px',
        boxShadow: '0 20px 60px rgba(0,0,0,0.28)',
        border: '1px solid #E8EAED',
      }}>
        {/* Header: Flo avatar + counter + close */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 12 }}>
          <div style={{
            width: 28, height: 28, borderRadius: '50%', background: '#E8794E',
            color: '#fff', display: 'grid', placeItems: 'center', fontSize: 13, fontWeight: 800, flexShrink: 0,
          }}>F</div>
          <span style={{ fontSize: 11, fontWeight: 700, color: '#E8794E' }}>Florence — Flo</span>
          <span style={{ marginLeft: 'auto', fontSize: 11, fontWeight: 600, color: '#9CA3AF' }}>
            {step + 1}/{total}
          </span>
          <button onClick={stop} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#9CA3AF', padding: 2, display: 'grid', placeItems: 'center' }}>
            <X size={14} />
          </button>
        </div>

        {/* Progress bar */}
        <div style={{ height: 3, background: '#F3F4F6', borderRadius: 2, marginBottom: 14, overflow: 'hidden' }}>
          <div style={{
            height: '100%',
            width: `${((step + 1) / total) * 100}%`,
            background: '#E8794E',
            borderRadius: 2,
            transition: 'width 0.35s ease',
          }} />
        </div>

        <h3 style={{ fontSize: 14, fontWeight: 800, color: '#15171C', margin: '0 0 7px', lineHeight: 1.3 }}>{s.title}</h3>
        <p style={{ fontSize: 12.5, color: '#4B5563', margin: '0 0 16px', lineHeight: 1.55 }}>{s.desc}</p>

        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <button
            onClick={() => step > 0 ? setStep(n => n - 1) : stop()}
            style={{ fontSize: 12, fontWeight: 600, color: '#9CA3AF', background: 'none', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 4, padding: 0 }}
          >
            {step > 0 ? <><ArrowLeft size={12}/> Précédent</> : 'Passer'}
          </button>
          <button
            onClick={() => isLast ? stop() : setStep(n => n + 1)}
            style={{ fontSize: 12, fontWeight: 700, color: '#fff', background: '#E8794E', border: 'none', borderRadius: 8, padding: '7px 14px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 4 }}
          >
            {isLast ? 'Terminer ✓' : <><ArrowRight size={12}/> Suivant</>}
          </button>
        </div>
      </div>
    </>
  );
}
