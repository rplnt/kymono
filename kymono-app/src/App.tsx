import { useEffect } from 'react'
import { HashRouter, Routes, Route, Navigate, useNavigate, useLocation } from 'react-router-dom'
import { Layout } from '@/components/Layout'
import { Home, Bookmarks, Settings, Mail, K } from '@/pages'
import { config, STORAGE_KEYS } from '@/config'

function getStoredValue<T>(key: string, defaultValue: T): T {
  const stored = localStorage.getItem(key)
  if (stored !== null) {
    try {
      return JSON.parse(stored) as T
    } catch {
      return defaultValue
    }
  }
  return defaultValue
}

function getDefaultRoute(): string {
  const defaultScreen = getStoredValue<string>(STORAGE_KEYS.DEFAULT_SCREEN, 'H')
  switch (defaultScreen) {
    case 'H': return '/home'
    case 'B': return '/bookmarks'
    case 'M': return '/mail'
    case 'K': return '/k'
    default: return '/home'
  }
}

function FirstRunHandler() {
  const navigate = useNavigate()
  const location = useLocation()

  useEffect(() => {
    const isFirstRun = !localStorage.getItem(STORAGE_KEYS.VERSION)

    if (isFirstRun) {
      // First run: show settings
      localStorage.setItem(STORAGE_KEYS.VERSION, config.version)
      navigate('/settings', { replace: true })
    } else if (location.pathname === '/') {
      // Not first run, at root: go to default screen
      navigate(getDefaultRoute(), { replace: true })
    }
  }, [navigate, location.pathname])

  return null
}

function App() {
  return (
    <HashRouter>
      <FirstRunHandler />
      <Routes>
        <Route path="/" element={<Layout />}>
          <Route index element={<Navigate to={getDefaultRoute()} replace />} />
          <Route path="home" element={<Home />} />
          <Route path="bookmarks" element={<Bookmarks />} />
          <Route path="settings" element={<Settings />} />
          <Route path="mail" element={<Mail />} />
          <Route path="k" element={<K />} />
        </Route>
      </Routes>
    </HashRouter>
  )
}

export default App
