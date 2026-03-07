import { createContext, useContext, useState, useCallback, type ReactNode } from 'react'
import type { NodeData } from '@/types'

interface NodeContextValue {
  currentNode: NodeData | null
  setCurrentNode: (node: NodeData | null) => void
}

const NodeContext = createContext<NodeContextValue | null>(null)

export function NodeProvider({ children }: { children: ReactNode }) {
  const [currentNode, setCurrentNodeState] = useState<NodeData | null>(null)

  const setCurrentNode = useCallback((node: NodeData | null) => {
    setCurrentNodeState(node)
  }, [])

  return (
    <NodeContext.Provider value={{ currentNode, setCurrentNode }}>{children}</NodeContext.Provider>
  )
}

export function useCurrentNode() {
  const context = useContext(NodeContext)
  if (!context) {
    throw new Error('useCurrentNode must be used within a NodeProvider')
  }
  return context
}
