import { useState, useEffect, useMemo, useCallback } from 'react'
import type { MpnNode } from '@/types'
import { config, CONFIG_PATHS } from '@/config'
import { fetchMpnData, openNode, truncate, getConfigValue } from '@/utils'

// Max number of single-user nodes to display
const MAX_SINGLE_COUNT_NODES = 10

export function MpnModule() {
  const [nodes, setNodes] = useState<MpnNode[]>([])
  const [loading, setLoading] = useState(true)
  const [enabled, setEnabled] = useState(() => getConfigValue(CONFIG_PATHS.MPN_ENABLED, true))
  const [collapsed, setCollapsed] = useState(false)

  // Load MPN data
  const loadData = useCallback(async () => {
    setLoading(true)
    try {
      const allNodes = await fetchMpnData()
      setNodes(allNodes)
    } catch (error) {
      console.error('Failed to load MPN data:', error)
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    loadData()
  }, [loadData])

  // Listen for settings changes
  useEffect(() => {
    const handleStorage = (e: StorageEvent) => {
      if (e.key === CONFIG_PATHS.MPN_ENABLED) {
        setEnabled(getConfigValue(CONFIG_PATHS.MPN_ENABLED, true))
      }
    }
    window.addEventListener('storage', handleStorage)
    return () => window.removeEventListener('storage', handleStorage)
  }, [])

  // Filter nodes according to original logic
  const filteredNodes = useMemo(() => {
    // First pass: filter by blacklist, ID, and bookm prefix
    const filtered = nodes.filter((node) => {
      const nodeId = parseInt(node.id, 10)
      const nodeName = node.name.toLowerCase()

      return !(
        nodeId <= 100 ||
        nodeName.startsWith('bookm') ||
        config.mpnBlacklist.includes(nodeId)
      )
    })

    // Find the index of the last node with count > 1
    let lastHighCountIndex = -1
    for (let i = filtered.length - 1; i >= 0; i--) {
      if (filtered[i].count > 1) {
        lastHighCountIndex = i
        break
      }
    }

    // Keep all nodes up to lastHighCountIndex, then limit trailing count=1 nodes
    const result: MpnNode[] = []
    let tailCount = 0

    for (let i = 0; i < filtered.length; i++) {
      if (i <= lastHighCountIndex) {
        result.push(filtered[i])
      } else {
        // We're in the tail of count=1 nodes
        if (tailCount < MAX_SINGLE_COUNT_NODES) {
          result.push(filtered[i])
          tailCount++
        }
      }
    }

    return result
  }, [nodes])

  // Calculate font size: (count > 5 ? 5.5 : count) * 0.43
  const getFontSize = (count: number): string => {
    const size = (count > 5 ? 5.5 : count) * 0.43
    return `${size}em`
  }

  const handleNodeClick = (e: React.MouseEvent, nodeId: string) => {
    e.preventDefault()
    openNode(nodeId)
  }

  const handleReload = (e: React.MouseEvent) => {
    e.stopPropagation()
    loadData()
  }

  const toggleCollapse = () => {
    setCollapsed((prev) => !prev)
  }

  // Hide if disabled
  if (!enabled) {
    return null
  }

  return (
    <div className="mpn-module home-module">
      <div className="module-header" onClick={toggleCollapse}>
        <span className="module-title">{collapsed ? '▸' : '▾'} most.populated.nodes</span>
        <button className="module-reload" onClick={handleReload} title="Reload">
          ↻
        </button>
      </div>

      {!collapsed && (
        <div className="module-content">
          {loading && (
            <div className="module-loading">
              <div className="sp-circle" />
            </div>
          )}

          {!loading && filteredNodes.length === 0 && (
            <p className="module-empty">No data available</p>
          )}

          {filteredNodes.length > 0 && (
            <div id="mpn">
              {filteredNodes.map((node) => (
                <span key={node.id} style={{ fontSize: getFontSize(node.count) }}>
                  {'('}
                  <a
                    href={`/id/${node.id}`}
                    className="node-link mpn-link"
                    title={`${node.name} (${node.count})`}
                    onClick={(e) => handleNodeClick(e, node.id)}
                  >
                    {truncate(node.name, 20).replace(/ /g, '\u00a0')}
                  </a>
                  {') '}
                </span>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  )
}
