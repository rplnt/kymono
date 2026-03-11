import { useState, useEffect, useMemo } from 'react'
import { useNavigate } from 'react-router-dom'
import type { Person } from '@/types'
import { fetchPeopleData, truncate } from '@/utils'

interface FriendsOnlineProps {
  onNavigate?: () => void
}

function formatIdle(minutes: number, seconds: number): string {
  if (minutes === 0 && seconds === 0) return 'now'
  if (minutes === 0) return `${seconds}s`
  return `${minutes}m`
}

export function FriendsOnline({ onNavigate: onNav }: FriendsOnlineProps) {
  const navigate = useNavigate()
  const [people, setPeople] = useState<Person[]>([])

  useEffect(() => {
    fetchPeopleData()
      .then(setPeople)
      .catch(() => {})
  }, [])

  const friends = useMemo(
    () =>
      people
        .filter((p) => p.isFriend)
        .sort((a, b) => {
          const idleA = (a.idleMinutes ?? 0) * 60 + (a.idleSeconds ?? 0)
          const idleB = (b.idleMinutes ?? 0) * 60 + (b.idleSeconds ?? 0)
          return idleA - idleB
        }),
    [people]
  )

  if (friends.length === 0) return null

  return (
    <div className="friends-online-section">
      <div className="friends-online-header">
        <span className="friends-online-title">friends</span>
      </div>

      <div className="friends-online-list">
        {friends.map((friend) => (
          <div key={friend.userId} className="friend-entry">
            <img
              src={friend.creatorImageUrl || ''}
              alt={friend.login}
              className="friend-icon"
              onError={(e) => {
                ;(e.target as HTMLImageElement).style.display = 'none'
              }}
            />
            <div className="friend-info">
              <div className="friend-line-1">
                <a
                  href={`#/id/${friend.userId}`}
                  className="friend-name"
                  onClick={(e) => {
                    e.preventDefault()
                    navigate(`/id/${friend.userId}`)
                    onNav?.()
                  }}
                >
                  {friend.login}
                </a>
                {friend.idleMinutes != null && friend.idleSeconds != null && (
                  <span className="friend-idle">
                    {formatIdle(friend.idleMinutes, friend.idleSeconds)}
                  </span>
                )}
              </div>
              {friend.locationId && friend.location && (
                <div className="friend-line-2">
                  <a
                    href={`#/id/${friend.locationId}`}
                    className="friend-location"
                    title={friend.location}
                    onClick={(e) => {
                      e.preventDefault()
                      navigate(`/id/${friend.locationId}`)
                      onNav?.()
                    }}
                  >
                    {truncate(friend.location, 25)}
                  </a>
                </div>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
