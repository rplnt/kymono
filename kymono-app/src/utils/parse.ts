import type {
  BookmarkCategory,
  Bookmark,
  MpnNode,
  NodeData,
  NodeAncestor,
  NodeComment,
  KItem,
} from '@/types'
import { config } from '@/config'
import { parseVisitDate } from './date'
import { stripHtml, sanitizeHtml, applyNl2br } from './html'

export function getImageUrl(nodeId: string): string {
  if (!nodeId || nodeId.length < 2) return ''
  return `${config.externalBase}/images/nodes/${nodeId[0]}/${nodeId[1]}/${nodeId}.gif`
}

// Raw JSON types from server

export interface RawMpnItem {
  id: string
  name: string
}

export interface RawBookmarkChild {
  id: string
  name: string
  unread: string | number
  hasDescendants: boolean
  lastVisit: string
}

export interface RawBookmarkCategory {
  id: string | null
  name: string
  unread: number | null
  children: RawBookmarkChild[]
}

interface RawNodeAncestor {
  link: string
  name: string
}

export interface RawNode {
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
  nl2br?: string | number
  given_k?: string
  node_bookmark?: string
  last_visit?: string
  [key: string]: unknown
}

export interface RawChild {
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
  nl2br?: string | number
  given_k?: string
  [key: string]: unknown
}

export interface RawKItem {
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
  given_k?: string
  [key: string]: unknown
}

export interface RawNodeResponse {
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

export interface RawReply {
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

export interface RawLastKItem {
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

export interface RawFriendSubmission {
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

export interface RawMailMessage {
  mail_id: string
  mail_from: string
  mail_from_name: string
  mail_to: string
  mail_to_name: string
  mail_text: string
  mail_timestamp: string
  mail_read: string
}

export function parseMpnJson(items: RawMpnItem[]): MpnNode[] {
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

export function parseBookmarksJson(categories: RawBookmarkCategory[]): BookmarkCategory[] {
  const result: BookmarkCategory[] = []

  for (const cat of categories) {
    if (cat.children.length === 0) continue

    const bookmarks: Bookmark[] = cat.children.map((child, index) => {
      const nameHtml = sanitizeHtml(child.name)
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

export function parseNodeJson(
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

export function parseChildJson(raw: RawChild, lastVisit?: Date): NodeComment {
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
    givenK: raw.given_k === 'yes',
  }
}

export function parseKItem(raw: RawKItem): KItem {
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
    givenK: raw.given_k === 'yes',
  }
}

export function parseLastKItem(raw: RawLastKItem): KItem {
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
