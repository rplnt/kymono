import { useState, useEffect } from 'react'
import type { SettingTemplate, SettingOption } from '@/types'
import { mockConfig } from '@/mocks'

function getStoredValue(category: string, name: string, defaultValue: unknown): unknown {
  const key = `${category}.${name}`
  const stored = localStorage.getItem(key)
  if (stored !== null) {
    try {
      return JSON.parse(stored)
    } catch {
      return defaultValue
    }
  }
  return defaultValue
}

function setStoredValue(category: string, name: string, value: unknown): void {
  const key = `${category}.${name}`
  localStorage.setItem(key, JSON.stringify(value))
}

interface SettingControlProps {
  category: string
  option: SettingOption
}

function SettingControl({ category, option }: SettingControlProps) {
  const defaultValue = option.type === 'enum'
    ? (option.value as string[])[0]
    : option.value

  const [value, setValue] = useState(() =>
    getStoredValue(category, option.name, defaultValue)
  )

  const handleChange = (newValue: unknown) => {
    setValue(newValue)
    setStoredValue(category, option.name, newValue)
  }

  switch (option.type) {
    case 'int':
    case 'float':
    case 'string':
      return (
        <input
          type="text"
          value={String(value)}
          onChange={(e) => {
            const val = option.type === 'int'
              ? parseInt(e.target.value, 10) || 0
              : option.type === 'float'
                ? parseFloat(e.target.value) || 0
                : e.target.value
            handleChange(val)
          }}
          className="setting-input"
        />
      )

    case 'boolean':
      return (
        <input
          type="checkbox"
          checked={Boolean(value)}
          onChange={(e) => handleChange(e.target.checked)}
          className="setting-checkbox"
        />
      )

    case 'enum':
      return (
        <select
          value={String(value)}
          onChange={(e) => handleChange(e.target.value)}
          className="setting-select"
        >
          {(option.value as string[]).map((opt) => (
            <option key={opt} value={opt}>
              {opt}
            </option>
          ))}
        </select>
      )

    default:
      return <span>Unknown type: {option.type}</span>
  }
}

interface SettingSectionProps {
  section: SettingTemplate
}

function SettingSection({ section }: SettingSectionProps) {
  return (
    <div className="setting-section">
      <div className="cat-header cat">{section.title}</div>
      {section.settings.map((option) => (
        <div key={option.name} className="setting-row">
          <div className="setting-description">{option.description}</div>
          <SettingControl category={section.name} option={option} />
        </div>
      ))}
    </div>
  )
}

export function Settings() {
  const [config, setConfig] = useState<SettingTemplate[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    // Use mock config for now (real API requires auth)
    // In production, this would fetch from config.configUrl
    setConfig(mockConfig.template)
    setLoading(false)
  }, [])

  if (loading) {
    return (
      <div>
        <div className="sp-circle" />
      </div>
    )
  }

  return (
    <div>
      {config.map((section) => (
        <SettingSection key={section.name} section={section} />
      ))}
    </div>
  )
}
