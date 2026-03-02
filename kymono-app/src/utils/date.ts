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
  if (!date) return 0
  return Math.floor((Date.now() - date.getTime()) / (60 * 1000))
}
