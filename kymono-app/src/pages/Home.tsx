import { useState, useEffect } from 'react'
import { CONFIG_PATHS } from '@/config'
import { getConfigValue } from '@/utils'
import { QuickBookmarks } from '@/components/QuickBookmarks'
import { MpnModule } from '@/components/MpnModule'

type ModuleId = 'quickBookmarks' | 'mpn'

interface ModuleConfig {
  id: ModuleId
  component: React.ComponentType
  orderPath: string
  defaultOrder: number
}

const MODULES: ModuleConfig[] = [
  {
    id: 'quickBookmarks',
    component: QuickBookmarks,
    orderPath: CONFIG_PATHS.QUICK_BOOKMARKS_ORDER,
    defaultOrder: 0
  },
  {
    id: 'mpn',
    component: MpnModule,
    orderPath: CONFIG_PATHS.MPN_ORDER,
    defaultOrder: 1
  }
]

function getSortedModules(): ModuleConfig[] {
  // Get modules with their current order indices
  const modulesWithOrder = MODULES.map(mod => ({
    ...mod,
    order: getConfigValue<number>(mod.orderPath, mod.defaultOrder)
  }))

  // Sort by order index (handles gaps automatically)
  return modulesWithOrder.sort((a, b) => a.order - b.order)
}

export function Home() {
  const [sortedModules, setSortedModules] = useState<ModuleConfig[]>(getSortedModules)

  // Listen for settings changes
  useEffect(() => {
    const handleStorage = (e: StorageEvent) => {
      // Check if any module order path changed
      const isOrderPath = MODULES.some(mod => mod.orderPath === e.key)
      if (isOrderPath) {
        setSortedModules(getSortedModules())
      }
    }
    window.addEventListener('storage', handleStorage)
    return () => window.removeEventListener('storage', handleStorage)
  }, [])

  return (
    <div>
      {sortedModules.map(({ id, component: Component }) => (
        <Component key={id} />
      ))}
    </div>
  )
}
