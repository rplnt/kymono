import { useState, useEffect, useCallback, memo } from 'react'
import { useNavigate } from 'react-router-dom'
import type { KItem } from '@/types'
import { useConfigValue } from '@/contexts'
import { fetchKData, fetchLastKData, giveKarma, scrollToElement } from '@/utils'
import { useTitle } from '@/utils/useTitle'
import { usePullToRefresh } from '@/utils/usePullToRefresh'
import { CONFIG_PATHS } from '@/config'
import { Timestamp } from '@/components/Timestamp'

type KTab = 'k' | '1h' | '1d' | '1w'

const TABS: { id: KTab; label: string }[] = [
  { id: 'k', label: 'K' },
  { id: '1h', label: '1H' },
  { id: '1d', label: '1D' },
  { id: '1w', label: '1W' },
]

interface KItemCardProps {
  item: KItem
  collapsed: boolean
  fullTimestamps: boolean
  showToolbar: boolean
  kState: 'idle' | 'sending' | 'ok' | 'error' | 'nehul' | 'neda-sa'
  onToggleCollapsed: (id: string) => void
  onNavigate: (path: string) => void
  onContentClick: (e: React.MouseEvent) => void
  onGiveK: (id: string) => void
}

const scrollToSibling = (itemId: string, direction: 'prev' | 'next') => {
  const el = document.getElementById(`k-item-${itemId}`)
  const sibling = direction === 'prev' ? el?.previousElementSibling : el?.nextElementSibling
  if (sibling) scrollToElement(sibling)
}

const KItemCard = memo(function KItemCard({
  item,
  collapsed,
  fullTimestamps,
  showToolbar,
  kState,
  onToggleCollapsed,
  onNavigate,
  onContentClick,
  onGiveK,
}: KItemCardProps) {
  return (
    <div id={`k-item-${item.id}`} className="comment">
      <div className="comment-header" onClick={() => onToggleCollapsed(item.id)}>
        {item.creatorImageUrl ? (
          <img
            src={item.creatorImageUrl}
            alt=""
            className="comment-avatar avatar-img"
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
            <Timestamp
              createdAt={item.createdAt}
              updatedAt={item.updatedAt}
              fullTimestamps={fullTimestamps}
            />
            {item.karma > 0 && <span className="comment-karma karma-value">{item.karma}K</span>}
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
      {(() => {
        const kBtn =
          item.givenK || kState === 'ok' ? (
            <span className="give-k-given">k given</span>
          ) : kState === 'nehul' ? (
            <span className="give-k-err">nehul</span>
          ) : kState === 'neda-sa' ? (
            <span className="give-k-err">neda sa</span>
          ) : kState === 'error' ? (
            <span className="give-k-err">err</span>
          ) : (
            <button
              className="give-k-btn"
              onClick={() => onGiveK(item.id)}
              disabled={kState === 'sending'}
            >
              give k
            </button>
          )

        if (!showToolbar) {
          return (
            <div className="comment-toolbar">
              <span className="toolbar-k-right">{kBtn}</span>
            </div>
          )
        }

        return (
          <div className="comment-toolbar">
            <button className="toolbar-btn" onClick={() => scrollToSibling(item.id, 'prev')}>
              prev
            </button>
            <span className="toolbar-sep">|</span>
            <button
              className="toolbar-btn"
              onClick={() => {
                const el = document.getElementById(`k-item-${item.id}`)
                if (el) scrollToElement(el)
              }}
            >
              up
            </button>
            <span className="toolbar-sep">|</span>
            <button className="toolbar-btn" onClick={() => scrollToSibling(item.id, 'next')}>
              next
            </button>
            <span className="toolbar-k-right">{kBtn}</span>
          </div>
        )
      })()}
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
  const [activeTab, setActiveTab] = useState<KTab>('k')
  const [showCommentToolbar] = useConfigValue<boolean>(CONFIG_PATHS.COMMENT_TOOLBAR)
  const [fullTimestamps] = useConfigValue<boolean>(CONFIG_PATHS.FULL_TIMESTAMPS)
  const [progressiveDisplay] = useConfigValue<boolean>(CONFIG_PATHS.K_PROGRESSIVE_DISPLAY)
  const [autoLoadOnScroll] = useConfigValue<boolean>(CONFIG_PATHS.K_AUTO_LOAD_SCROLL)
  const [nsfwFilter, setNsfwFilter] = useConfigValue<boolean>(CONFIG_PATHS.K_NSFW_FILTER)
  const [visibleCount, setVisibleCount] = useState(4)
  const [kStates, setKStates] = useState<
    Map<string, 'idle' | 'sending' | 'ok' | 'error' | 'nehul' | 'neda-sa'>
  >(new Map())

  const loadData = useCallback(async (tab: KTab, force = false) => {
    setLoading(true)
    setError(null)
    try {
      let data: KItem[]
      if (tab === 'k') {
        data = await fetchKData(force)
      } else {
        data = await fetchLastKData(tab, force)
      }
      setItems(data)
    } catch (err) {
      console.error('Failed to load K data:', err)
      setError(':(')
    } finally {
      setLoading(false)
    }
  }, [])

  usePullToRefresh(() => loadData(activeTab, true))

  useEffect(() => {
    loadData(activeTab)
  }, [loadData, activeTab])

  // Reset visible count and K states when items change
  useEffect(() => {
    setVisibleCount(4)
    setKStates(new Map())
  }, [items])

  // Auto-load on scroll
  useEffect(() => {
    if (!progressiveDisplay || !autoLoadOnScroll || items.length === 0) return
    const onScroll = () => {
      if (window.innerHeight + window.scrollY >= document.body.offsetHeight - 100) {
        setVisibleCount((prev) => (prev < items.length ? prev + 1 : prev))
      }
    }
    window.addEventListener('scroll', onScroll, { passive: true })
    return () => window.removeEventListener('scroll', onScroll)
  }, [progressiveDisplay, autoLoadOnScroll, items.length])

  // Fill screen on initial load when content is short
  useEffect(() => {
    if (!progressiveDisplay || !autoLoadOnScroll || items.length === 0) return
    const raf = requestAnimationFrame(() => {
      if (window.innerHeight >= document.body.offsetHeight - 100) {
        setVisibleCount((prev) => (prev < items.length ? prev + 1 : prev))
      }
    })
    return () => cancelAnimationFrame(raf)
  }, [progressiveDisplay, autoLoadOnScroll, items.length, visibleCount])

  const handleTabChange = (tab: KTab) => {
    if (tab === activeTab) return
    setActiveTab(tab)
  }

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

  const handleGiveK = useCallback(
    async (id: string) => {
      const state = kStates.get(id) || 'idle'
      if (state !== 'idle') return
      setKStates((prev) => new Map(prev).set(id, 'sending'))
      try {
        const result = await giveKarma(id)
        setKStates((prev) => new Map(prev).set(id, result))
        if (result === 'ok') {
          setItems((prev) =>
            prev.map((item) => (item.id === id ? { ...item, karma: item.karma + 1 } : item))
          )
        }
      } catch {
        setKStates((prev) => new Map(prev).set(id, 'error'))
      }
    },
    [kStates]
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

  const tabBar = (
    <div className="k-tabs">
      {TABS.map((tab) => (
        <button
          key={tab.id}
          className={`k-tab ${activeTab === tab.id ? 'k-tab-active' : ''}`}
          onClick={() => handleTabChange(tab.id)}
        >
          {tab.label}
        </button>
      ))}
      <button className="k-tab k-tab-active k-tab-right" onClick={() => setNsfwFilter(!nsfwFilter)}>
        {nsfwFilter ? 'SFW' : 'ALL'}
      </button>
    </div>
  )

  if (loading) {
    return (
      <div>
        {tabBar}
        <div className="sp-circle" />
      </div>
    )
  }

  if (error) {
    return (
      <div className="error-container">
        {tabBar}
        <p className="error-message">{error}</p>
        <button className="btn btn-retry" onClick={() => loadData(activeTab, true)}>
          Retry
        </button>
      </div>
    )
  }

  if (items.length === 0) {
    return (
      <div>
        {tabBar}
        <div className="empty-state">
          <div className="empty-state-icon">&#9733;</div>
          <p className="empty-state-text">No karma items</p>
        </div>
      </div>
    )
  }

  const filteredItems = nsfwFilter
    ? items.filter((item) => {
        const name = (item.name || '').toLowerCase()
        const parent = (item.parentName || '').toLowerCase()
        return !name.includes('nsfw') && !parent.includes('nsfw')
      })
    : items
  const displayItems = progressiveDisplay ? filteredItems.slice(0, visibleCount) : filteredItems
  const remaining = filteredItems.length - displayItems.length

  return (
    <div className="k-view">
      {tabBar}
      {displayItems.map((item) => (
        <KItemCard
          key={item.id}
          item={item}
          collapsed={collapsedItems.has(item.id)}
          fullTimestamps={fullTimestamps}
          showToolbar={showCommentToolbar}
          kState={kStates.get(item.id) || 'idle'}
          onToggleCollapsed={toggleCollapsed}
          onNavigate={handleNavigate}
          onContentClick={handleContentClick}
          onGiveK={handleGiveK}
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
