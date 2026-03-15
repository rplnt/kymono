const STARRED_KEY = 'kymono.starred'

export interface StarredNode {
  id: string
  name: string
  addedAt: string // ISO timestamp
}

let starredMap: Map<string, StarredNode> | null = null

function loadStarred(): StarredNode[] {
  try {
    return JSON.parse(localStorage.getItem(STARRED_KEY) || '[]')
  } catch {
    return []
  }
}

function saveStarred(list: StarredNode[]): void {
  localStorage.setItem(STARRED_KEY, JSON.stringify(list))
  starredMap = null
}

export function toggleStar(nodeId: string, name: string): boolean {
  const list = loadStarred()
  const idx = list.findIndex((s) => s.id === nodeId)
  if (idx >= 0) {
    list.splice(idx, 1)
    saveStarred(list)
    return false
  }
  list.push({ id: nodeId, name, addedAt: new Date().toISOString() })
  saveStarred(list)
  return true
}

export function isStarred(nodeId: string): boolean {
  return getStarredMap().has(nodeId)
}

export function getStarredMap(): Map<string, StarredNode> {
  if (!starredMap) {
    starredMap = new Map(loadStarred().map((s) => [s.id, s]))
  }
  return starredMap
}

export function getStarredList(): StarredNode[] {
  return loadStarred().reverse()
}
