import { useState, useEffect, useMemo, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import type { MpnNode } from '@/types'
import { useConfigValue } from '@/contexts'
import { config, CONFIG_PATHS } from '@/config'
import { fetchMpnData, truncate, getVisitedSet } from '@/utils'
import { HomeModule } from '@/components/HomeModule'

// Max number of single-user nodes to display
const MAX_SINGLE_COUNT_NODES = 10

export function MpnModule({ forceRefresh }: { forceRefresh?: boolean }) {
  const navigate = useNavigate()
  const [nodes, setNodes] = useState<MpnNode[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [enabled] = useConfigValue(CONFIG_PATHS.MPN_ENABLED)

  const loadData = useCallback(async (force = false) => {
    setLoading(true)
    setError(null)
    try {
      const allNodes = await fetchMpnData(force)
      setNodes(allNodes)
    } catch (err) {
      console.error('Failed to load MPN data:', err)
      setError('errorrrr')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    if (enabled) loadData(forceRefresh)
  }, [loadData, forceRefresh, enabled])

  // Filter nodes according to original logic
  const filteredNodes = useMemo(() => {
    const filtered = nodes.filter((node) => {
      const nodeName = node.name.toLowerCase()

      return !(
        !node.name.trim() ||
        parseInt(node.id, 10) <= 100 ||
        nodeName.startsWith('bookm') ||
        config.mpnBlacklist.has(node.id)
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

  const visited = useMemo(() => getVisitedSet(), [filteredNodes])

  const handleNodeClick = (e: React.MouseEvent, nodeId: string) => {
    e.preventDefault()
    navigate(`/id/${nodeId}`)
  }

  if (!enabled) {
    return null
  }

  return (
    <HomeModule
      title="most.populated.nodes"
      slug="mpn"
      loading={loading}
      error={error}
      empty={filteredNodes.length === 0}
      onReload={() => loadData(true)}
    >
      {filteredNodes.length > 0 && (
        <div id="mpn">
          {filteredNodes.map((node) => (
            <span key={node.id} className="mpn-entry" style={{ fontSize: getFontSize(node.count) }}>
              {'('}
              <a
                href={`/id/${node.id}`}
                className={`node-link mpn-link${visited.has(node.id) ? ' visited' : ''}`}
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
    </HomeModule>
  )
}
