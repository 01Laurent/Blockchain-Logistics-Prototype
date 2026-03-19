import { useEffect, useState } from 'react';

const listeners = new Set();

function emitToast(message, type) {
  const id = crypto.randomUUID();
  listeners.forEach((listener) => listener({ id, message, type }));
}

export const toast = {
  success: (message) => emitToast(message, 'success'),
  error: (message) => emitToast(message, 'error'),
  info: (message) => emitToast(message, 'info'),
  warning: (message) => emitToast(message, 'warning'),
};

export function Toast() {
  const [toasts, setToasts] = useState([]);

  useEffect(() => {
    const listener = (toastItem) => {
      setToasts((prev) => [...prev, toastItem]);

      setTimeout(() => {
        setToasts((prev) => prev.filter((t) => t.id !== toastItem.id));
      }, 4000);
    };

    listeners.add(listener);
    return () => listeners.delete(listener);
  }, []);

  const removeToast = (id) => {
    setToasts((prev) => prev.filter((toast) => toast.id !== id));
  };

  const getToastStyles = (type) => {
    switch (type) {
      case 'success':
        return {
          bg: 'bg-gradient-to-r from-emerald-500 to-green-600',
          icon: '✓',
          iconBg: 'bg-emerald-600',
          border: 'border-emerald-400',
        };
      case 'error':
        return {
          bg: 'bg-gradient-to-r from-red-500 to-rose-600',
          icon: '✕',
          iconBg: 'bg-red-600',
          border: 'border-red-400',
        };
      case 'warning':
        return {
          bg: 'bg-gradient-to-r from-amber-500 to-orange-600',
          icon: '⚠',
          iconBg: 'bg-amber-600',
          border: 'border-amber-400',
        };
      case 'info':
        return {
          bg: 'bg-gradient-to-r from-blue-500 to-indigo-600',
          icon: 'ℹ',
          iconBg: 'bg-blue-600',
          border: 'border-blue-400',
        };
      default:
        return {
          bg: 'bg-gradient-to-r from-gray-500 to-slate-600',
          icon: '•',
          iconBg: 'bg-gray-600',
          border: 'border-gray-400',
        };
    }
  };

  return (
    <>
      <div className="fixed top-4 right-4 z-[9999] space-y-3 pointer-events-none">
        {toasts.map((toast) => {
          const styles = getToastStyles(toast.type);
          return (
            <div
              key={toast.id}
              className="pointer-events-auto"
              style={{ animation: 'slideIn 0.3s ease-out' }}
            >
              <div className={`${styles.bg} rounded-xl shadow-2xl border-2 ${styles.border} overflow-hidden min-w-[320px] max-w-md`}>
                <div className="flex items-center p-4">
                  <div className={`${styles.iconBg} rounded-full w-10 h-10 flex items-center justify-center flex-shrink-0 shadow-lg`}>
                    <span className="text-white text-xl font-bold">{styles.icon}</span>
                  </div>

                  <div className="ml-4 flex-1">
                    <p className="text-white font-semibold text-sm leading-relaxed">
                      {toast.message}
                    </p>
                  </div>

                  <button
                    onClick={() => removeToast(toast.id)}
                    className="ml-4 text-white/80 hover:text-white transition-colors flex-shrink-0"
                  >
                    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                </div>

                <div className="h-1 bg-white/20">
                  <div
                    className="h-full bg-white/60"
                    style={{ animation: 'progress 4s linear forwards' }}
                  />
                </div>
              </div>
            </div>
          );
        })}
      </div>

      <style>{`
        @keyframes slideIn {
          from {
            transform: translateX(400px);
            opacity: 0;
          }
          to {
            transform: translateX(0);
            opacity: 1;
          }
        }

        @keyframes progress {
          from {
            width: 100%;
          }
          to {
            width: 0%;
          }
        }
      `}</style>
    </>
  );
}