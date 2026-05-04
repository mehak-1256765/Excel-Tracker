import { useState, useEffect, useRef } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import axios from 'axios'
import { ArrowLeft, RefreshCw, Download, Pencil, Check, X } from 'lucide-react'
import { useToast } from '../context/ToastContext'
import { relativeTime } from '../utils/time'
import StatsCards from '../components/StatsCards'
import DataTable from '../components/DataTable'
import FocusTimer from '../components/FocusTimer'


function InlineRename({ name, trackerId, onRenamed }) {
  const [editing, setEditing] = useState(false)
  const [val, setVal] = useState(name)
  const inputRef = useRef()
  const toast = useToast()

  useEffect(() => setVal(name), [name])

  const startEdit = () => {
    setVal(name)
    setEditing(true)
    setTimeout(() => inputRef.current?.select(), 0)
  }

  const cancel = () => {
    setVal(name)
    setEditing(false)
  }

  const save = async () => {
    const trimmed = val.trim()
    if (!trimmed || trimmed === name) { cancel(); return }
    try {
      await axios.patch(`/api/tracker/${trackerId}`, { name: trimmed })
      onRenamed(trimmed)
      toast('Tracker renamed')
    } catch {
      toast('Rename failed', 'error')
    }
    setEditing(false)
  }

  if (editing) {
    return (
      <div className="flex items-center gap-2">
        <input
          ref={inputRef}
          value={val}
          onChange={(e) => setVal(e.target.value)}
          onKeyDown={(e) => { if (e.key === 'Enter') save(); if (e.key === 'Escape') cancel() }}
          className="text-2xl font-bold text-gray-900 bg-transparent border-b-2 border-indigo-500 outline-none min-w-0 flex-1"
          autoFocus
        />
        <button onClick={save} className="p-1.5 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition">
          <Check className="w-4 h-4" />
        </button>
        <button onClick={cancel} className="p-1.5 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition">
          <X className="w-4 h-4" />
        </button>
      </div>
    )
  }

  return (
    <div className="flex items-center gap-2 group/rename">
      <h1 className="text-2xl font-bold text-gray-900 truncate">{name}</h1>
      <button
        onClick={startEdit}
        className="p-1.5 text-gray-300 hover:text-gray-500 hover:bg-gray-100 rounded-lg transition opacity-0 group-hover/rename:opacity-100"
        title="Rename"
      >
        <Pencil className="w-3.5 h-3.5" />
      </button>
    </div>
  )
}

export default function TrackerDetail() {
  const { id } = useParams()
  const navigate = useNavigate()
  const toast = useToast()
  const [tracker, setTracker] = useState(null)
  const [loading, setLoading] = useState(true)

  const fetchTracker = async () => {
    try {
      const res = await axios.get(`/api/tracker/${id}`)
      setTracker(res.data)
    } catch {
      toast('Failed to load tracker', 'error')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { fetchTracker() }, [id])

  const handleRowUpdate = async (rowId, updates) => {
    try {
      const res = await axios.patch(`/api/row/${rowId}`, updates)
      setTracker((prev) => ({
        ...prev,
        rows: prev.rows.map((r) => (r.id === rowId ? { ...r, ...res.data } : r)),
      }))
      if (updates.status) toast(`Status → ${updates.status}`)
    } catch {
      toast('Update failed', 'error')
    }
  }

  const handleBulkUpdate = async (rowIds, updates) => {
    try {
      await axios.post('/api/bulk-update', { row_ids: rowIds, ...updates })
      setTracker((prev) => ({
        ...prev,
        rows: prev.rows.map((r) => rowIds.includes(r.id) ? { ...r, ...updates } : r),
      }))
      const label = updates.status ? `${rowIds.length} rows → ${updates.status}` : `${rowIds.length} rows updated`
      toast(label)
    } catch {
      toast('Bulk update failed', 'error')
    }
  }

  const handleColumnsUpdate = async (newCols) => {
    try {
      await axios.patch(`/api/tracker/${id}/columns`, { columns: newCols })
      setTracker(prev => ({ ...prev, columns: newCols }))
      toast('Columns saved')
    } catch {
      toast('Failed to save columns', 'error')
    }
  }

  const handleRowAdd = async (payload) => {
    try {
      const res = await axios.post(`/api/tracker/${id}/row`, payload)
      setTracker((prev) => ({ ...prev, rows: [...prev.rows, res.data] }))
      toast('Row added')
    } catch {
      toast('Failed to add row', 'error')
    }
  }

  const handleRowDelete = async (rowId) => {
    try {
      await axios.delete(`/api/row/${rowId}`)
      setTracker((prev) => ({
        ...prev,
        rows: prev.rows.filter((r) => r.id !== rowId),
      }))
      toast('Row deleted')
    } catch {
      toast('Failed to delete row', 'error')
    }
  }

  const exportCSV = () => {
    if (!tracker) return
    const headers = ['#', ...tracker.columns, 'Status', 'Notes']
    const dataRows = tracker.rows.map((row) => [
      (row.row_index ?? 0) + 1,
      ...tracker.columns.map((col) => `"${String(row.data[col] || '').replace(/"/g, '""')}"`),
      row.status,
      `"${(row.notes || '').replace(/"/g, '""')}"`,
    ])
    const csv = [headers.join(','), ...dataRows.map((r) => r.join(','))].join('\n')
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `${tracker.name}.csv`
    a.click()
    URL.revokeObjectURL(url)
    toast('CSV exported')
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-[60vh]">
        <div className="animate-spin w-8 h-8 border-4 border-indigo-600 border-t-transparent rounded-full" />
      </div>
    )
  }

  if (!tracker) {
    return (
      <div className="max-w-2xl mx-auto px-4 py-16 text-center">
        <p className="text-gray-500 mb-4">Tracker not found.</p>
        <button onClick={() => navigate('/')} className="text-indigo-600 hover:underline text-sm">
          Back to dashboard
        </button>
      </div>
    )
  }

  const stats = {
    total: tracker.rows.length,
    completed: tracker.rows.filter((r) => r.status === 'completed').length,
    'in-progress': tracker.rows.filter((r) => r.status === 'in-progress').length,
    pending: tracker.rows.filter((r) => r.status === 'pending').length,
    blocked: tracker.rows.filter((r) => r.status === 'blocked').length,
    cancelled: tracker.rows.filter((r) => r.status === 'cancelled').length,
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-screen-xl mx-auto px-4 py-6">
        {/* Header */}
        <div className="flex items-start gap-3 mb-6">
          <button
            onClick={() => navigate('/')}
            className="p-2 mt-0.5 hover:bg-white border border-transparent hover:border-gray-200 rounded-lg transition text-gray-400 hover:text-gray-600 flex-shrink-0"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
          <div className="flex-1 min-w-0">
            <InlineRename
              name={tracker.name}
              trackerId={tracker.id}
              onRenamed={(newName) => setTracker((prev) => ({ ...prev, name: newName }))}
            />
            <p className="text-sm text-gray-400 mt-0.5">
              {stats.total} rows · updated {relativeTime(tracker.updated_at)}
            </p>
          </div>
          <div className="flex items-center gap-2 flex-shrink-0">
            <FocusTimer />
            <button
              onClick={exportCSV}
              className="flex items-center gap-1.5 px-3 py-2 text-sm text-gray-600 bg-white border border-gray-200 rounded-lg hover:border-gray-300 hover:bg-gray-50 transition font-medium"
            >
              <Download className="w-4 h-4" />
              <span className="hidden sm:inline">Export CSV</span>
            </button>
            <button
              onClick={fetchTracker}
              className="p-2 text-gray-400 hover:text-gray-600 bg-white border border-gray-200 rounded-lg hover:border-gray-300 transition"
              title="Refresh"
            >
              <RefreshCw className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Stats */}
        <div className="mb-5">
          <StatsCards stats={stats} />
        </div>

        {/* Table */}
        <div className="bg-white rounded-xl border border-gray-200 p-4">
          <DataTable
            columns={tracker.columns}
            rows={tracker.rows}
            trackerName={tracker.name}
            onRowUpdate={handleRowUpdate}
            onBulkUpdate={handleBulkUpdate}
            onRowAdd={handleRowAdd}
            onRowDelete={handleRowDelete}
            onColumnsUpdate={handleColumnsUpdate}
          />
        </div>
      </div>
    </div>
  )
}
