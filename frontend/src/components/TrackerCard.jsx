import { FileSpreadsheet, Trash2, ChevronRight } from 'lucide-react'
import { relativeTime } from '../utils/time'

const STATUS_SEGMENTS = [
  { key: 'completed',   color: 'bg-green-500' },
  { key: 'in-progress', color: 'bg-blue-500' },
  { key: 'blocked',     color: 'bg-red-500' },
  { key: 'cancelled',   color: 'bg-yellow-400' },
  { key: 'pending',     color: 'bg-gray-200' },
]

const STATUS_DOT = {
  completed:    'bg-green-500',
  'in-progress':'bg-blue-500',
  pending:      'bg-gray-300',
  blocked:      'bg-red-500',
  cancelled:    'bg-yellow-400',
}

export default function TrackerCard({ tracker, onClick, onDelete }) {
  const { stats } = tracker
  const total = stats?.total || 0
  const completedPct = total > 0 ? Math.round(((stats.completed || 0) / total) * 100) : 0

  const handleDelete = (e) => {
    e.stopPropagation()
    if (window.confirm(`Delete "${tracker.name}"? This cannot be undone.`)) onDelete()
  }

  return (
    <div
      onClick={onClick}
      className="bg-white rounded-xl border border-gray-200 p-5 cursor-pointer hover:border-indigo-300 hover:shadow-md transition-all group"
    >
      {/* Title row */}
      <div className="flex items-start justify-between mb-4">
        <div className="flex items-center gap-3 min-w-0">
          <div className="w-10 h-10 bg-indigo-50 rounded-lg flex items-center justify-center flex-shrink-0">
            <FileSpreadsheet className="w-5 h-5 text-indigo-600" />
          </div>
          <div className="min-w-0">
            <h3 className="font-semibold text-gray-900 truncate">{tracker.name}</h3>
            <div className="text-xs text-gray-400 mt-0.5">
              {total} rows · {relativeTime(tracker.updated_at)}
            </div>
          </div>
        </div>
        <button
          onClick={handleDelete}
          className="p-1.5 text-gray-300 hover:text-red-500 hover:bg-red-50 rounded-lg transition opacity-0 group-hover:opacity-100 flex-shrink-0 ml-2"
        >
          <Trash2 className="w-4 h-4" />
        </button>
      </div>

      {/* Stacked mini progress bar */}
      <div className="mb-3">
        <div className="flex justify-between text-xs mb-1.5">
          <span className="text-gray-400">{total} items</span>
          <span className="font-semibold text-gray-700">{completedPct}% done</span>
        </div>
        <div className="h-2 bg-gray-100 rounded-full overflow-hidden flex">
          {STATUS_SEGMENTS.map(({ key, color }) => {
            const count = stats?.[key] || 0
            const pct = total > 0 ? (count / total) * 100 : 0
            if (pct === 0) return null
            return (
              <div
                key={key}
                className={`h-full ${color} transition-all duration-500`}
                style={{ width: `${pct}%` }}
                title={`${key}: ${count}`}
              />
            )
          })}
        </div>
      </div>

      {/* Status pills */}
      <div className="flex items-center gap-1.5 flex-wrap mb-4">
        {Object.entries(STATUS_DOT).map(([status, dot]) => {
          const count = stats?.[status] || 0
          if (count === 0) return null
          return (
            <span
              key={status}
              className="flex items-center gap-1 text-xs text-gray-600 bg-gray-50 border border-gray-100 px-2 py-1 rounded-full"
            >
              <span className={`w-1.5 h-1.5 rounded-full ${dot}`} />
              {count} {status}
            </span>
          )
        })}
      </div>

      <div className="flex items-center justify-end text-indigo-500 text-sm font-medium">
        View tracker <ChevronRight className="w-4 h-4 ml-1" />
      </div>
    </div>
  )
}
