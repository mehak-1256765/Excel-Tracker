import { useState, useRef } from 'react'
import axios from 'axios'
import { Upload, FileSpreadsheet, AlertCircle } from 'lucide-react'

export default function UploadZone({ onSuccess }) {
  const [dragging, setDragging] = useState(false)
  const [uploading, setUploading] = useState(false)
  const [error, setError] = useState(null)
  const inputRef = useRef()

  const handleFile = async (file) => {
    if (!file) return
    const ext = file.name.split('.').pop().toLowerCase()
    if (!['xlsx', 'xls', 'csv'].includes(ext)) {
      setError('Only .xlsx, .xls, and .csv files are supported.')
      return
    }
    setUploading(true)
    setError(null)
    const formData = new FormData()
    formData.append('file', file)
    try {
      const res = await axios.post('/api/upload', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      })
      onSuccess(res.data)
    } catch (err) {
      setError(err.response?.data?.detail || 'Upload failed. Please try again.')
    } finally {
      setUploading(false)
    }
  }

  const handleDrop = (e) => {
    e.preventDefault()
    setDragging(false)
    handleFile(e.dataTransfer.files[0])
  }

  return (
    <div>
      <div
        onDragOver={(e) => { e.preventDefault(); setDragging(true) }}
        onDragLeave={() => setDragging(false)}
        onDrop={handleDrop}
        onClick={() => !uploading && inputRef.current.click()}
        className={`border-2 border-dashed rounded-xl p-10 text-center cursor-pointer transition select-none ${
          dragging
            ? 'border-indigo-500 bg-indigo-50'
            : 'border-gray-300 hover:border-indigo-400 hover:bg-gray-50'
        } ${uploading ? 'pointer-events-none opacity-60' : ''}`}
      >
        <input
          ref={inputRef}
          type="file"
          accept=".xlsx,.xls,.csv"
          className="hidden"
          onChange={(e) => handleFile(e.target.files[0])}
        />
        {uploading ? (
          <div className="flex flex-col items-center gap-3">
            <div className="animate-spin w-10 h-10 border-4 border-indigo-500 border-t-transparent rounded-full" />
            <p className="text-gray-600 font-medium">Parsing your file...</p>
            <p className="text-sm text-gray-400">This may take a moment</p>
          </div>
        ) : (
          <div className="flex flex-col items-center gap-3">
            <div className="w-14 h-14 bg-indigo-50 rounded-2xl flex items-center justify-center">
              <Upload className="w-7 h-7 text-indigo-500" />
            </div>
            <div>
              <p className="font-semibold text-gray-700">Drop your file here</p>
              <p className="text-sm text-gray-400 mt-1">or click to browse</p>
            </div>
            <div className="flex gap-3 text-xs text-gray-400 mt-1">
              {['.xlsx', '.xls', '.csv'].map((ext) => (
                <span key={ext} className="flex items-center gap-1 bg-gray-100 px-2 py-1 rounded-md">
                  <FileSpreadsheet className="w-3 h-3" />
                  {ext}
                </span>
              ))}
            </div>
          </div>
        )}
      </div>

      {error && (
        <div className="mt-3 flex items-start gap-2 text-red-600 text-sm bg-red-50 border border-red-100 p-3 rounded-lg">
          <AlertCircle className="w-4 h-4 flex-shrink-0 mt-0.5" />
          {error}
        </div>
      )}
    </div>
  )
}
