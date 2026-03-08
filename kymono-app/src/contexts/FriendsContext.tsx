import { createContext, useContext, useMemo } from 'react'
import type { ReactNode } from 'react'
import { getFriendMapFromDom } from '@/utils/api'

interface FriendsContextValue {
  isFriend: (id: string) => boolean
}

const FriendsContext = createContext<FriendsContextValue>({
  isFriend: () => false,
})

export function FriendsProvider({ children }: { children: ReactNode }) {
  const friendMap = useMemo(() => getFriendMapFromDom(), [])

  const value = useMemo(
    () => ({
      isFriend: (id: string) => !!friendMap[id],
    }),
    [friendMap]
  )

  return <FriendsContext.Provider value={value}>{children}</FriendsContext.Provider>
}

export function useFriends() {
  return useContext(FriendsContext)
}
