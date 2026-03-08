import { useState, useEffect, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import type { MailMessage } from '@/types'
import { useConfigValue } from '@/contexts'
import { fetchMailData, formatRelativeString, formatDate } from '@/utils'
import { useTitle } from '@/utils/useTitle'
import { config, CONFIG_PATHS } from '@/config'
import { ExternalLinkIcon } from '@/components/ExternalLinkIcon'

export function Mail() {
  useTitle('Mail')
  const navigate = useNavigate()
  const [messages, setMessages] = useState<MailMessage[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [fullTimestamps] = useConfigValue(CONFIG_PATHS.FULL_TIMESTAMPS, true)

  const loadData = useCallback(async (force = false) => {
    setLoading(true)
    setError(null)
    try {
      const data = await fetchMailData(force)
      setMessages(data)
    } catch (err) {
      console.error('Failed to load mail:', err)
      setError('Failed to load mail')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    loadData()
  }, [loadData])

  if (loading) {
    return (
      <div>
        <div className="sp-circle" />
      </div>
    )
  }

  if (error) {
    return (
      <div className="error-container">
        <p className="error-message">{error}</p>
        <button className="btn btn-retry" onClick={() => loadData(true)}>
          Retry
        </button>
      </div>
    )
  }

  if (messages.length === 0) {
    return (
      <div className="empty-state">
        <div className="empty-state-icon">&#9993;</div>
        <p className="empty-state-text">No mail</p>
      </div>
    )
  }

  const getImageUrl = (userId: string) => {
    if (!userId || userId.length < 2) return ''
    return `${config.externalBase}/images/nodes/${userId[0]}/${userId[1]}/${userId}.gif`
  }

  const formatTimestamp = (ts: string) =>
    fullTimestamps ? formatDate(new Date(ts)) : formatRelativeString(ts)

  return (
    <div className="mail-view">
      <div className="mail-header">
        <a
          href={`${config.externalBase}/id/21`}
          target="_blank"
          rel="noopener noreferrer"
          className="mail-header-link"
          title="Open mail on kyberia"
        >
          visit /id/21 <ExternalLinkIcon />
        </a>
        <button className="mail-reload" onClick={() => loadData(true)} title="Reload">
          ↻
        </button>
      </div>
      <div className="mail-list">
        {messages.map((msg) => (
          <div key={msg.id} className="mail-entry">
            <div className="mail-meta">
              <img
                src={getImageUrl(msg.fromId)}
                alt=""
                className="mail-avatar"
                onClick={() => navigate(`/id/${msg.fromId}`)}
              />
              <a
                href={`#/id/${msg.fromId}`}
                className="mail-from"
                onClick={(e) => {
                  e.preventDefault()
                  navigate(`/id/${msg.fromId}`)
                }}
              >
                {msg.fromName}
              </a>
              <span className="mail-arrow">&rarr;</span>
              <a
                href={`#/id/${msg.toId}`}
                className="mail-to"
                onClick={(e) => {
                  e.preventDefault()
                  navigate(`/id/${msg.toId}`)
                }}
              >
                {msg.toName}
              </a>
              {!msg.read && <span className="comment-badge comment-new">NEW</span>}
              <span className="mail-date">{formatTimestamp(msg.timestamp)}</span>
            </div>
            <div className="mail-body" dangerouslySetInnerHTML={{ __html: msg.text }} />
          </div>
        ))}
      </div>
    </div>
  )
}
