import React from 'react'
import { createRoot } from 'react-dom/client'
import App from './App'
import './styles/index.css'
import { initDataLayer, initGTM, initMetaPixel } from './lib/tracking'
import { getLeadData } from './lib/attribution'
import { clearState } from './lib/persistence'

/**
 * Atalho de teste: abrir a página com ?reset=1 limpa o progresso salvo
 * e começa o quiz do zero. Útil porque, sem isso, quem já completou
 * uma vez cai direto no resultado e parece que o quiz sumiu.
 */
if (typeof window !== 'undefined' && new URLSearchParams(window.location.search).has('reset')) {
  clearState()
}

// ordem importa: dataLayer -> atribuição -> GTM
initDataLayer()
getLeadData()
initGTM()
initMetaPixel()

createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
)
