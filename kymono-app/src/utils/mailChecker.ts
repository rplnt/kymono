import { config } from '@/config'

/**
 * Start a background runner that polls for new mail count every 60 seconds.
 * Returns a stop function to clean up the interval.
 */
export function startMailChecker(onCount: (n: number) => void): () => void {
  let stopped = false
  let timerId: ReturnType<typeof setTimeout> | null = null

  const check = async () => {
    try {
      const url = `${config.apiBase}/ajax/check_new_mail.php`
      const response = await fetch(url, { redirect: 'manual' })
      if (response.type === 'opaqueredirect' || !response.ok) return
      const text = await response.text()
      const count = parseInt(text.split(';')[0], 10)
      if (!isNaN(count) && !stopped) {
        onCount(count)
      }
    } catch {
      // silently ignore errors
    }
  }

  const schedule = () => {
    if (stopped) return
    timerId = setTimeout(() => {
      check().then(schedule)
    }, 60_000)
  }

  // Initial check, then schedule
  check().then(schedule)

  return () => {
    stopped = true
    if (timerId !== null) clearTimeout(timerId)
  }
}
