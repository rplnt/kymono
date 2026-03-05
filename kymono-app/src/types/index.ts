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
