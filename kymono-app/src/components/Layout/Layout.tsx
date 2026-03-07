import { useEffect, useState, useCallback } from 'react'
import { Outlet } from 'react-router-dom'
import { Menu } from './Menu'
import { SidePanel } from './SidePanel'
import { useConfigValue } from '@/contexts'
import { CONFIG_PATHS } from '@/config'

export function Layout() {
  const [sidePanelOpen, setSidePanelOpen] = useState(false)

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

  // Apply font scale to root — menu uses px so it stays fixed
  useEffect(() => {
    const sizeMap: Record<string, number> = { S: 16, M: 18, L: 21, XL: 24 }
    document.documentElement.style.fontSize = `${sizeMap[fontSizeValue] || 16}px`
  }, [fontSizeValue])

  return (
    <div
      className={`${responsiveYoutube ? 'responsive-youtube' : ''} ${responsiveImages ? 'responsive-images' : ''}`}
    >
      <Menu onToggleSidePanel={toggleSidePanel} onCloseSidePanel={closeSidePanel} />
      <SidePanel isOpen={sidePanelOpen} onClose={closeSidePanel} />
      <div className="pad" />
      <main id="app">
        <Outlet />
      </main>
    </div>
  )
}
