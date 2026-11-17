import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App'
import './index.css'

document.title = 'Kloop'

if ('serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    // Clear any stale caches from earlier versions so icons & manifest always load fresh
    if ('caches' in window) {
      caches.keys().then((keys) => keys.forEach((k) => void caches.delete(k))).catch(() => undefined)
    }
    navigator.serviceWorker
      .register('/sw.js?v=4')
      .then((reg) => reg.update())
      .catch(() => undefined)
  })
}

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
)
