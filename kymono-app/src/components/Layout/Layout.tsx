import { useEffect, useState, useCallback, useRef } from 'react'
import { Outlet } from 'react-router-dom'
import { Menu } from './Menu'
import { SidePanel } from './SidePanel'
import { CONFIG_PATHS } from '@/config'
import { getConfigValue } from '@/utils'

function getFontScale(): number {
  const value = getConfigValue<number>(CONFIG_PATHS.FONT_SIZE, 1)
  // Convert legacy em values to scale factor (1.9em -> ~1.2 scale)
  return value > 1 ? value / 1.6 : value
}

const PULL_THRESHOLD = 80

export function Layout() {
  const [sidePanelOpen, setSidePanelOpen] = useState(false)
  const [pullDistance, setPullDistance] = useState(0)
  const [isPulling, setIsPulling] = useState(false)
  const touchStartY = useRef(0)
  const mainRef = useRef<HTMLElement>(null)

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

  // Apply font scale on mount and listen for changes
  useEffect(() => {
    const applyFontScale = () => {
      const scale = getFontScale()
      document.documentElement.style.fontSize = `${scale * 16}px`
    }

    applyFontScale()

    const handleStorage = (e: StorageEvent) => {
      if (e.key === CONFIG_PATHS.FONT_SIZE) {
        applyFontScale()
      }
    }

    window.addEventListener('storage', handleStorage)
    return () => window.removeEventListener('storage', handleStorage)
  }, [])

  return (
    <div onTouchStart={handleTouchStart} onTouchMove={handleTouchMove} onTouchEnd={handleTouchEnd}>
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
      <main id="app" ref={mainRef}>
        <Outlet />
      </main>
    </div>
  )
}
