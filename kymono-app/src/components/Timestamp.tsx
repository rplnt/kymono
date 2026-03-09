import { useState } from 'react'
import { formatDate, formatRelativeDate } from '@/utils'

// Cycles: relative → full created → full edited → relative (if edited)
//         relative → full created → relative (if not edited)
export function Timestamp({
  createdAt,
  updatedAt,
  fullTimestamps,
}: {
  createdAt: Date | null
  updatedAt: Date | null
  fullTimestamps: boolean
}) {
  // 0 = default (uses fullTimestamps setting), 1 = full created, 2 = full edited
  const [mode, setMode] = useState(0)

  if (!createdAt) return null

  const cycle = (e: React.MouseEvent) => {
    e.stopPropagation()
    if (mode === 0) {
      setMode(fullTimestamps ? (updatedAt ? 2 : 0) : 1)
    } else if (mode === 1) {
      setMode(updatedAt ? 2 : 0)
    } else {
      setMode(0)
    }
  }

  const showFull = mode === 1 || mode === 2 || (mode === 0 && fullTimestamps)
  const showEdited = mode === 2
  const date = showEdited && updatedAt ? updatedAt : createdAt

  return (
    <span className="comment-date comment-date-clickable" onClick={cycle}>
      {showFull ? formatDate(date) : formatRelativeDate(createdAt)}
      {updatedAt && <span className={showEdited ? 'comment-date-edited' : undefined}>*</span>}
    </span>
  )
}
