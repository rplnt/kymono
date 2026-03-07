// Settings configuration types
export interface SettingTemplate {
  title: string
  name: string
  settings: SettingOption[]
}

export interface SettingOption {
  name: string
  description: string
  type: 'int' | 'float' | 'string' | 'boolean' | 'enum' | 'moduleOrder'
  value: number | string | boolean | string[]
}

export interface ConfigJson {
  version: number
  template: SettingTemplate[]
}

// Bookmark types
export interface BookmarkCategory {
  name: string
  unread: number
  bookmarks: Bookmark[]
}

export interface Bookmark {
  id: string
  node: string
  name: string
  nameHtml: string
  unread: number
  hasDescendants: boolean
  visitedAt: Date | null
}

// Home page types
export interface MpnNode {
  id: string
  name: string
  count: number
}

export interface OnlineFriend {
  userId: string
  login: string
  imageUrl: string
  locationId: string
  location: string
  idleMinutes: number
  idleSeconds: number
}

export interface LatestReply {
  id: string
  name: string
  parentId: string
  parentName: string
  creatorId: string
  login: string
  imageUrl: string
  content: string
  createdAt: string
}

export interface SidebarData {
  friends: OnlineFriend[]
  replies: LatestReply[]
}

export interface FriendSubmission {
  id: string
  name: string
  parentId: string
  parentName: string
  creatorId: string
  login: string
  imageUrl: string
  content: string
  createdAt: string
  karma: number
}

// Search index types
export interface SearchIndex {
  prefixIndex: Record<string, string[]>
  wordToIds: Record<string, string[]>
}

// Time range for bookmarks filter
export interface TimeRange {
  label: string
  minutes: number
}

// Node view types
export interface NodeAncestor {
  id: string
  name: string
}

export interface NodeData {
  id: string
  name: string
  nameHtml: string
  content: string
  parentId: string
  parentName: string
  creatorId: string
  owner: string
  templateId: string
  createdAt: Date
  updatedAt: Date | null
  karma: number
  imageUrl: string
  ancestors: NodeAncestor[]
  canWrite: boolean
  childrenCount: number
  views: number
}

// Node comment/child types
export interface NodeComment {
  id: string
  parentId: string
  depth: number
  creatorId: string
  owner: string
  name: string
  content: string
  templateId: string
  createdAt: Date
  updatedAt: Date | null
  karma: number
  childrenCount: number
  imageUrl: string
  isNew: boolean
  isOrphan: boolean
  contentChanged: boolean
  isHardlink: boolean
}

// K (karma) item type
export interface KItem {
  id: string
  name: string
  content: string
  parentId: string
  parentName: string
  creatorId: string
  owner: string
  templateId: string
  createdAt: Date
  updatedAt: Date | null
  karma: number
  childrenCount: number
  imageUrl: string
}

// Combined node + children response
export interface NodeResponse {
  node: NodeData
  children: NodeComment[]
  listingAmount: number
  offset: number
}
