import { NavLink, useNavigate } from 'react-router-dom';
import { useState, useRef, useEffect } from 'react';
import { useAuthStore, useUIStore, useConfigStore } from '../store';
import { dashboard as dashApi, auth as authApi } from '../api';
import { CORE_MODULES, SECONDARY_MODULES, roleAllows } from '../config/modules';
import SearchModal from './SearchModal';
import { useT, useLang } from '../hooks/useT';
import {
  LayoutDashboard, FolderKanban, Users, FileText, Receipt,
  HardHat, QrCode, Settings, Menu, Moon, Sun, Plus, X,
  LogOut, User, ChevronRight, BookUser, BarChart3, Bell,
  AlertCircle, Clock, FileQuestion, Search, Sparkles,
  FileSignature, ShoppingCart, FileStack, SlidersHorizontal, Check,
  Languages,
} from 'lucide-react';

function OnboardingBanner({ onDismiss, onGo }) {
  const t = useT();
  return (
    <div className="bg-orange-50 border-b border-orange-100 px-4 py-2.5 flex items-center gap-3">
      <span className="w-2 h-2 rounded-full bg-orange-400 animate-pulse flex-shrink-0" />
      <p className="text-sm text-orange-800 flex-1">{t('onboarding_banner')}</p>
      <button className="text-xs font-medium text-brand hover:underline flex-shrink-0" onClick={onGo}>
        {t('complete')}
      </button>
      <button className="text-orange-400 hover:text-orange-600 flex-shrink-0" onClick={onDismiss} title={t('close')}>
        <X size={14} />
      </button>
    </div>
  );
}

// Résolution des icônes par nom (le registre des modules stocke des chaînes).
const ICONS = {
  LayoutDashboard, Sparkles, FolderKanban, Users, FileText, Receipt,
  HardHat, QrCode, BarChart3, BookUser, FileSignature, ShoppingCart, FileStack, Settings,
};

const QUICK_KEYS = [
  { key: 'new_lead',        path: '/leads?new=1' },
  { key: 'new_quote',       path: '/soumissions?new=1' },
  { key: 'new_project_quick', path: '/projets?new=1' },
  { key: 'punch_site',      path: '/punch' },
];

export default function Layout({ children }) {
  const t = useT();
  const { lang, setLanguage } = useLang();
  const { user, logout, company } = useAuthStore();
  const { darkMode, sidebarOpen, toggleDark, toggleSidebar } = useUIStore();
  const { modules, load } = useConfigStore();
  const navigate = useNavigate();
  const [searchOpen, setSearchOpen] = useState(false);
  const [quickOpen, setQuickOpen] = useState(false);
  const [userMenuOpen, setUserMenuOpen] = useState(false);
  const [notifOpen, setNotifOpen] = useState(false);
  const [notifs, setNotifs] = useState([]);
  const [notifSeen, setNotifSeen] = useState(false);
  const [onboardingDone, setOnboardingDone] = useState(null); // null = loading, true/false
  const [onboardingTooltip, setOnboardingTooltip] = useState(false);
  const userMenuRef = useRef(null);
  const notifRef = useRef(null);

  const role = company?.role;
  const coreNav = CORE_MODULES.filter((m) => roleAllows(role, m.key));
  const secondaryNav = SECONDARY_MODULES.filter((m) => roleAllows(role, m.key) && modules?.[m.key]);

  useEffect(() => { load(); }, []);

  // Close menus on outside click
  useEffect(() => {
    const handler = (e) => {
      if (userMenuRef.current && !userMenuRef.current.contains(e.target)) setUserMenuOpen(false);
      if (notifRef.current && !notifRef.current.contains(e.target)) setNotifOpen(false);
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  // Global Cmd+K shortcut
  useEffect(() => {
    const handler = (e) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault();
        setSearchOpen(o => !o);
      }
    };
    document.addEventListener('keydown', handler);
    return () => document.removeEventListener('keydown', handler);
  }, []);

  // Load notifications
  useEffect(() => {
    const load = async () => {
      try { const { data } = await dashApi.notifications(); setNotifs(data || []); }
      catch {}
    };
    load();
    const t = setInterval(load, 300000); // every 5 min
    return () => clearInterval(t);
  }, []);

  // Load onboarding status from server (more reliable than cached user object)
  useEffect(() => {
    if (!user) return;
    authApi.me().then(({ data }) => {
      setOnboardingDone(data?.user?.onboarding_completed ?? false);
    }).catch(() => setOnboardingDone(user?.onboarding_completed ?? false));
  }, [user?.id]);

  const handleLogout = () => { logout(); navigate('/'); };
  const initials = (user?.name?.[0] || user?.email?.[0] || 'U').toUpperCase();

  return (
    <div className="flex h-screen bg-gray-50 overflow-hidden">
      {/* Sidebar */}
      <aside className={`${sidebarOpen ? 'w-56' : 'w-14'} flex-shrink-0 bg-white border-r border-gray-100 flex flex-col transition-all duration-200`}>
        {/* Logo */}
        <div className="flex items-center gap-2 px-3 py-4 border-b border-gray-100">
          <div className="w-7 h-7 rounded-lg flex items-center justify-center flex-shrink-0" style={{ background: '#F26522' }}>
            <span className="text-white font-bold text-xs">M</span>
          </div>
          {sidebarOpen && <span className="font-bold text-gray-900 text-sm">MONFLUX</span>}
        </div>

        {/* Nav — 3 onglets cœur + modules activés */}
        <nav className="flex-1 px-2 py-3 space-y-0.5 overflow-y-auto">
          {[...coreNav, ...secondaryNav].map((m) => {
            const Icon = ICONS[m.icon] || FolderKanban;
            const label = t(`nav_${m.key}`, m.label);
            return (
              <NavLink
                key={m.path}
                to={m.path}
                className={({ isActive }) => `nav-item ${isActive ? 'active' : ''} ${m.highlight ? 'nav-item-ai' : ''}`}
                title={!sidebarOpen ? label : undefined}
              >
                <Icon size={16} className="flex-shrink-0" />
                {sidebarOpen && <span className="truncate">{label}</span>}
                {m.highlight && sidebarOpen && (
                  <span className="ml-auto text-[10px] font-semibold text-brand bg-brand/10 px-1.5 py-0.5 rounded-full">IA</span>
                )}
                {m.comingSoon && sidebarOpen && !m.highlight && (
                  <span className="ml-auto text-[9px] text-gray-300 italic">{t('coming_soon')}</span>
                )}
              </NavLink>
            );
          })}

          {/* Paramètres — lien discret en bas du nav */}
          <NavLink to="/parametres" className={({ isActive }) => `nav-item mt-2 text-gray-400 ${isActive ? 'active' : ''}`} title={!sidebarOpen ? t('settings') : undefined}>
            <Settings size={16} className="flex-shrink-0" />
            {sidebarOpen && <span className="truncate">{t('settings')}</span>}
          </NavLink>
        </nav>

        {/* Sidebar footer */}
        <div className="px-2 py-3 border-t border-gray-100 space-y-0.5">
          <button onClick={toggleDark} className="nav-item w-full" title={t(darkMode ? 'light_mode' : 'dark_mode')}>
            {darkMode ? <Sun size={16} /> : <Moon size={16} />}
            {sidebarOpen && <span>{t(darkMode ? 'light_mode' : 'dark_mode')}</span>}
          </button>
        </div>
      </aside>

      {/* Main */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Topbar */}
        <header className="h-12 bg-white border-b border-gray-100 flex items-center gap-3 px-4 flex-shrink-0">
          <button onClick={toggleSidebar} className="btn-ghost p-1.5 rounded-md">
            <Menu size={16} />
          </button>

          {/* Search bar trigger */}
          <button
            className="hidden sm:flex items-center gap-2 bg-gray-50 border border-gray-200 rounded-lg px-3 py-1.5 text-xs text-gray-400 hover:border-gray-300 hover:bg-gray-100 transition-colors ml-2"
            onClick={() => setSearchOpen(true)}
          >
            <Search size={12} />
            <span>Rechercher…</span>
            <kbd className="ml-2 bg-white border border-gray-200 px-1 rounded text-gray-300 font-mono">⌘K</kbd>
          </button>

          <div className="flex-1" />

          {/* Language toggle FR / EN */}
          <button
            className="flex items-center gap-1 text-xs font-medium text-gray-500 hover:text-brand px-2 py-1 rounded-lg hover:bg-gray-50 transition-colors"
            onClick={() => setLanguage(lang === 'fr' ? 'en' : 'fr')}
            title={lang === 'fr' ? 'Switch to English' : 'Passer en français'}
          >
            <Languages size={14} />
            <span className="hidden sm:inline">{lang === 'fr' ? 'EN' : 'FR'}</span>
          </button>

          {/* Onboarding status dot */}
          {onboardingDone !== null && (
            <div className="relative" onMouseEnter={() => setOnboardingTooltip(true)} onMouseLeave={() => setOnboardingTooltip(false)}>
              <button
                onClick={() => navigate('/onboarding')}
                className="flex items-center justify-center w-6 h-6 rounded-full"
                title="Statut onboarding"
              >
                <span className={`w-2.5 h-2.5 rounded-full block ${onboardingDone ? 'bg-green-400' : 'bg-orange-400 animate-pulse'}`} />
              </button>
              {onboardingTooltip && (
                <div className="absolute right-0 top-8 bg-gray-900 text-white text-[11px] px-2.5 py-1.5 rounded-lg shadow-lg z-50 w-48 whitespace-normal">
                  {onboardingDone ? t('onboarding_complete') : t('onboarding_incomplete')}
                </div>
              )}
            </div>
          )}

          {/* Notification bell */}
          <div className="relative" ref={notifRef}>
            <button
              className="relative btn-ghost p-1.5 rounded-md"
              onClick={() => { setNotifOpen(o => !o); setNotifSeen(true); setQuickOpen(false); setUserMenuOpen(false); }}
              title="Notifications"
            >
              <Bell size={16} className={notifs.length > 0 ? 'text-gray-700' : 'text-gray-400'} />
              {notifs.length > 0 && !notifSeen && (
                <span className="absolute top-0.5 right-0.5 min-w-[14px] h-3.5 bg-red-500 text-white text-[9px] font-bold rounded-full flex items-center justify-center px-0.5 leading-none">
                  {notifs.length > 9 ? '9+' : notifs.length}
                </span>
              )}
            </button>
            {notifOpen && (
              <div className="absolute right-0 top-9 bg-white border border-gray-100 rounded-xl shadow-xl z-50 w-72 overflow-hidden">
                <div className="px-4 py-2.5 border-b border-gray-50 flex items-center justify-between">
                  <p className="text-sm font-semibold text-gray-900">Notifications</p>
                  {notifs.length > 0 && (
                    <span className="text-xs bg-red-100 text-red-600 px-2 py-0.5 rounded-full font-medium">
                      {notifs.length}
                    </span>
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
                        <button
                          key={i}
                          className="w-full text-left flex items-start gap-3 px-4 py-2.5 hover:bg-gray-50 transition-colors"
                          onClick={() => { navigate(n.path); setNotifOpen(false); }}
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

          {/* Quick-add */}
          <div className="relative">
            <button
              className="w-7 h-7 rounded-lg flex items-center justify-center text-white flex-shrink-0 shadow-sm"
              style={{ background: '#F26522' }}
              onClick={() => { setQuickOpen(o => !o); setUserMenuOpen(false); }}
              title="Actions rapides"
            >
              {quickOpen ? <X size={14} /> : <Plus size={14} />}
            </button>
            {quickOpen && (
              <div className="absolute right-0 top-9 bg-white border border-gray-100 rounded-xl shadow-lg z-50 py-1 w-48">
                {QUICK_KEYS.map(q => (
                  <button
                    key={q.path}
                    className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-orange-50 hover:text-brand transition-colors"
                    onClick={() => { navigate(q.path); setQuickOpen(false); }}
                  >
                    {t(q.key)}
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* User avatar + dropdown */}
          <div className="relative" ref={userMenuRef}>
            <button
              onClick={() => { setUserMenuOpen(o => !o); setQuickOpen(false); }}
              className="flex items-center gap-2 rounded-lg px-1.5 py-1 hover:bg-gray-50 transition-colors"
              title="Mon compte"
            >
              {user?.name && <span className="text-xs text-gray-500 hidden sm:block">{user.name}</span>}
              <div
                className="w-7 h-7 rounded-full flex items-center justify-center text-white text-xs font-medium flex-shrink-0"
                style={{ background: '#111827' }}
              >
                {initials}
              </div>
            </button>

            {userMenuOpen && (
              <div className="absolute right-0 top-10 bg-white border border-gray-100 rounded-xl shadow-xl z-50 py-1 w-52">
                {/* User info header */}
                <div className="px-4 py-2.5 border-b border-gray-50">
                  <p className="text-sm font-semibold text-gray-900 truncate">{user?.name || 'Mon compte'}</p>
                  <p className="text-xs text-gray-400 truncate">{user?.email}</p>
                </div>

                <button
                  className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 flex items-center gap-2"
                  onClick={() => { navigate('/parametres?tab=profil'); setUserMenuOpen(false); }}
                >
                  <User size={14} className="text-gray-400" />
                  Mon profil
                </button>

                <button
                  className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 flex items-center gap-2"
                  onClick={() => { navigate('/parametres'); setUserMenuOpen(false); }}
                >
                  <Settings size={14} className="text-gray-400" />
                  Paramètres
                </button>

                <div className="my-1 border-t border-gray-100" />

                <button
                  className="w-full text-left px-4 py-2 text-sm text-red-500 hover:bg-red-50 flex items-center gap-2"
                  onClick={handleLogout}
                >
                  <LogOut size={14} />
                  Déconnexion
                </button>
              </div>
            )}
          </div>
        </header>

        {/* Content */}
        <main className="flex-1 overflow-y-auto">
          {onboardingDone === false && (
            <OnboardingBanner onDismiss={() => setOnboardingDone(true)} onGo={() => navigate('/onboarding')} />
          )}
          {children}
        </main>
      </div>

      {/* Global search */}
      {searchOpen && <SearchModal onClose={() => setSearchOpen(false)} />}
    </div>
  );
}
