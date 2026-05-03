const STATUSES = [
  { key: 'total',       label: 'Total',       bg: 'bg-gray-50',   border: 'border-gray-200',  text: 'text-gray-700',   dot: 'bg-gray-400',   bar: '' },
  { key: 'completed',   label: 'Completed',   bg: 'bg-green-50',  border: 'border-green-200', text: 'text-green-700',  dot: 'bg-green-500',  bar: 'bg-green-500' },
  { key: 'in-progress', label: 'In Progress', bg: 'bg-blue-50',   border: 'border-blue-200',  text: 'text-blue-700',   dot: 'bg-blue-500',   bar: 'bg-blue-500' },
  { key: 'pending',     label: 'Pending',     bg: 'bg-gray-50',   border: 'border-gray-200',  text: 'text-gray-600',   dot: 'bg-gray-300',   bar: 'bg-gray-300' },
  { key: 'blocked',     label: 'Blocked',     bg: 'bg-red-50',    border: 'border-red-200',   text: 'text-red-700',    dot: 'bg-red-500',    bar: 'bg-red-500' },
  { key: 'cancelled',   label: 'Cancelled',   bg: 'bg-yellow-50', border: 'border-yellow-200',text: 'text-yellow-700', dot: 'bg-yellow-400', bar: 'bg-yellow-400' },
]

const STACK_ORDER = ['completed', 'in-progress', 'pending', 'blocked', 'cancelled']

export default function StatsCards({ stats }) {
  const total = stats.total || 0
  const completedPct = total > 0 ? Math.round(((stats.completed || 0) / total) * 100) : 0

  return (
    <div>
      {/* Stacked progress bar */}
      <div className="bg-white border border-gray-200 rounded-xl p-4 mb-4">
        <div className="flex justify-between items-center mb-3">
          <span className="text-sm font-semibold text-gray-700">Overall Progress</span>
          <span className="text-sm font-bold text-gray-900">{completedPct}% Complete</span>
        </div>

        <div className="h-5 bg-gray-100 rounded-full overflow-hidden flex mb-3">
          {STACK_ORDER.map((key) => {
            const count = stats[key] || 0
            const pct = total > 0 ? (count / total) * 100 : 0
            if (pct === 0) return null
            const s = STATUSES.find((s) => s.key === key)
            return (
              <div
                key={key}
                className={`h-full transition-all duration-700 ${s.bar}`}
                style={{ width: `${pct}%` }}
                title={`${s.label}: ${count} (${Math.round(pct)}%)`}
              />
            )
          })}
        </div>

        {/* Legend */}
        <div className="flex flex-wrap gap-3">
          {STACK_ORDER.map((key) => {
            const count = stats[key] || 0
            if (count === 0) return null
            const s = STATUSES.find((st) => st.key === key)
            const pct = total > 0 ? Math.round((count / total) * 100) : 0
            return (
              <div key={key} className="flex items-center gap-1.5 text-xs text-gray-600">
                <span className={`w-2.5 h-2.5 rounded-sm ${s.bar}`} />
                <span>{s.label}</span>
                <span className="text-gray-400">{count} ({pct}%)</span>
              </div>
            )
          })}
        </div>
      </div>

      {/* Stat cards */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
        {STATUSES.map(({ key, label, bg, border, text, dot }) => (
          <div key={key} className={`${bg} border ${border} rounded-xl p-4`}>
            <div className="flex items-center gap-1.5 mb-2">
              <span className={`w-2 h-2 rounded-full flex-shrink-0 ${dot}`} />
              <span className={`text-xs font-semibold ${text} uppercase tracking-wide truncate`}>
                {label}
              </span>
            </div>
            <span className={`text-3xl font-bold ${text}`}>{stats[key] ?? 0}</span>
          </div>
        ))}
      </div>
    </div>
  )
}
