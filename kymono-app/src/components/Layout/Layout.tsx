import { useEffect } from 'react'
import { Outlet } from 'react-router-dom'
import { Menu } from './Menu'
import { STORAGE_KEYS } from '@/config'

function getFontScale(): number {
  const stored = localStorage.getItem(STORAGE_KEYS.FONT_SIZE)
  if (stored !== null) {
    try {
      const value = JSON.parse(stored) as number
      // Convert legacy em values to scale factor (1.9em -> ~1.2 scale)
      return value > 1 ? value / 1.6 : value
    } catch {
      return 1
    }
  }
  return 1
}

export function Layout() {
  // Apply font scale on mount and listen for changes
  useEffect(() => {
    const applyFontScale = () => {
      const scale = getFontScale()
      document.documentElement.style.fontSize = `${scale * 16}px`
    }

    applyFontScale()

    const handleStorage = (e: StorageEvent) => {
      if (e.key === STORAGE_KEYS.FONT_SIZE) {
        applyFontScale()
      }
    }

    window.addEventListener('storage', handleStorage)
    return () => window.removeEventListener('storage', handleStorage)
  }, [])

  return (
    <>
      <Menu />
      <div className="pad" />
      <main id="app">
        <Outlet />
      </main>
    </>
  )
}
