import { useEffect } from 'react'

const SUFFIX = ' | KyMoNo'

export function useTitle(title: string | null | undefined) {
  useEffect(() => {
    document.title = title ? title + SUFFIX : 'KyMoNo'
  }, [title])
}
