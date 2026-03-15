import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useConfigValue } from '@/contexts'
import { CONFIG_PATHS } from '@/config'
import { getStarredList, toggleStar } from '@/utils'
import { formatRelativeDate, formatDate } from '@/utils/date'
import { useTitle } from '@/utils/useTitle'
import type { StarredNode } from '@/utils'

export function Starred() {
  const navigate = useNavigate()
  const [items, setItems] = useState(() => getStarredList())
  const [fullTimestamps] = useConfigValue<boolean>(CONFIG_PATHS.FULL_TIMESTAMPS)

  useTitle('Starred')

  const handleUnstar = (item: StarredNode) => {
    toggleStar(item.id, item.name)
    setItems(getStarredList())
  }

  if (items.length === 0) {
    return <div className="starred-empty">No starred nodes</div>
  }

  return (
    <div className="starred-list">
      {items.map((item) => {
        const date = new Date(item.addedAt)
        const timeStr = fullTimestamps ? formatDate(date) : formatRelativeDate(date)
        return (
          <div key={item.id} className="starred-item">
            <button className="star-btn active" onClick={() => handleUnstar(item)} title="Unstar">
              &#9733;
            </button>
            <a
              href={`#/id/${item.id}`}
              className="node-link"
              onClick={(e) => {
                e.preventDefault()
                navigate(`/id/${item.id}`)
              }}
            >
              {item.name}
            </a>
            <span className="starred-time">{timeStr}</span>
          </div>
        )
      })}
    </div>
  )
}
