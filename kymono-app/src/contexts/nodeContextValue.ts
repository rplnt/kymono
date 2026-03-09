import { createContext } from 'react'
import type { NodeData } from '@/types'

export interface NodeContextValue {
  currentNode: NodeData | null
  setCurrentNode: (node: NodeData | null) => void
  anticsrf?: string
  setAnticsrf: (token: string | undefined) => void
}

export const NodeContext = createContext<NodeContextValue | null>(null)
