import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { companies as companiesApi } from './api';
import { DEFAULT_PIPELINE, defaultModulesEnabled } from './config/modules';

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
      language: 'fr',

      toggleDark:    () => set((s) => { const d = !s.darkMode; document.documentElement.classList.toggle('dark', d); return { darkMode: d }; }),
      toggleSidebar: () => set((s) => ({ sidebarOpen: !s.sidebarOpen })),
      setModule:     (m) => set({ activeModule: m }),
      setLanguage:   (l) => set({ language: l }),
    }),
    {
      name: 'monflux-ui',
      partialize: (s) => ({ darkMode: s.darkMode, sidebarOpen: s.sidebarOpen, language: s.language }),
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

// ── Refonte v3 — config: modules activables + pipeline personnalisable ───────
export const useConfigStore = create((set, get) => ({
  modules: null,    // objet modules_enabled { key: bool }
  pipeline: null,   // tableau d'états [{ key, label, color, terminal? }]
  loaded: false,
  loading: false,

  load: async (force = false) => {
    if (get().loading || (get().loaded && !force)) return;
    set({ loading: true });
    try {
      const { data } = await companiesApi.get();
      set({
        modules: data.modules_enabled || defaultModulesEnabled(),
        pipeline: Array.isArray(data.pipeline_stages) && data.pipeline_stages.length
          ? data.pipeline_stages : DEFAULT_PIPELINE,
        loaded: true,
      });
    } catch {
      set({ modules: defaultModulesEnabled(), pipeline: DEFAULT_PIPELINE, loaded: true });
    } finally {
      set({ loading: false });
    }
  },

  toggleModule: async (key) => {
    const modules = { ...(get().modules || {}), [key]: !get().modules?.[key] };
    set({ modules });
    try { await companiesApi.update({ modules_enabled: modules }); } catch {}
  },

  setPipeline: async (pipeline) => {
    set({ pipeline });
    try { await companiesApi.update({ pipeline_stages: pipeline }); } catch {}
  },

  reset: () => set({ modules: null, pipeline: null, loaded: false }),
}));
