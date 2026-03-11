import type {
  BookmarkCategory,
  MpnNode,
  Person,
  OnlineFriend,
  LatestReply,
  SidebarData,
  NodeResponse,
  KItem,
  FriendSubmission,
  MailMessage,
} from '@/types'
import { config } from '@/config'
import { stripHtml } from './html'
import {
  getImageUrl,
  parseMpnJson,
  parsePeopleUsers,
  parseBookmarksJson,
  parseNodeJson,
  parseChildJson,
  parseKItem,
  parseLastKItem,
} from './parse'
import type {
  RawMpnItem,
  RawNodeResponse,
  RawKItem,
  RawLastKItem,
  RawReply,
  RawFriendSubmission,
  RawMailMessage,
} from './parse'

export { stripHtml } from './html'

const FETCH_TIMEOUT_MS = 30_000

let requestCount = 0
export function getRequestCount(): number {
  return requestCount
}

function fetchWithTimeout(input: RequestInfo | URL, init?: RequestInit): Promise<Response> {
  requestCount++
  return fetch(input, { signal: AbortSignal.timeout(FETCH_TIMEOUT_MS), ...init })
}

const CACHE_TTL_MS = 60_000

type CacheKey =
  | 'people'
  | 'sidebar'
  | 'bookmarks'
  | 'k'
  | 'friendsSubmissions'
  | 'mail'
  | `lastk-${'1h' | '1d' | '1w'}`
type InflightKey = CacheKey | `node-${string}`

interface CacheEntry<T> {
  data: T
  fetchedAt: number
}

const cache = new Map<CacheKey, CacheEntry<unknown>>()
const inflight = new Map<InflightKey, Promise<unknown>>()

function getCached<T>(key: CacheKey): T | null {
  const entry = cache.get(key)
  if (entry && Date.now() - entry.fetchedAt < CACHE_TTL_MS) {
    return entry.data as T
  }
  return null
}

function setCache<T>(key: CacheKey, data: T): void {
  cache.set(key, { data, fetchedAt: Date.now() })
}

function dedupedFetch<T>(key: InflightKey, fn: () => Promise<T>): Promise<T> {
  const existing = inflight.get(key)
  if (existing) return existing as Promise<T>
  const promise = fn().finally(() => inflight.delete(key))
  inflight.set(key, promise)
  return promise
}

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

async function cachedFetch<TRaw, TResult>(
  cacheKey: CacheKey,
  url: string,
  jsonId: string,
  transform: (raw: TRaw) => TResult,
  force: boolean
): Promise<TResult> {
  if (!force) {
    const cached = getCached<TResult>(cacheKey)
    if (cached) return cached
  }
  const doFetch = async () => {
    const response = await fetchWithTimeout(url)
    if (!response.ok) throw new Error(`Failed to fetch: ${response.status}`)
    const html = await response.text()
    const data = extractJson<TRaw>(html, jsonId)
    if (!data) throw new Error(`Failed to parse ${cacheKey} data`)
    const result = transform(data)
    setCache(cacheKey, result)
    return result
  }
  return force ? doFetch() : dedupedFetch(cacheKey, doFetch)
}

interface PeopleData {
  nodes: MpnNode[]
  users: Person[]
}

async function fetchPeopleRaw(force = false): Promise<PeopleData> {
  const cacheKey: CacheKey = 'people'
  if (!force) {
    const cached = getCached<PeopleData>(cacheKey)
    if (cached) return cached
  }
  const doFetch = async () => {
    const url = `${config.apiBase}${config.base}${config.templates.people}`
    const response = await fetchWithTimeout(url)
    if (!response.ok) throw new Error(`Failed to fetch: ${response.status}`)
    const html = await response.text()
    const data = extractJson<RawMpnItem[]>(html, 'kymono.people')
    if (!data) throw new Error('Failed to parse people data')
    const result: PeopleData = { nodes: parseMpnJson(data), users: parsePeopleUsers(data) }
    setCache(cacheKey, result)
    return result
  }
  return force ? doFetch() : dedupedFetch(cacheKey, doFetch)
}

export async function fetchMpnData(force = false): Promise<MpnNode[]> {
  return (await fetchPeopleRaw(force)).nodes
}

export async function fetchPeopleData(force = false): Promise<Person[]> {
  return (await fetchPeopleRaw(force)).users
}

export async function fetchSidebarData(force = false): Promise<SidebarData> {
  const cacheKey = 'sidebar'
  if (!force) {
    const cached = getCached<SidebarData>(cacheKey)
    if (cached) return cached
  }
  const doFetch = async () => {
    const url = `${config.apiBase}${config.base}${config.templates.sidebar}`
    const response = await fetchWithTimeout(url)
    if (!response.ok) {
      throw new Error(`Failed to fetch sidebar: ${response.status}`)
    }
    const html = await response.text()

    const friendsRaw = extractJson<
      (Omit<OnlineFriend, 'creatorImageUrl'> & { creatorImageUrl?: string })[]
    >(html, 'kymono.friends')
    const friends = friendsRaw
      ? friendsRaw.map((f) => ({
          ...f,
          creatorImageUrl: f.creatorImageUrl || getImageUrl(f.userId),
        }))
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
  return force ? doFetch() : dedupedFetch(cacheKey, doFetch)
}

export function fetchBookmarksData(force = false): Promise<BookmarkCategory[]> {
  return cachedFetch(
    'bookmarks',
    `${config.apiBase}${config.base}${config.templates.bookmarks}`,
    'kymono.bookmarks',
    parseBookmarksJson,
    force
  )
}

export async function fetchNodeData(nodeId: string, templateId?: string): Promise<NodeResponse> {
  const dedupKey: InflightKey = `node-${nodeId}-${templateId || ''}`
  const doFetch = async () => {
    const effectiveTemplateId = templateId || config.templates.node
    const url = `${config.apiBase}/id/${nodeId}/${effectiveTemplateId}`

    const response = await fetchWithTimeout(url)
    if (!response.ok) {
      throw new Error(`Failed to fetch node ${nodeId}: ${response.status}`)
    }

    const html = await response.text()
    const data = extractJson<RawNodeResponse>(html, 'kymono.node')

    if (!data) {
      if (html.includes("you don't have permissions for viewing this data node")) {
        throw new Error("you don't have permissions for viewing this data node")
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
        const lastVisit = data.node.last_visit ? new Date(data.node.last_visit) : undefined
        return (data.children || []).map((c) => parseChildJson(c, lastVisit))
      })(),
      listingAmount: data.listing_amount,
      offset: data.offset,
      anticsrf: data.anticsrf,
    }
  }
  return dedupedFetch(dedupKey, doFetch)
}

export function fetchKData(force = false): Promise<KItem[]> {
  return cachedFetch(
    'k',
    `${config.apiBase}${config.base}${config.templates.k}`,
    'kymono.k',
    (data: RawKItem[]) => data.map(parseKItem),
    force
  )
}

export async function fetchLastKData(
  interval: '1h' | '1d' | '1w' = '1h',
  force = false
): Promise<KItem[]> {
  const cacheKey = `lastk-${interval}` as const
  if (!force) {
    const cached = getCached<KItem[]>(cacheKey)
    if (cached) return cached
  }
  const doFetch = async () => {
    const url = `${config.apiBase}${config.base}${config.templates.lastK}`
    let response: Response
    if (interval === '1h') {
      response = await fetchWithTimeout(url)
    } else {
      const formData = new FormData()
      formData.append('interval', interval === '1d' ? '24' : '168')
      formData.append('template_event', 'Hour')
      response = await fetchWithTimeout(url, { method: 'POST', body: formData })
    }
    if (!response.ok) {
      throw new Error(`Failed to fetch last K data: ${response.status}`)
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

  const response = await fetchWithTimeout(url, {
    method: 'POST',
    body: formData,
    redirect: 'manual',
  })
  if (response.type !== 'opaqueredirect' && !response.ok) {
    throw new Error(`Failed to submit comment: ${response.status}`)
  }
}

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
  const response = await fetchWithTimeout(url, {
    method: 'POST',
    body: formData,
    redirect: 'manual',
  })
  if (response.type === 'opaqueredirect') return 'ok'
  if (!response.ok) {
    throw new Error(`Failed to give K: ${response.status}`)
  }
  const text = await response.text()
  if (text.includes('uz to nehul')) return 'nehul'
  if (text.includes('musis byt prihlaseny') || text.includes("don't have permissions"))
    return 'neda-sa'
  return 'ok'
}

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
  const response = await fetchWithTimeout(url, {
    method: 'POST',
    body: formData,
    redirect: 'manual',
  })
  if (response.type === 'opaqueredirect') return !isCurrentlyBookmarked
  if (!response.ok) {
    throw new Error(`Failed to toggle bookmark: ${response.status}`)
  }
  return !isCurrentlyBookmarked
}

export function getUserIdFromDom(): string | null {
  const el = document.querySelector('script#kymono\\.userId')
  return el?.textContent?.trim() || null
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

export function fetchFriendsSubmissions(force = false): Promise<FriendSubmission[]> {
  return cachedFetch(
    'friendsSubmissions',
    `${config.apiBase}${config.base}${config.templates.friendsSubmissions}`,
    'kymono.friendsSubmissions',
    (data: RawFriendSubmission[]) =>
      data.map((r) => ({
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
      })),
    force
  )
}

export interface MailDataResult {
  messages: MailMessage[]
  anticsrf?: string
}

export async function fetchMailData(force = false): Promise<MailDataResult> {
  const cacheKey: CacheKey = 'mail'
  if (!force) {
    const cached = getCached<MailDataResult>(cacheKey)
    if (cached) return cached
  }
  const doFetch = async () => {
    const url = `${config.apiBase}${config.base}${config.templates.mail}`
    const response = await fetchWithTimeout(url)
    if (!response.ok) throw new Error(`Failed to fetch: ${response.status}`)
    const html = await response.text()
    const data = extractJson<RawMailMessage[]>(html, 'kymono.mail')
    if (!data) throw new Error('Failed to parse mail data')

    const anticsrf = extractJson<string>(html, 'kymono.anticsrf') ?? undefined

    const messages = data.map((m) => ({
      id: m.mail_id,
      fromId: m.mail_from,
      fromName: m.mail_from_name,
      toId: m.mail_to,
      toName: m.mail_to_name,
      text: m.mail_text,
      timestamp: m.mail_timestamp,
      read: m.mail_read === 'yes',
    }))

    const result: MailDataResult = { messages, anticsrf }
    setCache(cacheKey, result)
    return result
  }
  return force ? doFetch() : dedupedFetch(cacheKey, doFetch)
}

export async function sendMail(
  toUserId: string,
  text: string,
  anticsrf: string
): Promise<void> {
  const url = `${config.apiBase}/id/24`
  const formData = new FormData()
  formData.append('mail_to', toUserId)
  formData.append('mail_to_type', 'id')
  formData.append('mail_text', text)
  formData.append('event', 'send')
  formData.append('anticsrf', anticsrf)

  const response = await fetchWithTimeout(url, {
    method: 'POST',
    body: formData,
    redirect: 'manual',
  })
  if (response.type !== 'opaqueredirect' && !response.ok) {
    throw new Error(`Failed to send mail: ${response.status}`)
  }
}
