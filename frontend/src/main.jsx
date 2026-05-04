import React from 'react'
import ReactDOM from 'react-dom/client'
import axios from 'axios'
import App from './App'
import './index.css'

// In production the frontend calls the Render backend directly;
// in dev the Vite proxy handles /api → localhost:8000
if (import.meta.env.PROD) {
  axios.defaults.baseURL = 'https://excel-tracker-1.onrender.com'
}

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
)
