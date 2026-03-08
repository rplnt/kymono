/**
 * Parse a date string in format "YYYY-MM-DD HH:MM:SS"
 */
export function parseVisitDate(dateStr: string): Date | null {
  if (!dateStr) return null

  const match = dateStr.match(/(\d{4})-(\d{2})-(\d{2})\s(\d{2}):(\d{2}):(\d{2})/)
  if (!match) return null

  const [, year, month, day, hour, minute, second] = match
  return new Date(
    parseInt(year),
    parseInt(month) - 1, // months are 0-indexed
    parseInt(day),
    parseInt(hour),
    parseInt(minute),
    parseInt(second)
  )
}

/**
 * Calculate minutes since a date string
 */
export function dateDiffMins(dateStr: string): number {
  const date = parseVisitDate(dateStr)
  if (!date) return 0

  return Math.floor((Date.now() - date.getTime()) / (60 * 1000))
}

/**
 * Calculate minutes since a Date object
 */
export function minutesSince(date: Date | null): number {
  if (!date) return Infinity
  return Math.floor((Date.now() - date.getTime()) / (60 * 1000))
}

/**
 * Format a Date as a localized string
 */
export function formatDate(date: Date): string {
  return date.toLocaleDateString('sk-SK', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  })
}

/**
 * Format a Date as a relative time string (e.g., "2h", "3d")
 */
export function formatRelativeDate(date: Date): string {
  const diff = Date.now() - date.getTime()
  const minutes = Math.floor(diff / 60000)
  const hours = Math.floor(diff / 3600000)
  const days = Math.floor(diff / 86400000)
  const weeks = Math.floor(days / 7)
  const months = Math.floor(days / 30)
  const years = Math.floor(days / 365)

  if (minutes < 1) return 'now'
  if (minutes < 60) return `${minutes}m ago`
  if (hours < 24) return `${hours}h ago`
  if (days < 7) return `${days}d ago`
  if (weeks < 5) return `${weeks}w ago`
  if (months < 12) return `${months}mo ago`
  return `${years}y ago`
}

/**
 * Format a date string as relative time
 */
export function formatRelativeString(dateStr: string): string {
  return formatRelativeDate(new Date(dateStr))
}
