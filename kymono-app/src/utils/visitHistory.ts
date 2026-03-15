const VISIT_HISTORY_KEY = 'kymono.visitHistory'
const VISIT_HISTORY_MAX = 50

export interface VisitEntry {
  id: string
  name: string
}

let visitedSet: Set<string> | null = null

function loadHistory(): VisitEntry[] {
  try {
    const raw = JSON.parse(localStorage.getItem(VISIT_HISTORY_KEY) || '[]')
    // Handle migration from old string[] format
    if (raw.length > 0 && typeof raw[0] === 'string') return []
    return raw
  } catch {
    return []
  }
}

export function recordVisit(nodeId: string, name: string): void {
  const history = loadHistory().filter((e) => e.id !== nodeId)
  history.push({ id: nodeId, name })
  if (history.length > VISIT_HISTORY_MAX) history.splice(0, history.length - VISIT_HISTORY_MAX)
  localStorage.setItem(VISIT_HISTORY_KEY, JSON.stringify(history))
  visitedSet = null
}

export function getVisitedSet(): Set<string> {
  if (!visitedSet) visitedSet = new Set(loadHistory().map((e) => e.id))
  return visitedSet
}

export function getVisitHistory(): VisitEntry[] {
  return loadHistory()
}
