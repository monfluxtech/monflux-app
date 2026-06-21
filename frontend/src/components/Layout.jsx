import { NavLink, useNavigate } from 'react-router-dom';
import { useState, useRef, useEffect } from 'react';
import { useAuthStore, useUIStore, useConfigStore } from '../store';
import { dashboard as dashApi, auth as authApi } from '../api';
import { CORE_MODULES, SECONDARY_MODULES, roleAllows } from '../config/modules';
import SearchModal from './SearchModal';
import { useT, useLang } from '../hooks/useT';
import {
  LayoutDashboard, FolderKanban, Users, FileText, Receipt,
  HardHat, QrCode, Settings, Moon, Sun, Plus, X,
  LogOut, User, BookUser, BarChart3, Bell,
  AlertCircle, Clock, FileQuestion, Search, Sparkles,
  FileSignature, ShoppingCart, FileStack, Languages, ChevronRight,
} from 'lucide-react';

const ICONS = {
  LayoutDashboard, Sparkles, FolderKanban, Users, FileText, Receipt,
  HardHat, QrCode, BarChart3, BookUser, FileSignature, ShoppingCart, FileStack, Settings,
};

const QUICK_KEYS = [
  { key: 'new_lead',          path: '/leads?new=1' },
  { key: 'new_quote',         path: '/soumissions?new=1' },
  { key: 'new_project_quick', path: '/projets?new=1' },
  { key: 'punch_site',        path: '/punch' },
];

function RailBtn({ to, icon: Icon, label, highlight, badge, onClick }) {
  const base = 'relative group flex items-center justify-center w-10 h-10 rounded-[10px] border-none bg-transparent text-[#6B7280] transition-all duration-100 cursor-pointer hover:bg-white/8 hover:text-white';
  const activeClass = 'bg-[rgba(242,101,34,0.18)] text-[#F26522]';

  if (to) {
    return (
      <NavLink
        to={to}
        className={({ isActive }) => `${base} ${isActive ? activeClass : ''}`}
        title={label}
      >
        <Icon size={19} />
        {badge && (
          <span className="absolute top-1 right-1 w-1.5 h-1.5 rounded-full bg-red-500 border-[1.5px] border-[#111317]" />
        )}
        <span className="rail-tip">{label}</span>
      </NavLink>
    );
  }

  return (
    <button onClick={onClick} className={base} title={label}>
      <Icon size={19} />
      {badge && (
        <span className="absolute top-1 right-1 w-1.5 h-1.5 rounded-full bg-red-500 border-[1.5px] border-[#111317]" />
      )}
      <span className="rail-tip">{label}</span>
    </button>
  );
}

export default function Layout({ children, toc = null, noTopbar = false }) {
  const t = useT();
  const { lang, setLanguage } = useLang();
  const { user, logout, company } = useAuthStore();
  const { darkMode, toggleDark } = useUIStore();
  const { modules, load } = useConfigStore();
  const navigate = useNavigate();
  const [searchOpen, setSearchOpen] = useState(false);
  const [quickOpen, setQuickOpen] = useState(false);
  const [userMenuOpen, setUserMenuOpen] = useState(false);
  const [notifOpen, setNotifOpen] = useState(false);
  const [notifs, setNotifs] = useState([]);
  const [notifSeen, setNotifSeen] = useState(false);
  const [onboardingDone, setOnboardingDone] = useState(null);
  const userMenuRef = useRef(null);
  const notifRef = useRef(null);

  const role = company?.role;
  const coreNav   = CORE_MODULES.filter((m) => roleAllows(role, m.key));
  const secondaryNav = SECONDARY_MODULES.filter((m) => roleAllows(role, m.key) && modules?.[m.key]);

  useEffect(() => { load(); }, []);

  useEffect(() => {
    const handler = (e) => {
      if (userMenuRef.current && !userMenuRef.current.contains(e.target)) setUserMenuOpen(false);
      if (notifRef.current && !notifRef.current.contains(e.target)) setNotifOpen(false);
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  useEffect(() => {
    const handler = (e) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') { e.preventDefault(); setSearchOpen(o => !o); }
    };
    document.addEventListener('keydown', handler);
    return () => document.removeEventListener('keydown', handler);
  }, []);

  useEffect(() => {
    const fetchNotifs = async () => {
      try { const { data } = await dashApi.notifications(); setNotifs(data || []); } catch {}
    };
    fetchNotifs();
    const timer = setInterval(fetchNotifs, 300000);
    return () => clearInterval(timer);
  }, []);

  useEffect(() => {
    if (!user) return;
    authApi.me().then(({ data }) => {
      setOnboardingDone(data?.user?.onboarding_completed ?? false);
    }).catch(() => setOnboardingDone(user?.onboarding_completed ?? false));
  }, [user?.id]);

  const handleLogout = () => { logout(); navigate('/'); };
  const initials = (user?.name?.[0] || user?.email?.[0] || 'U').toUpperCase();

  return (
    <div style={{ display: 'grid', gridTemplateColumns: '56px 1fr', minHeight: '100vh', background: '#F5F6F8' }}>

      {/* ── NAV RAIL ── */}
      <nav style={{
        position: 'sticky', top: 0, height: '100vh', width: 56,
        background: '#111317', display: 'flex', flexDirection: 'column',
        alignItems: 'center', padding: '14px 0', gap: 4, zIndex: 30,
      }}>
        {/* Logo */}
        <div
          style={{
            width: 36, height: 36, background: '#F26522', borderRadius: 10,
            display: 'grid', placeItems: 'center', fontWeight: 900,
            fontSize: 17, color: '#fff', marginBottom: 10, flexShrink: 0,
            cursor: 'pointer',
          }}
          onClick={() => navigate('/dashboard')}
        >
          M
        </div>

        {/* Core modules */}
        {coreNav.map((m) => {
          const Icon = ICONS[m.icon] || FolderKanban;
          const label = t(`nav_${m.key}`, m.label);
          return (
            <RailBtn key={m.path} to={m.path} icon={Icon} label={label} highlight={m.highlight} />
          );
        })}

        {/* Divider before secondary */}
        {secondaryNav.length > 0 && (
          <div style={{ width: 24, height: 1, background: 'rgba(255,255,255,0.08)', margin: '4px 0' }} />
        )}

        {/* Secondary modules */}
        {secondaryNav.map((m) => {
          const Icon = ICONS[m.icon] || FolderKanban;
          const label = t(`nav_${m.key}`, m.label);
          return (
            <RailBtn key={m.path} to={m.path} icon={Icon} label={label} />
          );
        })}

        {/* Spacer */}
        <div style={{ flex: 1 }} />

        {/* Notifications */}
        <div className="relative" ref={notifRef}>
          <RailBtn
            icon={Bell}
            label="Notifications"
            badge={notifs.length > 0 && !notifSeen}
            onClick={() => { setNotifOpen(o => !o); setNotifSeen(true); }}
          />
          {notifOpen && (
            <div className="absolute left-14 bottom-0 bg-white border border-gray-100 rounded-xl shadow-xl z-50 w-72 overflow-hidden">
              <div className="px-4 py-2.5 border-b border-gray-50 flex items-center justify-between">
                <p className="text-sm font-semibold text-gray-900">Notifications</p>
                {notifs.length > 0 && (
                  <span className="text-xs bg-red-100 text-red-600 px-2 py-0.5 rounded-full font-medium">{notifs.length}</span>
                )}
              </div>
              {notifs.length === 0 ? (
                <div className="px-4 py-6 text-center">
                  <Bell size={20} className="text-gray-200 mx-auto mb-2" />
                  <p className="text-xs text-gray-400">Aucune alerte en ce moment</p>
                </div>
              ) : (
                <div className="max-h-64 overflow-y-auto py-1">
                  {notifs.map((n, i) => {
                    const Icon = n.type === 'invoice_overdue' ? AlertCircle : n.type === 'follow_up' ? Clock : FileQuestion;
                    const color = n.severity === 'error' ? '#ef4444' : n.severity === 'warning' ? '#f59e0b' : '#6366f1';
                    return (
                      <button key={i} className="w-full text-left flex items-start gap-3 px-4 py-2.5 hover:bg-gray-50"
                        onClick={() => { navigate(n.path); setNotifOpen(false); }}>
                        <Icon size={14} className="mt-0.5 flex-shrink-0" style={{ color }} />
                        <p className="text-xs text-gray-700 leading-snug">{n.label}</p>
                      </button>
                    );
                  })}
                </div>
              )}
            </div>
          )}
        </div>

        {/* Settings */}
        <RailBtn to="/parametres" icon={Settings} label="Paramètres" />

        {/* Dark mode */}
        <RailBtn icon={darkMode ? Sun : Moon} label={t(darkMode ? 'light_mode' : 'dark_mode')} onClick={toggleDark} />

        {/* User avatar */}
        <div className="relative mt-1" ref={userMenuRef}>
          <button
            onClick={() => setUserMenuOpen(o => !o)}
            style={{
              width: 32, height: 32, borderRadius: '50%', background: '#F26522',
              color: '#fff', fontSize: 13, fontWeight: 700, border: 'none',
              cursor: 'pointer', display: 'grid', placeItems: 'center',
            }}
            title={user?.name || 'Mon compte'}
          >
            {initials}
          </button>
          {userMenuOpen && (
            <div className="absolute left-14 bottom-0 bg-white border border-gray-100 rounded-xl shadow-xl z-50 py-1 w-52">
              <div className="px-4 py-2.5 border-b border-gray-50">
                <p className="text-sm font-semibold text-gray-900 truncate">{user?.name || 'Mon compte'}</p>
                <p className="text-xs text-gray-400 truncate">{user?.email}</p>
              </div>
              <button className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 flex items-center gap-2"
                onClick={() => { navigate('/parametres?tab=profil'); setUserMenuOpen(false); }}>
                <User size={14} className="text-gray-400" /> Mon profil
              </button>
              <button className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 flex items-center gap-2"
                onClick={() => { navigate('/parametres'); setUserMenuOpen(false); }}>
                <Settings size={14} className="text-gray-400" /> Paramètres
              </button>
              <div className="my-1 border-t border-gray-100" />
              {onboardingDone === false && (
                <button className="w-full text-left px-4 py-2 text-sm text-orange-600 hover:bg-orange-50 flex items-center gap-2"
                  onClick={() => { navigate('/onboarding'); setUserMenuOpen(false); }}>
                  <span className="w-2 h-2 rounded-full bg-orange-400 animate-pulse" />
                  Compléter l'onboarding
                </button>
              )}
              <button className="w-full text-left px-4 py-2 text-sm text-red-500 hover:bg-red-50 flex items-center gap-2" onClick={handleLogout}>
                <LogOut size={14} /> Déconnexion
              </button>
            </div>
          )}
        </div>
      </nav>

      {/* ── MAIN AREA ── */}
      <div style={{ display: 'flex', flexDirection: 'column', minHeight: '100vh', overflow: 'hidden' }}>

        {/* Optional TOC panel — shown inline before content when provided */}
        {toc && (
          <div style={{ display: 'flex', flex: 1, overflow: 'hidden' }}>
            {/* TOC sidebar */}
            <div style={{
              width: 204, flexShrink: 0, background: '#fff',
              borderRight: '1px solid #E8EAED', display: 'flex', flexDirection: 'column',
              overflowY: 'auto', position: 'sticky', top: 0, height: '100vh',
            }}>
              {toc}
            </div>
            {/* Doc area */}
            <div style={{ flex: 1, overflowY: 'auto' }}>
              {children}
            </div>
          </div>
        )}

        {/* Default layout (no TOC) */}
        {!toc && <>

        {/* Topbar */}
        <header style={{
          position: 'sticky', top: 0, height: 54,
          background: 'rgba(255,255,255,0.92)', backdropFilter: 'blur(12px) saturate(180%)',
          borderBottom: '1px solid #E8EAED', display: 'flex', alignItems: 'center',
          gap: 10, padding: '0 36px', zIndex: 15, flexShrink: 0,
        }}>
          {/* Language */}
          <button
            onClick={() => setLanguage(lang === 'fr' ? 'en' : 'fr')}
            className="flex items-center gap-1 text-xs font-semibold text-gray-500 hover:text-brand px-2 py-1 rounded-lg hover:bg-gray-50 transition-colors"
            title={lang === 'fr' ? 'Switch to English' : 'Passer en français'}
          >
            <Languages size={13} />
            <span>{lang === 'fr' ? 'EN' : 'FR'}</span>
          </button>

          <div style={{ flex: 1 }} />

          {/* Search */}
          <button
            onClick={() => setSearchOpen(true)}
            style={{
              display: 'flex', alignItems: 'center', gap: 8,
              background: '#F4F5F6', border: '1px solid #E8EAED',
              borderRadius: 9, padding: '8px 11px', fontSize: 12.5,
              color: '#7C8089', width: 220, cursor: 'pointer',
            }}
          >
            <Search size={13} />
            <span>Rechercher…</span>
            <kbd style={{ fontSize: 10, marginLeft: 'auto', background: '#E8E9EB', borderRadius: 4, padding: '1px 5px', color: '#888' }}>⌘K</kbd>
          </button>

          {/* Quick add */}
          <div className="relative">
            <button
              onClick={() => { setQuickOpen(o => !o); setUserMenuOpen(false); }}
              style={{
                width: 32, height: 32, background: '#F26522', border: 'none',
                borderRadius: 9, cursor: 'pointer', display: 'grid', placeItems: 'center',
                color: '#fff', boxShadow: '0 1px 3px rgba(0,0,0,0.12)',
              }}
              title="Actions rapides"
            >
              {quickOpen ? <X size={14} /> : <Plus size={14} />}
            </button>
            {quickOpen && (
              <div className="absolute right-0 top-9 bg-white border border-gray-100 rounded-xl shadow-lg z-50 py-1 w-48">
                {QUICK_KEYS.map(q => (
                  <button key={q.path}
                    className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-orange-50 hover:text-brand transition-colors"
                    onClick={() => { navigate(q.path); setQuickOpen(false); }}>
                    {t(q.key)}
                  </button>
                ))}
              </div>
            )}
          </div>
        </header>

        {/* Onboarding banner */}
        {onboardingDone === false && (
          <div style={{ background: '#FFF7ED', borderBottom: '1px solid #FED7AA', padding: '10px 36px', display: 'flex', alignItems: 'center', gap: 12 }}>
            <span style={{ width: 8, height: 8, borderRadius: '50%', background: '#F26522', display: 'block', animation: 'pulse 2s infinite', flexShrink: 0 }} />
            <p style={{ fontSize: 13, color: '#9A3412', flex: 1 }}>Complète ton profil pour personnaliser MONFLUX selon ton métier.</p>
            <button onClick={() => navigate('/onboarding')}
              style={{ fontSize: 12, fontWeight: 700, color: '#F26522', background: 'none', border: 'none', cursor: 'pointer' }}>
              Compléter →
            </button>
          </div>
        )}

        {/* Content */}
        <main style={{ flex: 1, overflowY: 'auto' }}>
          {children}
        </main>

        </>} {/* end !toc */}

      </div>

      {searchOpen && <SearchModal onClose={() => setSearchOpen(false)} />}
    </div>
  );
}
