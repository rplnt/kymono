import { useState, useCallback, type ReactNode } from 'react'
import type { NodeData } from '@/types'
import { NodeContext } from './nodeContextValue'

export function NodeProvider({ children }: { children: ReactNode }) {
  const [currentNode, setCurrentNodeState] = useState<NodeData | null>(null)
  const [anticsrf, setAnticsrfState] = useState<string | undefined>()

  const setCurrentNode = useCallback((node: NodeData | null) => {
    setCurrentNodeState(node)
  }, [])

  const setAnticsrf = useCallback((token: string | undefined) => {
    setAnticsrfState(token)
  }, [])

  return (
    <NodeContext.Provider value={{ currentNode, setCurrentNode, anticsrf, setAnticsrf }}>{children}</NodeContext.Provider>
  )
}
