import { useTitle } from '@/utils/useTitle'

export function K() {
  useTitle('K')
  return (
    <div className="empty-state">
      <div className="empty-state-icon">&#9733;</div>
      <p className="empty-state-text">K module not yet implemented</p>
    </div>
  )
}
