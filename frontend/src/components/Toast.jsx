import { createContext, useContext, useState, useCallback } from 'react';
import { CheckCircle, AlertCircle, Info, X } from 'lucide-react';

const ToastCtx = createContext(null);

let _toastId = 0;

export function ToastProvider({ children }) {
  const [toasts, setToasts] = useState([]);

  const add = useCallback((msg, type = 'info', duration = 3500) => {
    const id = ++_toastId;
    setToasts(t => [...t, { id, msg, type }]);
    setTimeout(() => setToasts(t => t.filter(x => x.id !== id)), duration);
    return id;
  }, []);

  const remove = useCallback((id) => setToasts(t => t.filter(x => x.id !== id)), []);

  const ICONS = {
    success: <CheckCircle size={15} className="text-green-500 flex-shrink-0" />,
    error:   <AlertCircle size={15} className="text-red-500 flex-shrink-0" />,
    info:    <Info size={15} className="text-blue-500 flex-shrink-0" />,
  };

  return (
    <ToastCtx.Provider value={add}>
      {children}
      <div className="fixed bottom-20 left-1/2 -translate-x-1/2 z-[200] flex flex-col gap-2 items-center pointer-events-none">
        {toasts.map(t => (
          <div
            key={t.id}
            className="flex items-center gap-2 bg-white border border-gray-100 shadow-lg rounded-xl px-4 py-2.5 text-sm text-gray-800 pointer-events-auto max-w-sm"
            style={{ animation: 'fadeInUp 0.2s ease' }}
          >
            {ICONS[t.type] || ICONS.info}
            <span className="flex-1">{t.msg}</span>
            <button onClick={() => remove(t.id)} className="text-gray-300 hover:text-gray-500 ml-1">
              <X size={13} />
            </button>
          </div>
        ))}
      </div>
    </ToastCtx.Provider>
  );
}

export function useToast() {
  return useContext(ToastCtx);
}
