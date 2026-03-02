import { useState, useEffect, useMemo } from 'react'
import type { MpnNode } from '@/types'
import { config, STORAGE_KEYS } from '@/config'
import { parseMpnXml, openNode, truncate } from '@/utils'
import { mockMpnXml } from '@/mocks'

function getMpnEnabled(): boolean {
  const stored = localStorage.getItem(STORAGE_KEYS.MPN_ENABLED)
  if (stored !== null) {
    try {
      return JSON.parse(stored)
    } catch {
      return true
    }
  }
  return true
}

export function Home() {
  const [nodes, setNodes] = useState<MpnNode[]>([])
  const [loading, setLoading] = useState(true)
  const [mpnEnabled, setMpnEnabled] = useState(getMpnEnabled)

  useEffect(() => {
    // Check if MPN is enabled
    if (!mpnEnabled) {
      setLoading(false)
      return
    }

    // Load MPN data (using mock for now)
    const allNodes = parseMpnXml(mockMpnXml)
    setNodes(allNodes)
    setLoading(false)
  }, [mpnEnabled])

  // Filter and limit nodes according to original logic
  const filteredNodes = useMemo(() => {
    let limitOne = 4
    const result: MpnNode[] = []

    for (const node of nodes) {
      if (limitOne <= 0) break

      const nodeId = parseInt(node.id, 10)
      const nodeName = node.name.toLowerCase()

      // Skip nodes with ID < 30, starting with "bookm", or in blacklist
      if (
        nodeId < 30 ||
        nodeName.startsWith('bookm') ||
        config.mpnBlacklist.includes(nodeId)
      ) {
        continue
      }

      // Track entries with count <= 1
      if (node.count <= 1) {
        limitOne--
      }

      result.push(node)
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

  // Listen for settings changes
  useEffect(() => {
    const handleStorage = (e: StorageEvent) => {
      if (e.key === STORAGE_KEYS.MPN_ENABLED) {
        setMpnEnabled(getMpnEnabled())
      }
    }
    window.addEventListener('storage', handleStorage)
    return () => window.removeEventListener('storage', handleStorage)
  }, [])

  if (loading) {
    return (
      <div>
        <div className="sp-circle" />
      </div>
    )
  }

  if (!mpnEnabled) {
    return (
      <div>
        <p>MPN module is disabled. Enable it in Settings.</p>
      </div>
    )
  }

  return (
    <div>
      <div className="cat-header cat">most.populated.nodes</div>
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
    </div>
  )
}
