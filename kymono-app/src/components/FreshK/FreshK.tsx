import { useState, useEffect, useCallback, useMemo } from 'react'
import { useNavigate } from 'react-router-dom'
import type { KItem } from '@/types'
import { useConfigValue } from '@/contexts'
import { CONFIG_PATHS } from '@/config'
import { fetchLastKData, stripHtml } from '@/utils'
import { HomeModule } from '@/components/HomeModule'

const MAX_DISPLAY = 5

export function FreshK({ forceRefresh }: { forceRefresh?: boolean }) {
  const navigate = useNavigate()
  const [items, setItems] = useState<KItem[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [enabled] = useConfigValue(CONFIG_PATHS.FRESH_K_ENABLED)

  const loadData = useCallback(async (force = false) => {
    setLoading(true)
    setError(null)
    try {
      const data = await fetchLastKData('1h', force)
      setItems(data)
    } catch (err) {
      console.error('Failed to load fresh K:', err)
      setError('Failed to load fresh K')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    if (enabled) {
      loadData(forceRefresh)
    }
  }, [loadData, enabled, forceRefresh])

  const handleLink = (e: React.MouseEvent, path: string) => {
    e.preventDefault()
    navigate(path)
  }

  const visible = useMemo(() => items.slice(0, MAX_DISPLAY), [items])

  if (!enabled) return null

  return (
    <HomeModule
      title="fresh.k"
      slug="fresh-k"
      loading={loading}
      error={error}
      empty={items.length === 0}
      emptyMessage="No recent karma"
      onReload={() => loadData(true)}
    >
      {visible.map((item) => {
        const plainContent = stripHtml(item.content)
        return (
          <div key={item.id} className="fs-entry">
            <div className="fs-meta">
              <img
                src={item.creatorImageUrl}
                alt=""
                className="fs-avatar"
                onClick={(e) => {
                  e.preventDefault()
                  navigate(`/id/${item.creatorId}`)
                }}
              />
              <a
                href={`#/id/${item.creatorId}`}
                className="fs-author"
                onClick={(e) => handleLink(e, `/id/${item.creatorId}`)}
              >
                {item.owner}
              </a>
              {item.karma > 0 && <span className="fs-karma">{item.karma}K</span>}
            </div>
            <div className="fs-title-line">
              <a
                href={`#/id/${item.id}`}
                className="fs-title"
                onClick={(e) => handleLink(e, `/id/${item.id}`)}
              >
                {item.name || `node ${item.id}`}
              </a>
              <span className="fs-in">
                {' in '}
                <a
                  href={`#/id/${item.parentId}`}
                  className="fs-parent"
                  onClick={(e) => handleLink(e, `/id/${item.parentId}`)}
                >
                  {item.parentName}
                </a>
              </span>
            </div>
            <div className="fs-content">
              {plainContent ? (
                <>
                  {plainContent.endsWith('...') ? plainContent.slice(0, -3) : plainContent}
                  {plainContent.endsWith('...') && <span className="fs-truncated">[...]</span>}
                </>
              ) : (
                <span className="fs-content-empty">...</span>
              )}
            </div>
          </div>
        )
      })}
    </HomeModule>
  )
}
