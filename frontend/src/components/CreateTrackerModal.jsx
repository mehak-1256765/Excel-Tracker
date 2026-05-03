import { useState } from 'react'
import axios from 'axios'
import { Plus, Trash2, AlertCircle, GripVertical } from 'lucide-react'

const DEFAULT_COLUMNS = ['Name', 'Description', 'Due Date']

export default function CreateTrackerModal({ onSuccess, onClose }) {
  const [name, setName] = useState('')
  const [columns, setColumns] = useState(DEFAULT_COLUMNS)
  const [newCol, setNewCol] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)

  const addColumn = () => {
    const trimmed = newCol.trim()
    if (!trimmed) return
    if (columns.map((c) => c.toLowerCase()).includes(trimmed.toLowerCase())) {
      setError(`Column "${trimmed}" already exists`)
      return
    }
    setColumns((prev) => [...prev, trimmed])
    setNewCol('')
    setError(null)
  }

  const removeColumn = (i) => setColumns((prev) => prev.filter((_, idx) => idx !== i))

  const updateColumn = (i, val) =>
    setColumns((prev) => prev.map((c, idx) => (idx === i ? val : c)))

  const handleCreate = async () => {
    const trimmedName = name.trim()
    const validCols = columns.map((c) => c.trim()).filter(Boolean)

    if (!trimmedName) { setError('Tracker name is required'); return }
    if (validCols.length === 0) { setError('Add at least one column'); return }

    setLoading(true)
    setError(null)
    try {
      const res = await axios.post('/api/create', { name: trimmedName, columns: validCols })
      onSuccess(res.data)
    } catch (err) {
      setError(err.response?.data?.detail || 'Failed to create tracker')
      setLoading(false)
    }
  }

  return (
    <div className="flex flex-col max-h-[80vh]">
      {/* Name */}
      <div className="mb-5">
        <label className="text-sm font-medium text-gray-700 block mb-1.5">Tracker Name</label>
        <input
          autoFocus
          type="text"
          value={name}
          onChange={(e) => { setName(e.target.value); setError(null) }}
          onKeyDown={(e) => e.key === 'Enter' && handleCreate()}
          placeholder="e.g. Project Tasks, Client List, Weekly Goals…"
          className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-300"
        />
      </div>

      {/* Columns */}
      <div className="flex-1 overflow-y-auto mb-5">
        <div className="flex items-center justify-between mb-2">
          <label className="text-sm font-medium text-gray-700">
            Columns
            <span className="ml-1.5 text-xs text-gray-400 font-normal">({columns.length})</span>
          </label>
          <span className="text-xs text-gray-400">Click name to rename</span>
        </div>

        <div className="space-y-2 mb-3">
          {columns.map((col, i) => (
            <div key={i} className="flex items-center gap-2 group">
              <GripVertical className="w-4 h-4 text-gray-300 flex-shrink-0" />
              <input
                value={col}
                onChange={(e) => updateColumn(i, e.target.value)}
                className="flex-1 border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-300 bg-gray-50 focus:bg-white"
              />
              <button
                onClick={() => removeColumn(i)}
                className="p-1.5 text-gray-300 hover:text-red-500 hover:bg-red-50 rounded-lg transition opacity-0 group-hover:opacity-100 flex-shrink-0"
              >
                <Trash2 className="w-3.5 h-3.5" />
              </button>
            </div>
          ))}
        </div>

        {/* Add column input */}
        <div className="flex gap-2">
          <input
            type="text"
            value={newCol}
            onChange={(e) => { setNewCol(e.target.value); setError(null) }}
            onKeyDown={(e) => e.key === 'Enter' && addColumn()}
            placeholder="New column name…"
            className="flex-1 border border-dashed border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-300 placeholder-gray-300"
          />
          <button
            onClick={addColumn}
            disabled={!newCol.trim()}
            className="flex items-center gap-1 px-3 py-2 bg-gray-100 hover:bg-gray-200 text-gray-600 text-sm font-medium rounded-lg transition disabled:opacity-40 disabled:cursor-not-allowed"
          >
            <Plus className="w-3.5 h-3.5" />
            Add
          </button>
        </div>
      </div>

      {/* Error */}
      {error && (
        <div className="flex items-center gap-2 text-red-600 text-sm bg-red-50 border border-red-100 rounded-lg px-3 py-2.5 mb-4">
          <AlertCircle className="w-4 h-4 flex-shrink-0" />
          {error}
        </div>
      )}

      {/* Preview summary */}
      <div className="bg-gray-50 border border-gray-200 rounded-xl p-3 mb-4">
        <p className="text-xs text-gray-500 font-medium mb-1.5">Preview</p>
        <p className="text-sm text-gray-700">
          <span className="font-semibold">{name.trim() || 'Untitled'}</span>
          {' '}with {columns.filter(Boolean).length} column{columns.filter(Boolean).length !== 1 ? 's' : ''}:
          {' '}
          <span className="text-gray-500">
            {columns.filter(Boolean).slice(0, 4).join(', ')}
            {columns.filter(Boolean).length > 4 && ` +${columns.filter(Boolean).length - 4} more`}
          </span>
        </p>
        <p className="text-xs text-gray-400 mt-1">You can add rows after creating the tracker.</p>
      </div>

      {/* Actions */}
      <div className="flex gap-2">
        <button
          onClick={handleCreate}
          disabled={loading}
          className="flex-1 py-2.5 bg-indigo-600 text-white text-sm font-semibold rounded-xl hover:bg-indigo-700 active:bg-indigo-800 transition disabled:opacity-60"
        >
          {loading ? 'Creating…' : 'Create Tracker'}
        </button>
        <button
          onClick={onClose}
          className="px-4 py-2.5 text-sm text-gray-500 hover:bg-gray-100 rounded-xl transition"
        >
          Cancel
        </button>
      </div>
    </div>
  )
}
