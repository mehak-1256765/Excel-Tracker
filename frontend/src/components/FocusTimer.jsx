import { useState, useEffect, useRef } from 'react'
import { Timer, Play, Pause, RotateCcw, X, Coffee } from 'lucide-react'

const MODES = {
  work:       { label: '🎯 Focus',      mins: 25, color: '#6366f1' },
  shortBreak: { label: '☕ Short Break', mins: 5,  color: '#10b981' },
  longBreak:  { label: '🌿 Long Break', mins: 15, color: '#0ea5e9' },
}

export default function FocusTimer() {
  const [open, setOpen]       = useState(false)
  const [mode, setMode]       = useState('work')
  const [seconds, setSeconds] = useState(MODES.work.mins * 60)
  const [running, setRunning] = useState(false)
  const [sessions, setSessions] = useState(0)
  const intervalRef = useRef(null)
  const panelRef    = useRef(null)

  const totalSecs = MODES[mode].mins * 60

  // Countdown
  useEffect(() => {
    if (running) {
      intervalRef.current = setInterval(() => {
        setSeconds(s => {
          if (s <= 1) {
            clearInterval(intervalRef.current)
            setRunning(false)
            if (mode === 'work') setSessions(n => n + 1)
            return 0
          }
          return s - 1
        })
      }, 1000)
    } else {
      clearInterval(intervalRef.current)
    }
    return () => clearInterval(intervalRef.current)
  }, [running, mode])

  // Close on outside click
  useEffect(() => {
    if (!open) return
    const handler = (e) => { if (!panelRef.current?.contains(e.target)) setOpen(false) }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [open])

  const switchMode = (m) => {
    clearInterval(intervalRef.current)
    setRunning(false)
    setMode(m)
    setSeconds(MODES[m].mins * 60)
  }

  const reset = () => {
    clearInterval(intervalRef.current)
    setRunning(false)
    setSeconds(MODES[mode].mins * 60)
  }

  const mins = String(Math.floor(seconds / 60)).padStart(2, '0')
  const secs = String(seconds % 60).padStart(2, '0')
  const progress = ((totalSecs - seconds) / totalSecs) * 100
  const circumference = 2 * Math.PI * 42
  const currentColor = MODES[mode].color

  return (
    <div className="relative" ref={panelRef}>
      {/* Trigger button */}
      <button
        onClick={() => setOpen(o => !o)}
        className={`flex items-center gap-1.5 px-3 py-2 text-sm border rounded-lg transition font-medium ${
          running
            ? 'bg-indigo-600 text-white border-indigo-600 shadow-sm shadow-indigo-200 animate-pulse'
            : 'bg-white border-gray-200 text-gray-600 hover:border-indigo-300 hover:text-indigo-600'
        }`}
        title="Focus Timer"
      >
        <Timer className="w-4 h-4" />
        <span className="tabular-nums">{mins}:{secs}</span>
      </button>

      {/* Panel */}
      {open && (
        <div className="absolute right-0 top-full mt-2 w-72 bg-white rounded-2xl border border-gray-200 shadow-2xl z-50 overflow-hidden animate-fade-up">

          {/* Mode tabs */}
          <div className="flex border-b border-gray-100">
            {Object.entries(MODES).map(([key, m]) => (
              <button
                key={key}
                onClick={() => switchMode(key)}
                className={`flex-1 py-2.5 text-xs font-medium transition ${
                  mode === key
                    ? 'text-indigo-600 border-b-2 border-indigo-500 bg-indigo-50/50'
                    : 'text-gray-500 hover:text-gray-700 hover:bg-gray-50'
                }`}
              >
                {key === 'work' ? 'Focus' : key === 'shortBreak' ? 'Short' : 'Long'}
              </button>
            ))}
            <button
              onClick={() => setOpen(false)}
              className="px-3 text-gray-400 hover:text-gray-600 transition"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          </div>

          <div className="p-5">
            <p className="text-center text-sm font-semibold text-gray-700 mb-4">{MODES[mode].label}</p>

            {/* Circular progress ring */}
            <div className="flex items-center justify-center mb-5 relative">
              <svg className="w-36 h-36 -rotate-90" viewBox="0 0 100 100">
                <circle cx="50" cy="50" r="42" fill="none" stroke="#f3f4f6" strokeWidth="7" />
                <circle
                  cx="50" cy="50" r="42"
                  fill="none"
                  stroke={currentColor}
                  strokeWidth="7"
                  strokeLinecap="round"
                  strokeDasharray={circumference}
                  strokeDashoffset={circumference * (1 - progress / 100)}
                  className="transition-all duration-1000"
                />
              </svg>
              <div className="absolute text-center">
                <p className="text-4xl font-bold text-gray-900 tabular-nums tracking-tight">{mins}:{secs}</p>
                <p className="text-xs text-gray-400 mt-0.5">{Math.round(progress)}% done</p>
              </div>
            </div>

            {/* Controls */}
            <div className="flex gap-2 mb-4">
              <button
                onClick={reset}
                className="p-2.5 border border-gray-200 rounded-xl text-gray-500 hover:bg-gray-50 hover:text-gray-700 transition"
                title="Reset"
              >
                <RotateCcw className="w-4 h-4" />
              </button>
              <button
                onClick={() => setRunning(r => !r)}
                className="flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl font-semibold text-sm transition shadow-sm"
                style={{
                  backgroundColor: running ? '#f3f4f6' : currentColor,
                  color: running ? '#374151' : '#fff',
                }}
              >
                {running ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4" />}
                {running ? 'Pause' : 'Start'}
              </button>
            </div>

            {/* Session dots */}
            <div className="flex flex-col items-center gap-1">
              <div className="flex gap-1.5">
                {[1, 2, 3, 4].map(i => (
                  <div
                    key={i}
                    className="w-2.5 h-2.5 rounded-full transition-all"
                    style={{ backgroundColor: sessions >= i ? currentColor : '#e5e7eb' }}
                  />
                ))}
              </div>
              <p className="text-xs text-gray-400">
                {sessions} session{sessions !== 1 ? 's' : ''} · {sessions >= 4 ? 'Take a long break!' : `${4 - (sessions % 4)} until long break`}
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
