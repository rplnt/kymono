import { useEffect, useRef } from 'react'
import { useConfigValue } from '@/contexts'
import { CONFIG_PATHS } from '@/config'

type State = 'idle' | 'pulling' | 'refreshing'

export function usePullToRefresh(onRefresh?: () => Promise<void> | void): void {
  const [enabled] = useConfigValue(CONFIG_PATHS.PULL_TO_REFRESH, false)
  const callbackRef = useRef(onRefresh)
  useEffect(() => {
    callbackRef.current = onRefresh
  })

  useEffect(() => {
    if (!enabled) return

    const app = document.getElementById('app')
    if (!app) return

    // Create indicator element
    const indicator = document.createElement('div')
    indicator.id = 'pull-refresh-indicator'
    app.prepend(indicator)

    // Add overscroll containment
    document.body.style.overscrollBehaviorY = 'contain'

    let state: State = 'idle'
    let startY = 0
    let currentPull = 0
    const threshold = 70
    const maxPull = 120

    const updateIndicator = () => {
      if (state === 'pulling') {
        indicator.className = 'pulling'
        indicator.style.height = `${currentPull}px`
        indicator.innerHTML =
          currentPull >= threshold
            ? '<span class="pull-text">release to refresh</span>'
            : '<span class="pull-text">pull to refresh</span>'
      } else if (state === 'refreshing') {
        indicator.className = 'refreshing'
        indicator.style.height = ''
        indicator.innerHTML = '<div class="sp-circle"></div>'
      } else {
        indicator.className = ''
        indicator.style.height = ''
        indicator.innerHTML = ''
      }
    }

    const onTouchStart = (e: TouchEvent) => {
      if (state !== 'idle' || window.scrollY > 0) return
      startY = e.touches[0].clientY
    }

    const onTouchMove = (e: TouchEvent) => {
      if (state === 'refreshing') return
      if (state === 'idle' && window.scrollY > 0) return

      const deltaY = e.touches[0].clientY - startY
      if (deltaY <= 0) {
        if (state === 'pulling') {
          state = 'idle'
          currentPull = 0
          updateIndicator()
        }
        return
      }

      e.preventDefault()
      state = 'pulling'
      currentPull = Math.min(deltaY, maxPull)
      updateIndicator()
    }

    const onTouchEnd = async () => {
      if (state !== 'pulling') return

      if (currentPull >= threshold) {
        state = 'refreshing'
        currentPull = 0
        updateIndicator()
        try {
          if (callbackRef.current) {
            await callbackRef.current()
          } else {
            window.location.reload()
          }
        } catch {
          // ignore refresh errors
        }
        state = 'idle'
        updateIndicator()
      } else {
        state = 'idle'
        currentPull = 0
        updateIndicator()
      }
    }

    document.addEventListener('touchstart', onTouchStart, { passive: true })
    document.addEventListener('touchmove', onTouchMove, { passive: false })
    document.addEventListener('touchend', onTouchEnd)

    return () => {
      document.removeEventListener('touchstart', onTouchStart)
      document.removeEventListener('touchmove', onTouchMove)
      document.removeEventListener('touchend', onTouchEnd)
      indicator.remove()
      document.body.style.overscrollBehaviorY = ''
    }
  }, [enabled])
}
