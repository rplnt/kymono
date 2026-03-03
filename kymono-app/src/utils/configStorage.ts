const STORAGE_KEY = 'kymono.config'

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

function getConfig(): KymonoConfig {
  try {
    const stored = localStorage.getItem(STORAGE_KEY)
    if (stored) {
      return JSON.parse(stored)
    }
  } catch {
    // Invalid JSON, return empty config
  }
  return {}
}

function setConfig(config: KymonoConfig): void {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(config))
}

export function getConfigValue<T>(path: string, defaultValue: T): T {
  const config = getConfig()
  const parts = path.split('.')

  let current: unknown = config
  for (const part of parts) {
    if (current && typeof current === 'object' && part in current) {
      current = (current as Record<string, unknown>)[part]
    } else {
      return defaultValue
    }
  }

  return (current as T) ?? defaultValue
}

export function setConfigValue(path: string, value: unknown): void {
  const config = getConfig()
  const parts = path.split('.')

  let current: Record<string, unknown> = config as Record<string, unknown>
  for (let i = 0; i < parts.length - 1; i++) {
    const part = parts[i]
    if (!(part in current) || typeof current[part] !== 'object') {
      current[part] = {}
    }
    current = current[part] as Record<string, unknown>
  }

  current[parts[parts.length - 1]] = value
  setConfig(config)
}

export function hasConfig(): boolean {
  return localStorage.getItem(STORAGE_KEY) !== null
}

export function initConfig(version: string): void {
  if (!hasConfig()) {
    setConfig({ version })
  }
}

export { STORAGE_KEY }
