import { parseVisitDate, dateDiffMins, minutesSince } from './date'

describe('parseVisitDate', () => {
  it('parses valid date string', () => {
    const result = parseVisitDate('2024-03-15 14:30:45')

    expect(result).toBeInstanceOf(Date)
    expect(result?.getFullYear()).toBe(2024)
    expect(result?.getMonth()).toBe(2) // March (0-indexed)
    expect(result?.getDate()).toBe(15)
    expect(result?.getHours()).toBe(14)
    expect(result?.getMinutes()).toBe(30)
    expect(result?.getSeconds()).toBe(45)
  })

  it('returns null for empty string', () => {
    expect(parseVisitDate('')).toBeNull()
  })

  it('returns null for invalid format', () => {
    expect(parseVisitDate('not a date')).toBeNull()
    expect(parseVisitDate('2024/03/15')).toBeNull()
    expect(parseVisitDate('15-03-2024 14:30:45')).toBeNull()
  })
})

describe('dateDiffMins', () => {
  it('calculates minutes difference', () => {
    // Create a date 60 minutes ago
    const now = new Date()
    const sixtyMinsAgo = new Date(now.getTime() - 60 * 60 * 1000)
    const dateStr = formatDateString(sixtyMinsAgo)

    const diff = dateDiffMins(dateStr)

    // Allow 1 minute tolerance for test execution time
    expect(diff).toBeGreaterThanOrEqual(59)
    expect(diff).toBeLessThanOrEqual(61)
  })

  it('returns 0 for invalid date', () => {
    expect(dateDiffMins('')).toBe(0)
    expect(dateDiffMins('invalid')).toBe(0)
  })
})

describe('minutesSince', () => {
  it('calculates minutes since a date', () => {
    const now = new Date()
    const thirtyMinsAgo = new Date(now.getTime() - 30 * 60 * 1000)

    const diff = minutesSince(thirtyMinsAgo)

    expect(diff).toBeGreaterThanOrEqual(29)
    expect(diff).toBeLessThanOrEqual(31)
  })

  it('returns 0 for null', () => {
    expect(minutesSince(null)).toBe(0)
  })
})

// Helper to format a Date to the expected string format
function formatDateString(date: Date): string {
  const pad = (n: number) => n.toString().padStart(2, '0')
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())} ${pad(date.getHours())}:${pad(date.getMinutes())}:${pad(date.getSeconds())}`
}
