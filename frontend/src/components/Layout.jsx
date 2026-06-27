import { NavLink, useNavigate } from 'react-router-dom';
import { useState, useRef, useEffect } from 'react';
import { useAuthStore, useUIStore, useConfigStore } from '../store';
import { dashboard as dashApi, auth as authApi } from '../api';
import { CORE_MODULES, SECONDARY_MODULES, roleAllows } from '../config/modules';
import SearchModal from './SearchModal';
import { useT, useLang } from '../hooks/useT';
import {
  LayoutDashboard, FolderKanban, Users, FileText, Receipt,
  HardHat, QrCode, Settings, Plus, X,
  LogOut, User, BookUser, BarChart3, Bell,
  AlertCircle, Clock, FileQuestion, Search, Sparkles,
  FileSignature, ShoppingCart, FileStack, Languages,
} from 'lucide-react';

const ICONS = {
  LayoutDashboard, Sparkles, FolderKanban, Users, FileText, Receipt,
  HardHat, QrCode, BarChart3, BookUser, FileSignature,
  ShoppingCart, FileStack, Settings,
};

const QUICK_KEYS = [
  { key: 'new_lead', path: '/leads?new=1' },
  { key: 'new_quote', path: '/soumissions?new=1' },
  { key: 'new_project_quick', path: '/projets?new=1' },
  { key: 'punch_site', path: '/punch' },
];

function SidebarLink({ to, icon: Icon, label, onClick, badge = false }) {
  const content = (
    <>
      <span className="app-sidebar-link-icon">
        <Icon size={14} />
      </span>
      <span className="truncate">{label}</span>
      {badge && <span className="ml-auto w-1.5 h-1.5 rounded-full bg-red-500 flex-shrink-0" />}
    </>
  );

  if (to) {
    return (
      <NavLink to={to} className={({ isActive }) => `app-sidebar-link ${isActive ? 'active' : ''}`}>
        {content}
      </NavLink>
    );
  }

  return (
    <button type="button" onClick={onClick} className="app-sidebar-link">
      {content}
    </button>
  );
}

export default function Layout({ children, toc = null, noTopbar = false }) {
  const t = useT();
  const { lang, setLanguage } = useLang();
  const { user, logout, company } = useAuthStore();
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
  const quickRef = useRef(null);

  const role = company?.role;
  const coreNav = CORE_MODULES.filter((m) => roleAllows(role, m.key));
  const secondaryNav = SECONDARY_MODULES.filter((m) => roleAllows(role, m.key) && modules?.[m.key]);

  useEffect(() => {
    load();
  }, []);

  useEffect(() => {
    const handler = (e) => {
      if (userMenuRef.current && !userMenuRef.current.contains(e.target)) setUserMenuOpen(false);
      if (notifRef.current && !notifRef.current.contains(e.target)) setNotifOpen(false);
      if (quickRef.current && !quickRef.current.contains(e.target)) setQuickOpen(false);
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  useEffect(() => {
    const handler = (e) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault();
        setSearchOpen((open) => !open);
      }
    };
    document.addEventListener('keydown', handler);
    return () => document.removeEventListener('keydown', handler);
  }, []);

  useEffect(() => {
    const fetchNotifs = async () => {
      try {
        const { data } = await dashApi.notifications();
        setNotifs(data || []);
      } catch {}
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

  const handleLogout = () => {
    logout();
    navigate('/');
  };

  const initials = (user?.name?.[0] || user?.email?.[0] || 'U').toUpperCase();
  const profileSubtitle = company?.role || user?.email || 'Mon compte';

  return (
    <div className="app-shell">
      <aside className="app-sidebar">
        <div className="app-sidebar-header">
          <button
            type="button"
            className="app-sidebar-logo"
            title="MONFLUX"
            onClick={() => navigate('/dashboard')}
          >
            M
          </button>
          <span className="app-sidebar-app">MONFLUX</span>

          <div className="relative" ref={notifRef}>
            <button
              type="button"
              className="app-sidebar-icon-btn"
              title="Notifications"
              onClick={() => {
                setNotifOpen((open) => !open);
                setNotifSeen(true);
              }}
            >
              <Bell size={15} />
              {notifs.length > 0 && !notifSeen && (
                <span className="absolute top-[5px] right-[5px] w-1.5 h-1.5 rounded-full bg-red-500 border-[1.5px] border-[#111317]" />
              )}
            </button>
            {notifOpen && (
              <div className="absolute right-0 top-9 bg-white border border-gray-100 rounded-xl shadow-xl z-50 w-72 overflow-hidden">
                <div className="px-4 py-2.5 border-b border-gray-50 flex items-center justify-between">
                  <p className="text-sm font-semibold text-gray-900">{t('sidebar_notifications', 'Notifications')}</p>
                  {notifs.length > 0 && (
                    <span className="text-xs bg-red-100 text-red-600 px-2 py-0.5 rounded-full font-medium">{notifs.length}</span>
                  )}
                </div>
                {notifs.length === 0 ? (
                  <div className="px-4 py-6 text-center">
                    <Bell size={20} className="text-gray-200 mx-auto mb-2" />
                    <p className="text-xs text-gray-400">{t('sidebar_no_notifications', 'Aucune alerte en ce moment')}</p>
                  </div>
                ) : (
                  <div className="max-h-64 overflow-y-auto py-1">
                    {notifs.map((n, i) => {
                      const Icon = n.type === 'invoice_overdue' ? AlertCircle : n.type === 'follow_up' ? Clock : FileQuestion;
                      const color = n.severity === 'error' ? '#ef4444' : n.severity === 'warning' ? '#f59e0b' : '#6366f1';
                      return (
                        <button
                          key={i}
                          type="button"
                          className="w-full text-left flex items-start gap-3 px-4 py-2.5 hover:bg-gray-50"
                          onClick={() => {
                            navigate(n.path);
                            setNotifOpen(false);
                          }}
                        >
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
        </div>

        <div className="app-sidebar-scroll">
        <nav className="app-sidebar-global">
          {coreNav.map((m) => {
            const Icon = ICONS[m.icon] || FolderKanban;
            return (
              <SidebarLink
                key={m.path}
                to={m.path}
                icon={Icon}
                label={t(`nav_${m.key}`, m.label)}
              />
            );
          })}

          {secondaryNav.length > 0 && (
            <>
              <div className="app-sidebar-section-label">{t('nav_modules_label', 'Modules')}</div>
              {secondaryNav.map((m) => {
                const Icon = ICONS[m.icon] || FolderKanban;
                return (
                  <SidebarLink
                    key={m.path}
                    to={m.path}
                    icon={Icon}
                    label={t(`nav_${m.key}`, m.label)}
                  />
                );
              })}
            </>
          )}
        </nav>

        {toc ? toc : <div style={{ flex: 1 }} />}

        <div className="app-sidebar-bottom">
          {onboardingDone === false && (
            <div className="app-sidebar-status">
              <span className="app-sidebar-status-dot warn" />
              <div className="app-sidebar-status-text">
                {t('sidebar_profile_incomplete', 'Profil à compléter')}
                <br />
                {t('sidebar_profile_incomplete_sub', 'Active MONFLUX selon ton métier')}
              </div>
              <button
                type="button"
                className="text-[10px] font-bold text-[#E8794E] px-1.5 py-1 rounded"
                onClick={() => navigate('/onboarding')}
              >
                {t('sidebar_complete_btn', 'Modifier')}
              </button>
            </div>
          )}

          <div className="app-sidebar-mini-actions">
            <button
              type="button"
              className="mini"
              title={lang === 'fr' ? 'Switch to English' : 'Passer en français'}
              onClick={() => setLanguage(lang === 'fr' ? 'en' : 'fr')}
            >
              <Languages size={14} />
            </button>
            <button
              type="button"
              className="mini"
              title={lang === 'fr' ? 'Visite guidée' : 'Guided tour'}
              onClick={() => window.dispatchEvent(new Event('mf:start-tour'))}
              style={{ color: '#E8794E' }}
            >
              <Sparkles size={14} />
            </button>
          </div>

          <div className="relative" ref={userMenuRef}>
            <button
              type="button"
              className="app-sidebar-user-row w-full text-left"
              onClick={() => setUserMenuOpen((open) => !open)}
              title={user?.name || 'Mon compte'}
            >
              <div className="app-sidebar-avatar">{initials}</div>
              <div className="app-sidebar-user-meta">
                <b>{user?.name || 'Mon compte'}</b>
                <small>{profileSubtitle}</small>
              </div>
              <div className="app-sidebar-icon-btn !w-7 !h-7 !border !border-white/10 !bg-white/5 !text-white/45">
                <Settings size={13} />
              </div>
            </button>

            {userMenuOpen && (
              <div className="absolute left-0 bottom-12 bg-white border border-gray-100 rounded-xl shadow-xl z-50 py-1 w-56">
                <div className="px-4 py-2.5 border-b border-gray-50">
                  <p className="text-sm font-semibold text-gray-900 truncate">{user?.name || 'Mon compte'}</p>
                  <p className="text-xs text-gray-400 truncate">{user?.email}</p>
                </div>
                <button
                  type="button"
                  className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 flex items-center gap-2"
                  onClick={() => {
                    navigate('/parametres?tab=profil');
                    setUserMenuOpen(false);
                  }}
                >
                  <User size={14} className="text-gray-400" /> {t('sidebar_user_profile', 'Mon profil')}
                </button>
                <button
                  type="button"
                  className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 flex items-center gap-2"
                  onClick={() => {
                    navigate('/parametres');
                    setUserMenuOpen(false);
                  }}
                >
                  <Settings size={14} className="text-gray-400" /> {t('sidebar_settings', 'Paramètres')}
                </button>
                <div className="my-1 border-t border-gray-100" />
                {onboardingDone === false && (
                  <button
                    type="button"
                    className="w-full text-left px-4 py-2 text-sm text-orange-600 hover:bg-orange-50 flex items-center gap-2"
                    onClick={() => {
                      navigate('/onboarding');
                      setUserMenuOpen(false);
                    }}
                  >
                    <span className="w-2 h-2 rounded-full bg-orange-400 animate-pulse" />
                    {t('sidebar_complete_onboarding', "Compléter l'onboarding")}
                  </button>
                )}
                <button
                  type="button"
                  className="w-full text-left px-4 py-2 text-sm text-red-500 hover:bg-red-50 flex items-center gap-2"
                  onClick={handleLogout}
                >
                  <LogOut size={14} /> {t('sidebar_logout', 'Déconnexion')}
                </button>
              </div>
            )}
          </div>
        </div>
        </div>{/* fin app-sidebar-scroll */}
      </aside>

      <div className="flex min-w-0 min-h-screen flex-col overflow-hidden">
        {toc ? (
          <div className="flex-1 overflow-y-auto">{children}</div>
        ) : (
          <>
            {!noTopbar && (
              <header className="app-topbar">
                <button
                  type="button"
                  onClick={() => setLanguage(lang === 'fr' ? 'en' : 'fr')}
                  className="flex items-center gap-1 text-xs font-semibold text-gray-500 hover:text-brand px-2 py-1 rounded-lg hover:bg-gray-50 transition-colors"
                  title={lang === 'fr' ? 'Switch to English' : 'Passer en français'}
                >
                  <Languages size={13} />
                  <span>{lang === 'fr' ? 'EN' : 'FR'}</span>
                </button>

                <div style={{ flex: 1 }} />

                <button
                  type="button"
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

                <div className="relative" ref={quickRef}>
                  <button
                    type="button"
                    onClick={() => {
                      setQuickOpen((open) => !open);
                      setUserMenuOpen(false);
                    }}
                    style={{
                      width: 32, height: 32, background: '#E8794E', border: 'none',
                      borderRadius: 9, cursor: 'pointer', display: 'grid', placeItems: 'center',
                      color: '#fff', boxShadow: '0 1px 3px rgba(0,0,0,0.12)',
                    }}
                    title="Actions rapides"
                  >
                    {quickOpen ? <X size={14} /> : <Plus size={14} />}
                  </button>
                  {quickOpen && (
                    <div className="absolute right-0 top-9 bg-white border border-gray-100 rounded-xl shadow-lg z-50 py-1 w-48">
                      {QUICK_KEYS.map((q) => (
                        <button
                          key={q.path}
                          type="button"
                          className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-orange-50 hover:text-brand transition-colors"
                          onClick={() => {
                            navigate(q.path);
                            setQuickOpen(false);
                          }}
                        >
                          {t(q.key)}
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              </header>
            )}

            {onboardingDone === false && (
              <div style={{ background: '#FFF7ED', borderBottom: '1px solid #FED7AA', padding: '10px 36px', display: 'flex', alignItems: 'center', gap: 12 }}>
                <span style={{ width: 8, height: 8, borderRadius: '50%', background: '#E8794E', display: 'block', animation: 'pulse 2s infinite', flexShrink: 0 }} />
                <p style={{ fontSize: 13, color: '#9A3412', flex: 1 }}>Complète ton profil pour personnaliser MONFLUX selon ton métier.</p>
                <button
                  type="button"
                  onClick={() => navigate('/onboarding')}
                  style={{ fontSize: 12, fontWeight: 700, color: '#E8794E', background: 'none', border: 'none', cursor: 'pointer' }}
                >
                  Compléter →
                </button>
              </div>
            )}

            <main className="flex-1 overflow-y-auto">
              {children}
            </main>
          </>
        )}
      </div>

      {searchOpen && <SearchModal onClose={() => setSearchOpen(false)} />}
    </div>
  );
}
