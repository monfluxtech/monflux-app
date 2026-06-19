import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Search, Loader2, Users, FolderKanban, FileText,
  Receipt, BookUser, HardHat, ChevronRight,
} from 'lucide-react';
import http from '../api';

const TYPE_META = {
  lead:         { label: 'Lead',          color: '#F26522', Icon: Users },
  project:      { label: 'Projet',        color: '#6366f1', Icon: FolderKanban },
  quote:        { label: 'Soumission',    color: '#3b82f6', Icon: FileText },
  invoice:      { label: 'Facture',       color: '#22c55e', Icon: Receipt },
  contact:      { label: 'Contact',       color: '#9ca3af', Icon: BookUser },
  subcontractor:{ label: 'Sous-traitant', color: '#f59e0b', Icon: HardHat },
};

const STATUS_FR = {
  new:'Nouveau', contacted:'Contacté', won:'Gagné', lost:'Perdu', active:'Actif',
  draft:'Brouillon', sent:'Envoyée', signed:'Signée', paid:'Payée', overdue:'En retard',
  completed:'Terminé', on_hold:'En pause',
};

export default function SearchModal({ onClose }) {
  const [q, setQ] = useState('');
  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(false);
  const [selected, setSelected] = useState(0);
  const navigate = useNavigate();
  const inputRef = useRef(null);
  const listRef = useRef(null);

  useEffect(() => { setTimeout(() => inputRef.current?.focus(), 50); }, []);

  useEffect(() => {
    if (q.trim().length < 2) { setResults([]); return; }
    const t = setTimeout(async () => {
      setLoading(true);
      try {
        const { data } = await http.get('/search', { params: { q: q.trim() } });
        setResults(data);
        setSelected(0);
      } catch {} finally { setLoading(false); }
    }, 220);
    return () => clearTimeout(t);
  }, [q]);

  // Scroll selected item into view
  useEffect(() => {
    const el = listRef.current?.children[selected];
    el?.scrollIntoView({ block: 'nearest' });
  }, [selected]);

  const go = (path) => { navigate(path); onClose(); };

  const handleKey = (e) => {
    if (e.key === 'ArrowDown') { e.preventDefault(); setSelected(s => Math.min(s + 1, results.length - 1)); }
    else if (e.key === 'ArrowUp')  { e.preventDefault(); setSelected(s => Math.max(s - 1, 0)); }
    else if (e.key === 'Enter' && results[selected]) { go(results[selected].path); }
    else if (e.key === 'Escape')  { onClose(); }
  };

  return (
    <div
      className="fixed inset-0 bg-black/40 backdrop-blur-sm z-[100] flex items-start justify-center pt-[12vh]"
      onClick={onClose}
    >
      <div
        className="bg-white rounded-2xl shadow-2xl w-full max-w-lg mx-4 overflow-hidden animate-in fade-in slide-in-from-top-4"
        style={{ animationDuration: '150ms' }}
        onClick={e => e.stopPropagation()}
      >
        {/* Search input */}
        <div className="flex items-center gap-3 px-4 py-3.5">
          {loading
            ? <Loader2 size={17} className="text-brand animate-spin flex-shrink-0" />
            : <Search size={17} className="text-gray-400 flex-shrink-0" />
          }
          <input
            ref={inputRef}
            className="flex-1 text-sm outline-none placeholder:text-gray-400 bg-transparent"
            placeholder="Rechercher leads, projets, factures, contacts…"
            value={q}
            onChange={e => setQ(e.target.value)}
            onKeyDown={handleKey}
          />
          {q && (
            <button className="text-gray-300 hover:text-gray-500" onClick={() => { setQ(''); setResults([]); inputRef.current?.focus(); }}>
              ×
            </button>
          )}
          <kbd className="text-xs text-gray-300 bg-gray-100 px-1.5 py-0.5 rounded font-mono">Esc</kbd>
        </div>

        {/* Divider */}
        <div className="h-px bg-gray-100" />

        {/* Results */}
        {results.length > 0 && (
          <div ref={listRef} className="max-h-72 overflow-y-auto py-1">
            {results.map((r, i) => {
              const meta = TYPE_META[r.type] || { label: r.type, color: '#9ca3af', Icon: Search };
              const statusLabel = STATUS_FR[r.status] || r.status;
              return (
                <button
                  key={`${r.type}-${r.id}`}
                  className={`w-full text-left flex items-center gap-3 px-4 py-2.5 transition-colors ${
                    i === selected ? 'bg-orange-50' : 'hover:bg-gray-50'
                  }`}
                  onClick={() => go(r.path)}
                  onMouseEnter={() => setSelected(i)}
                >
                  <div
                    className="w-7 h-7 rounded-lg flex items-center justify-center flex-shrink-0"
                    style={{ background: meta.color + '18' }}
                  >
                    <meta.Icon size={13} style={{ color: meta.color }} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-gray-900 truncate">{r.name}</p>
                    {r.sub && <p className="text-xs text-gray-400 truncate">{r.sub}</p>}
                  </div>
                  <div className="flex items-center gap-1.5 flex-shrink-0">
                    <span
                      className="text-xs px-2 py-0.5 rounded-full font-medium"
                      style={{ background: meta.color + '15', color: meta.color }}
                    >
                      {meta.label}
                    </span>
                    {i === selected && <ChevronRight size={13} className="text-gray-300" />}
                  </div>
                </button>
              );
            })}
          </div>
        )}

        {q.trim().length >= 2 && !loading && results.length === 0 && (
          <div className="px-4 py-8 text-center">
            <Search size={24} className="text-gray-200 mx-auto mb-2" />
            <p className="text-sm text-gray-400">Aucun résultat pour <strong>« {q} »</strong></p>
          </div>
        )}

        {q.trim().length < 2 && (
          <div className="px-4 py-5 flex flex-wrap gap-2 justify-center">
            {Object.entries(TYPE_META).map(([type, meta]) => (
              <div
                key={type}
                className="flex items-center gap-1.5 text-xs text-gray-400 bg-gray-50 px-2.5 py-1.5 rounded-lg"
              >
                <meta.Icon size={11} style={{ color: meta.color }} />
                {meta.label}
              </div>
            ))}
          </div>
        )}

        {/* Footer */}
        <div className="px-4 py-2 border-t border-gray-50 flex items-center gap-5 text-xs text-gray-300">
          <span className="flex items-center gap-1"><kbd className="bg-gray-100 px-1 rounded font-mono">↑↓</kbd> naviguer</span>
          <span className="flex items-center gap-1"><kbd className="bg-gray-100 px-1 rounded font-mono">↵</kbd> ouvrir</span>
          <span className="flex items-center gap-1"><kbd className="bg-gray-100 px-1 rounded font-mono">Esc</kbd> fermer</span>
          <span className="ml-auto">
            <kbd className="bg-gray-100 px-1 rounded font-mono">⌘K</kbd> pour rouvrir
          </span>
        </div>
      </div>
    </div>
  );
}
