import { useParams, Navigate } from 'react-router-dom'
import { MODULES, MODULE_ROUTES } from './Home'
import { useTitle } from '@/utils/useTitle'

export function Module() {
  const { moduleId } = useParams<{ moduleId: string }>()
  const entry = MODULES.find((m) => MODULE_ROUTES[m.id] === moduleId)
  useTitle(entry?.id ?? '')
  if (!entry) return <Navigate to="/home" replace />
  const Component = entry.component
  return <Component />
}
