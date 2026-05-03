import { createContext, useContext, useState, useCallback } from 'react'
import { CheckCircle, XCircle, X } from 'lucide-react'

const ToastContext = createContext(null)

export function useToast() {
  return useContext(ToastContext)
}

export function ToastProvider({ children }) {
  const [toasts, setToasts] = useState([])

  const addToast = useCallback((message, type = 'success') => {
    const id = Date.now() + Math.random()
    setToasts((prev) => [...prev, { id, message, type }])
    setTimeout(() => setToasts((prev) => prev.filter((t) => t.id !== id)), 3000)
  }, [])

  const remove = useCallback((id) => {
    setToasts((prev) => prev.filter((t) => t.id !== id))
  }, [])

  return (
    <ToastContext.Provider value={addToast}>
      {children}
      <div className="fixed bottom-5 right-5 flex flex-col gap-2 z-[9999] pointer-events-none">
        {toasts.map((t) => (
          <div
            key={t.id}
            className={`pointer-events-auto flex items-center gap-3 pl-4 pr-3 py-3 rounded-xl shadow-xl text-sm font-medium text-white animate-fade-up min-w-[220px] max-w-xs ${
              t.type === 'error' ? 'bg-red-600' : 'bg-gray-900'
            }`}
          >
            {t.type === 'error' ? (
              <XCircle className="w-4 h-4 flex-shrink-0 text-red-200" />
            ) : (
              <CheckCircle className="w-4 h-4 flex-shrink-0 text-green-400" />
            )}
            <span className="flex-1">{t.message}</span>
            <button
              onClick={() => remove(t.id)}
              className="text-white/50 hover:text-white transition p-0.5 flex-shrink-0"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          </div>
        ))}
      </div>
    </ToastContext.Provider>
  )
}
