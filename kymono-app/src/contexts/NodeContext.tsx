import { useState, useCallback, type ReactNode } from 'react'
import type { NodeData } from '@/types'
import { NodeContext } from './nodeContextValue'

export function NodeProvider({ children }: { children: ReactNode }) {
  const [currentNode, setCurrentNodeState] = useState<NodeData | null>(null)

  const setCurrentNode = useCallback((node: NodeData | null) => {
    setCurrentNodeState(node)
  }, [])

  return (
    <NodeContext.Provider value={{ currentNode, setCurrentNode }}>{children}</NodeContext.Provider>
  )
}
