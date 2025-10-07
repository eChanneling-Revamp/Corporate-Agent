import { createContext, useCallback, useContext, useMemo, useState } from 'react'

export type Toast = {
  id: string
  type?: 'success' | 'error' | 'info'
  title?: string
  message: string
  durationMs?: number
}

type ToastContextValue = {
  toasts: Toast[]
  showToast: (t: Omit<Toast, 'id'>) => void
  dismissToast: (id: string) => void
}

const ToastContext = createContext<ToastContextValue | null>(null)

export function ToastProvider({ children }: { children: React.ReactNode }) {
  const [toasts, setToasts] = useState<Toast[]>([])

  const dismissToast = useCallback((id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id))
  }, [])

  const showToast = useCallback((t: Omit<Toast, 'id'>) => {
    const id = `${Date.now()}-${Math.floor(Math.random() * 10000)}`
    const toast: Toast = { id, durationMs: 3000, type: 'info', ...t }
    setToasts((prev) => [toast, ...prev])
    const timeout = toast.durationMs ?? 3000
    if (timeout > 0) {
      setTimeout(() => dismissToast(id), timeout)
    }
  }, [dismissToast])

  const value = useMemo(() => ({ toasts, showToast, dismissToast }), [toasts, showToast, dismissToast])

  return (
    <ToastContext.Provider value={value}>
      {children}
    </ToastContext.Provider>
  )
}

export function useToast() {
  const ctx = useContext(ToastContext)
  if (!ctx) throw new Error('useToast must be used within ToastProvider')
  return ctx
}

export function ToastContainer() {
  const { toasts, dismissToast } = useToast()
  return (
    <div className="fixed bottom-4 right-4 z-50 space-y-2 w-[90vw] max-w-sm">
      {toasts.map((t) => (
        <div 
          key={t.id} 
          className={`rounded-md shadow-lg border px-4 py-3 text-sm bg-white ${
            t.type === 'success' ? 'border-green-200' : t.type === 'error' ? 'border-red-200' : 'border-gray-200'
          }`}
        >
          {t.title && <div className="font-medium mb-0.5">{t.title}</div>}
          <div className="text-gray-700">{t.message}</div>
          <button 
            onClick={() => dismissToast(t.id)} 
            className="text-xs text-gray-500 hover:text-gray-700 mt-1"
          >
            Dismiss
          </button>
        </div>
      ))}
    </div>
  )
}