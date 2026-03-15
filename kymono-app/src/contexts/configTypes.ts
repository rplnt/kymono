import { createContext } from 'react'

// Config is a nested key-value store accessed via dot-path strings (e.g. "global.fontSize").
// All access goes through getValue/setValue, so we keep the type generic.
export type KymonoConfig = Record<string, Record<string, unknown> | unknown>

export interface ConfigContextValue {
  config: KymonoConfig
  getValue: <T>(path: string, defaultValue: T) => T
  setValue: (path: string, value: unknown) => void
  resetConfig: () => void
}

export const ConfigContext = createContext<ConfigContextValue | null>(null)
