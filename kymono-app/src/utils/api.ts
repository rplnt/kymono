import type {
  BookmarkCategory,
  Bookmark,
  MpnNode,
  OnlineFriend,
  LatestReply,
  SidebarData,
  ConfigJson,
  NodeData,
  NodeAncestor,
  NodeComment,
  NodeResponse,
  KItem,
  FriendSubmission,
  MailMessage,
} from '@/types'
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
 * Simple in-memory cache for API responses.
 * Each key stores the data and the timestamp it was fetched.
 * Calls within CACHE_TTL_MS return cached data; force=true bypasses.
 */
const CACHE_TTL_MS = 60_000

interface CacheEntry<T> {
  data: T
  fetchedAt: number
}

const cache = new Map<string, CacheEntry<unknown>>()
const inflight = new Map<string, Promise<unknown>>()

function getCached<T>(key: string): T | null {
  const entry = cache.get(key)
  if (entry && Date.now() - entry.fetchedAt < CACHE_TTL_MS) {
    return entry.data as T
  }
  return null
}

function setCache<T>(key: string, data: T): void {
  cache.set(key, { data, fetchedAt: Date.now() })
}

function dedupedFetch<T>(key: string, fn: () => Promise<T>): Promise<T> {
  const existing = inflight.get(key)
  if (existing) return existing as Promise<T>
  const promise = fn().finally(() => inflight.delete(key))
  inflight.set(key, promise)
  return promise
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

interface RawKItem {
  node_id: string
  node_name: string
  node_content: string
  node_parent: string
  parent_name: string
  node_creator: string
  creator: string
  template_id: string
  node_created: string
  node_updated: string | null
  k: string | number
  node_children_count: string | number
  nl2br: string | number
  [key: string]: unknown
}

interface RawNodeResponse {
  node: RawNode
  nodeImageUrl?: string
  creatorImageUrl?: string
  canWrite: boolean
  anticsrf?: string
  listing_amount: number
  offset: number
  node_views: number | string
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
function parseNodeJson(
  raw: RawNode,
  canWrite: boolean,
  views: number = 0,
  nodeImageUrl?: string,
  creatorImageUrl?: string
): NodeData {
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
    nodeImageUrl: nodeImageUrl || getImageUrl(raw.node_id),
    creatorImageUrl: creatorImageUrl || getImageUrl(raw.node_creator),
    ancestors,
    canWrite,
    childrenCount:
      typeof raw.node_children_count === 'string'
        ? parseInt(raw.node_children_count, 10)
        : raw.node_children_count || 0,
    views,
    givenK: raw.given_k === 'yes',
    bookmarked: raw.node_bookmark === 'yes',
  }
}

/**
 * Parse child/comment JSON data into NodeComment
 */
function parseChildJson(raw: RawChild, lastVisit?: Date): NodeComment {
  const createdAt = new Date(raw.node_created)
  const updatedAt = raw.node_updated ? new Date(raw.node_updated) : null
  const isOrphan = raw.orphan === 1
  const isNew = lastVisit ? createdAt > lastVisit && !isOrphan : false
  const contentChanged = lastVisit && updatedAt ? updatedAt > lastVisit : false

  return {
    id: raw.node_id,
    parentId: raw.node_parent,
    depth: typeof raw.depth === 'string' ? parseInt(raw.depth, 10) : raw.depth,
    creatorId: raw.node_creator,
    owner: raw.login || '',
    name: stripHtml(raw.node_name || ''),
    content: applyNl2br(raw.node_content || '', raw.nl2br),
    templateId: raw.template_id,
    createdAt,
    updatedAt,
    karma: typeof raw.k === 'string' ? parseInt(raw.k, 10) : raw.k,
    childrenCount:
      typeof raw.node_children_count === 'string'
        ? parseInt(raw.node_children_count, 10)
        : raw.node_children_count || 0,
    creatorImageUrl: getImageUrl(raw.node_creator),
    isNew,
    isOrphan,
    contentChanged,
    isHardlink: raw.node_status === 'linked',
    givenK: raw.given_k === 'yes', // not present on children, always false
  }
}

/**
 * Fetch and parse MPN data from server
 */
export async function fetchMpnData(force = false): Promise<MpnNode[]> {
  const cacheKey = 'mpn'
  if (!force) {
    const cached = getCached<MpnNode[]>(cacheKey)
    if (cached) return cached
  }
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
  const result = parseMpnJson(data)
  setCache(cacheKey, result)
  return result
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
  creatorImageUrl?: string
}

/**
 * Fetch and parse sidebar data (friends + latest replies) from server
 */
export async function fetchSidebarData(force = false): Promise<SidebarData> {
  const cacheKey = 'sidebar'
  if (!force) {
    const cached = getCached<SidebarData>(cacheKey)
    if (cached) return cached
  }
  const url = `${config.apiBase}${config.base}${config.templates.sidebar}`
  const response = await fetch(url)
  if (!response.ok) {
    throw new Error(`Failed to fetch sidebar data: ${response.status}`)
  }
  const html = await response.text()

  const friendsRaw = extractJson<
    (Omit<OnlineFriend, 'creatorImageUrl'> & { creatorImageUrl?: string })[]
  >(html, 'kymono.friends')
  const friends = friendsRaw
    ? friendsRaw.map((f) => ({ ...f, creatorImageUrl: f.creatorImageUrl || getImageUrl(f.userId) }))
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
        creatorImageUrl: r.creatorImageUrl || getImageUrl(r.node_creator),
        content: stripHtml(r.node_content || ''),
        createdAt: r.node_created,
      }))
    : []

  const result = { friends, replies }
  setCache(cacheKey, result)
  return result
}

/**
 * Fetch and parse bookmarks data from server
 */
export async function fetchBookmarksData(force = false): Promise<BookmarkCategory[]> {
  const cacheKey = 'bookmarks'
  if (!force) {
    const cached = getCached<BookmarkCategory[]>(cacheKey)
    if (cached) return cached
  }
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
  const result = parseBookmarksJson(data)
  setCache(cacheKey, result)
  return result
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
export async function fetchNodeData(nodeId: string, templateId?: string): Promise<NodeResponse> {
  const effectiveTemplateId = templateId || config.templates.node
  const url = `${config.apiBase}/id/${nodeId}/${effectiveTemplateId}`

  const response = await fetch(url)
  if (!response.ok) {
    throw new Error(`Failed to fetch node data: ${response.status}`)
  }

  const html = await response.text()
  const data = extractJson<RawNodeResponse>(html, 'kymono.node')

  if (!data) {
    if (html.includes("you don't have permissions for viewing this data node")) {
      throw new Error("You don't have permissions for viewing this data node")
    }
    throw new Error('Failed to parse node data')
  }

  return {
    node: parseNodeJson(
      data.node,
      data.canWrite ?? false,
      typeof data.node_views === 'string' ? parseInt(data.node_views, 10) : data.node_views || 0,
      data.nodeImageUrl,
      data.creatorImageUrl
    ),
    children: (() => {
      const lastVisit = data.node.last_visit ? new Date(data.node.last_visit as string) : undefined
      return (data.children || []).map((c) => parseChildJson(c, lastVisit))
    })(),
    listingAmount: data.listing_amount,
    offset: data.offset,
    anticsrf: data.anticsrf,
  }
}

/**
 * Parse K item JSON data into KItem
 */
function parseKItem(raw: RawKItem): KItem {
  return {
    id: raw.node_id,
    name: stripHtml(raw.node_name || ''),
    content: applyNl2br(raw.node_content || '', raw.nl2br),
    parentId: raw.node_parent,
    parentName: stripHtml(raw.parent_name || ''),
    creatorId: raw.node_creator,
    owner: raw.creator || '',
    templateId: raw.template_id,
    createdAt: new Date(raw.node_created),
    updatedAt: raw.node_updated ? new Date(raw.node_updated) : null,
    karma: typeof raw.k === 'string' ? parseInt(raw.k, 10) : raw.k,
    childrenCount:
      typeof raw.node_children_count === 'string'
        ? parseInt(raw.node_children_count, 10)
        : raw.node_children_count || 0,
    creatorImageUrl: getImageUrl(raw.node_creator),
    givenK: raw.given_k === 'yes', // not present on K list items, always false
  }
}

/**
 * Fetch and parse K (karma) data from server
 */
export async function fetchKData(force = false): Promise<KItem[]> {
  const cacheKey = 'k'
  if (!force) {
    const cached = getCached<KItem[]>(cacheKey)
    if (cached) return cached
  }
  const url = `${config.apiBase}${config.base}${config.templates.k}`
  const response = await fetch(url)
  if (!response.ok) {
    throw new Error(`Failed to fetch K data: ${response.status}`)
  }
  const html = await response.text()
  const data = extractJson<RawKItem[]>(html, 'kymono.k')
  if (!data) {
    throw new Error('Failed to parse K data')
  }
  const result = data.map(parseKItem)
  setCache(cacheKey, result)
  return result
}

interface RawLastKItem {
  node_id: string
  node_name: string
  node_content: string
  node_parent: string
  node_parent_name: string
  node_creator: string
  node_creator_name: string
  count: string | number
  [key: string]: unknown
}

function parseLastKItem(raw: RawLastKItem): KItem {
  return {
    id: raw.node_id,
    name: stripHtml(raw.node_name || ''),
    content: raw.node_content || '',
    parentId: raw.node_parent,
    parentName: stripHtml(raw.node_parent_name || ''),
    creatorId: raw.node_creator,
    owner: raw.node_creator_name || '',
    templateId: '',
    createdAt: null,
    updatedAt: null,
    karma: typeof raw.count === 'string' ? parseInt(raw.count, 10) : raw.count,
    childrenCount: 0,
    creatorImageUrl: getImageUrl(raw.node_creator),
    givenK: raw.given_k === 'yes',
  }
}

/**
 * Fetch and parse Last K (recent karma) data from server
 */
export async function fetchLastKData(
  interval: '1h' | '1d' | '1w' = '1h',
  force = false
): Promise<KItem[]> {
  const cacheKey = `lastk-${interval}`
  if (!force) {
    const cached = getCached<KItem[]>(cacheKey)
    if (cached) return cached
  }
  const doFetch = async () => {
    const url = `${config.apiBase}${config.base}${config.templates.lastK}`
    let response: Response
    if (interval === '1h') {
      response = await fetch(url)
    } else {
      const formData = new FormData()
      formData.append('interval', interval === '1d' ? '24' : '168')
      formData.append('template_event', 'Hour')
      response = await fetch(url, { method: 'POST', body: formData })
    }
    if (!response.ok) {
      throw new Error(`Failed to fetch Last K data: ${response.status}`)
    }
    const html = await response.text()
    const data = extractJson<RawLastKItem[]>(html, 'kymono.lastk')
    if (!data) {
      throw new Error('Failed to parse Last K data')
    }
    const result = data.map(parseLastKItem)
    setCache(cacheKey, result)
    return result
  }
  return force ? doFetch() : dedupedFetch(cacheKey, doFetch)
}

/**
 * Submit a comment (template 4) under a parent node
 */
export async function submitComment(
  parentNodeId: string,
  title: string,
  content: string,
  anticsrf: string
): Promise<void> {
  const url = `${config.apiBase}/id/${parentNodeId}`
  const formData = new FormData()
  formData.append('node_name', title)
  formData.append('node_content', content)
  formData.append('template_id', '4')
  formData.append('node_parent', parentNodeId)
  formData.append('event', 'add')
  formData.append('anticsrf', anticsrf)

  const response = await fetch(url, { method: 'POST', body: formData, redirect: 'manual' })
  if (response.type !== 'opaqueredirect' && !response.ok) {
    throw new Error(`Failed to submit comment: ${response.status}`)
  }
}

/**
 * Give karma (K+) to a node
 */
export async function giveKarma(
  nodeId: string,
  anticsrf?: string
): Promise<'ok' | 'nehul' | 'neda-sa'> {
  const url = `${config.apiBase}/id/${nodeId}/`
  const formData = new FormData()
  formData.append('event', 'K')
  if (anticsrf) {
    formData.append('anticsrf', anticsrf)
  }
  const response = await fetch(url, { method: 'POST', body: formData, redirect: 'manual' })
  if (response.type === 'opaqueredirect') return 'ok'
  if (!response.ok) {
    throw new Error(`Failed to give K: ${response.status}`)
  }
  // 200 — check body for known error messages
  const text = await response.text()
  if (text.includes('uz to nehul')) return 'nehul'
  if (text.includes('musis byt prihlaseny') || text.includes("don't have permissions"))
    return 'neda-sa'
  return 'ok'
}

/**
 * Toggle bookmark (book/unbook) on a node
 */
export async function toggleBookmark(
  nodeId: string,
  isCurrentlyBookmarked: boolean,
  anticsrf?: string
): Promise<boolean> {
  const url = `${config.apiBase}/id/${nodeId}/`
  const formData = new FormData()
  formData.append('event', isCurrentlyBookmarked ? 'unbook' : 'book')
  if (anticsrf) {
    formData.append('anticsrf', anticsrf)
  }
  const response = await fetch(url, { method: 'POST', body: formData, redirect: 'manual' })
  if (response.type === 'opaqueredirect') return !isCurrentlyBookmarked
  if (!response.ok) {
    throw new Error(`Failed to toggle bookmark: ${response.status}`)
  }
  return !isCurrentlyBookmarked
}

export function getFriendMapFromDom(): Record<string, boolean> {
  const el = document.querySelector('script#kymono\\.friendList')
  if (!el?.textContent) return {}
  try {
    return JSON.parse(el.textContent)
  } catch {
    return {}
  }
}

interface RawFriendSubmission {
  node_id: string
  node_name: string
  node_parent: string
  parent_name: string
  node_creator: string
  login: string
  node_content: string
  node_created: string
  k: string | number
  creatorImageUrl?: string
}

/**
 * Fetch and parse friends' submissions data from server
 */
export async function fetchFriendsSubmissions(force = false): Promise<FriendSubmission[]> {
  const cacheKey = 'friendsSubmissions'
  if (!force) {
    const cached = getCached<FriendSubmission[]>(cacheKey)
    if (cached) return cached
  }
  const doFetch = async () => {
    const url = `${config.apiBase}${config.base}${config.templates.friendsSubmissions}`
    const response = await fetch(url)
    if (!response.ok) {
      throw new Error(`Failed to fetch friends submissions: ${response.status}`)
    }
    const html = await response.text()
    const data = extractJson<RawFriendSubmission[]>(html, 'kymono.friendsSubmissions')
    if (!data) {
      throw new Error('Failed to parse friends submissions data')
    }

    const result = data.map((r) => ({
      id: r.node_id,
      name: stripHtml(r.node_name || ''),
      parentId: r.node_parent,
      parentName: stripHtml(r.parent_name || ''),
      creatorId: r.node_creator,
      login: r.login,
      creatorImageUrl: r.creatorImageUrl || getImageUrl(r.node_creator),
      content: stripHtml(r.node_content || ''),
      createdAt: r.node_created,
      karma: typeof r.k === 'string' ? parseInt(r.k, 10) : r.k,
    }))
    setCache(cacheKey, result)
    return result
  }
  return force ? doFetch() : dedupedFetch(cacheKey, doFetch)
}

interface RawMailMessage {
  mail_id: string
  mail_from: string
  mail_from_name: string
  mail_to: string
  mail_to_name: string
  mail_text: string
  mail_timestamp: string
  mail_read: string
}

/**
 * Fetch and parse mail data from server
 */
export async function fetchMailData(force = false): Promise<MailMessage[]> {
  const cacheKey = 'mail'
  if (!force) {
    const cached = getCached<MailMessage[]>(cacheKey)
    if (cached) return cached
  }
  const doFetch = async () => {
    const url = `${config.apiBase}${config.base}${config.templates.mail}`
    const response = await fetch(url)
    if (!response.ok) {
      throw new Error(`Failed to fetch mail data: ${response.status}`)
    }
    const html = await response.text()
    const data = extractJson<RawMailMessage[]>(html, 'kymono.mail')
    if (!data) {
      throw new Error('Failed to parse mail data')
    }
    const result: MailMessage[] = data.map((m) => ({
      id: m.mail_id,
      fromId: m.mail_from,
      fromName: m.mail_from_name,
      toId: m.mail_to,
      toName: m.mail_to_name,
      text: m.mail_text,
      timestamp: m.mail_timestamp,
      read: m.mail_read === 'yes',
    }))
    setCache(cacheKey, result)
    return result
  }
  return force ? doFetch() : dedupedFetch(cacheKey, doFetch)
}
