// Settings configuration types
export interface SettingTemplate {
  title: string
  name: string
  settings: SettingOption[]
}

export interface SettingOption {
  name: string
  description: string
  type: 'int' | 'float' | 'string' | 'boolean' | 'enum'
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
