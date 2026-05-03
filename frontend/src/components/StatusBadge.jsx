import { useState, useRef, useEffect } from 'react'
import { createPortal } from 'react-dom'
import { ChevronDown, Check } from 'lucide-react'

export const STATUS_CONFIG = {
  pending:       { label: 'Pending',     dot: 'bg-gray-400',   pill: 'bg-gray-100 text-gray-700' },
  'in-progress': { label: 'In Progress', dot: 'bg-blue-500',   pill: 'bg-blue-100 text-blue-700' },
  completed:     { label: 'Completed',   dot: 'bg-green-500',  pill: 'bg-green-100 text-green-700' },
  blocked:       { label: 'Blocked',     dot: 'bg-red-500',    pill: 'bg-red-100 text-red-700' },
  cancelled:     { label: 'Cancelled',   dot: 'bg-yellow-400', pill: 'bg-yellow-100 text-yellow-700' },
}

export const STATUS_OPTIONS = Object.keys(STATUS_CONFIG)

export default function StatusBadge({ value, onChange, disabled }) {
  const [open, setOpen] = useState(false)
  const [dropPos, setDropPos] = useState({ top: 0, left: 0 })
  const btnRef = useRef()
  const cfg = STATUS_CONFIG[value] || STATUS_CONFIG.pending

  const handleOpen = () => {
    if (disabled) return
    const rect = btnRef.current.getBoundingClientRect()
    setDropPos({ top: rect.bottom + 4, left: rect.left })
    setOpen(true)
  }

  useEffect(() => {
    if (!open) return
    const close = (e) => {
      if (!btnRef.current?.contains(e.target)) setOpen(false)
    }
    document.addEventListener('mousedown', close)
    return () => document.removeEventListener('mousedown', close)
  }, [open])

  return (
    <>
      <button
        ref={btnRef}
        onClick={handleOpen}
        disabled={disabled}
        className={`flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold whitespace-nowrap transition ${cfg.pill} ${
          disabled ? 'opacity-50 cursor-not-allowed' : 'hover:opacity-75 cursor-pointer'
        }`}
      >
        <span className={`w-1.5 h-1.5 rounded-full flex-shrink-0 ${cfg.dot}`} />
        {cfg.label}
        {!disabled && <ChevronDown className="w-3 h-3 flex-shrink-0 opacity-60" />}
      </button>

      {open &&
        createPortal(
          <div
            style={{ position: 'fixed', top: dropPos.top, left: dropPos.left, zIndex: 9999 }}
            className="bg-white border border-gray-200 rounded-xl shadow-xl overflow-hidden w-44"
          >
            {Object.entries(STATUS_CONFIG).map(([key, c]) => (
              <button
                key={key}
                onMouseDown={() => { onChange(key); setOpen(false) }}
                className={`w-full flex items-center gap-2.5 px-3 py-2.5 text-sm hover:bg-gray-50 transition text-left ${
                  key === value ? 'bg-indigo-50' : ''
                }`}
              >
                <span className={`w-2 h-2 rounded-full flex-shrink-0 ${c.dot}`} />
                <span className={`font-medium ${key === value ? 'text-indigo-700' : 'text-gray-700'}`}>
                  {c.label}
                </span>
                {key === value && <Check className="w-3.5 h-3.5 ml-auto text-indigo-500" />}
              </button>
            ))}
          </div>,
          document.body
        )}
    </>
  )
}
