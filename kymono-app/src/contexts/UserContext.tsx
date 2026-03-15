import { createContext, useContext, useMemo } from 'react'
import type { ReactNode } from 'react'
import { getUserIdFromDom } from '@/utils/api'

interface UserContextValue {
  userId: string | null
}

const UserContext = createContext<UserContextValue>({
  userId: null,
})

export function UserProvider({ children }: { children: ReactNode }) {
  const value = useMemo(() => ({ userId: getUserIdFromDom() }), [])

  return <UserContext.Provider value={value}>{children}</UserContext.Provider>
}

export function useUser() {
  return useContext(UserContext)
}
