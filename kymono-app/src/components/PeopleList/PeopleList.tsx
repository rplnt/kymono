import { useState, useEffect, useMemo } from 'react'
import { useNavigate } from 'react-router-dom'
import type { Person } from '@/types'
import { fetchPeopleData } from '@/utils'

interface PeopleListProps {
  onNavigate?: () => void
}

export function PeopleList({ onNavigate: onNav }: PeopleListProps) {
  const navigate = useNavigate()
  const [people, setPeople] = useState<Person[]>([])
  const [expanded, setExpanded] = useState(false)

  useEffect(() => {
    fetchPeopleData()
      .then(setPeople)
      .catch(() => {})
  }, [])

  const others = useMemo(
    () => people.filter((p) => !p.isFriend).sort((a, b) => a.login.localeCompare(b.login)),
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
