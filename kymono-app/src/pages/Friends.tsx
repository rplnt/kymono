import { useTitle } from '@/utils/useTitle'

export function Mail() {
  useTitle('Mail')
  return (
    <div className="empty-state">
      <div className="empty-state-icon">&#9993;</div>
      <p className="empty-state-text">mail nie sa</p>
    </div>
  )
}
