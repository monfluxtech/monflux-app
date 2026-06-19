import { NavLink, useNavigate } from 'react-router-dom';
import { useState } from 'react';
import { useAuthStore, useUIStore } from '../store';
import {
  LayoutDashboard, FolderKanban, Users, FileText, Receipt,
  HardHat, QrCode, MessageSquare, Settings, LogOut, Menu, Moon, Sun, Plus, X
} from 'lucide-react';

const NAV = [
  { to: '/dashboard',       icon: LayoutDashboard, label: 'Tableau de bord' },
  { to: '/projets',         icon: FolderKanban,    label: 'Projets & Gantt' },
  { to: '/leads',           icon: Users,           label: 'Leads' },
  { to: '/soumissions',     icon: FileText,        label: 'Soumissions' },
  { to: '/factures',        icon: Receipt,         label: 'Factures' },
  { to: '/sous-traitants',  icon: HardHat,         label: 'Sous-traitants' },
  { to: '/punch',           icon: QrCode,          label: 'Pointage QR' },
  { to: '/chat',            icon: MessageSquare,   label: 'Assistant IA' },
  { to: '/parametres',      icon: Settings,        label: 'Paramètres' },
];

const QUICK = [
  { label:'Nouveau lead',        path:'/leads?new=1' },
  { label:'Nouvelle soumission', path:'/soumissions?new=1' },
  { label:'Nouveau projet',      path:'/projets?new=1' },
  { label:'Pointer un chantier', path:'/punch' },
];

export default function Layout({ children }) {
  const { user, logout } = useAuthStore();
  const { darkMode, sidebarOpen, toggleDark, toggleSidebar } = useUIStore();
  const navigate = useNavigate();
  const [quickOpen, setQuickOpen] = useState(false);

  const handleLogout = () => { logout(); navigate('/'); };

  return (
    <div className="flex h-screen bg-gray-50 overflow-hidden">
      {/* Sidebar */}
      <aside className={`${sidebarOpen ? 'w-56' : 'w-14'} flex-shrink-0 bg-white border-r border-gray-100 flex flex-col transition-all duration-200`}>
        {/* Logo */}
        <div className="flex items-center gap-2 px-3 py-4 border-b border-gray-100">
          <div className="w-7 h-7 rounded-lg flex items-center justify-center flex-shrink-0" style={{background:'#F26522'}}>
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

        {/* Footer */}
        <div className="px-2 py-3 border-t border-gray-100 space-y-0.5">
          <button onClick={toggleDark} className="nav-item w-full" title="Mode sombre">
            {darkMode ? <Sun size={16}/> : <Moon size={16}/>}
            {sidebarOpen && <span>{darkMode ? 'Mode clair' : 'Mode sombre'}</span>}
          </button>
          <button onClick={handleLogout} className="nav-item w-full text-red-500 hover:bg-red-50 hover:text-red-600" title="Déconnexion">
            <LogOut size={16}/>
            {sidebarOpen && <span>Déconnexion</span>}
          </button>
        </div>
      </aside>

      {/* Main */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Topbar */}
        <header className="h-12 bg-white border-b border-gray-100 flex items-center gap-3 px-4 flex-shrink-0">
          <button onClick={toggleSidebar} className="btn-ghost p-1.5 rounded-md">
            <Menu size={16}/>
          </button>
          <div className="flex-1" />
          {/* Quick-add */}
          <div className="relative">
            <button
              className="w-7 h-7 rounded-lg flex items-center justify-center text-white flex-shrink-0 shadow-sm"
              style={{background:'#F26522'}}
              onClick={() => setQuickOpen(o=>!o)}
              title="Actions rapides"
            >
              {quickOpen ? <X size={14}/> : <Plus size={14}/>}
            </button>
            {quickOpen && (
              <div className="absolute right-0 top-9 bg-white border border-gray-100 rounded-xl shadow-lg z-50 py-1 w-48">
                {QUICK.map(q => (
                  <button key={q.path} className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-orange-50 hover:text-brand transition-colors"
                    onClick={() => { navigate(q.path); setQuickOpen(false); }}>
                    {q.label}
                  </button>
                ))}
              </div>
            )}
          </div>
          {user?.name && <span className="text-xs text-gray-500 hidden sm:block">{user.name}</span>}
          <div className="w-7 h-7 rounded-full flex items-center justify-center text-white text-xs font-medium flex-shrink-0" style={{background:'#111827'}}>
            {(user?.name?.[0] || user?.email?.[0] || 'U').toUpperCase()}
          </div>
        </header>

        {/* Content */}
        <main className="flex-1 overflow-y-auto">
          {children}
        </main>
      </div>
    </div>
  );
}
