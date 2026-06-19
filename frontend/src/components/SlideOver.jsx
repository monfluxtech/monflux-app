import { useEffect } from 'react';
import { X } from 'lucide-react';

/**
 * Apple-style right-anchored slide-over panel. Replaces centered pop-up modals.
 *
 * Props:
 *  - title:    header text
 *  - subtitle: optional small text under the title
 *  - onClose:  called on backdrop click, Escape, or the × button
 *  - width:    Tailwind max-width class (default 'max-w-md')
 *  - footer:   optional node pinned to the bottom
 *  - children: panel body
 */
export default function SlideOver({ title, subtitle, onClose, width = 'max-w-md', footer, children }) {
  useEffect(() => {
    const onKey = (e) => { if (e.key === 'Escape') onClose?.(); };
    document.addEventListener('keydown', onKey);
    // Lock background scroll while open
    const prev = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => { document.removeEventListener('keydown', onKey); document.body.style.overflow = prev; };
  }, [onClose]);

  return (
    <div className="fixed inset-0 z-50 flex justify-end">
      {/* Backdrop */}
      <div
        className="slide-over-backdrop absolute inset-0 bg-gray-900/20 backdrop-blur-[2px]"
        onClick={onClose}
      />
      {/* Panel */}
      <div className={`slide-over-panel relative h-full w-full ${width} bg-white shadow-2xl flex flex-col rounded-l-2xl overflow-hidden`}>
        {/* Header */}
        <div className="flex items-start gap-3 px-6 py-4 border-b border-gray-100 flex-shrink-0">
          <div className="flex-1 min-w-0">
            <h2 className="font-semibold text-gray-900 text-base leading-tight truncate">{title}</h2>
            {subtitle && <p className="text-xs text-gray-400 mt-0.5">{subtitle}</p>}
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-lg flex items-center justify-center text-gray-400 hover:text-gray-700 hover:bg-gray-100 transition-colors flex-shrink-0"
            title="Fermer (Échap)"
          >
            <X size={18} />
          </button>
        </div>

        {/* Body */}
        <div className="flex-1 overflow-y-auto px-6 py-5">{children}</div>

        {/* Footer */}
        {footer && <div className="px-6 py-4 border-t border-gray-100 flex-shrink-0">{footer}</div>}
      </div>
    </div>
  );
}
