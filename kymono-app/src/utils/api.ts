import type { BookmarkCategory, Bookmark, MpnNode, ConfigJson } from '@/types'
import { parseVisitDate } from './date'

/**
 * Parse bookmarks XML-like data into structured format
 */
export function parseBookmarksXml(xml: string): BookmarkCategory[] {
  const parser = new DOMParser()
  const doc = parser.parseFromString(`<root>${xml}</root>`, 'text/xml')

  const categories: BookmarkCategory[] = []
  const catElements = doc.querySelectorAll('book-cat')

  catElements.forEach((catEl) => {
    const bookmarks: Bookmark[] = []
    const bookmarkElements = catEl.querySelectorAll('book-mark')

    bookmarkElements.forEach((bmEl, index) => {
      bookmarks.push({
        id: `bm-${catEl.getAttribute('name')}-${index}`,
        node: bmEl.getAttribute('node') || '',
        name: bmEl.textContent?.trim() || '',
        unread: parseInt(bmEl.getAttribute('unread') || '0', 10),
        hasDescendants: bmEl.getAttribute('desc') === 'yes',
        visitedAt: parseVisitDate(bmEl.getAttribute('visit') || '')
      })
    })

    categories.push({
      name: catEl.getAttribute('name') || '...',
      unread: parseInt(catEl.getAttribute('unread') || '0', 10),
      bookmarks
    })
  })

  return categories
}

/**
 * Parse MPN (Most Populated Nodes) XML-like data
 */
export function parseMpnXml(xml: string): MpnNode[] {
  const parser = new DOMParser()
  const doc = parser.parseFromString(`<root>${xml}</root>`, 'text/xml')

  const nodes: MpnNode[] = []
  const nodeElements = doc.querySelectorAll('mpn > node')

  nodeElements.forEach((nodeEl) => {
    nodes.push({
      id: nodeEl.getAttribute('node') || '',
      name: nodeEl.textContent?.trim() || '',
      count: parseInt(nodeEl.getAttribute('count') || '0', 10)
    })
  })

  return nodes
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
