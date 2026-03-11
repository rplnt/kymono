import { useState, useEffect, useCallback, useMemo, useRef } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import type { MailMessage, Person } from '@/types'
import { useConfigValue, useUser } from '@/contexts'
import {
  fetchMailData,
  fetchPeopleData,
  sendMail,
  formatRelativeString,
  formatDate,
  stripHtml,
} from '@/utils'
import type { MailDataResult } from '@/utils'
import { useTitle } from '@/utils/useTitle'
import { usePullToRefresh } from '@/utils/usePullToRefresh'
import { config, CONFIG_PATHS } from '@/config'

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
    msgs.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())
    const lastMessage = msgs[0]
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

  conversations.sort(
    (a, b) =>
      new Date(b.lastMessage.timestamp).getTime() - new Date(a.lastMessage.timestamp).getTime()
  )

  return conversations
}

type SendState = 'idle' | 'sending' | 'sent' | 'error'

function ReplyForm({
  otherUserId,
  anticsrf,
  onSent,
}: {
  otherUserId: string
  anticsrf: string | undefined
  onSent: () => void
}) {
  const [text, setText] = useState('')
  const [sendState, setSendState] = useState<SendState>('idle')

  const handleSend = async () => {
    if (!text.trim() || !anticsrf) return
    setSendState('sending')
    try {
      await sendMail(otherUserId, text.trim(), anticsrf)
      setSendState('sent')
      setText('')
      onSent()
    } catch (err) {
      console.error('Failed to send mail:', err)
      setSendState('error')
    }
  }

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && (e.metaKey || e.ctrlKey)) {
      handleSend()
    }
  }

  useEffect(() => {
    if (sendState === 'sent' || sendState === 'error') {
      const t = setTimeout(() => setSendState('idle'), 2000)
      return () => clearTimeout(t)
    }
  }, [sendState])

  return (
    <div className="mail-reply-form">
      <textarea
        className="mail-reply-textarea"
        value={text}
        onChange={(e) => setText(e.target.value)}
        onKeyDown={handleKeyDown}
        placeholder="Write a message..."
        rows={3}
        disabled={sendState === 'sending'}
      />
      <div className="mail-reply-actions">
        <button
          className="btn btn-send"
          onClick={handleSend}
          disabled={!text.trim() || !anticsrf || sendState === 'sending'}
        >
          {sendState === 'sending'
            ? 'sending...'
            : sendState === 'sent'
              ? 'sent'
              : sendState === 'error'
                ? 'err'
                : 'send'}
        </button>
      </div>
    </div>
  )
}

function NewConversationSearch({
  conversations,
  onSelect,
  onCancel,
}: {
  conversations: Conversation[]
  onSelect: (userId: string) => void
  onCancel: () => void
}) {
  const [query, setQuery] = useState('')
  const [people, setPeople] = useState<Person[]>([])
  const [loadingPeople, setLoadingPeople] = useState(false)
  const inputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    inputRef.current?.focus()
  }, [])

  useEffect(() => {
    let cancelled = false
    setLoadingPeople(true)
    fetchPeopleData()
      .then((data) => {
        if (!cancelled) {
          setPeople(data)
          setLoadingPeople(false)
        }
      })
      .catch(() => {
        if (!cancelled) setLoadingPeople(false)
      })
    return () => {
      cancelled = true
    }
  }, [])

  const suggestions = useMemo(() => {
    const q = query.trim().toLowerCase()
    if (!q) return []

    const results: { userId: string; label: string; source: 'people' | 'contact' }[] = []
    const seen = new Set<string>()

    // Search people (by login)
    for (const p of people) {
      if (p.login.toLowerCase().includes(q)) {
        if (!seen.has(p.userId)) {
          seen.add(p.userId)
          results.push({ userId: p.userId, label: p.login, source: 'people' })
        }
      }
    }

    // Search existing mail contacts (by name)
    for (const conv of conversations) {
      if (conv.otherUserName.toLowerCase().includes(q)) {
        if (!seen.has(conv.otherUserId)) {
          seen.add(conv.otherUserId)
          results.push({
            userId: conv.otherUserId,
            label: conv.otherUserName,
            source: 'contact',
          })
        }
      }
    }

    // If query is numeric, offer direct ID
    if (/^\d+$/.test(q) && !seen.has(q)) {
      results.push({ userId: q, label: `user #${q}`, source: 'contact' })
    }

    return results.slice(0, 15)
  }, [query, people, conversations])

  return (
    <div className="new-conv-search">
      <div className="new-conv-header">
        <button className="conv-back" onClick={onCancel}>
          &larr;
        </button>
        <input
          ref={inputRef}
          className="new-conv-input"
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === 'Enter' && suggestions.length > 0) {
              onSelect(suggestions[0].userId)
            }
          }}
          placeholder={loadingPeople ? 'Loading people...' : 'Search by login or name...'}
        />
      </div>
      {suggestions.length > 0 && (
        <div className="new-conv-results">
          {suggestions.map((s, i) => (
            <div
              key={s.userId}
              className={`new-conv-result${i === 0 ? ' new-conv-result-active' : ''}`}
              onClick={() => onSelect(s.userId)}
            >
              <img src={getImageUrl(s.userId)} alt="" className="mail-avatar" />
              <span className="new-conv-result-label">{s.label}</span>
            </div>
          ))}
        </div>
      )}
      {query.trim() && suggestions.length === 0 && !loadingPeople && (
        <div className="new-conv-empty">No matches</div>
      )}
    </div>
  )
}

function getImageUrl(id: string) {
  if (!id || id.length < 2) return ''
  return `${config.externalBase}/images/nodes/${id[0]}/${id[1]}/${id}.gif`
}

export function Mail() {
  useTitle('Mail')
  const navigate = useNavigate()
  const { userId: routeUserId } = useParams<{ userId?: string }>()
  const { userId } = useUser()
  const [messages, setMessages] = useState<MailMessage[]>([])
  const [anticsrf, setAnticsrf] = useState<string | undefined>()
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [selectedConversation, setSelectedConversation] = useState<string | null>(null)
  const [showNewConversation, setShowNewConversation] = useState(false)
  const [fullTimestamps] = useConfigValue<boolean>(CONFIG_PATHS.FULL_TIMESTAMPS)

  const loadData = useCallback(async (force = false) => {
    setLoading(true)
    setError(null)
    try {
      const result: MailDataResult = await fetchMailData(force)
      setMessages(result.messages)
      setAnticsrf(result.anticsrf)
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

  // Sync selected conversation to route param
  useEffect(() => {
    if (routeUserId) {
      setSelectedConversation(routeUserId)
      setShowNewConversation(false)
    } else {
      setSelectedConversation(null)
      setShowNewConversation(false)
    }
  }, [routeUserId])

  useEffect(() => {
    const handler = (e: Event) => {
      if ((e as CustomEvent).detail === '/mail') {
        setSelectedConversation(null)
        setShowNewConversation(false)
      }
    }
    window.addEventListener('menu-nav-reset', handler)
    return () => window.removeEventListener('menu-nav-reset', handler)
  }, [])

  const conversations = useMemo(() => groupIntoConversations(messages, userId), [messages, userId])

  const activeConversation = useMemo(
    () =>
      selectedConversation
        ? (conversations.find((c) => c.otherUserId === selectedConversation) ?? null)
        : null,
    [conversations, selectedConversation]
  )

  const handleReplySent = useCallback(() => {
    // Reload mail data after sending
    loadData(true)
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

  if (routeUserId && !/^\d+$/.test(routeUserId)) {
    return (
      <div className="error-container">
        <p className="error-message">Invalid user ID: {routeUserId}</p>
        <button className="btn btn-retry" onClick={() => navigate('/mail', { replace: true })}>
          Back to mail
        </button>
      </div>
    )
  }

  const formatTimestamp = (ts: string) =>
    fullTimestamps ? formatDate(new Date(ts)) : formatRelativeString(ts)

  // New conversation search view
  if (showNewConversation) {
    return (
      <div className="mail-view">
        <div className="mail-header">
          <button className="mail-reload" onClick={() => loadData(true)} title="Reload">
            ↻
          </button>
        </div>
        <NewConversationSearch
          conversations={conversations}
          onSelect={(uid) => {
            setShowNewConversation(false)
            setSelectedConversation(uid)
            navigate(`/mail/${uid}`, { replace: true })
          }}
          onCancel={() => setShowNewConversation(false)}
        />
      </div>
    )
  }

  // Conversation detail view (existing or empty for route-based userId)
  if (selectedConversation) {
    return (
      <div className="mail-view">
        <div className="mail-header">
          <button className="mail-reload" onClick={() => loadData(true)} title="Reload">
            ↻
          </button>
        </div>
        <div className="conv-header">
          <button
            className="conv-back"
            onClick={() => {
              setSelectedConversation(null)
              navigate('/mail', { replace: true })
            }}
          >
            &larr;
          </button>
          <img
            src={getImageUrl(selectedConversation)}
            alt=""
            className="mail-avatar"
            onClick={() => navigate(`/id/${selectedConversation}`)}
          />
          <a
            href={`#/id/${selectedConversation}`}
            className="conv-header-name"
            onClick={(e) => {
              e.preventDefault()
              navigate(`/id/${selectedConversation}`)
            }}
          >
            {activeConversation?.otherUserName || `#${selectedConversation}`}
          </a>
        </div>
        <ReplyForm
          otherUserId={selectedConversation}
          anticsrf={anticsrf}
          onSent={handleReplySent}
        />
        {activeConversation ? (
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
        ) : (
          <div className="mail-list">
            <div className="empty-state">
              <p className="empty-state-text">No messages yet</p>
            </div>
          </div>
        )}
        <div className="mail-more">
          <a href={`${config.externalBase}/id/24`} target="_blank" rel="noopener noreferrer">
            more in /id/24
          </a>
        </div>
      </div>
    )
  }

  // Conversation list view
  return (
    <div className="mail-view">
      <div className="mail-header">
        <button className="btn btn-new-conv" onClick={() => setShowNewConversation(true)}>
          new mail
        </button>
        <button className="mail-reload" onClick={() => loadData(true)} title="Reload">
          ↻
        </button>
      </div>
      {messages.length === 0 ? (
        <div className="empty-state">
          <div className="empty-state-icon">&#9993;</div>
          <p className="empty-state-text">No mail</p>
        </div>
      ) : (
        <div className="mail-list">
          {conversations.map((conv) => (
            <div
              key={conv.otherUserId}
              className="conv-entry"
              onClick={() => {
                setSelectedConversation(conv.otherUserId)
                navigate(`/mail/${conv.otherUserId}`, { replace: true })
              }}
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
                  {conv.lastMessage.fromId === userId ? 'you' : conv.lastMessage.fromName}
                  {': '}
                  {stripHtml(conv.lastMessage.text)}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
      <div className="mail-more">
        <a href={`${config.externalBase}/id/24`} target="_blank" rel="noopener noreferrer">
          more in /id/24
        </a>
      </div>
    </div>
  )
}
