import { useContext, useCallback } from 'react'
import { ConfigContext } from './configTypes'
import type { ConfigContextValue } from './configTypes'
import { CONFIG_DEFAULTS } from '@/config'

export function useConfig(): ConfigContextValue {
  const context = useContext(ConfigContext)
  if (!context) {
    throw new Error('useConfig must be used within a ConfigProvider')
  }
  return context
}

// Convenience hook for a single config value with automatic updates
export function useConfigValue<T>(path: string, defaultValue?: T): [T, (value: T) => void] {
  const { getValue, setValue } = useConfig()
  const fallback = (defaultValue !== undefined ? defaultValue : CONFIG_DEFAULTS[path]) as T
  const value = getValue(path, fallback)
  const updateValue = useCallback((newValue: T) => setValue(path, newValue), [path, setValue])
  return [value, updateValue]
}
