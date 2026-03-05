import { useState, useCallback, useEffect, useMemo } from 'react'
import type { ReactNode } from 'react'
import { ConfigContext } from './configTypes'
import type { KymonoConfig } from './configTypes'

const STORAGE_KEY = 'kymono.config'

function loadConfig(): KymonoConfig {
  try {
    const stored = localStorage.getItem(STORAGE_KEY)
    if (stored) {
      return JSON.parse(stored)
    }
  } catch {
    // Invalid JSON, return empty config
  }
  return {}
}

function saveConfig(config: KymonoConfig): void {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(config))
}

function getValueFromConfig<T>(config: KymonoConfig, path: string, defaultValue: T): T {
  const parts = path.split('.')
  let current: unknown = config

  for (const part of parts) {
    if (current && typeof current === 'object' && part in current) {
      current = (current as Record<string, unknown>)[part]
    } else {
      return defaultValue
    }
  }

  return (current as T) ?? defaultValue
}

function setValueInConfig(config: KymonoConfig, path: string, value: unknown): KymonoConfig {
  const newConfig = { ...config }
  const parts = path.split('.')

  let current: Record<string, unknown> = newConfig as Record<string, unknown>
  for (let i = 0; i < parts.length - 1; i++) {
    const part = parts[i]
    if (!(part in current) || typeof current[part] !== 'object') {
      current[part] = {}
    } else {
      // Clone nested objects to maintain immutability
      current[part] = { ...(current[part] as Record<string, unknown>) }
    }
    current = current[part] as Record<string, unknown>
  }

  current[parts[parts.length - 1]] = value
  return newConfig
}

interface ConfigProviderProps {
  children: ReactNode
}

export function ConfigProvider({ children }: ConfigProviderProps) {
  const [config, setConfig] = useState<KymonoConfig>(loadConfig)

  // Listen for storage events from other tabs
  useEffect(() => {
    const handleStorage = (e: StorageEvent) => {
      if (e.key === STORAGE_KEY) {
        setConfig(loadConfig())
      }
    }
    window.addEventListener('storage', handleStorage)
    return () => window.removeEventListener('storage', handleStorage)
  }, [])

  const getValue = useCallback(
    <T,>(path: string, defaultValue: T): T => {
      return getValueFromConfig(config, path, defaultValue)
    },
    [config]
  )

  const setValue = useCallback((path: string, value: unknown) => {
    setConfig((prev) => {
      const newConfig = setValueInConfig(prev, path, value)
      saveConfig(newConfig)
      return newConfig
    })
  }, [])

  const contextValue = useMemo(() => ({ config, getValue, setValue }), [config, getValue, setValue])

  return <ConfigContext.Provider value={contextValue}>{children}</ConfigContext.Provider>
}
