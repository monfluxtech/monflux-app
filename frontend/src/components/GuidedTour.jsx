import { useEffect, useMemo, useState } from 'react';
import { useLocation } from 'react-router-dom';
import { X, ArrowRight, ArrowLeft } from 'lucide-react';
import { useAuthStore } from '../store';

const TOUR_CONTEXTS = {
  global: {
    version: 2,
    steps: [
      {
        target: null,
        title: 'Salut, moi c\'est Flo 👋',
        desc: 'Je suis ton assistante IA intégrée à MONFLUX. Je vais te faire faire le tour rapidement — ensuite je reste disponible partout dans l’app pour analyser, résumer et générer pour toi.',
        position: 'center',
      },
      {
        target: '.app-sidebar',
        title: 'Navigation simple et claire',
        desc: 'Le menu regroupe les modules utiles à ton métier. L’objectif est que tu trouves tout sans chercher et avec le moins de clics possible.',
        position: 'right',
      },
      {
        target: '[href="/dashboard"]',
        title: 'Tableau de bord',
        desc: 'Ta vue cockpit: alertes, projets actifs, finances et priorités du jour.',
        position: 'right',
      },
      {
        target: '[href="/projets"]',
        title: 'Projets',
        desc: 'Chaque chantier se pilote dans une fiche unique: phases, équipe, devis, dépenses, factures, conformité et portails.',
        position: 'right',
      },
      {
        target: '[href="/chat"]',
        title: 'Florence — Flo',
        desc: 'Tu peux me parler ici en tout temps pour résumer, rédiger, planifier ou trouver les prochaines actions.',
        position: 'right',
      },
      {
        target: '[href="/parametres"]',
        title: 'Paramètres',
        desc: 'Tu règles ici les modèles, l’équipe, Flo, les modules et les automatisations de l’entreprise.',
        position: 'right',
      },
      {
        target: null,
        title: 'C’est parti 🚀',
        desc: 'Tu peux relancer un tour contextuel à tout moment depuis le menu. MONFLUX est pensé pour défiler, éditer directement et cliquer le moins possible.',
        position: 'center',
      },
    ],
  },
  project: {
    version: 1,
    steps: [
      {
        target: '#s-hero',
        title: 'La fiche projet en un coup d’œil',
        desc: 'Le hero résume l’essentiel: état du chantier, dates, santé, accès rapides, punch et portails.',
        position: 'center',
      },
      {
        target: '.ai-float-btn',
        title: 'Flo dans le projet',
        desc: 'Le bouton Flo suit la fiche projet. Utilise-le pour générer, résumer, analyser ou remplir des éléments sans quitter le chantier.',
        position: 'left',
      },
      {
        target: '#s-pipeline',
        title: 'Phases du projet',
        desc: 'Le Gantt et les phases servent de colonne vertébrale: statut, ressources, dépendances et dates réelles.',
        position: 'center',
      },
      {
        target: '#s-equipe',
        title: 'Équipe et conformité',
        desc: 'Tu gères ici les ressources, les affectations, la conformité et les recommandations de Flo par métier.',
        position: 'center',
      },
      {
        target: '#s-soumission',
        title: 'Devis & contrat',
        desc: 'Le devis est éditable directement dans les cellules. Tu ajustes rapidement les postes, montants, sélections et documents liés.',
        position: 'center',
      },
      {
        target: '#s-punch',
        title: 'Punch',
        desc: 'Le punch suit le réel terrain, avec saisie rapide, chronos en cours et vue semaine pour comparer prévu vs réalisé.',
        position: 'center',
      },
      {
        target: '#s-expenses',
        title: 'Dépenses',
        desc: 'Factures fournisseurs et dépenses terrain: première ligne éditable, pièces jointes reçus et mise à jour directe sans ouvrir de formulaire séparé.',
        position: 'center',
      },
      {
        target: '#s-invoices',
        title: 'Factures client',
        desc: 'Tu peux créer à partir du devis, facturer partiellement, suivre le statut et éditer les lignes directement dans la section.',
        position: 'center',
      },
      {
        target: '#s-extras',
        title: 'Demandes de modification',
        desc: 'Les changements client ou chantier se suivent ici comme un tableau vivant, relié au devis et aux portails.',
        position: 'center',
      },
      {
        target: '#s-nonconformites',
        title: 'Non-conformités, quittances et dénonciations',
        desc: 'Toute la conformité terrain et légale reste visible dans la fiche projet, en édition directe et sans navigation lourde.',
        position: 'center',
      },
      {
        target: null,
        title: 'Une fiche projet pensée pour défiler',
        desc: 'L’idée générale: glisser verticalement dans un seul flux, éditer dans place et réduire au maximum les allers-retours et les clics.',
        position: 'center',
      },
    ],
  },
  settings: {
    version: 1,
    steps: [
      {
        target: null,
        title: 'Paramètres MONFLUX',
        desc: 'Cette section centralise les réglages d’entreprise: profils, équipe, modèles, Flo et modules.',
        position: 'center',
      },
      {
        target: '[href="/parametres"]',
        title: 'Réglages structurants',
        desc: 'On configure ici ce qui doit être standardisé: modèles, processus et logique partagée entre tous les projets.',
        position: 'right',
      },
      {
        target: null,
        title: 'Modèles et automatisations',
        desc: 'Les modèles de contrats, de documents et les préférences de Flo servent à accélérer toute l’opération sans surpersonnaliser.',
        position: 'center',
      },
    ],
  },
  chat: {
    version: 1,
    steps: [
      {
        target: null,
        title: 'Florence — Flo',
        desc: 'Ici, tu centralises les conversations avec l’assistante IA: mémoire, brouillons, résumés et aides opérationnelles.',
        position: 'center',
      },
      {
        target: null,
        title: 'Conversations conservées',
        desc: 'Les conversations utiles restent visibles à gauche pour reprendre un échange sans repartir de zéro.',
        position: 'center',
      },
    ],
  },
};

// Routes internes protégées par <Guard> dans App.jsx — seules celles-ci peuvent déclencher l'onboarding Flo.
// Liste blanche volontaire (plutôt qu'une exclusion des routes publiques) : toute nouvelle route publique/portail
// ajoutée plus tard est exclue par défaut, sans avoir à penser à la blacklister explicitement.
const INTERNAL_EXACT_ROUTES = ['/dashboard', '/leads', '/soumissions', '/factures', '/sous-traitants', '/contacts', '/rapport', '/contrats', '/commandes', '/factures-achat', '/punch', '/chat', '/parametres'];
const INTERNAL_PREFIX_ROUTES = ['/projets'];

function isInternalAppRoute(pathname) {
  if (INTERNAL_EXACT_ROUTES.includes(pathname)) return true;
  return INTERNAL_PREFIX_ROUTES.some((prefix) => pathname === prefix || pathname.startsWith(`${prefix}/`));
}

function getTourContext(pathname) {
  if (pathname.startsWith('/projets/')) return 'project';
  if (pathname.startsWith('/parametres')) return 'settings';
  if (pathname.startsWith('/chat')) return 'chat';
  return 'global';
}

function shouldAutoLaunch(contextKey) {
  const savedVersion = parseInt(localStorage.getItem(`mf_tour_v_${contextKey}`) || '0', 10);
  const targetVersion = TOUR_CONTEXTS[contextKey]?.version || 1;
  if (contextKey === 'global' && localStorage.getItem('mf_tour_pending') === '1') return true;
  if (savedVersion < targetVersion) return true;
  return false;
}

const FALLBACK_STEPS = [
  {
    target: null,
    title: 'Salut, moi c\'est Flo 👋',
    desc: 'Je suis ton assistante IA intégrée à MONFLUX.',
    position: 'center',
  },
];

export default function GuidedTour() {
  const { user } = useAuthStore();
  const { pathname } = useLocation();
  const [step, setStep] = useState(-1);
  const [targetRect, setTargetRect] = useState(null);
  const contextKey = getTourContext(pathname);
  const steps = useMemo(() => TOUR_CONTEXTS[contextKey]?.steps || FALLBACK_STEPS, [contextKey]);
  const versionKey = `mf_tour_v_${contextKey}`;
  const isInternal = isInternalAppRoute(pathname);

  const start = () => setStep(0);

  const stop = () => {
    setStep(-1);
    localStorage.setItem(versionKey, String(TOUR_CONTEXTS[contextKey]?.version || 1));
    if (contextKey === 'global') localStorage.removeItem('mf_tour_pending');
  };

  useEffect(() => {
    if (!user || !isInternal) return;
    const handler = () => start();
    window.addEventListener('mf:start-tour', handler);
    if (shouldAutoLaunch(contextKey)) {
      const timer = setTimeout(() => start(), 1400);
      return () => { clearTimeout(timer); window.removeEventListener('mf:start-tour', handler); };
    }
    return () => window.removeEventListener('mf:start-tour', handler);
  }, [user, isInternal, contextKey]);

  useEffect(() => {
    if (step < 0 || step >= steps.length) return;
    const s = steps[step];
    const syncTarget = () => {
      if (!s.target) { setTargetRect(null); return; }
      const el = document.querySelector(s.target);
      if (!el) { setTargetRect(null); return; }
      const rect = el.getBoundingClientRect();
      setTargetRect(rect);
      el.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
    };
    syncTarget();
    window.addEventListener('resize', syncTarget);
    window.addEventListener('scroll', syncTarget, true);
    return () => {
      window.removeEventListener('resize', syncTarget);
      window.removeEventListener('scroll', syncTarget, true);
    };
  }, [step, steps]);

  if (!isInternal || step < 0 || step >= steps.length) return null;

  const s = steps[step];
  const isCentered = s.position === 'center' || !targetRect;
  const isLast = step === steps.length - 1;
  const total = steps.length;

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
