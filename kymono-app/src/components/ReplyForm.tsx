import { useState, useRef } from 'react'
import { submitComment } from '@/utils'

interface ReplyFormProps {
  nodeId: string
  anticsrf: string | undefined
  onSubmitted: () => void
}

export function ReplyForm({ nodeId, anticsrf, onSubmitted }: ReplyFormProps) {
  const [replyTitle, setReplyTitle] = useState('')
  const [replyContent, setReplyContent] = useState('')
  const [replyError, setReplyError] = useState<string | null>(null)
  const [submitting, setSubmitting] = useState(false)
  const submittingRef = useRef(false)
  const textareaRef = useRef<HTMLTextAreaElement>(null)
  const cursorPosRef = useRef<number | null>(null)
  const [insertModal, setInsertModal] = useState<'link' | 'image' | null>(null)
  const [modalUrl, setModalUrl] = useState('')
  const [modalTitle, setModalTitle] = useState('')
  const [modalWidth, setModalWidth] = useState('')

  const handleSubmit = async () => {
    if (submittingRef.current) return
    if (!replyContent.trim()) return
    if (!anticsrf) {
      setReplyError('Missing CSRF token. Try reloading.')
      return
    }

    submittingRef.current = true
    setSubmitting(true)
    setReplyError(null)
    try {
      await submitComment(nodeId, replyTitle, replyContent, anticsrf)
      setReplyTitle('')
      setReplyContent('')
      await onSubmitted()
    } catch (err) {
      setReplyError(err instanceof Error ? err.message : 'Failed to submit comment')
    } finally {
      setSubmitting(false)
      submittingRef.current = false
    }
  }

  const openInsertModal = (type: 'link' | 'image') => {
    cursorPosRef.current = textareaRef.current?.selectionStart ?? null
    setModalUrl('')
    setModalTitle('')
    setModalWidth('')
    setInsertModal(type)
  }

  const handleInsert = () => {
    if (!modalUrl.trim()) return
    const widthAttr = modalWidth.trim() ? ` width="${modalWidth.trim()}"` : ''
    const html =
      insertModal === 'image'
        ? `<img src="${modalUrl.trim()}"${widthAttr}>`
        : `<a href="${modalUrl.trim()}">${modalTitle.trim() || modalUrl.trim()}</a>`

    const pos = cursorPosRef.current ?? replyContent.length
    const before = replyContent.slice(0, pos)
    const after = replyContent.slice(pos)
    setReplyContent(before + html + after)
    setInsertModal(null)
  }

  return (
    <div className="reply-form">
      <input
        type="text"
        className="reply-title input-surface"
        placeholder="Title"
        value={replyTitle}
        onChange={(e) => setReplyTitle(e.target.value)}
        disabled={submitting}
        autoComplete="off"
        autoCorrect="off"
      />
      <textarea
        ref={textareaRef}
        className="reply-content input-surface"
        placeholder="Content"
        value={replyContent}
        onChange={(e) => setReplyContent(e.target.value)}
        rows={4}
        disabled={submitting}
        autoComplete="off"
        autoCorrect="off"
      />
      {replyError && <p className="reply-error">{replyError}</p>}
      <div className="reply-actions">
        <button
          className="reply-submit"
          disabled={submitting || !replyContent.trim()}
          onClick={handleSubmit}
        >
          {submitting ? 'Submitting...' : 'Add'}
        </button>
        <div className="reply-toolbar">
          <button
            className="reply-toolbar-btn"
            title="Insert link"
            disabled={submitting}
            onClick={() => openInsertModal('link')}
          >
            <svg
              width="14"
              height="14"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
            >
              <path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71" />
              <path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71" />
            </svg>
          </button>
          <button
            className="reply-toolbar-btn"
            title="Insert image"
            disabled={submitting}
            onClick={() => openInsertModal('image')}
          >
            <svg
              width="14"
              height="14"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
            >
              <rect x="3" y="3" width="18" height="18" rx="2" ry="2" />
              <circle cx="8.5" cy="8.5" r="1.5" />
              <polyline points="21 15 16 10 5 21" />
            </svg>
          </button>
        </div>
      </div>
      {insertModal && (
        <div className="insert-modal-backdrop" onClick={() => setInsertModal(null)}>
          <div className="insert-modal" onClick={(e) => e.stopPropagation()}>
            <div className="insert-modal-title">Insert {insertModal}</div>
            <input
              type="url"
              className="insert-modal-input input-surface"
              placeholder="URL"
              value={modalUrl}
              onChange={(e) => setModalUrl(e.target.value)}
              autoFocus
              autoComplete="off"
              onKeyDown={(e) => {
                if (e.key === 'Enter') handleInsert()
              }}
            />
            {insertModal === 'link' && (
              <input
                type="text"
                className="insert-modal-input input-surface"
                placeholder="Title (optional)"
                value={modalTitle}
                onChange={(e) => setModalTitle(e.target.value)}
                autoComplete="off"
                onKeyDown={(e) => {
                  if (e.key === 'Enter') handleInsert()
                }}
              />
            )}
            {insertModal === 'image' && (
              <input
                type="number"
                className="insert-modal-input input-surface"
                placeholder="Width (optional, e.g. 300)"
                value={modalWidth}
                onChange={(e) => setModalWidth(e.target.value)}
                autoComplete="off"
                onKeyDown={(e) => {
                  if (e.key === 'Enter') handleInsert()
                }}
              />
            )}
            <div className="insert-modal-actions">
              <button className="reply-submit" disabled={!modalUrl.trim()} onClick={handleInsert}>
                Insert
              </button>
              <button className="reply-submit" onClick={() => setInsertModal(null)}>
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
