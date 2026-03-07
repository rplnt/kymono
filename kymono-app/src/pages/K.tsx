import { useState, useEffect, useCallback, memo } from 'react'
import { useNavigate } from 'react-router-dom'
import type { KItem } from '@/types'
import { useConfigValue } from '@/contexts'
import { fetchKData, formatDate, formatRelativeDate } from '@/utils'
import { useTitle } from '@/utils/useTitle'
import { CONFIG_PATHS } from '@/config'

interface KItemCardProps {
  item: KItem
  collapsed: boolean
  fullTimestamps: boolean
  showToolbar: boolean
  onToggleCollapsed: (id: string) => void
  onNavigate: (path: string) => void
  onContentClick: (e: React.MouseEvent) => void
}

const scrollToSibling = (itemId: string, direction: 'prev' | 'next') => {
  const el = document.getElementById(`k-item-${itemId}`)
  const sibling = direction === 'prev' ? el?.previousElementSibling : el?.nextElementSibling
  if (sibling) {
    const menuHeight =
      parseInt(getComputedStyle(document.documentElement).getPropertyValue('--menu-height')) || 56
    const top = sibling.getBoundingClientRect().top + window.scrollY - menuHeight - 8
    window.scrollTo({ top, behavior: 'smooth' })
  }
}

const KItemCard = memo(function KItemCard({
  item,
  collapsed,
  fullTimestamps,
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
              {fullTimestamps ? formatDate(item.createdAt) : formatRelativeDate(item.createdAt)}
              {item.updatedAt && (
                <span className="comment-date-edit">
                  {' '}
                  (
                  {fullTimestamps ? formatDate(item.updatedAt) : formatRelativeDate(item.updatedAt)}
                  )
                </span>
              )}
            </span>
            {item.karma > 0 && <span className="comment-karma">{item.karma}K</span>}
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
          <button className="toolbar-btn" onClick={() => scrollToSibling(item.id, 'prev')}>
            prev
          </button>
          <span className="toolbar-sep">|</span>
          <button
            className="toolbar-btn"
            onClick={() => {
              const el = document.getElementById(`k-item-${item.id}`)
              if (el) {
                const menuHeight =
                  parseInt(
                    getComputedStyle(document.documentElement).getPropertyValue('--menu-height')
                  ) || 56
                const top = el.getBoundingClientRect().top + window.scrollY - menuHeight - 8
                window.scrollTo({ top, behavior: 'smooth' })
              }
            }}
          >
            up
          </button>
          <span className="toolbar-sep">|</span>
          <button className="toolbar-btn" onClick={() => scrollToSibling(item.id, 'next')}>
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
  const [fullTimestamps] = useConfigValue(CONFIG_PATHS.FULL_TIMESTAMPS, true)
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

  const handleNavigate = useCallback(
    (path: string) => {
      navigate(path)
    },
    [navigate]
  )

  const handleContentClick = useCallback(
    (e: React.MouseEvent) => {
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
    },
    [navigate]
  )

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
      {displayItems.map((item) => (
        <KItemCard
          key={item.id}
          item={item}
          collapsed={collapsedItems.has(item.id)}
          fullTimestamps={fullTimestamps}
          showToolbar={showCommentToolbar}
          onToggleCollapsed={toggleCollapsed}
          onNavigate={handleNavigate}
          onContentClick={handleContentClick}
        />
      ))}
      {progressiveDisplay && remaining > 0 && (
        <button className="btn btn-show-more" onClick={() => setVisibleCount((prev) => prev + 1)}>
          display next ({remaining} remaining)
        </button>
      )}
    </div>
  )
}
