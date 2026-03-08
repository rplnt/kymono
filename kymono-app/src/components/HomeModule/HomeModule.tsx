import { Link } from 'react-router-dom'

interface HomeModuleProps {
  title: string
  slug?: string
  loading: boolean
  error: string | null
  empty: boolean
  emptyMessage?: string
  onReload: () => void
  children: React.ReactNode
}

export function HomeModule({
  title,
  slug,
  loading,
  error,
  empty,
  emptyMessage = 'No data available',
  onReload,
  children,
}: HomeModuleProps) {
  return (
    <div className="home-module">
      <div className="module-header">
        <span className="module-header-stub" />
        {slug ? (
          <Link to={`/module/${slug}`} className="module-title module-title-link">
            {title}
          </Link>
        ) : (
          <span className="module-title">{title}</span>
        )}
        <span className="module-header-line" />
        <button className="module-reload" onClick={onReload} title="Reload">
          ↻
        </button>
      </div>

      <div className="module-content">
        {loading && (
          <div className="module-loading">
            <div className="sp-circle" />
          </div>
        )}

        {!loading && error && (
          <p className="module-error">
            {error}{' '}
            <button className="module-retry" onClick={onReload}>
              Retry
            </button>
          </p>
        )}

        {!loading && !error && empty && <p className="module-empty">{emptyMessage}</p>}

        {children}
      </div>
    </div>
  )
}
