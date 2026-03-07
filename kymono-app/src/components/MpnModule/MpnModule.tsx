import { useState, useEffect, useMemo, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import type { MpnNode } from '@/types'
import { useConfigValue } from '@/contexts'
import { config, CONFIG_PATHS } from '@/config'
import { fetchMpnData, truncate } from '@/utils'

// Max number of single-user nodes to display
const MAX_SINGLE_COUNT_NODES = 10

export function MpnModule() {
  const navigate = useNavigate()
  const [nodes, setNodes] = useState<MpnNode[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [enabled] = useConfigValue(CONFIG_PATHS.MPN_ENABLED, true)
  const [collapsed, setCollapsed] = useState(false)

  // Load MPN data
  const loadData = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const allNodes = await fetchMpnData()
      setNodes(allNodes)
    } catch (err) {
      console.error('Failed to load MPN data:', err)
      setError('Failed to load data')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    loadData()
  }, [loadData])

  // Filter nodes according to original logic
  const filteredNodes = useMemo(() => {
    const filtered = nodes.filter((node) => {
      const nodeId = parseInt(node.id, 10)
      const nodeName = node.name.toLowerCase()

      return !(
        !node.name.trim() ||
        nodeId <= 100 ||
        nodeName.startsWith('bookm') ||
        config.mpnBlacklist.includes(nodeId)
      )
    })

    let lastHighCountIndex = -1
    for (let i = filtered.length - 1; i >= 0; i--) {
      if (filtered[i].count > 1) {
        lastHighCountIndex = i
        break
      }
    }

    const result: MpnNode[] = []
    let tailCount = 0

    for (let i = 0; i < filtered.length; i++) {
      if (i <= lastHighCountIndex) {
        result.push(filtered[i])
      } else {
        if (tailCount < MAX_SINGLE_COUNT_NODES) {
          result.push(filtered[i])
          tailCount++
        }
      }
    }

    return result
  }, [nodes])

  const getFontSize = (count: number): string => {
    const cappedCount = Math.min(count, 6)
    const size = 0.5 + (cappedCount - 1) * 0.6
    return `${size}em`
  }

  const handleNodeClick = (e: React.MouseEvent, nodeId: string) => {
    e.preventDefault()
    navigate(`/id/${nodeId}`)
  }

  const handleReload = (e: React.MouseEvent) => {
    e.stopPropagation()
    loadData()
  }

  if (!enabled) {
    return null
  }

  return (
    <div className="mpn-module home-module">
      <div className="module-header" onClick={() => setCollapsed((prev) => !prev)}>
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

          {!loading && error && (
            <p className="module-error">
              {error}{' '}
              <button className="module-retry" onClick={handleReload}>
                Retry
              </button>
            </p>
          )}

          {!loading && !error && filteredNodes.length === 0 && (
            <p className="module-empty">No data available</p>
          )}

          {filteredNodes.length > 0 && (
            <div id="mpn">
              {filteredNodes.map((node) => (
                <span key={node.id} className="mpn-entry" style={{ fontSize: getFontSize(node.count) }}>
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
