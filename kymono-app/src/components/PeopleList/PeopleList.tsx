import { useState, useMemo } from 'react'
import { useNavigate } from 'react-router-dom'
import type { Person } from '@/types'

interface PeopleListProps {
  people: Person[]
  onNavigate?: () => void
}

export function PeopleList({ people, onNavigate: onNav }: PeopleListProps) {
  const navigate = useNavigate()
  const [expanded, setExpanded] = useState(false)

  const others = useMemo(
    () =>
      people
        .filter((p) => !p.isFriend && (p.idleMinutes ?? 0) < 60)
        .sort((a, b) => a.login.localeCompare(b.login)),
    [people]
  )

  if (others.length === 0) return null

  return (
    <div className="people-section">
      <div className="people-header" onClick={() => setExpanded((v) => !v)}>
        <span className="people-title">people ({others.length})</span>
        <span className="people-toggle">{expanded ? '−' : '+'}</span>
      </div>

      {expanded && (
        <div className="people-list">
          {others.map((p) => (
            <a
              key={p.userId}
              href={`#/id/${p.userId}`}
              className="people-name"
              onClick={(e) => {
                e.preventDefault()
                navigate(`/id/${p.userId}`)
                onNav?.()
              }}
            >
              {p.login}
            </a>
          ))}
        </div>
      )}
    </div>
  )
}
