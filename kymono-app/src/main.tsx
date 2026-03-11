import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App'

// Remove host page stylesheets so they don't clash with KyMoNo styles
document.querySelectorAll('link[rel="stylesheet"]').forEach((el) => el.remove())

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

// PWA meta tags for iOS/Android home screen pinning
const pwaMeta: Record<string, string> = {
  'mobile-web-app-capable': 'yes',
  'apple-mobile-web-app-capable': 'yes',
  'apple-mobile-web-app-status-bar-style': 'black',
  'apple-mobile-web-app-title': 'KyMoNo',
  'application-name': 'KyMoNo',
  'theme-color': '#111111',
}
for (const [name, content] of Object.entries(pwaMeta)) {
  if (!document.querySelector(`meta[name="${name}"]`)) {
    const meta = document.createElement('meta')
    meta.name = name
    meta.content = content
    document.head.appendChild(meta)
  }
}

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>
)
