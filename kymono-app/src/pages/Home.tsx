import { useMemo } from 'react'
import { CONFIG_PATHS } from '@/config'
import { useConfig } from '@/contexts'
import { useTitle } from '@/utils/useTitle'
import { QuickBookmarks } from '@/components/QuickBookmarks'
import { MpnModule } from '@/components/MpnModule'
import { FriendsSubmissions } from '@/components/FriendsSubmissions'
import { LatestSubmissions } from '@/components/LatestSubmissions'
import { HotNodes } from '@/components/HotNodes'
import { FreshK } from '@/components/FreshK'

export type ModuleId =
  | 'quickBookmarks'
  | 'mpn'
  | 'friendsSubmissions'
  | 'latestSubmissions'
  | 'hotNodes'
  | 'freshK'

export interface ModuleConfig {
  id: ModuleId
  component: React.ComponentType
  orderPath: string
  defaultOrder: number
}

export const MODULE_ROUTES: Record<ModuleId, string> = {
  mpn: 'mpn',
  quickBookmarks: 'quick-bookmarks',
  friendsSubmissions: 'friends-submissions',
  latestSubmissions: 'latest-submissions',
  hotNodes: 'hot-nodes',
  freshK: 'fresh-k',
}

export const MODULES: ModuleConfig[] = [
  {
    id: 'mpn',
    component: MpnModule,
    orderPath: CONFIG_PATHS.MPN_ORDER,
    defaultOrder: 0,
  },
  {
    id: 'quickBookmarks',
    component: QuickBookmarks,
    orderPath: CONFIG_PATHS.QUICK_BOOKMARKS_ORDER,
    defaultOrder: 1,
  },
  {
    id: 'friendsSubmissions',
    component: FriendsSubmissions,
    orderPath: CONFIG_PATHS.FRIENDS_SUBMISSIONS_ORDER,
    defaultOrder: 2,
  },
  {
    id: 'hotNodes',
    component: HotNodes,
    orderPath: CONFIG_PATHS.HOT_NODES_ORDER,
    defaultOrder: 3,
  },
  {
    id: 'latestSubmissions',
    component: LatestSubmissions,
    orderPath: CONFIG_PATHS.LATEST_SUBMISSIONS_ORDER,
    defaultOrder: 4,
  },
  {
    id: 'freshK',
    component: FreshK,
    orderPath: CONFIG_PATHS.FRESH_K_ORDER,
    defaultOrder: 5,
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

  const twoColumn = getValue<boolean>(CONFIG_PATHS.TWO_COLUMN_LAYOUT, true)

  return (
    <div className={twoColumn ? 'home-grid' : undefined}>
      {sortedModules.map(({ id, component: Component }) => (
        <Component key={id} />
      ))}
    </div>
  )
}
