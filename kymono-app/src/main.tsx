import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App'

// Prevent mobile zoom on input focus
const viewport = document.querySelector('meta[name="viewport"]')
if (viewport) {
  const content = viewport.getAttribute('content') || ''
  if (!content.includes('maximum-scale')) {
    viewport.setAttribute('content', content + ', maximum-scale=1.0')
  }
} else {
  const meta = document.createElement('meta')
  meta.name = 'viewport'
  meta.content = 'width=device-width, initial-scale=1.0, maximum-scale=1.0'
  document.head.appendChild(meta)
}

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>
)
