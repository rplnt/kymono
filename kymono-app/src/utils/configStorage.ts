export const CONFIG_STORAGE_KEY = 'kymono.config'
// Newest reply's server-side createdAt (e.g. "2026-03-10 14:23:05"),
// used as watermark to split "new" vs "older" replies
export const SIDEBAR_LOADED_KEY = 'kymono.sidebar.lastLoaded'

export function hasConfig(): boolean {
  return localStorage.getItem(CONFIG_STORAGE_KEY) !== null
}

export function initConfig(version: string): void {
  if (!hasConfig()) {
    localStorage.setItem(CONFIG_STORAGE_KEY, JSON.stringify({ version }))
  }
}
