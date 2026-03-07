const STORAGE_KEY = 'kymono.config'

export function hasConfig(): boolean {
  return localStorage.getItem(STORAGE_KEY) !== null
}

export function initConfig(version: string): void {
  if (!hasConfig()) {
    localStorage.setItem(STORAGE_KEY, JSON.stringify({ version }))
  }
}
