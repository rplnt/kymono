import { useState } from 'react'

interface HomeModuleProps {
  title: string
  loading: boolean
  error: string | null
  empty: boolean
  emptyMessage?: string
  onReload: () => void
  children: React.ReactNode
}

export function HomeModule({
  title,
  loading,
  error,
  empty,
  emptyMessage = 'No data available',
  onReload,
  children,
}: HomeModuleProps) {
  const [collapsed, setCollapsed] = useState(false)

  const handleReload = (e: React.MouseEvent) => {
    e.stopPropagation()
    onReload()
  }

  return (
    <div className="home-module">
      <div className="module-header" onClick={() => setCollapsed((prev) => !prev)}>
        <span className="module-title">{title}</span>
        <button className="module-reload" onClick={handleReload} title="Reload">
          ↻
        </button>
      </div>

      {!collapsed && (
        <div className="module-content">
          {loading && (
            <div className="module-loading">
              <div className="sp-circle" />
            </div>
          )}

          {!loading && error && (
            <p className="module-error">
              {error}{' '}
              <button className="module-retry" onClick={handleReload}>
                Retry
              </button>
            </p>
          )}

          {!loading && !error && empty && <p className="module-empty">{emptyMessage}</p>}

          {children}
        </div>
      )}
    </div>
  )
}
