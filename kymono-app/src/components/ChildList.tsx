import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import type { NodeComment } from '@/types'

interface ChildListProps {
  items: NodeComment[]
}

export function ChildList({ items }: ChildListProps) {
  const navigate = useNavigate()
  const [filter, setFilter] = useState('')

  const sorted = [...items].sort((a, b) => a.name.localeCompare(b.name))
  const filtered = filter
    ? sorted.filter((c) => c.name.toLowerCase().includes(filter.toLowerCase()))
    : sorted

  return (
    <>
      <input
        type="search"
        className="child-filter"
        placeholder="Filter..."
        value={filter}
        onChange={(e) => setFilter(e.target.value)}
        autoComplete="off"
      />
      {filtered.map((child) => (
        <div key={child.id} className="node-child-item list-row">
          <a
            href={`#/id/${child.id}`}
            className="node-child-name"
            onClick={(e) => {
              e.preventDefault()
              navigate(`/id/${child.id}`)
            }}
          >
            {child.name || `node ${child.id}`}
          </a>
          {child.childrenCount > 0 && (
            <span className="node-child-children">{child.childrenCount}</span>
          )}
          {child.karma > 0 && <span className="node-child-karma karma-value">{child.karma}K</span>}
          <a
            href={`#/id/${child.creatorId}`}
            className="node-child-author"
            onClick={(e) => {
              e.preventDefault()
              navigate(`/id/${child.creatorId}`)
            }}
          >
            {child.owner}
          </a>
        </div>
      ))}
    </>
  )
}
