import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.jsx'
import { BRAND } from './brand.js'

// Le titre de l'onglet suit automatiquement src/brand.js
document.title = BRAND.name

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <App />
  </StrictMode>,
)
