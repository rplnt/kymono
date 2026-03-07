import { useEffect, useState, useCallback, useRef } from 'react'
import { Outlet } from 'react-router-dom'
import { Menu } from './Menu'
import { SidePanel } from './SidePanel'
import { useConfigValue } from '@/contexts'
import { CONFIG_PATHS } from '@/config'

const PULL_THRESHOLD = 80

export function Layout() {
  const [sidePanelOpen, setSidePanelOpen] = useState(false)
  const [pullDistance, setPullDistance] = useState(0)
  const [isPulling, setIsPulling] = useState(false)
  const touchStartY = useRef(0)

  // Get font size from config - reactively updates when changed in settings
  const [fontSizeValue] = useConfigValue<string>(CONFIG_PATHS.FONT_SIZE, 'M')
  const [responsiveYoutube] = useConfigValue<boolean>(CONFIG_PATHS.RESPONSIVE_YOUTUBE, true)
  const [responsiveImages] = useConfigValue<boolean>(CONFIG_PATHS.RESPONSIVE_IMAGES, true)

  const toggleSidePanel = useCallback(() => {
    setSidePanelOpen((prev) => !prev)
  }, [])

  const closeSidePanel = useCallback(() => {
    setSidePanelOpen(false)
  }, [])

  // Pull-to-refresh handlers
  const handleTouchStart = useCallback((e: React.TouchEvent) => {
    if (window.scrollY === 0) {
      touchStartY.current = e.touches[0].clientY
      setIsPulling(true)
    }
  }, [])

  const handleTouchMove = useCallback(
    (e: React.TouchEvent) => {
      if (!isPulling) return
      const currentY = e.touches[0].clientY
      const distance = currentY - touchStartY.current
      if (distance > 0) {
        setPullDistance(Math.min(distance, PULL_THRESHOLD * 1.5))
      }
    },
    [isPulling]
  )

  const handleTouchEnd = useCallback(() => {
    if (pullDistance >= PULL_THRESHOLD) {
      window.location.reload()
    }
    setPullDistance(0)
    setIsPulling(false)
  }, [pullDistance])

  // Apply font scale to root — menu uses px so it stays fixed
  const sizeMap: Record<string, number> = { S: 16, M: 18, L: 21, XL: 24 }
  useEffect(() => {
    document.documentElement.style.fontSize = `${sizeMap[fontSizeValue] || 16}px`
  }, [fontSizeValue])

  return (
    <div
      className={`${responsiveYoutube ? 'responsive-youtube' : ''} ${responsiveImages ? 'responsive-images' : ''}`}
      onTouchStart={handleTouchStart}
      onTouchMove={handleTouchMove}
      onTouchEnd={handleTouchEnd}
    >
      <Menu onToggleSidePanel={toggleSidePanel} onCloseSidePanel={closeSidePanel} />
      <SidePanel isOpen={sidePanelOpen} onClose={closeSidePanel} />
      <div className="pad" />
      {pullDistance > 0 && (
        <div
          className="pull-indicator"
          style={{
            height: pullDistance,
            opacity: Math.min(pullDistance / PULL_THRESHOLD, 1),
          }}
        >
          {pullDistance >= PULL_THRESHOLD ? '↻ Release to reload' : '↓ Pull to reload'}
        </div>
      )}
      <main id="app">
        <Outlet />
      </main>
    </div>
  )
}
