import { useState, useEffect, useCallback, useMemo } from 'react'
import { useNavigate } from 'react-router-dom'
import type { MailMessage } from '@/types'
import { useConfigValue, useUser } from '@/contexts'
import { fetchMailData, formatRelativeString, formatDate } from '@/utils'
import { useTitle } from '@/utils/useTitle'
import { usePullToRefresh } from '@/utils/usePullToRefresh'
import { config, CONFIG_PATHS } from '@/config'
import { ExternalLinkIcon } from '@/components/ExternalLinkIcon'

interface Conversation {
  otherUserId: string
  otherUserName: string
  lastMessage: MailMessage
  messages: MailMessage[]
  hasUnread: boolean
}

function groupIntoConversations(messages: MailMessage[], userId: string | null): Conversation[] {
  const map = new Map<string, MailMessage[]>()

  for (const msg of messages) {
    const otherUserId = msg.fromId === userId ? msg.toId : msg.fromId
    const group = map.get(otherUserId)
    if (group) {
      group.push(msg)
    } else {
      map.set(otherUserId, [msg])
    }
  }

  const conversations: Conversation[] = []
  for (const [otherUserId, msgs] of map) {
    // Sort messages oldest first within conversation
    msgs.sort((a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime())
    const lastMessage = msgs[msgs.length - 1]
    const otherUserName =
      lastMessage.fromId === otherUserId ? lastMessage.fromName : lastMessage.toName
    conversations.push({
      otherUserId,
      otherUserName,
      lastMessage,
      messages: msgs,
      hasUnread: msgs.some((m) => !m.read),
    })
  }

  // Sort conversations by last message timestamp, newest first
  conversations.sort(
    (a, b) =>
      new Date(b.lastMessage.timestamp).getTime() - new Date(a.lastMessage.timestamp).getTime()
  )

  return conversations
}

function stripHtml(html: string): string {
  const tmp = document.createElement('div')
  tmp.innerHTML = html
  return tmp.textContent || tmp.innerText || ''
}

export function Mail() {
  useTitle('Mail')
  const navigate = useNavigate()
  const { userId } = useUser()
  const [messages, setMessages] = useState<MailMessage[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [selectedConversation, setSelectedConversation] = useState<string | null>(null)
  const [fullTimestamps] = useConfigValue<boolean>(CONFIG_PATHS.FULL_TIMESTAMPS)

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

  usePullToRefresh(() => loadData(true))

  useEffect(() => {
    loadData()
  }, [loadData])

  const conversations = useMemo(() => groupIntoConversations(messages, userId), [messages, userId])

  const activeConversation = useMemo(
    () =>
      selectedConversation
        ? (conversations.find((c) => c.otherUserId === selectedConversation) ?? null)
        : null,
    [conversations, selectedConversation]
  )

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

  const getImageUrl = (id: string) => {
    if (!id || id.length < 2) return ''
    return `${config.externalBase}/images/nodes/${id[0]}/${id[1]}/${id}.gif`
  }

  const formatTimestamp = (ts: string) =>
    fullTimestamps ? formatDate(new Date(ts)) : formatRelativeString(ts)

  // Conversation detail view
  if (activeConversation) {
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
        <div className="conv-header">
          <button className="conv-back" onClick={() => setSelectedConversation(null)}>
            &larr;
          </button>
          <img
            src={getImageUrl(activeConversation.otherUserId)}
            alt=""
            className="mail-avatar"
            onClick={() => navigate(`/id/${activeConversation.otherUserId}`)}
          />
          <a
            href={`#/id/${activeConversation.otherUserId}`}
            className="conv-header-name"
            onClick={(e) => {
              e.preventDefault()
              navigate(`/id/${activeConversation.otherUserId}`)
            }}
          >
            {activeConversation.otherUserName}
          </a>
        </div>
        <div className="mail-list">
          {activeConversation.messages.map((msg) => (
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

  // Conversation list view
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
        {conversations.map((conv) => (
          <div
            key={conv.otherUserId}
            className="conv-entry"
            onClick={() => setSelectedConversation(conv.otherUserId)}
          >
            <img
              src={getImageUrl(conv.otherUserId)}
              alt=""
              className="mail-avatar"
              onClick={(e) => {
                e.stopPropagation()
                navigate(`/id/${conv.otherUserId}`)
              }}
            />
            <div className="conv-body">
              <div className="conv-top">
                <span className="conv-name">{conv.otherUserName}</span>
                {conv.hasUnread && <span className="comment-badge comment-new">NEW</span>}
                <span className="mail-date">{formatTimestamp(conv.lastMessage.timestamp)}</span>
              </div>
              <div className="conv-preview">
                {conv.lastMessage.fromId === userId ? 'You' : conv.lastMessage.fromName}
                {': '}
                {stripHtml(conv.lastMessage.text)}
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
