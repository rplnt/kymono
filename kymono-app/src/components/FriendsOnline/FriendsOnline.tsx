import { useNavigate } from 'react-router-dom'
import type { OnlineFriend } from '@/types'
import { truncate } from '@/utils'

interface FriendsOnlineProps {
  friends: OnlineFriend[]
}

function formatIdle(minutes: number, seconds: number): string {
  if (minutes === 0 && seconds === 0) return 'now'
  if (minutes === 0) return `${seconds}s`
  return `${minutes}m`
}

export function FriendsOnline({ friends }: FriendsOnlineProps) {
  const navigate = useNavigate()

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
              src={friend.imageUrl}
              alt={friend.login}
              className="friend-icon"
              onError={(e) => { (e.target as HTMLImageElement).style.display = 'none' }}
            />
            <div className="friend-info">
              <div className="friend-line-1">
                <a
                  href={`#/id/${friend.userId}`}
                  className="friend-name"
                  onClick={(e) => {
                    e.preventDefault()
                    navigate(`/id/${friend.userId}`)
                  }}
                >
                  {friend.login}
                </a>
                <span className="friend-idle">{formatIdle(friend.idleMinutes, friend.idleSeconds)}</span>
              </div>
              <div className="friend-line-2">
                <a
                  href={`#/id/${friend.locationId}`}
                  className="friend-location"
                  title={friend.location}
                  onClick={(e) => {
                    e.preventDefault()
                    navigate(`/id/${friend.locationId}`)
                  }}
                >
                  {truncate(friend.location, 25)}
                </a>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
