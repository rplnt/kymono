import { useEffect } from 'react'
import { HashRouter, Routes, Route, Navigate, useNavigate, useLocation } from 'react-router-dom'
import { Layout } from '@/components/Layout'
import { Home, Bookmarks, Settings, K, Friends } from '@/pages'
import { config, CONFIG_PATHS } from '@/config'
import { getConfigValue, hasConfig, initConfig } from '@/utils'

function getDefaultRoute(): string {
  const defaultScreen = getConfigValue<string>(CONFIG_PATHS.DEFAULT_SCREEN, 'H')
  switch (defaultScreen) {
    case 'H':
      return '/home'
    case 'B':
      return '/bookmarks'
    case 'K':
      return '/k'
    case 'F':
      return '/friends'
    default:
      return '/home'
  }
}

function FirstRunHandler() {
  const navigate = useNavigate()
  const location = useLocation()

  useEffect(() => {
    const isFirstRun = !hasConfig()

    if (isFirstRun) {
      // First run: initialize config and show settings
      initConfig(config.version)
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
          <Route path="k" element={<K />} />
          <Route path="friends" element={<Friends />} />
        </Route>
      </Routes>
    </HashRouter>
  )
}

export default App
