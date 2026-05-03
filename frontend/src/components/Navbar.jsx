import { Link, useLocation } from 'react-router-dom'
import { BarChart2, Home, ChevronRight } from 'lucide-react'

function today() {
  return new Date().toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' })
}

export default function Navbar({ trackerName }) {
  const location = useLocation()
  const isDetail = location.pathname.startsWith('/tracker/')

  return (
    <nav className="sticky top-0 z-40 bg-white border-b border-gray-200">
      <div className="max-w-screen-xl mx-auto px-4 h-14 flex items-center justify-between gap-4">

        {/* Left — logo + breadcrumb */}
        <div className="flex items-center gap-2 min-w-0">
          <Link to="/" className="flex items-center gap-2.5 flex-shrink-0 group">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-indigo-500 to-violet-600 flex items-center justify-center shadow-sm shadow-indigo-200">
              <BarChart2 className="w-4 h-4 text-white" />
            </div>
            <div className="hidden sm:block">
              <p className="text-[15px] font-bold text-gray-900 leading-tight group-hover:text-indigo-700 transition-colors">
                Excel Tracker
              </p>
              <p className="text-[10px] text-indigo-400 leading-none tracking-widest uppercase font-semibold">
                Progress Monitor
              </p>
            </div>
            <span className="sm:hidden text-[15px] font-bold text-gray-900">Excel Tracker</span>
          </Link>

          {isDetail && trackerName && (
            <div className="flex items-center gap-1.5 min-w-0">
              <ChevronRight className="w-3.5 h-3.5 text-gray-300 flex-shrink-0" />
              <Link
                to="/"
                className="text-xs text-gray-400 hover:text-indigo-600 transition-colors flex-shrink-0 flex items-center gap-1"
              >
                <Home className="w-3 h-3" />
                <span className="hidden sm:inline">Home</span>
              </Link>
              <ChevronRight className="w-3.5 h-3.5 text-gray-300 flex-shrink-0" />
              <span className="text-xs font-semibold text-gray-700 truncate max-w-[140px] sm:max-w-xs">
                {trackerName}
              </span>
            </div>
          )}
        </div>

        {/* Right — date pill */}
        <div className="flex-shrink-0">
          <div className="hidden sm:flex items-center gap-1.5 bg-indigo-50 border border-indigo-100 rounded-full px-3 py-1">
            <div className="w-1.5 h-1.5 rounded-full bg-indigo-500 animate-pulse" />
            <span className="text-xs font-semibold text-indigo-600">{today()}</span>
          </div>
        </div>

      </div>
    </nav>
  )
}
