import { createContext } from 'react'

export interface KymonoConfig {
  version?: string
  global?: {
    fontSize?: number
    defaultScreen?: string
  }
  home?: {
    mpnEnabled?: boolean
    mpnOrder?: number
    quickBookmarksEnabled?: boolean
    quickBookmarksOrder?: number
  }
  bookmarks?: {
    focusFilter?: boolean
    includeDescendants?: boolean
    defaultTimespan?: string
  }
}

export interface ConfigContextValue {
  config: KymonoConfig
  getValue: <T>(path: string, defaultValue: T) => T
  setValue: (path: string, value: unknown) => void
}

export const ConfigContext = createContext<ConfigContextValue | null>(null)
