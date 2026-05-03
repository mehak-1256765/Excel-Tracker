import { BrowserRouter, Routes, Route } from 'react-router-dom'
import { ToastProvider } from './context/ToastContext'
import Navbar from './components/Navbar'
import Dashboard from './pages/Dashboard'
import TrackerDetail from './pages/TrackerDetail'

export default function App() {
  return (
    <BrowserRouter>
      <ToastProvider>
        <div className="min-h-screen bg-gray-50">
          <Navbar />
          <Routes>
            <Route path="/" element={<Dashboard />} />
            <Route path="/tracker/:id" element={<TrackerDetail />} />
          </Routes>
        </div>
      </ToastProvider>
    </BrowserRouter>
  )
}
