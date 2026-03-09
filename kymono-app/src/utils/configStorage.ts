export const CONFIG_STORAGE_KEY = 'kymono.config'
export const SIDEBAR_LOADED_KEY = 'kymono.sidebar.lastLoaded'

export function hasConfig(): boolean {
  return localStorage.getItem(CONFIG_STORAGE_KEY) !== null
}

export function initConfig(version: string): void {
  if (!hasConfig()) {
    localStorage.setItem(CONFIG_STORAGE_KEY, JSON.stringify({ version }))
  }
}
