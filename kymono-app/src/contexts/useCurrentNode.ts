import { useContext } from 'react'
import { NodeContext } from './nodeContextValue'

export function useCurrentNode() {
  const context = useContext(NodeContext)
  if (!context) {
    throw new Error('useCurrentNode must be used within a NodeProvider')
  }
  return context
}
