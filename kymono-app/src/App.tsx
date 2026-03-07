import { Component } from 'react'
import type { ReactNode, ErrorInfo } from 'react'
import { HashRouter, Routes, Route, Navigate } from 'react-router-dom'
import { Layout } from '@/components/Layout'
import { Home, Bookmarks, Settings, K, Mail, Node } from '@/pages'
import { ConfigProvider, NodeProvider, useConfig } from '@/contexts'
import { config, CONFIG_PATHS } from '@/config'
import { hasConfig, initConfig } from '@/utils'

interface ErrorBoundaryState {
  hasError: boolean
}

class ErrorBoundary extends Component<{ children: ReactNode }, ErrorBoundaryState> {
  state: ErrorBoundaryState = { hasError: false }

  static getDerivedStateFromError(): ErrorBoundaryState {
    return { hasError: true }
  }

  componentDidCatch(error: Error, info: ErrorInfo) {
    console.error('Uncaught error:', error, info)
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="error-container">
          <p className="error-message">Something went wrong.</p>
          <button className="btn btn-retry" onClick={() => window.location.reload()}>
            Reload
          </button>
        </div>
      )
    }
    return this.props.children
  }
}

function IndexRedirect() {
  const { getValue } = useConfig()

  if (!hasConfig()) {
    initConfig(config.version)
    return <Navigate to="/settings" replace />
  }

  const defaultScreen = getValue<string>(CONFIG_PATHS.DEFAULT_SCREEN, 'H')
  const route =
    defaultScreen === 'B'
      ? '/bookmarks'
      : defaultScreen === 'K'
        ? '/k'
        : defaultScreen === 'M'
          ? '/mail'
          : '/home'

  return <Navigate to={route} replace />
}

function App() {
  return (
    <ErrorBoundary>
      <ConfigProvider>
        <HashRouter>
          <NodeProvider>
            <Routes>
              <Route path="/" element={<Layout />}>
                <Route index element={<IndexRedirect />} />
                <Route path="home" element={<Home />} />
                <Route path="bookmarks" element={<Bookmarks />} />
                <Route path="settings" element={<Settings />} />
                <Route path="k" element={<K />} />
                <Route path="mail" element={<Mail />} />
                <Route path="id/:nodeId" element={<Node />} />
                <Route path="*" element={<Navigate to="/home" replace />} />
              </Route>
            </Routes>
          </NodeProvider>
        </HashRouter>
      </ConfigProvider>
    </ErrorBoundary>
  )
}

export default App
