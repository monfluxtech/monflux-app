import { NavLink, useNavigate } from 'react-router-dom';
import { useState, useRef, useEffect } from 'react';
import { useAuthStore, useUIStore } from '../store';
import FloatingChat from './FloatingChat';
import {
  LayoutDashboard, FolderKanban, Users, FileText, Receipt,
  HardHat, QrCode, Settings, Menu, Moon, Sun, Plus, X,
  LogOut, User, ChevronRight, BookUser, BarChart3,
} from 'lucide-react';

const NAV = [
  { to: '/dashboard',       icon: LayoutDashboard, label: 'Tableau de bord' },
  { to: '/projets',         icon: FolderKanban,    label: 'Projets & Gantt' },
  { to: '/leads',           icon: Users,           label: 'Leads' },
  { to: '/contacts',        icon: BookUser,        label: 'Contacts' },
  { to: '/soumissions',     icon: FileText,        label: 'Soumissions' },
  { to: '/factures',        icon: Receipt,         label: 'Factures' },
  { to: '/sous-traitants',  icon: HardHat,         label: 'Sous-traitants' },
  { to: '/punch',           icon: QrCode,          label: 'Pointage QR' },
  { to: '/rapport',         icon: BarChart3,       label: 'Rapport' },
  { to: '/parametres',      icon: Settings,        label: 'Paramètres' },
];

const QUICK = [
  { label: 'Nouveau lead',        path: '/leads?new=1' },
  { label: 'Nouvelle soumission', path: '/soumissions?new=1' },
  { label: 'Nouveau projet',      path: '/projets?new=1' },
  { label: 'Pointer un chantier', path: '/punch' },
];

export default function Layout({ children }) {
  const { user, logout } = useAuthStore();
  const { darkMode, sidebarOpen, toggleDark, toggleSidebar } = useUIStore();
  const navigate = useNavigate();
  const [quickOpen, setQuickOpen] = useState(false);
  const [userMenuOpen, setUserMenuOpen] = useState(false);
  const userMenuRef = useRef(null);

  // Close user menu on outside click
  useEffect(() => {
    const handler = (e) => {
      if (userMenuRef.current && !userMenuRef.current.contains(e.target)) {
        setUserMenuOpen(false);
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

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

        {/* Nav */}
        <nav className="flex-1 px-2 py-3 space-y-0.5 overflow-y-auto">
          {NAV.map(({ to, icon: Icon, label }) => (
            <NavLink
              key={to}
              to={to}
              className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`}
              title={!sidebarOpen ? label : undefined}
            >
              <Icon size={16} className="flex-shrink-0" />
              {sidebarOpen && <span className="truncate">{label}</span>}
            </NavLink>
          ))}
        </nav>

        {/* Sidebar footer */}
        <div className="px-2 py-3 border-t border-gray-100 space-y-0.5">
          <button onClick={toggleDark} className="nav-item w-full" title="Mode sombre">
            {darkMode ? <Sun size={16} /> : <Moon size={16} />}
            {sidebarOpen && <span>{darkMode ? 'Mode clair' : 'Mode sombre'}</span>}
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
          <div className="flex-1" />

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
                {QUICK.map(q => (
                  <button
                    key={q.path}
                    className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-orange-50 hover:text-brand transition-colors"
                    onClick={() => { navigate(q.path); setQuickOpen(false); }}
                  >
                    {q.label}
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
          {children}
        </main>
      </div>

      {/* Floating AI chat */}
      <FloatingChat />
    </div>
  );
}
