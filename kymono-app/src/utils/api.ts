import type { BookmarkCategory, Bookmark, MpnNode, ConfigJson, NodeData, NodeAncestor, NodeComment } from '@/types'
import { config } from '@/config'
import { parseVisitDate } from './date'

// Safe color patterns - hex, named colors, rgb/rgba, hsl/hsla
const SAFE_COLOR_PATTERNS = [
  /^#[0-9a-f]{3}$/i, // #RGB
  /^#[0-9a-f]{6}$/i, // #RRGGBB
  /^#[0-9a-f]{8}$/i, // #RRGGBBAA
  /^[a-z]{3,20}$/i, // Named colors (red, blue, darkgreen, etc.)
  /^rgb\(\s*\d{1,3}\s*,\s*\d{1,3}\s*,\s*\d{1,3}\s*\)$/i, // rgb(r,g,b)
  /^rgba\(\s*\d{1,3}\s*,\s*\d{1,3}\s*,\s*\d{1,3}\s*,\s*[\d.]+\s*\)$/i, // rgba(r,g,b,a)
  /^hsl\(\s*\d{1,3}\s*,\s*\d{1,3}%\s*,\s*\d{1,3}%\s*\)$/i, // hsl(h,s%,l%)
  /^hsla\(\s*\d{1,3}\s*,\s*\d{1,3}%\s*,\s*\d{1,3}%\s*,\s*[\d.]+\s*\)$/i, // hsla(h,s%,l%,a)
]

/**
 * Validate and sanitize a color value to prevent CSS injection
 */
function sanitizeColor(color: string): string | null {
  const trimmed = color.trim()
  for (const pattern of SAFE_COLOR_PATTERNS) {
    if (pattern.test(trimmed)) {
      return trimmed
    }
  }
  return null
}

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

    // Font tag - only keep color if safe
    if (tag === 'font') {
      const rawColor = el.getAttribute('color')
      const color = rawColor ? sanitizeColor(rawColor) : null
      if (color) {
        return `<span style="color:${color}">${children}</span>`
      }
      return children
    }

    // Span - only keep color from style if safe
    if (tag === 'span') {
      const style = el.getAttribute('style') || ''
      const colorMatch = style.match(/color\s*:\s*([^;]+)/i)
      if (colorMatch) {
        const color = sanitizeColor(colorMatch[1])
        if (color) {
          return `<span style="color:${color}">${children}</span>`
        }
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
 * Uses HTML parser for tolerance of malformed markup in bookmark names
 */
export function parseBookmarksXml(xml: string): BookmarkCategory[] {
  const parser = new DOMParser()
  // Use HTML parser for better tolerance of malformed content
  const doc = parser.parseFromString(`<div>${xml}</div>`, 'text/html')

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
  // Use HTML parser for consistency and tolerance
  const doc = parser.parseFromString(`<div>${xml}</div>`, 'text/html')

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
 * Uses greedy match to find the last </div> closing the kmn element
 */
function extractContent(html: string): string {
  const startMatch = html.match(/<div[^>]*id=["']kmn["'][^>]*>/i)
  if (!startMatch) return ''

  const startIdx = startMatch.index! + startMatch[0].length
  const endIdx = html.lastIndexOf('</div>')

  if (endIdx <= startIdx) return ''
  return html.substring(startIdx, endIdx).trim()
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
 * Parse node XML data into structured format
 */
export function parseNodeXml(xml: string): NodeData | null {
  const parser = new DOMParser()
  const doc = parser.parseFromString(`<root>${xml}</root>`, 'text/xml')

  const nodeEl = doc.querySelector('node')
  if (!nodeEl) return null

  const nameEl = nodeEl.querySelector('name')
  const contentEl = nodeEl.querySelector('content')
  const ownerEl = nodeEl.querySelector('owner')
  const parentEl = nodeEl.querySelector('parent')
  const ancestorEls = nodeEl.querySelectorAll('ancestors > ancestor')

  const updatedAttr = nodeEl.getAttribute('updated')

  const ancestors: NodeAncestor[] = []
  ancestorEls.forEach((el) => {
    ancestors.push({
      id: el.getAttribute('node') || '',
      name: el.textContent?.trim() || '',
    })
  })

  return {
    id: nodeEl.getAttribute('node') || '',
    name: nameEl?.textContent?.trim() || '',
    content: contentEl?.textContent || '',
    parentId: parentEl?.getAttribute('node') || '',
    parentName: parentEl?.textContent?.trim() || '',
    creatorId: ownerEl?.getAttribute('node') || '',
    owner: ownerEl?.textContent?.trim() || '',
    templateId: nodeEl.getAttribute('template') || '',
    createdAt: new Date(nodeEl.getAttribute('created') || ''),
    updatedAt: updatedAttr ? new Date(updatedAttr) : null,
    karma: parseInt(nodeEl.getAttribute('k') || '0', 10) || 0,
    imageUrl: nodeEl.getAttribute('image') || '',
    ancestors,
    canWrite: nodeEl.getAttribute('write') === 'yes',
  }
}

/**
 * Fetch and parse node data from server
 * @param nodeId - The node ID to fetch
 * @param templateId - The template ID to use for rendering (defaults to config.templates.nodeView)
 */
export async function fetchNodeData(
  nodeId: string,
  templateId?: string
): Promise<NodeData> {
  const effectiveTemplateId = templateId || config.templates.nodeView
  // Use the node's own ID in the path, not the base config path
  const url = `${config.apiBase}/id/${nodeId}/${effectiveTemplateId}`

  const response = await fetch(url)
  if (!response.ok) {
    throw new Error(`Failed to fetch node data: ${response.status}`)
  }

  const html = await response.text()
  const content = extractContent(html)
  const nodeData = parseNodeXml(content)

  if (!nodeData) {
    throw new Error('Failed to parse node data')
  }

  return nodeData
}

/**
 * Open a node in a new tab
 * @deprecated Use navigation to internal Node view instead
 */
export function openNode(nodeId: string): void {
  window.open(`https://kyberia.sk/id/${nodeId}`, '_blank')
}

/**
 * Parse children/comments XML data into structured format
 */
export function parseChildrenXml(xml: string): NodeComment[] {
  const parser = new DOMParser()
  const doc = parser.parseFromString(`<root>${xml}</root>`, 'text/xml')

  const comments: NodeComment[] = []
  const childEls = doc.querySelectorAll('child')

  childEls.forEach((el) => {
    const nameEl = el.querySelector('name')
    const ownerEl = el.querySelector('owner')
    const parentEl = el.querySelector('parent')
    const contentEl = el.querySelector('content')
    const updatedAttr = el.getAttribute('updated')

    comments.push({
      id: el.getAttribute('node') || '',
      parentId: parentEl?.getAttribute('node') || '',
      depth: parseInt(el.getAttribute('depth') || '0', 10),
      creatorId: ownerEl?.getAttribute('node') || '',
      owner: ownerEl?.textContent?.trim() || '',
      name: nameEl?.textContent?.trim() || '',
      content: contentEl?.textContent || '',
      templateId: el.getAttribute('template') || '',
      createdAt: new Date(el.getAttribute('created') || ''),
      updatedAt: updatedAttr ? new Date(updatedAttr) : null,
      karma: parseInt(el.getAttribute('k') || '0', 10) || 0,
      childrenCount: parseInt(el.getAttribute('children') || '0', 10),
      imageUrl: el.getAttribute('image') || '',
      isNew: el.getAttribute('new') === 'yes',
      isOrphan: el.getAttribute('orphan') === 'yes',
      contentChanged: el.getAttribute('changed') === 'yes',
      isHardlink: el.getAttribute('status') === 'linked',
    })
  })

  return comments
}

/**
 * Fetch and parse children/comments data from server
 * @param nodeId - The node ID to fetch children for
 */
export async function fetchNodeChildren(nodeId: string): Promise<NodeComment[]> {
  const url = `${config.apiBase}/id/${nodeId}/${config.templates.children}`
  const response = await fetch(url)
  if (!response.ok) {
    throw new Error(`Failed to fetch children: ${response.status}`)
  }
  const html = await response.text()
  const content = extractContent(html)
  return parseChildrenXml(content)
}
