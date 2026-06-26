/**
 * useUiPrefs — gestion des préférences UI persistées en DB (company_config.ui_preferences)
 * avec fallback/migration automatique depuis localStorage.
 *
 * Usage :
 *   const { prefs, setPref } = useUiPrefs();
 *   const markup = prefs.quote_markup ?? 0;
 *   setPref('quote_markup', 18);
 */
import { useState, useEffect, useRef, useCallback } from 'react';
import { companies as companiesApi } from '../api';

let _cache = null;          // singleton partagé entre les composants de la même session
let _listeners = new Set();

function notify(prefs) {
  _cache = prefs;
  _listeners.forEach(fn => fn(prefs));
}

async function loadPrefs() {
  if (_cache) return _cache;
  try {
    const { data } = await companiesApi.get();
    const dbPrefs = data?.company_config?.ui_preferences || data?.ui_preferences || {};
    // Migration localStorage → DB : copie les clés connues si absentes en DB
    const LS_KEYS = [
      ['quote_markup', 'monflux-quote-markup', Number],
      ['quote_pdf_cols', 'monflux-quote-pdf-cols', JSON.parse],
      ['gantt_pinned', 'mf_gantt_pinned', JSON.parse],
      ['gantt_hidden', 'mf_gantt_hidden', JSON.parse],
      ['flo_settings', 'monflux-flo-settings', JSON.parse],
      ['flow_flags', 'monflux-flow-flags', JSON.parse],
      ['suppliers', 'monflux-suppliers', JSON.parse],
      ['roles_matrix', 'monflux-roles-matrix', JSON.parse],
    ];
    let migrated = false;
    const merged = { ...dbPrefs };
    for (const [key, lsKey, parse] of LS_KEYS) {
      if (merged[key] === undefined) {
        const raw = localStorage.getItem(lsKey);
        if (raw !== null) {
          try { merged[key] = parse(raw); migrated = true; } catch {}
        }
      }
    }
    if (migrated) {
      // Persist migrated data to DB (fire-and-forget)
      companiesApi.updateConfig({ ui_preferences: merged }).catch(() => {});
    }
    notify(merged);
    return merged;
  } catch {
    const empty = {};
    notify(empty);
    return empty;
  }
}

export function useUiPrefs() {
  const [prefs, setPrefs] = useState(_cache || {});
  const saveTimer = useRef(null);

  useEffect(() => {
    _listeners.add(setPrefs);
    if (!_cache) loadPrefs();
    else setPrefs(_cache);
    return () => { _listeners.delete(setPrefs); };
  }, []);

  const setPref = useCallback((key, value) => {
    const next = { ..._cache, [key]: value };
    notify(next);
    // Debounced save to DB
    clearTimeout(saveTimer.current);
    saveTimer.current = setTimeout(() => {
      companiesApi.updateConfig({ ui_preferences: next }).catch(() => {});
    }, 600);
  }, []);

  return { prefs, setPref };
}

/**
 * useProjectPrefs — préférences par projet persistées dans field_assessment
 * Clés : toc_hidden, toc_order, toc_override, trade_certifs, trade_resources,
 *        trade_conformite, mat_wishlist, relances_count, relances_methods, relances_freq
 */
export function useProjectPrefs(project, saveAssessmentField) {
  const getFA = useCallback((key, defaultVal) => {
    const fa = project?.field_assessment || {};
    if (fa[key] !== undefined) return fa[key];
    // Migration: try localStorage
    const lsMap = {
      toc_hidden: `monflux-toc-hidden-${project?.id}`,
      toc_order: `monflux-toc-order-${project?.id}`,
      toc_override: `monflux-toc-override-${project?.id}`,
      trade_certifs: `monflux-trade-certifs-${project?.id}`,
      trade_resources: `monflux-trade-resources-${project?.id}`,
      trade_conformite: `monflux-trade-conformite-${project?.id}`,
      mat_wishlist: `monflux-mat-wishlist-${project?.id}`,
      relances_count: `monflux-relances-count-${project?.id}`,
      relances_methods: `monflux-relances-methods-${project?.id}`,
      relances_freq: `monflux-relances-freq-${project?.id}`,
    };
    const lsKey = lsMap[key];
    if (!lsKey) return defaultVal;
    try {
      const raw = localStorage.getItem(lsKey);
      if (raw !== null) return JSON.parse(raw);
    } catch {}
    return defaultVal;
  }, [project]);

  const setProjectPref = useCallback((key, value) => {
    saveAssessmentField(key, value);
  }, [saveAssessmentField]);

  return { getFA, setProjectPref };
}
