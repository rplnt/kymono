import type { BookmarkCategory, Bookmark, MpnNode, ConfigJson } from '@/types'
import { config } from '@/config'
import { parseVisitDate } from './date'

/**
 * Sanitize HTML to only allow colors, bold, and italics
 * Strips font size, face, and other attributes
 */
function sanitizeBookmarkHtml(html: string): string {
  const parser = new DOMParser()
  const doc = parser.parseFromString(`<div>${html}</div>`, 'text/html')
  const root = doc.body.firstChild as HTMLElement

  function processNode(node: Node): string {
    if (node.nodeType === Node.TEXT_NODE) {
      return node.textContent || ''
    }

    if (node.nodeType !== Node.ELEMENT_NODE) {
      return ''
    }

    const el = node as HTMLElement
    const tag = el.tagName.toLowerCase()
    const children = Array.from(el.childNodes).map(processNode).join('')

    // Bold tags
    if (tag === 'b' || tag === 'strong') {
      return `<b>${children}</b>`
    }

    // Italic tags
    if (tag === 'i' || tag === 'em') {
      return `<i>${children}</i>`
    }

    // Font tag - only keep color
    if (tag === 'font') {
      const color = el.getAttribute('color')
      if (color) {
        return `<span style="color:${color}">${children}</span>`
      }
      return children
    }

    // Span - only keep color from style
    if (tag === 'span') {
      const style = el.getAttribute('style') || ''
      const colorMatch = style.match(/color\s*:\s*([^;]+)/i)
      if (colorMatch) {
        return `<span style="color:${colorMatch[1].trim()}">${children}</span>`
      }
      return children
    }

    // Any other tag - just return children
    return children
  }

  return processNode(root)
}

/**
 * Parse bookmarks XML-like data into structured format
 */
export function parseBookmarksXml(xml: string): BookmarkCategory[] {
  const parser = new DOMParser()
  const doc = parser.parseFromString(`<root>${xml}</root>`, 'text/xml')

  const categories: BookmarkCategory[] = []
  const catElements = doc.querySelectorAll('category')

  catElements.forEach((catEl) => {
    const bookmarks: Bookmark[] = []
    const bookmarkElements = catEl.querySelectorAll('bookmark')

    bookmarkElements.forEach((bmEl, index) => {
      const rawHtml = bmEl.innerHTML || ''
      const nameHtml = sanitizeBookmarkHtml(rawHtml)
      const name = bmEl.textContent?.trim() || ''

      bookmarks.push({
        id: `bm-${catEl.getAttribute('name')}-${index}`,
        node: bmEl.getAttribute('node') || '',
        name,
        nameHtml,
        unread: parseInt(bmEl.getAttribute('unread') || '0', 10),
        hasDescendants: bmEl.getAttribute('desc') === 'yes',
        visitedAt: parseVisitDate(bmEl.getAttribute('visit') || ''),
      })
    })

    // Skip empty categories
    if (bookmarks.length === 0) return

    categories.push({
      name: catEl.getAttribute('name') || '...',
      unread: parseInt(catEl.getAttribute('unread') || '0', 10),
      bookmarks,
    })
  })

  return categories
}

/**
 * Parse MPN (Most Populated Nodes) XML-like data
 * Aggregates user entries by node ID and counts occurrences
 */
export function parseMpnXml(xml: string): MpnNode[] {
  const parser = new DOMParser()
  const doc = parser.parseFromString(`<root>${xml}</root>`, 'text/xml')

  // Aggregate counts by node ID
  const nodeMap = new Map<string, { name: string; count: number }>()
  const userElements = doc.querySelectorAll('mpn > user')

  userElements.forEach((el) => {
    const id = el.getAttribute('id') || ''
    const name = el.textContent?.trim() || ''

    if (nodeMap.has(id)) {
      nodeMap.get(id)!.count++
    } else {
      nodeMap.set(id, { name, count: 1 })
    }
  })

  // Convert to array, preserving insertion order (order of first appearance)
  return Array.from(nodeMap.entries()).map(([id, { name, count }]) => ({ id, name, count }))
}

/**
 * Extract content from HTML response
 * Looks for content inside a hidden div with id="kmn"
 */
function extractContent(html: string): string {
  const parser = new DOMParser()
  const doc = parser.parseFromString(html, 'text/html')
  const kmnDiv = doc.getElementById('kmn')
  return kmnDiv?.innerHTML || ''
}

/**
 * Fetch and parse MPN data from server
 */
export async function fetchMpnData(): Promise<MpnNode[]> {
  const url = `${config.apiBase}${config.base}${config.templates.mpn}`
  const response = await fetch(url)
  if (!response.ok) {
    throw new Error(`Failed to fetch MPN data: ${response.status}`)
  }
  const html = await response.text()
  const content = extractContent(html)
  return parseMpnXml(content)
}

/**
 * Fetch and parse bookmarks data from server
 */
export async function fetchBookmarksData(): Promise<BookmarkCategory[]> {
  const url = `${config.apiBase}${config.base}${config.templates.bookmarks}`
  const response = await fetch(url)
  if (!response.ok) {
    throw new Error(`Failed to fetch bookmarks data: ${response.status}`)
  }
  const html = await response.text()
  const content = extractContent(html)
  return parseBookmarksXml(content)
}

/**
 * Fetch configuration JSON
 */
export async function fetchConfig(url: string): Promise<ConfigJson> {
  const response = await fetch(url)
  if (!response.ok) {
    throw new Error(`Failed to fetch config: ${response.status}`)
  }
  return response.json()
}

/**
 * Open a node in a new tab
 */
export function openNode(nodeId: string): void {
  window.open(`https://kyberia.sk/id/${nodeId}`, '_blank')
}
