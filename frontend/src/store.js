import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export const useAuthStore = create(
  persist(
    (set) => ({
      user: null,
      company: null,
      plan: null,
      token: null,
      isAuthenticated: false,

      setAuth: ({ token, user, company, plan }) => {
        localStorage.setItem('token', token);
        set({ token, user, company, plan, isAuthenticated: true });
      },
      setCompany: (company) => set({ company }),
      setPlan:    (plan)    => set({ plan }),

      logout: () => {
        localStorage.removeItem('token');
        set({ user: null, company: null, plan: null, token: null, isAuthenticated: false });
      },
    }),
    { name: 'monflux-auth', partialize: (s) => ({ token: s.token, user: s.user, company: s.company }) }
  )
);

export const useUIStore = create(
  persist(
    (set) => ({
      darkMode: false,
      sidebarOpen: true,
      activeModule: 'dashboard',

      toggleDark:    () => set((s) => { const d = !s.darkMode; document.documentElement.classList.toggle('dark', d); return { darkMode: d }; }),
      toggleSidebar: () => set((s) => ({ sidebarOpen: !s.sidebarOpen })),
      setModule:     (m) => set({ activeModule: m }),
    }),
    {
      name: 'monflux-ui',
      partialize: (s) => ({ darkMode: s.darkMode, sidebarOpen: s.sidebarOpen }),
      onRehydrateStorage: () => (state) => {
        if (state?.darkMode) document.documentElement.classList.add('dark');
      },
    }
  )
);

export const useDevStore = create((set) => ({
  enabled: import.meta.env.DEV,
  currentOverride: null,
  setOverride: (o) => set({ currentOverride: o }),
}));
