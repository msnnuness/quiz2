import React from 'react'
import { createRoot } from 'react-dom/client'
import App from './App'
import './styles/index.css'
import { initDataLayer, initGTM } from './lib/tracking'
import { getLeadData } from './lib/attribution'

// ordem importa: dataLayer -> atribuição -> GTM
initDataLayer()
getLeadData()
initGTM()

createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
)
