import { fetchSidebarData } from './api'

const LAST_LOADED_KEY = 'kymono.sidebar.lastLoaded'

/**
 * Start a background runner that polls for new replies every 5 minutes.
 * Compares reply timestamps against localStorage lastLoaded to count new replies.
 * Returns a stop function to clean up the interval.
 */
export function startRepliesChecker(onNewCount: (n: number) => void): () => void {
  let stopped = false
  let timerId: ReturnType<typeof setTimeout> | null = null

  const check = async () => {
    try {
      const data = await fetchSidebarData()
      if (stopped) return

      const lastLoadedAt = localStorage.getItem(LAST_LOADED_KEY)
      if (!lastLoadedAt) {
        onNewCount(0)
        return
      }

      const newCount = data.replies.filter((r) => r.createdAt > lastLoadedAt).length
      onNewCount(newCount)
    } catch {
      // silently ignore errors, keep previous data
    }
  }

  const schedule = () => {
    if (stopped) return
    timerId = setTimeout(() => {
      check().then(schedule)
    }, 300_000)
  }

  // Initial check, then schedule
  check().then(schedule)

  return () => {
    stopped = true
    if (timerId !== null) clearTimeout(timerId)
  }
}
