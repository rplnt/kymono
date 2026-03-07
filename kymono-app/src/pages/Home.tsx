import { useMemo } from 'react'
import { CONFIG_PATHS } from '@/config'
import { useConfig } from '@/contexts'
import { useTitle } from '@/utils/useTitle'
import { QuickBookmarks } from '@/components/QuickBookmarks'
import { MpnModule } from '@/components/MpnModule'
import { FriendsSubmissions } from '@/components/FriendsSubmissions'

type ModuleId = 'quickBookmarks' | 'mpn' | 'friendsSubmissions'

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
    defaultOrder: 0,
  },
  {
    id: 'mpn',
    component: MpnModule,
    orderPath: CONFIG_PATHS.MPN_ORDER,
    defaultOrder: 1,
  },
  {
    id: 'friendsSubmissions',
    component: FriendsSubmissions,
    orderPath: CONFIG_PATHS.FRIENDS_SUBMISSIONS_ORDER,
    defaultOrder: 2,
  },
]

export function Home() {
  useTitle('Home')
  const { getValue } = useConfig()

  const sortedModules = useMemo(() => {
    const modulesWithOrder = MODULES.map((mod) => ({
      ...mod,
      order: getValue<number>(mod.orderPath, mod.defaultOrder),
    }))
    return modulesWithOrder.sort((a, b) => a.order - b.order)
  }, [getValue])

  return (
    <div>
      {sortedModules.map(({ id, component: Component }) => (
        <Component key={id} />
      ))}
    </div>
  )
}
