import { useState, useMemo, useRef, useEffect } from 'react'
import { Search, ChevronUp, ChevronDown, ChevronsUpDown, X, Columns, CheckSquare, Plus, Trash2, Check, Palette, Save, AlertTriangle } from 'lucide-react'
import StatusBadge, { STATUS_OPTIONS, STATUS_CONFIG } from './StatusBadge'

// ── Status → row visual style ─────────────────────────────────────────────
const ROW_STATUS = {
  pending:       { bg: 'bg-white',         accent: 'bg-gray-300',   text: 'text-gray-700' },
  'in-progress': { bg: 'bg-blue-50/50',    accent: 'bg-blue-500',   text: 'text-gray-700' },
  completed:     { bg: 'bg-green-50/60',   accent: 'bg-green-500',  text: 'text-gray-600' },
  blocked:       { bg: 'bg-red-50/50',     accent: 'bg-red-500',    text: 'text-gray-700' },
  cancelled:     { bg: 'bg-gray-50',       accent: 'bg-gray-400',   text: 'text-gray-400' },
}

// ── Filter tabs — each status gets its own color ──────────────────────────
const FILTER_TABS = [
  { key: 'all',          label: 'All',         on: 'bg-indigo-600 text-white shadow-sm',  off: 'bg-gray-100 text-gray-600 hover:bg-gray-200',  dot: '' },
  { key: 'pending',      label: 'Pending',     on: 'bg-gray-600 text-white shadow-sm',    off: 'bg-gray-100 text-gray-600 hover:bg-gray-200',  dot: 'bg-gray-400' },
  { key: 'in-progress',  label: 'In Progress', on: 'bg-blue-600 text-white shadow-sm',    off: 'bg-blue-50 text-blue-700 hover:bg-blue-100',   dot: 'bg-blue-500' },
  { key: 'completed',    label: 'Completed',   on: 'bg-green-600 text-white shadow-sm',   off: 'bg-green-50 text-green-700 hover:bg-green-100',dot: 'bg-green-500' },
  { key: 'blocked',      label: 'Blocked',     on: 'bg-red-600 text-white shadow-sm',     off: 'bg-red-50 text-red-700 hover:bg-red-100',      dot: 'bg-red-500' },
  { key: 'cancelled',    label: 'Cancelled',   on: 'bg-amber-500 text-white shadow-sm',   off: 'bg-amber-50 text-amber-700 hover:bg-amber-100',dot: 'bg-amber-400' },
]

// ── Color swatches ────────────────────────────────────────────────────────
const COLOR_SWATCHES = [
  { label: 'None',   value: '' },
  { label: 'Red',    value: '#fee2e2' },
  { label: 'Orange', value: '#ffedd5' },
  { label: 'Yellow', value: '#fef9c3' },
  { label: 'Green',  value: '#dcfce7' },
  { label: 'Cyan',   value: '#cffafe' },
  { label: 'Blue',   value: '#dbeafe' },
  { label: 'Violet', value: '#ede9fe' },
  { label: 'Pink',   value: '#fce7f3' },
  { label: 'Gray',   value: '#f3f4f6' },
]

// ── Font helpers ──────────────────────────────────────────────────────────
function fontClasses(style) {
  if (style === 'bold') return 'font-bold'
  if (style === 'italic') return 'italic'
  if (style === 'bold-italic') return 'font-bold italic'
  return ''
}

function applyFontToggle(current, toggle) {
  const isBold = current === 'bold' || current === 'bold-italic'
  const isItalic = current === 'italic' || current === 'bold-italic'
  const newBold = toggle === 'bold' ? !isBold : isBold
  const newItalic = toggle === 'italic' ? !isItalic : isItalic
  if (newBold && newItalic) return 'bold-italic'
  if (newBold) return 'bold'
  if (newItalic) return 'italic'
  return 'normal'
}

function EditableNotes({ value, onSave }) {
  const [editing, setEditing] = useState(false)
  const [val, setVal] = useState(value || '')

  useEffect(() => { setVal(value || '') }, [value])

  const handleBlur = () => {
    setEditing(false)
    if (val !== (value || '')) onSave(val)
  }

  if (editing) {
    return (
      <textarea
        autoFocus
        value={val}
        onChange={(e) => setVal(e.target.value)}
        onBlur={handleBlur}
        onKeyDown={(e) => e.key === 'Escape' && setEditing(false)}
        rows={2}
        className="w-full min-w-[160px] text-sm border border-indigo-300 rounded-lg p-2 resize-none focus:outline-none focus:ring-2 focus:ring-indigo-300"
      />
    )
  }

  return (
    <div
      onClick={() => setEditing(true)}
      className="min-w-[140px] text-sm text-gray-600 cursor-pointer hover:bg-black/5 rounded-lg px-2 py-1.5 min-h-[32px] transition break-words"
    >
      {val || <span className="text-gray-300 italic text-xs">Add note…</span>}
    </div>
  )
}

function ColumnToggle({ columns, hidden, onToggle }) {
  const [open, setOpen] = useState(false)
  const ref = useRef()

  useEffect(() => {
    if (!open) return
    const close = (e) => { if (!ref.current?.contains(e.target)) setOpen(false) }
    document.addEventListener('mousedown', close)
    return () => document.removeEventListener('mousedown', close)
  }, [open])

  const hiddenCount = hidden.size
  return (
    <div ref={ref} className="relative">
      <button
        onClick={() => setOpen((o) => !o)}
        className={`flex items-center gap-1.5 px-3 py-2 text-sm border rounded-lg transition ${
          hiddenCount > 0
            ? 'bg-indigo-50 border-indigo-200 text-indigo-700'
            : 'bg-white border-gray-200 text-gray-600 hover:border-gray-300 hover:bg-gray-50'
        }`}
      >
        <Columns className="w-4 h-4" />
        Columns
        {hiddenCount > 0 && (
          <span className="text-xs bg-indigo-600 text-white rounded-full px-1.5 py-0.5">
            {columns.length - hiddenCount}/{columns.length}
          </span>
        )}
      </button>
      {open && (
        <div className="absolute right-0 top-full mt-1 bg-white border border-gray-200 rounded-xl shadow-xl z-20 p-2 w-52 animate-fade-up max-h-72 overflow-y-auto">
          <div className="flex items-center justify-between px-2 py-1 mb-1">
            <span className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Columns</span>
            {hiddenCount > 0 && (
              <button onClick={() => onToggle('__reset__')} className="text-xs text-indigo-600 hover:underline">
                Show all
              </button>
            )}
          </div>
          {columns.map((col) => (
            <label key={col} className="flex items-center gap-2.5 px-2 py-1.5 hover:bg-gray-50 rounded-lg cursor-pointer">
              <input
                type="checkbox"
                checked={!hidden.has(col)}
                onChange={() => onToggle(col)}
                className="rounded border-gray-300 text-indigo-600 focus:ring-indigo-500 w-3.5 h-3.5"
              />
              <span className="text-sm text-gray-700 truncate">{col}</span>
            </label>
          ))}
        </div>
      )}
    </div>
  )
}

function AddRowForm({ columns, onSave }) {
  const [open, setOpen] = useState(false)
  const [values, setValues] = useState({})
  const [status, setStatus] = useState('pending')
  const [saving, setSaving] = useState(false)

  const handleSave = async () => {
    setSaving(true)
    const rowData = {}
    columns.forEach((col) => { rowData[col] = values[col] || '' })
    await onSave({ data: rowData, status, notes: '' })
    setValues({})
    setStatus('pending')
    setSaving(false)
    setOpen(false)
  }

  if (!open) {
    return (
      <button
        onClick={() => setOpen(true)}
        className="mt-3 w-full flex items-center justify-center gap-2 py-2.5 border-2 border-dashed border-gray-200 rounded-xl text-sm text-gray-400 hover:border-indigo-400 hover:text-indigo-500 hover:bg-indigo-50/30 transition"
      >
        <Plus className="w-4 h-4" />
        Add row
      </button>
    )
  }

  return (
    <div className="mt-3 border border-indigo-200 rounded-xl p-4 bg-indigo-50/20 animate-fade-up">
      <p className="text-sm font-semibold text-gray-700 mb-3">New Row</p>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 mb-4">
        {columns.map((col) => (
          <div key={col}>
            <label className="text-xs font-medium text-gray-500 block mb-1">{col}</label>
            <input
              value={values[col] || ''}
              onChange={(e) => setValues((prev) => ({ ...prev, [col]: e.target.value }))}
              onKeyDown={(e) => e.key === 'Enter' && handleSave()}
              placeholder={`Enter ${col.toLowerCase()}…`}
              className="w-full text-sm border border-gray-200 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-indigo-300 bg-white"
            />
          </div>
        ))}
        <div>
          <label className="text-xs font-medium text-gray-500 block mb-1">Status</label>
          <select
            value={status}
            onChange={(e) => setStatus(e.target.value)}
            className="w-full text-sm border border-gray-200 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-indigo-300 bg-white"
          >
            {STATUS_OPTIONS.map((s) => (
              <option key={s} value={s}>{STATUS_CONFIG[s].label}</option>
            ))}
          </select>
        </div>
      </div>
      <div className="flex gap-2">
        <button
          onClick={handleSave}
          disabled={saving}
          className="flex items-center gap-1.5 px-4 py-2 bg-indigo-600 text-white text-sm font-medium rounded-lg hover:bg-indigo-700 transition disabled:opacity-60"
        >
          <Check className="w-3.5 h-3.5" />
          {saving ? 'Saving…' : 'Add Row'}
        </button>
        <button
          onClick={() => { setOpen(false); setValues({}) }}
          className="px-4 py-2 text-sm text-gray-500 hover:bg-gray-100 rounded-lg transition"
        >
          Cancel
        </button>
      </div>
    </div>
  )
}

export default function DataTable({ columns, rows, onRowUpdate, onBulkUpdate, onRowAdd, onRowDelete, onColumnsUpdate }) {
  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState('all')
  const [sortCol, setSortCol] = useState(null)
  const [sortDir, setSortDir] = useState('asc')
  const [hiddenCols, setHiddenCols] = useState(new Set())
  const [selected, setSelected] = useState(new Set())
  const [bulkStatus, setBulkStatus] = useState('completed')

  // Column management state
  const [pendingCols, setPendingCols] = useState(null)
  const [addingCol, setAddingCol] = useState(false)
  const [newColName, setNewColName] = useState('')
  const [colNameError, setColNameError] = useState('')

  // Per-row color picker state
  const [colorPickerRowId, setColorPickerRowId] = useState(null)

  // Close color picker on outside click
  useEffect(() => {
    const handler = (e) => {
      if (!e.target.closest('[data-color-picker]')) {
        setColorPickerRowId(null)
      }
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [])

  // Working columns: use pending if available, else the prop
  const workingCols = pendingCols ?? columns
  const visibleCols = workingCols.filter((c) => !hiddenCols.has(c))
  const hasPendingColChanges = pendingCols !== null

  const handleSort = (col) => {
    if (sortCol === col) setSortDir((d) => (d === 'asc' ? 'desc' : 'asc'))
    else { setSortCol(col); setSortDir('asc') }
  }

  const toggleCol = (col) => {
    if (col === '__reset__') { setHiddenCols(new Set()); return }
    setHiddenCols((prev) => {
      const next = new Set(prev)
      next.has(col) ? next.delete(col) : next.add(col)
      return next
    })
  }

  // ── Column management handlers ──────────────────────────────────────────
  const handleAddCol = () => {
    const name = newColName.trim()
    if (!name) return
    if (workingCols.map((c) => c.toLowerCase()).includes(name.toLowerCase())) {
      setColNameError(`"${name}" already exists`)
      return
    }
    setPendingCols([...workingCols, name])
    setNewColName('')
    setAddingCol(false)
    setColNameError('')
  }

  const handleRemoveCol = (col) => {
    if (workingCols.length <= 1) return
    setPendingCols(workingCols.filter((c) => c !== col))
    setHiddenCols((prev) => { const n = new Set(prev); n.delete(col); return n })
  }

  const saveColChanges = async () => {
    if (!pendingCols) return
    await onColumnsUpdate(pendingCols)
    setPendingCols(null)
  }

  const discardColChanges = () => {
    setPendingCols(null)
    setColNameError('')
  }

  // ── Row formatting handlers ─────────────────────────────────────────────
  const handleRowColor = (rowId, color) => {
    onRowUpdate(rowId, { color })
    setColorPickerRowId(null)
  }

  const handleRowFont = (rowId, currentStyle, toggle) => {
    onRowUpdate(rowId, { font_style: applyFontToggle(currentStyle || 'normal', toggle) })
  }

  // ── Filtered / sorted rows ──────────────────────────────────────────────
  const filtered = useMemo(() => {
    return rows
      .filter((row) => {
        if (statusFilter !== 'all' && row.status !== statusFilter) return false
        if (search) {
          const q = search.toLowerCase()
          return (
            columns.some((col) => String(row.data[col] || '').toLowerCase().includes(q)) ||
            (row.notes || '').toLowerCase().includes(q)
          )
        }
        return true
      })
      .sort((a, b) => {
        if (!sortCol) return 0
        const av = String(a.data[sortCol] || '')
        const bv = String(b.data[sortCol] || '')
        return sortDir === 'asc' ? av.localeCompare(bv) : bv.localeCompare(av)
      })
  }, [rows, search, statusFilter, sortCol, sortDir, columns])

  const tabCounts = useMemo(
    () => FILTER_TABS.map((tab) => ({
      ...tab,
      count: tab.key === 'all' ? rows.length : rows.filter((r) => r.status === tab.key).length,
    })),
    [rows]
  )

  const allVisibleSelected = filtered.length > 0 && filtered.every((r) => selected.has(r.id))

  const toggleSelectAll = () => {
    if (allVisibleSelected) {
      setSelected((prev) => { const n = new Set(prev); filtered.forEach((r) => n.delete(r.id)); return n })
    } else {
      setSelected((prev) => { const n = new Set(prev); filtered.forEach((r) => n.add(r.id)); return n })
    }
  }

  const toggleRow = (id) => {
    setSelected((prev) => { const n = new Set(prev); n.has(id) ? n.delete(id) : n.add(id); return n })
  }

  const handleBulkApply = () => {
    onBulkUpdate([...selected], { status: bulkStatus })
    setSelected(new Set())
  }

  const handleBulkColor = (color) => {
    onBulkUpdate([...selected], { color })
  }

  const handleBulkFont = (toggle) => {
    const selectedRows = rows.filter((r) => selected.has(r.id))
    const allHave = selectedRows.every((r) => {
      const s = r.font_style || 'normal'
      return toggle === 'bold' ? (s === 'bold' || s === 'bold-italic') : (s === 'italic' || s === 'bold-italic')
    })
    for (const row of selectedRows) {
      const s = row.font_style || 'normal'
      const isBold = s === 'bold' || s === 'bold-italic'
      const isItalic = s === 'italic' || s === 'bold-italic'
      const newBold = toggle === 'bold' ? !allHave : isBold
      const newItalic = toggle === 'italic' ? !allHave : isItalic
      const newStyle = newBold && newItalic ? 'bold-italic' : newBold ? 'bold' : newItalic ? 'italic' : 'normal'
      onRowUpdate(row.id, { font_style: newStyle })
    }
  }

  const handleDelete = (id) => {
    if (window.confirm('Delete this row?')) {
      onRowDelete(id)
      setSelected((prev) => { const n = new Set(prev); n.delete(id); return n })
    }
  }

  // Action column is always present (4 fixed cols + action col)
  const extraCols = 4 + 1

  return (
    <div>
      {/* Toolbar */}
      <div className="flex flex-wrap items-center gap-2 mb-3">
        <div className="relative flex-1 min-w-[180px] max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
          <input
            type="text"
            placeholder="Search all columns…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-9 pr-8 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-300 bg-gray-50"
          />
          {search && (
            <button onClick={() => setSearch('')} className="absolute right-2.5 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 transition">
              <X className="w-3.5 h-3.5" />
            </button>
          )}
        </div>
        <span className="text-sm text-gray-400 whitespace-nowrap">{filtered.length} of {rows.length}</span>
        <div className="ml-auto flex items-center gap-2">
          <ColumnToggle columns={workingCols} hidden={hiddenCols} onToggle={toggleCol} />
          <span className="text-gray-300 hidden sm:block">|</span>
          {addingCol ? (
            <div className="flex items-center gap-1.5">
              <input
                autoFocus
                value={newColName}
                onChange={(e) => { setNewColName(e.target.value); setColNameError('') }}
                onKeyDown={(e) => { if (e.key === 'Enter') handleAddCol(); if (e.key === 'Escape') { setAddingCol(false); setNewColName(''); setColNameError('') } }}
                placeholder="Column name…"
                className="text-sm border border-indigo-300 rounded-lg px-2 py-1.5 focus:outline-none focus:ring-2 focus:ring-indigo-300 w-36"
              />
              <button
                onClick={handleAddCol}
                className="flex items-center gap-1 px-2.5 py-1.5 bg-indigo-600 text-white text-sm font-medium rounded-lg hover:bg-indigo-700 transition"
              >
                <Plus className="w-3.5 h-3.5" />
                Add
              </button>
              <button
                onClick={() => { setAddingCol(false); setNewColName(''); setColNameError('') }}
                className="p-1.5 text-gray-400 hover:text-gray-600 transition"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            </div>
          ) : (
            <button
              onClick={() => setAddingCol(true)}
              className="flex items-center gap-1.5 px-3 py-2 text-sm border border-gray-200 rounded-lg bg-white text-gray-600 hover:border-gray-300 hover:bg-gray-50 transition"
            >
              <Plus className="w-4 h-4" />
              Add Column
            </button>
          )}
        </div>
      </div>

      {/* Column name error */}
      {colNameError && (
        <p className="text-red-500 text-xs mb-2">{colNameError}</p>
      )}

      {/* Pending column changes banner */}
      {hasPendingColChanges && (
        <div className="bg-amber-50 border border-amber-200 rounded-xl px-4 py-2.5 flex items-center gap-3 mb-3 animate-fade-up">
          <AlertTriangle className="w-4 h-4 text-amber-500 flex-shrink-0" />
          <span className="text-sm text-amber-800 flex-1">You have unsaved column changes</span>
          <button
            onClick={saveColChanges}
            className="flex items-center gap-1.5 bg-amber-500 text-white px-3 py-1 rounded-lg text-sm font-medium hover:bg-amber-600 transition"
          >
            <Save className="w-3.5 h-3.5" />
            Save Changes
          </button>
          <button
            onClick={discardColChanges}
            className="text-gray-500 hover:text-gray-700 text-sm transition"
          >
            Discard
          </button>
        </div>
      )}

      {/* Filter tabs — each status has its own color */}
      <div className="flex gap-1.5 mb-4 overflow-x-auto pb-1">
        {tabCounts.map((tab) => (
          <button
            key={tab.key}
            onClick={() => { setStatusFilter(tab.key); setSelected(new Set()) }}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-medium whitespace-nowrap transition-all ${
              statusFilter === tab.key ? tab.on : tab.off
            }`}
          >
            {tab.dot && (
              <span className={`w-1.5 h-1.5 rounded-full flex-shrink-0 ${
                statusFilter === tab.key ? 'bg-white/70' : tab.dot
              }`} />
            )}
            {tab.label}
            <span className={`text-xs px-1.5 py-0.5 rounded-full font-semibold ${
              statusFilter === tab.key
                ? 'bg-white/20 text-white'
                : 'bg-white/80 text-gray-600 border border-gray-200'
            }`}>
              {tab.count}
            </span>
          </button>
        ))}
      </div>

      {/* Bulk action bar */}
      {selected.size > 0 && (
        <div className="flex items-center gap-3 mb-3 bg-indigo-50 border border-indigo-200 rounded-xl px-4 py-2.5 animate-fade-up flex-wrap">
          <CheckSquare className="w-4 h-4 text-indigo-600 flex-shrink-0" />
          <span className="text-sm font-semibold text-indigo-700">{selected.size} row{selected.size !== 1 ? 's' : ''} selected</span>
          <span className="text-gray-300 hidden sm:block">|</span>
          <span className="text-sm text-gray-600">Set status to</span>
          <select
            value={bulkStatus}
            onChange={(e) => setBulkStatus(e.target.value)}
            className="text-sm border border-indigo-200 rounded-lg px-2 py-1 bg-white focus:outline-none focus:ring-2 focus:ring-indigo-300"
          >
            {STATUS_OPTIONS.map((s) => (
              <option key={s} value={s}>{STATUS_CONFIG[s].label}</option>
            ))}
          </select>
          <button onClick={handleBulkApply} className="px-3 py-1 bg-indigo-600 text-white text-sm font-medium rounded-lg hover:bg-indigo-700 transition">
            Apply
          </button>

          <span className="text-gray-300 hidden sm:block">|</span>
          <span className="text-sm text-gray-600">Color:</span>
          <div className="flex items-center gap-1 flex-wrap">
            {COLOR_SWATCHES.map((s) => (
              <button
                key={s.value}
                onClick={() => handleBulkColor(s.value)}
                className="w-5 h-5 rounded-full border border-gray-200 hover:scale-125 transition cursor-pointer flex-shrink-0 flex items-center justify-center"
                style={{ backgroundColor: s.value || '#fff' }}
                title={s.label}
              >
                {!s.value && <span className="text-gray-400 text-xs leading-none">∅</span>}
              </button>
            ))}
          </div>

          <span className="text-gray-300 hidden sm:block">|</span>
          <button
            onClick={() => handleBulkFont('bold')}
            className="px-2 py-1 text-sm font-bold border border-gray-200 rounded hover:bg-gray-100 transition"
            title="Toggle bold"
          >
            B
          </button>
          <button
            onClick={() => handleBulkFont('italic')}
            className="px-2 py-1 text-sm italic border border-gray-200 rounded hover:bg-gray-100 transition"
            title="Toggle italic"
          >
            I
          </button>

          <button onClick={() => setSelected(new Set())} className="ml-auto text-gray-400 hover:text-gray-600 transition">
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* Table */}
      <div className="border border-gray-200 rounded-xl overflow-hidden shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">

            {/* ── Colored header ─────────────────────────────────────── */}
            <thead>
              <tr className="bg-gradient-to-r from-indigo-700 to-indigo-500">
                {/* checkbox */}
                <th className="px-3 py-3 w-10">
                  <input
                    type="checkbox"
                    checked={allVisibleSelected}
                    onChange={toggleSelectAll}
                    className="rounded border-indigo-300 bg-indigo-600 text-white focus:ring-white w-3.5 h-3.5 cursor-pointer"
                  />
                </th>
                {/* row number */}
                <th className="px-3 py-3 text-left text-xs font-semibold text-indigo-200 uppercase tracking-wide w-10">#</th>
                {/* data columns */}
                {visibleCols.map((col) => (
                  <th
                    key={col}
                    onClick={() => handleSort(col)}
                    className="px-4 py-3 text-left text-xs font-bold text-white uppercase tracking-wider cursor-pointer hover:bg-white/10 transition whitespace-nowrap select-none min-w-[120px] relative group/col"
                  >
                    <div className="flex items-center gap-1.5">
                      {col}
                      {sortCol === col ? (
                        sortDir === 'asc'
                          ? <ChevronUp className="w-3 h-3 text-indigo-200" />
                          : <ChevronDown className="w-3 h-3 text-indigo-200" />
                      ) : (
                        <ChevronsUpDown className="w-3 h-3 text-indigo-300 opacity-60" />
                      )}
                      {workingCols.length > 1 && (
                        <button
                          onClick={(e) => { e.stopPropagation(); handleRemoveCol(col) }}
                          className="opacity-0 group-hover/col:opacity-100 ml-1 w-3.5 h-3.5 rounded-full bg-white/20 hover:bg-red-500 flex items-center justify-center transition text-white text-xs leading-none flex-shrink-0"
                          title={`Remove "${col}" column`}
                        >
                          ×
                        </button>
                      )}
                    </div>
                  </th>
                ))}
                <th className="px-4 py-3 text-left text-xs font-bold text-white uppercase tracking-wider whitespace-nowrap">Status</th>
                <th className="px-4 py-3 text-left text-xs font-bold text-white uppercase tracking-wider min-w-[160px]">Notes</th>
                {/* Actions column — always present */}
                <th className="w-24" />
              </tr>
            </thead>

            {/* ── Rows with status-based colors ──────────────────────── */}
            <tbody className="divide-y divide-gray-100">
              {filtered.length === 0 ? (
                <tr>
                  <td colSpan={visibleCols.length + extraCols} className="px-4 py-16 text-center text-gray-400 text-sm">
                    No rows match your filters.
                  </td>
                </tr>
              ) : (
                filtered.map((row) => {
                  const isSelected = selected.has(row.id)
                  const st = ROW_STATUS[row.status] || ROW_STATUS.pending
                  const rowBgClass = row.color ? '' : (isSelected ? 'bg-indigo-50 ring-1 ring-inset ring-indigo-200' : st.bg)
                  const isBold = ['bold', 'bold-italic'].includes(row.font_style || 'normal')
                  const isItalic = ['italic', 'bold-italic'].includes(row.font_style || 'normal')
                  return (
                    <tr
                      key={row.id}
                      className={`transition-colors duration-300 group/row ${rowBgClass} hover:brightness-[0.97]`}
                      style={row.color ? { backgroundColor: row.color } : undefined}
                    >
                      {/* Checkbox cell — holds the left accent bar */}
                      <td className="px-3 py-3 align-top relative">
                        <div
                          className={`absolute left-0 top-0 bottom-0 w-1 transition-colors duration-300 ${
                            isSelected ? 'bg-indigo-500' : st.accent
                          }`}
                        />
                        <input
                          type="checkbox"
                          checked={isSelected}
                          onChange={() => toggleRow(row.id)}
                          className="rounded border-gray-300 text-indigo-600 focus:ring-indigo-500 w-3.5 h-3.5 mt-0.5 cursor-pointer"
                        />
                      </td>

                      {/* Row number */}
                      <td className={`px-3 py-3 text-xs font-mono align-top pt-3.5 ${
                        row.status === 'cancelled' ? 'text-gray-300' : 'text-gray-400'
                      }`}>
                        {(row.row_index ?? 0) + 1}
                      </td>

                      {/* Data cells */}
                      {visibleCols.map((col) => (
                        <td
                          key={col}
                          className={`px-4 py-3 align-top break-words min-w-[120px] max-w-[320px] ${st.text} ${
                            row.status === 'cancelled' ? 'line-through decoration-gray-300' : ''
                          } ${fontClasses(row.font_style)}`}
                        >
                          {row.data[col] || <span className="text-gray-300 no-underline">—</span>}
                        </td>
                      ))}

                      {/* Status badge */}
                      <td className="px-4 py-3 align-top">
                        <StatusBadge
                          value={row.status || 'pending'}
                          onChange={(status) => onRowUpdate(row.id, { status })}
                        />
                      </td>

                      {/* Notes */}
                      <td className="px-4 py-3 align-top">
                        <EditableNotes
                          value={row.notes}
                          onSave={(notes) => onRowUpdate(row.id, { notes })}
                        />
                      </td>

                      {/* Per-row actions: color picker, bold, italic, delete */}
                      <td className="px-2 py-3 align-top relative">
                        <div className="opacity-0 group-hover/row:opacity-100 transition flex items-center gap-1">
                          {/* Color picker toggle button */}
                          <button
                            data-color-picker="true"
                            onClick={() => setColorPickerRowId((prev) => prev === row.id ? null : row.id)}
                            className="w-5 h-5 rounded-full border-2 border-gray-300 hover:border-gray-500 transition cursor-pointer flex-shrink-0"
                            style={{ backgroundColor: row.color || '#fff' }}
                            title="Row color"
                          />

                          {/* Bold button */}
                          <button
                            onClick={() => handleRowFont(row.id, row.font_style, 'bold')}
                            className={`px-1.5 py-0.5 text-xs font-bold rounded transition ${
                              isBold ? 'bg-gray-200 text-gray-900' : 'text-gray-300 hover:text-gray-700 hover:bg-gray-100'
                            }`}
                            title="Toggle bold"
                          >
                            B
                          </button>

                          {/* Italic button */}
                          <button
                            onClick={() => handleRowFont(row.id, row.font_style, 'italic')}
                            className={`px-1.5 py-0.5 text-xs italic rounded transition ${
                              isItalic ? 'bg-gray-200 text-gray-900' : 'text-gray-300 hover:text-gray-700 hover:bg-gray-100'
                            }`}
                            title="Toggle italic"
                          >
                            I
                          </button>

                          {/* Delete button */}
                          {onRowDelete && (
                            <button
                              onClick={() => handleDelete(row.id)}
                              className="p-1.5 text-gray-200 hover:text-red-500 hover:bg-red-50 rounded-lg transition"
                              title="Delete row"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          )}
                        </div>

                        {/* Color picker popover */}
                        {colorPickerRowId === row.id && (
                          <div
                            data-color-picker="true"
                            className="absolute right-8 top-8 z-30 bg-white border border-gray-200 rounded-xl shadow-xl p-2 flex flex-wrap gap-1 w-[132px] animate-fade-up"
                          >
                            {COLOR_SWATCHES.map((s) => (
                              <button
                                key={s.value}
                                data-color-picker="true"
                                onClick={() => handleRowColor(row.id, s.value)}
                                className="w-8 h-8 rounded-lg border-2 hover:scale-110 transition"
                                style={{
                                  backgroundColor: s.value || '#fff',
                                  borderColor: s.value === (row.color || '') ? '#6366f1' : '#e5e7eb',
                                }}
                                title={s.label}
                              />
                            ))}
                          </div>
                        )}
                      </td>
                    </tr>
                  )
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Add row form */}
      {onRowAdd && <AddRowForm columns={workingCols} onSave={onRowAdd} />}
    </div>
  )
}
