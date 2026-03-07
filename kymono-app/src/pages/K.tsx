import { useState, useEffect, useCallback, memo } from 'react'
import { useNavigate } from 'react-router-dom'
import type { KItem } from '@/types'
import { useConfigValue } from '@/contexts'
import { fetchKData } from '@/utils'
import { useTitle } from '@/utils/useTitle'
import { CONFIG_PATHS } from '@/config'

function formatDate(date: Date): string {
  return date.toLocaleDateString('sk-SK', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  })
}

function formatRelativeDate(date: Date): string {
  const now = Date.now()
  const diff = now - date.getTime()
  const minutes = Math.floor(diff / 60000)
  const hours = Math.floor(diff / 3600000)
  const days = Math.floor(diff / 86400000)
  const weeks = Math.floor(days / 7)
  const months = Math.floor(days / 30)
  const years = Math.floor(days / 365)

  if (minutes < 1) return 'now'
  if (minutes < 60) return `${minutes}m`
  if (hours < 24) return `${hours}h`
  if (days < 7) return `${days}d`
  if (weeks < 5) return `${weeks}w`
  if (months < 12) return `${months}mo`
  return `${years}y`
}

interface KItemCardProps {
  item: KItem
  prevItemId?: string
  nextItemId?: string
  collapsed: boolean
  useRelativeTime: boolean
  showToolbar: boolean
  onToggleCollapsed: (id: string) => void
  onNavigate: (path: string) => void
  onContentClick: (e: React.MouseEvent) => void
}

const KItemCard = memo(function KItemCard({
  item,
  prevItemId,
  nextItemId,
  collapsed,
  useRelativeTime,
  showToolbar,
  onToggleCollapsed,
  onNavigate,
  onContentClick,
}: KItemCardProps) {
  return (
    <div id={`k-item-${item.id}`} className="comment">
      <div className="comment-header" onClick={() => onToggleCollapsed(item.id)}>
        {item.imageUrl ? (
          <img
            src={item.imageUrl}
            alt=""
            className="comment-avatar"
            onClick={(e) => {
              e.stopPropagation()
              onNavigate(`/id/${item.creatorId}`)
            }}
          />
        ) : (
          <div
            className="comment-avatar comment-avatar-placeholder"
            onClick={(e) => {
              e.stopPropagation()
              onNavigate(`/id/${item.creatorId}`)
            }}
          />
        )}
        <div className="comment-meta">
          <div className="comment-meta-line">
            <a
              href={`#/id/${item.creatorId}`}
              className="comment-author"
              onClick={(e) => {
                e.preventDefault()
                e.stopPropagation()
                onNavigate(`/id/${item.creatorId}`)
              }}
            >
              {item.owner}
            </a>
            <span className="comment-date">
              {useRelativeTime ? formatRelativeDate(item.createdAt) : formatDate(item.createdAt)}
              {item.updatedAt && (
                <span className="comment-date-edit">
                  {' '}({useRelativeTime ? formatRelativeDate(item.updatedAt) : formatDate(item.updatedAt)})
                </span>
              )}
            </span>
            {item.karma > 0 && (
              <span className="comment-karma">{item.karma}K</span>
            )}
          </div>
          <div className="comment-meta-line">
            <a
              href={`#/id/${item.id}`}
              className="comment-title"
              onClick={(e) => {
                e.preventDefault()
                e.stopPropagation()
                onNavigate(`/id/${item.id}`)
              }}
            >
              {item.name || `node ${item.id}`}
            </a>
            <span className="k-parent-ref">
              <span className="k-parent-in">in</span>
              <a
                href={`#/id/${item.parentId}`}
                className="k-parent-link"
                onClick={(e) => {
                  e.preventDefault()
                  e.stopPropagation()
                  onNavigate(`/id/${item.parentId}`)
                }}
              >
                {item.parentName}
              </a>
            </span>
          </div>
        </div>
      </div>
      {!collapsed && (
        <div className="comment-body">
          <div
            className="comment-content"
            dangerouslySetInnerHTML={{ __html: item.content }}
            onClick={onContentClick}
          />
        </div>
      )}
      {showToolbar && (
        <div className="comment-toolbar">
          <button
            className="toolbar-btn"
            disabled={!prevItemId}
            onClick={() => {
              if (prevItemId) {
                const menuHeight = parseInt(getComputedStyle(document.documentElement).getPropertyValue('--menu-height')) || 56
                const el = document.getElementById(`k-item-${prevItemId}`)
                if (el) {
                  const top = el.getBoundingClientRect().top + window.scrollY - menuHeight - 8
                  window.scrollTo({ top, behavior: 'smooth' })
                }
              }
            }}
          >
            prev
          </button>
          <span className="toolbar-sep">|</span>
          <button
            className="toolbar-btn"
            onClick={() => {
              const el = document.getElementById(`k-item-${item.id}`)
              if (el) {
                const menuHeight = parseInt(getComputedStyle(document.documentElement).getPropertyValue('--menu-height')) || 56
                const top = el.getBoundingClientRect().top + window.scrollY - menuHeight - 8
                window.scrollTo({ top, behavior: 'smooth' })
              }
            }}
          >
            up
          </button>
          <span className="toolbar-sep">|</span>
          <button
            className="toolbar-btn"
            disabled={!nextItemId}
            onClick={() => {
              if (nextItemId) {
                const menuHeight = parseInt(getComputedStyle(document.documentElement).getPropertyValue('--menu-height')) || 56
                const el = document.getElementById(`k-item-${nextItemId}`)
                if (el) {
                  const top = el.getBoundingClientRect().top + window.scrollY - menuHeight - 8
                  window.scrollTo({ top, behavior: 'smooth' })
                }
              }
            }}
          >
            next
          </button>
        </div>
      )}
    </div>
  )
})

export function K() {
  useTitle('K')
  const navigate = useNavigate()
  const [items, setItems] = useState<KItem[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [collapsedItems, setCollapsedItems] = useState<Set<string>>(new Set())
  const [showCommentToolbar] = useConfigValue(CONFIG_PATHS.COMMENT_TOOLBAR, true)
  const [useRelativeTime] = useConfigValue(CONFIG_PATHS.RELATIVE_TIME, true)
  const [progressiveDisplay] = useConfigValue(CONFIG_PATHS.K_PROGRESSIVE_DISPLAY, false)
  const [autoLoadOnScroll] = useConfigValue(CONFIG_PATHS.K_AUTO_LOAD_SCROLL, false)
  const [visibleCount, setVisibleCount] = useState(4)

  const loadData = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const data = await fetchKData()
      setItems(data)
    } catch (err) {
      console.error('Failed to load K data:', err)
      setError('Failed to load K data')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    loadData()
  }, [loadData])

  // Reset visible count when items change
  useEffect(() => {
    setVisibleCount(4)
  }, [items])

  // Auto-load on scroll
  useEffect(() => {
    if (!progressiveDisplay || !autoLoadOnScroll) return
    const onScroll = () => {
      if (window.innerHeight + window.scrollY >= document.body.offsetHeight - 100) {
        setVisibleCount((prev) => prev + 1)
      }
    }
    window.addEventListener('scroll', onScroll, { passive: true })
    return () => window.removeEventListener('scroll', onScroll)
  }, [progressiveDisplay, autoLoadOnScroll])

  const toggleCollapsed = useCallback((id: string) => {
    setCollapsedItems((prev) => {
      const next = new Set(prev)
      if (next.has(id)) {
        next.delete(id)
      } else {
        next.add(id)
      }
      return next
    })
  }, [])

  const handleNavigate = useCallback((path: string) => {
    navigate(path)
  }, [navigate])

  const handleContentClick = useCallback((e: React.MouseEvent) => {
    const target = e.target as HTMLElement
    const anchor = target.closest('a')
    if (!anchor) return
    const href = anchor.getAttribute('href')
    if (!href) return
    const match = href.match(/^\/id\/(\d+)/)
    if (match) {
      e.preventDefault()
      navigate(`/id/${match[1]}`)
    }
  }, [navigate])

  if (loading) {
    return (
      <div>
        <div className="sp-circle" />
      </div>
    )
  }

  if (error) {
    return (
      <div className="error-container">
        <p className="error-message">{error}</p>
        <button className="btn btn-retry" onClick={loadData}>
          Retry
        </button>
      </div>
    )
  }

  if (items.length === 0) {
    return (
      <div className="empty-state">
        <div className="empty-state-icon">&#9733;</div>
        <p className="empty-state-text">No karma items</p>
      </div>
    )
  }

  const displayItems = progressiveDisplay ? items.slice(0, visibleCount) : items
  const remaining = items.length - displayItems.length

  return (
    <div className="k-view">
      {displayItems.map((item, idx) => (
        <KItemCard
          key={item.id}
          item={item}
          prevItemId={idx > 0 ? displayItems[idx - 1].id : undefined}
          nextItemId={idx + 1 < displayItems.length ? displayItems[idx + 1].id : undefined}
          collapsed={collapsedItems.has(item.id)}
          useRelativeTime={useRelativeTime}
          showToolbar={showCommentToolbar}
          onToggleCollapsed={toggleCollapsed}
          onNavigate={handleNavigate}
          onContentClick={handleContentClick}
        />
      ))}
      {progressiveDisplay && remaining > 0 && (
        <button
          className="btn btn-show-more"
          onClick={() => setVisibleCount((prev) => prev + 1)}
        >
          display next ({remaining} remaining)
        </button>
      )}
    </div>
  )
}
