import { useState, useEffect, useMemo } from 'react'
import { useNavigate } from 'react-router-dom'
import axios from 'axios'
import { useToast } from '../context/ToastContext'
import UploadZone from '../components/UploadZone'
import TrackerCard from '../components/TrackerCard'
import CreateTrackerModal from '../components/CreateTrackerModal'
import {
  Plus, RefreshCw, Upload, PenLine, FileSpreadsheet,
  CheckCircle, BarChart2, ArrowRight, Zap, Target, TrendingUp,
} from 'lucide-react'

// ── Skeleton card ─────────────────────────────────────────────────────────
function SkeletonCard() {
  return (
    <div className="bg-white rounded-xl border border-gray-200 p-5 animate-pulse">
      <div className="flex items-center gap-3 mb-4">
        <div className="w-10 h-10 bg-gray-200 rounded-lg flex-shrink-0" />
        <div className="flex-1">
          <div className="h-4 bg-gray-200 rounded w-3/4 mb-2" />
          <div className="h-3 bg-gray-100 rounded w-1/2" />
        </div>
      </div>
      <div className="h-2 bg-gray-100 rounded-full mb-4" />
      <div className="flex gap-2 mb-4">
        <div className="h-5 bg-gray-100 rounded-full w-20" />
        <div className="h-5 bg-gray-100 rounded-full w-24" />
      </div>
      <div className="h-4 bg-gray-100 rounded w-28 ml-auto" />
    </div>
  )
}

// ── New tracker modal ─────────────────────────────────────────────────────
function NewTrackerModal({ onSuccess, onClose }) {
  const [tab, setTab] = useState('upload')
  return (
    <div
      className="fixed inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center z-50 p-4 animate-fade-in"
      onClick={(e) => e.target === e.currentTarget && onClose()}
    >
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg animate-fade-up">
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
          <h2 className="font-semibold text-gray-900">New Tracker</h2>
          <button onClick={onClose} className="w-8 h-8 flex items-center justify-center rounded-lg text-gray-400 hover:text-gray-600 hover:bg-gray-100 transition text-xl leading-none">×</button>
        </div>
        <div className="flex gap-1 px-6 pt-4">
          {[
            { key: 'upload', label: 'Upload Excel / CSV', icon: Upload },
            { key: 'create', label: 'Create Manually',    icon: PenLine },
          ].map(({ key, label, icon: Icon }) => (
            <button
              key={key}
              onClick={() => setTab(key)}
              className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition ${
                tab === key ? 'bg-indigo-50 text-indigo-700 border border-indigo-200' : 'text-gray-500 hover:text-gray-700 hover:bg-gray-50'
              }`}
            >
              <Icon className="w-4 h-4" />
              {label}
            </button>
          ))}
        </div>
        <div className="p-6">
          {tab === 'upload'
            ? <UploadZone onSuccess={onSuccess} />
            : <CreateTrackerModal onSuccess={onSuccess} onClose={onClose} />
          }
        </div>
      </div>
    </div>
  )
}

// ── Feature card ──────────────────────────────────────────────────────────
function FeatureCard({ icon: Icon, iconBg, iconColor, title, desc }) {
  return (
    <div className="bg-white rounded-xl border border-gray-200 p-5 hover:shadow-md hover:-translate-y-0.5 transition-all">
      <div className={`w-10 h-10 ${iconBg} rounded-xl flex items-center justify-center mb-3`}>
        <Icon className={`w-5 h-5 ${iconColor}`} />
      </div>
      <h3 className="font-semibold text-gray-800 mb-1 text-sm">{title}</h3>
      <p className="text-xs text-gray-500 leading-relaxed">{desc}</p>
    </div>
  )
}

// ── How it works step ─────────────────────────────────────────────────────
function Step({ num, title, desc, last }) {
  return (
    <div className="flex items-start gap-4 flex-1">
      <div className="flex-shrink-0 flex flex-col items-center">
        <div className="w-9 h-9 rounded-full bg-indigo-600 text-white flex items-center justify-center text-sm font-bold shadow-md shadow-indigo-200">
          {num}
        </div>
        {!last && <div className="w-0.5 h-8 bg-indigo-200 mt-2 hidden sm:block" />}
      </div>
      <div className="pb-6">
        <p className="font-semibold text-gray-800 text-sm mb-1">{title}</p>
        <p className="text-xs text-gray-500 leading-relaxed">{desc}</p>
      </div>
    </div>
  )
}

// ── Main component ────────────────────────────────────────────────────────
export default function Dashboard() {
  const [trackers, setTrackers] = useState([])
  const [loading, setLoading] = useState(true)
  const [showModal, setShowModal] = useState(false)
  const navigate = useNavigate()
  const toast = useToast()

  const fetchTrackers = async () => {
    setLoading(true)
    try {
      const res = await axios.get('/api/trackers')
      setTrackers(res.data)
    } catch {
      toast('Failed to load trackers', 'error')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { fetchTrackers() }, [])

  const handleSuccess = (tracker) => {
    setShowModal(false)
    const isEmpty = !tracker.rows || tracker.rows.length === 0
    toast(isEmpty ? `"${tracker.name}" created — add your first rows` : `"${tracker.name}" imported — ${tracker.rows.length} rows`)
    navigate(`/tracker/${tracker.id}`)
  }

  const handleDelete = async (id, name) => {
    try {
      await axios.delete(`/api/tracker/${id}`)
      setTrackers((prev) => prev.filter((t) => t.id !== id))
      toast(`"${name}" deleted`)
    } catch {
      toast('Delete failed', 'error')
    }
  }

  // Aggregate stats across all trackers
  const globalStats = useMemo(() => {
    const totalItems = trackers.reduce((s, t) => s + (t.stats?.total || 0), 0)
    const totalDone  = trackers.reduce((s, t) => s + (t.stats?.completed || 0), 0)
    const pct = totalItems > 0 ? Math.round((totalDone / totalItems) * 100) : 0
    return { totalItems, totalDone, pct }
  }, [trackers])

  const hasTrackers = !loading && trackers.length > 0

  return (
    <div className="max-w-6xl mx-auto px-4 py-8">

      {/* ── HERO BANNER ──────────────────────────────────────────────── */}
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-indigo-600 via-indigo-500 to-violet-600 p-8 mb-8 text-white shadow-lg shadow-indigo-200">
        {/* Background decoration circles */}
        <div className="absolute -top-10 -right-10 w-48 h-48 bg-white/10 rounded-full" />
        <div className="absolute -bottom-8 -right-4 w-32 h-32 bg-white/5 rounded-full" />
        <div className="absolute top-4 right-32 w-16 h-16 bg-white/5 rounded-full" />

        <div className="relative flex flex-col sm:flex-row sm:items-center sm:justify-between gap-6">
          <div className="max-w-xl">
            <div className="flex items-center gap-2 mb-3">
              <div className="flex items-center gap-1.5 bg-white/20 rounded-full px-3 py-1 text-xs font-medium">
                <Zap className="w-3 h-3" />
                Daily Progress Tracker
              </div>
            </div>
            <h1 className="text-3xl sm:text-4xl font-bold leading-tight mb-3">
              Track everything.<br />Miss nothing.
            </h1>
            <p className="text-indigo-100 text-sm leading-relaxed max-w-md">
              Upload your Excel sheet or build a tracker from scratch. Update statuses, add notes, and watch your progress in real time — every single day.
            </p>

            {hasTrackers && (
              <div className="flex items-center gap-5 mt-5 flex-wrap">
                <div>
                  <p className="text-2xl font-bold">{trackers.length}</p>
                  <p className="text-indigo-200 text-xs">Tracker{trackers.length !== 1 ? 's' : ''}</p>
                </div>
                <div className="w-px h-8 bg-white/20" />
                <div>
                  <p className="text-2xl font-bold">{globalStats.totalItems}</p>
                  <p className="text-indigo-200 text-xs">Total Items</p>
                </div>
                <div className="w-px h-8 bg-white/20" />
                <div>
                  <p className="text-2xl font-bold">{globalStats.pct}%</p>
                  <p className="text-indigo-200 text-xs">Avg Completion</p>
                </div>
              </div>
            )}
          </div>

          <div className="flex flex-col gap-3 flex-shrink-0">
            <button
              onClick={() => setShowModal(true)}
              className="flex items-center justify-center gap-2 px-6 py-3 bg-white text-indigo-700 font-semibold rounded-xl hover:bg-indigo-50 active:bg-indigo-100 transition shadow-md text-sm whitespace-nowrap"
            >
              <Plus className="w-4 h-4" />
              New Tracker
            </button>
            {hasTrackers && (
              <button
                onClick={fetchTrackers}
                className="flex items-center justify-center gap-2 px-6 py-3 bg-white/15 text-white font-medium rounded-xl hover:bg-white/25 transition text-sm"
              >
                <RefreshCw className="w-4 h-4" />
                Refresh
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Modal */}
      {showModal && <NewTrackerModal onSuccess={handleSuccess} onClose={() => setShowModal(false)} />}

      {/* ── TRACKER GRID (when trackers exist) ───────────────────────── */}
      {loading ? (
        <>
          <div className="flex items-center justify-between mb-4">
            <div className="h-5 w-32 bg-gray-200 rounded animate-pulse" />
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {[1, 2, 3].map((i) => <SkeletonCard key={i} />)}
          </div>
        </>
      ) : hasTrackers ? (
        <>
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-base font-semibold text-gray-700">
              My Trackers
              <span className="ml-2 text-sm font-normal text-gray-400">{trackers.length} total</span>
            </h2>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {trackers.map((tracker) => (
              <TrackerCard
                key={tracker.id}
                tracker={tracker}
                onClick={() => navigate(`/tracker/${tracker.id}`)}
                onDelete={() => handleDelete(tracker.id, tracker.name)}
              />
            ))}
            <button
              onClick={() => setShowModal(true)}
              className="border-2 border-dashed border-gray-200 rounded-xl p-6 flex flex-col items-center justify-center gap-2.5 text-gray-400 hover:border-indigo-400 hover:text-indigo-500 hover:bg-indigo-50/50 transition cursor-pointer min-h-[200px]"
            >
              <div className="w-10 h-10 rounded-xl border-2 border-dashed border-current flex items-center justify-center">
                <Plus className="w-5 h-5" />
              </div>
              <span className="text-sm font-medium">New Tracker</span>
            </button>
          </div>
        </>
      ) : (
        /* ── EMPTY STATE ──────────────────────────────────────────────── */
        <div>
          {/* Feature highlights */}
          <div className="mb-8">
            <h2 className="text-base font-semibold text-gray-700 mb-4">Everything you need to stay on track</h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
              <FeatureCard
                icon={FileSpreadsheet}
                iconBg="bg-indigo-50"
                iconColor="text-indigo-600"
                title="Import Any Excel"
                desc="Drop in any .xlsx or .csv file. Columns are detected automatically — no setup needed."
              />
              <FeatureCard
                icon={PenLine}
                iconBg="bg-violet-50"
                iconColor="text-violet-600"
                title="Build from Scratch"
                desc="No Excel? No problem. Define your own columns and start adding rows directly in the browser."
              />
              <FeatureCard
                icon={Target}
                iconBg="bg-emerald-50"
                iconColor="text-emerald-600"
                title="Color-coded Status"
                desc="Every row gets a status — pending, in progress, completed, blocked, cancelled — with matching colors."
              />
              <FeatureCard
                icon={TrendingUp}
                iconBg="bg-orange-50"
                iconColor="text-orange-600"
                title="Progress at a Glance"
                desc="Stacked progress bars and live stats show exactly how far along each tracker is — always up to date."
              />
            </div>
          </div>

          {/* How it works */}
          <div className="bg-white rounded-2xl border border-gray-200 p-6 mb-8">
            <h2 className="text-base font-semibold text-gray-700 mb-6">How it works</h2>
            <div className="flex flex-col sm:flex-row gap-0 sm:gap-4">
              <Step
                num="1"
                title="Create your tracker"
                desc="Upload an existing Excel / CSV file, or define column names manually to start from a blank tracker."
              />
              <div className="hidden sm:flex items-start pt-3 text-indigo-300">
                <ArrowRight className="w-5 h-5 mt-1" />
              </div>
              <Step
                num="2"
                title="Update statuses daily"
                desc="Change any row's status with one click. Add notes, filter by status, and bulk-update multiple rows at once."
              />
              <div className="hidden sm:flex items-start pt-3 text-indigo-300">
                <ArrowRight className="w-5 h-5 mt-1" />
              </div>
              <Step
                num="3"
                title="Monitor your progress"
                desc="See live progress bars, completion percentages, and status breakdowns — so you always know where things stand."
                last
              />
            </div>
          </div>

          {/* CTA section */}
          <div className="text-center py-6">
            <p className="text-gray-400 text-sm mb-5">Ready to get started? Create your first tracker now.</p>
            <div className="flex items-center justify-center gap-3 flex-wrap">
              <button
                onClick={() => setShowModal(true)}
                className="inline-flex items-center gap-2 px-6 py-3 bg-indigo-600 text-white rounded-xl hover:bg-indigo-700 transition text-sm font-semibold shadow-sm shadow-indigo-200"
              >
                <Upload className="w-4 h-4" />
                Upload Excel
              </button>
              <button
                onClick={() => setShowModal(true)}
                className="inline-flex items-center gap-2 px-6 py-3 bg-white border border-gray-200 text-gray-700 rounded-xl hover:border-indigo-300 hover:text-indigo-600 transition text-sm font-medium"
              >
                <PenLine className="w-4 h-4" />
                Create Manually
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
