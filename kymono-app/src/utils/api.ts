import type { BookmarkCategory, Bookmark, MpnNode, OnlineFriend, LatestReply, SidebarData, ConfigJson, NodeData, NodeAncestor, NodeComment, NodeResponse } from '@/types'
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
 * Strip all HTML tags and return plain text
 */
function stripHtml(html: string): string {
  const parser = new DOMParser()
  const doc = parser.parseFromString(`<div>${html}</div>`, 'text/html')
  return doc.body.textContent?.trim() || ''
}

/**
 * Sanitize HTML to only allow colors, bold, and italics
 * Strips font size, face, and other attributes
 */
function sanitizeHtml(html: string): string {
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
 * Construct image URL from node ID
 * Pattern: /images/nodes/X/Y/ID.gif where X=first digit, Y=second digit
 */
function getImageUrl(nodeId: string): string {
  if (!nodeId || nodeId.length < 2) return ''
  return `${config.externalBase}/images/nodes/${nodeId[0]}/${nodeId[1]}/${nodeId}.gif`
}

/**
 * Convert newlines to <br> tags if nl2br flag is set
 */
function applyNl2br(content: string, nl2br: unknown): string {
  if (nl2br === '1' || nl2br === 1 || nl2br === true) {
    return content.replace(/\n/g, '<br>\n')
  }
  return content
}

/**
 * Extract JSON data from HTML response
 * Looks for content inside a <script type="application/json" id="..."> tag
 */
function extractJson<T>(html: string, id: string): T | null {
  const regex = new RegExp(`<script[^>]*id="${id}"[^>]*>([\\s\\S]*?)</script>`, 'i')
  const match = html.match(regex)
  if (!match) return null
  try {
    return JSON.parse(match[1])
  } catch {
    return null
  }
}

// Raw JSON types from server
interface RawMpnItem {
  id: string
  name: string
}

interface RawBookmarkChild {
  id: string
  name: string
  unread: string | number
  hasDescendants: boolean
  lastVisit: string
}

interface RawBookmarkCategory {
  id: string | null
  name: string
  unread: number | null
  children: RawBookmarkChild[]
}

interface RawNodeAncestor {
  link: string
  name: string
}

interface RawNode {
  node_id: string
  node_name: string
  node_content: string
  node_parent: string
  node_parent_name: string
  node_creator: string
  owner: string
  template_id: string
  node_created: string
  node_updated: string | null
  k: string | number
  node_children_count: string | number
  ancestors: RawNodeAncestor[]
  // Additional fields we don't map but exist
  [key: string]: unknown
}

interface RawChild {
  node_id: string
  node_parent: string
  node_name: string
  node_content: string
  node_creator: string
  login: string
  template_id: string
  node_created: string
  node_updated: string | null
  k: string | number
  node_children_count: string | number
  depth: string | number
  orphan: number
  node_status?: string
  // Additional fields
  [key: string]: unknown
}

interface RawNodeResponse {
  node: RawNode
  canWrite: boolean
  listing_amount: number
  offset: number
  children: RawChild[]
}

/**
 * Parse MPN JSON data
 * Aggregates entries by node ID and counts occurrences
 */
function parseMpnJson(items: RawMpnItem[]): MpnNode[] {
  const nodeMap = new Map<string, { name: string; count: number }>()

  for (const item of items) {
    if (nodeMap.has(item.id)) {
      nodeMap.get(item.id)!.count++
    } else {
      nodeMap.set(item.id, { name: item.name, count: 1 })
    }
  }

  return Array.from(nodeMap.entries()).map(([id, { name, count }]) => ({ id, name, count }))
}

/**
 * Parse bookmarks JSON data
 */
function parseBookmarksJson(categories: RawBookmarkCategory[]): BookmarkCategory[] {
  const result: BookmarkCategory[] = []

  for (const cat of categories) {
    // Skip categories with no children
    if (cat.children.length === 0) continue

    const bookmarks: Bookmark[] = cat.children.map((child, index) => {
      const nameHtml = sanitizeHtml(child.name)
      // Strip HTML for plain text name
      const parser = new DOMParser()
      const doc = parser.parseFromString(`<div>${child.name}</div>`, 'text/html')
      const name = doc.body.textContent?.trim() || ''

      return {
        id: `bm-${cat.id || 'uncategorized'}-${index}`,
        node: child.id,
        name,
        nameHtml,
        unread: typeof child.unread === 'string' ? parseInt(child.unread, 10) : child.unread,
        hasDescendants: child.hasDescendants,
        visitedAt: parseVisitDate(child.lastVisit),
      }
    })

    result.push({
      name: cat.name || (cat.id === null ? 'uncategorized' : '...'),
      unread: cat.unread ?? 0,
      bookmarks,
    })
  }

  return result
}

/**
 * Parse node JSON data into NodeData
 */
function parseNodeJson(raw: RawNode, canWrite: boolean): NodeData {
  const ancestors: NodeAncestor[] = (raw.ancestors || []).map((a) => ({
    id: a.link,
    name: stripHtml(a.name || ''),
  }))

  return {
    id: raw.node_id,
    name: stripHtml(raw.node_name || ''),
    nameHtml: sanitizeHtml(raw.node_name || ''),
    content: applyNl2br(raw.node_content || '', raw.nl2br),
    parentId: raw.node_parent,
    parentName: stripHtml(raw.node_parent_name || ''),
    creatorId: raw.node_creator,
    owner: raw.owner || '',
    templateId: raw.template_id,
    createdAt: new Date(raw.node_created),
    updatedAt: raw.node_updated ? new Date(raw.node_updated) : null,
    karma: typeof raw.k === 'string' ? parseInt(raw.k, 10) : raw.k,
    imageUrl: getImageUrl(raw.node_id),
    ancestors,
    canWrite,
    childrenCount: typeof raw.node_children_count === 'string' ? parseInt(raw.node_children_count, 10) : (raw.node_children_count || 0),
  }
}

/**
 * Parse child/comment JSON data into NodeComment
 */
function parseChildJson(raw: RawChild): NodeComment {
  return {
    id: raw.node_id,
    parentId: raw.node_parent,
    depth: typeof raw.depth === 'string' ? parseInt(raw.depth, 10) : raw.depth,
    creatorId: raw.node_creator,
    owner: raw.login || '',
    name: stripHtml(raw.node_name || ''),
    content: applyNl2br(raw.node_content || '', raw.nl2br),
    templateId: raw.template_id,
    createdAt: new Date(raw.node_created),
    updatedAt: raw.node_updated ? new Date(raw.node_updated) : null,
    karma: typeof raw.k === 'string' ? parseInt(raw.k, 10) : raw.k,
    childrenCount: typeof raw.node_children_count === 'string' ? parseInt(raw.node_children_count, 10) : (raw.node_children_count || 0),
    imageUrl: getImageUrl(raw.node_creator),
    isNew: false, // TODO: Calculate from last_visit if needed
    isOrphan: raw.orphan === 1,
    contentChanged: false, // TODO: Calculate from last_visit if needed
    isHardlink: raw.node_status === 'linked',
  }
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
  const data = extractJson<RawMpnItem[]>(html, 'kymono.mpn')
  if (!data) {
    throw new Error('Failed to parse MPN data')
  }
  return parseMpnJson(data)
}

interface RawReply {
  node_id: string
  node_name: string
  node_parent: string
  parent_name: string
  node_creator: string
  login: string
  node_content: string
  node_created: string
}

/**
 * Fetch and parse sidebar data (friends + latest replies) from server
 */
export async function fetchSidebarData(): Promise<SidebarData> {
  const url = `${config.apiBase}${config.base}${config.templates.sidebar}`
  const response = await fetch(url)
  if (!response.ok) {
    throw new Error(`Failed to fetch sidebar data: ${response.status}`)
  }
  const html = await response.text()

  const friendsRaw = extractJson<Omit<OnlineFriend, 'imageUrl'>[]>(html, 'kymono.friends')
  const friends = friendsRaw
    ? friendsRaw.map((f) => ({ ...f, imageUrl: getImageUrl(f.userId) }))
    : []

  const repliesRaw = extractJson<RawReply[]>(html, 'kymono.replies')
  const replies: LatestReply[] = repliesRaw
    ? repliesRaw.map((r) => ({
        id: r.node_id,
        name: stripHtml(r.node_name || ''),
        parentId: r.node_parent,
        parentName: stripHtml(r.parent_name || ''),
        creatorId: r.node_creator,
        login: r.login,
        imageUrl: getImageUrl(r.node_creator),
        content: stripHtml(r.node_content || ''),
        createdAt: r.node_created,
      }))
    : []

  return { friends, replies }
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
  const data = extractJson<RawBookmarkCategory[]>(html, 'kymono.bookmarks')
  if (!data) {
    throw new Error('Failed to parse bookmarks data')
  }
  return parseBookmarksJson(data)
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
 * Fetch and parse node data from server (includes children)
 * @param nodeId - The node ID to fetch
 * @param templateId - The template ID to use for rendering (defaults to config.templates.node)
 */
export async function fetchNodeData(
  nodeId: string,
  templateId?: string
): Promise<NodeResponse> {
  const effectiveTemplateId = templateId || config.templates.node
  const url = `${config.apiBase}/id/${nodeId}/${effectiveTemplateId}`

  const response = await fetch(url)
  if (!response.ok) {
    throw new Error(`Failed to fetch node data: ${response.status}`)
  }

  const html = await response.text()
  const data = extractJson<RawNodeResponse>(html, 'kymono.node')

  if (!data) {
    throw new Error('Failed to parse node data')
  }

  return {
    node: parseNodeJson(data.node, data.canWrite ?? false),
    children: (data.children || []).map(parseChildJson),
    listingAmount: data.listing_amount,
    offset: data.offset,
  }
}