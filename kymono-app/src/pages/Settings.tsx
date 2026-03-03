import { useState } from 'react'
import type { SettingTemplate, SettingOption, ConfigJson } from '@/types'
import { getConfigValue, setConfigValue } from '@/utils'
import { CONFIG_PATHS } from '@/config'

const settingsConfig: ConfigJson = {
  version: 1,
  template: [
    {
      title: 'Global',
      name: 'global',
      settings: [
        {
          name: 'fontSize',
          description: 'Application font size',
          type: 'float',
          value: 1.9,
        },
        {
          name: 'defaultScreen',
          description: 'Screen to show when KyMoNo is started',
          type: 'enum',
          value: ['H', 'B', 'K', 'F'],
        },
      ],
    },
    {
      title: 'Home',
      name: 'home',
      settings: [
        {
          name: 'quickBookmarksEnabled',
          description: 'Enable Quick Bookmarks module',
          type: 'boolean',
          value: true,
        },
        {
          name: 'mpnEnabled',
          description: 'Enable Most Populated Nodes module',
          type: 'boolean',
          value: true,
        },
        {
          name: 'moduleOrder',
          description: 'Module display order',
          type: 'moduleOrder',
          value: ['quickBookmarks', 'mpn'],
        },
      ],
    },
    {
      title: 'Bookmarks',
      name: 'bookmarks',
      settings: [
        {
          name: 'focusFilter',
          description: 'Focus to filter field on load',
          type: 'boolean',
          value: false,
        },
        {
          name: 'includeDescendants',
          description: 'NEW filter will also show nodes with new descendants',
          type: 'boolean',
          value: true,
        },
        {
          name: 'defaultTimespan',
          description: 'Default timespan of bookmarks filter',
          type: 'enum',
          value: ['24H', '1W', '1M', '23Y'],
        },
      ],
    },
  ],
}

const MODULE_LABELS: Record<string, string> = {
  quickBookmarks: 'Quick Bookmarks',
  mpn: 'Most Populated Nodes',
}

const MODULE_ORDER_PATHS: Record<string, string> = {
  quickBookmarks: CONFIG_PATHS.QUICK_BOOKMARKS_ORDER,
  mpn: CONFIG_PATHS.MPN_ORDER,
}

interface SettingControlProps {
  category: string
  option: SettingOption
}

type SettingValue = string | number | boolean | string[]

function SettingControl({ category, option }: SettingControlProps) {
  const path = `${category}.${option.name}`
  const defaultValue = option.type === 'enum' ? (option.value as string[])[0] : option.value

  const [value, setValue] = useState<SettingValue>(() =>
    getConfigValue(path, defaultValue as SettingValue)
  )

  const handleChange = (newValue: SettingValue) => {
    setValue(newValue)
    setConfigValue(path, newValue)
    // Dispatch storage event so other components can react
    window.dispatchEvent(new StorageEvent('storage', { key: path }))
  }

  switch (option.type) {
    case 'int':
      return (
        <input
          type="number"
          step="1"
          value={String(value)}
          onChange={(e) => handleChange(parseInt(e.target.value, 10) || 0)}
          className="setting-input"
        />
      )

    case 'float': {
      const options = [0.5, 0.75, 1, 1.25, 1.5, 1.75, 2, 2.25, 2.5]
      return (
        <select
          value={Number(value) || 1}
          onChange={(e) => handleChange(parseFloat(e.target.value))}
          className="setting-select"
        >
          {options.map((opt) => (
            <option key={opt} value={opt}>
              {opt}
            </option>
          ))}
        </select>
      )
    }

    case 'string':
      return (
        <input
          type="text"
          value={String(value)}
          onChange={(e) => handleChange(e.target.value)}
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

    case 'moduleOrder': {
      // Get current order from stored values, fall back to default
      const defaultOrder = option.value as string[]
      const currentOrder = [...defaultOrder].sort((a, b) => {
        const orderA = getConfigValue<number>(MODULE_ORDER_PATHS[a], defaultOrder.indexOf(a))
        const orderB = getConfigValue<number>(MODULE_ORDER_PATHS[b], defaultOrder.indexOf(b))
        return orderA - orderB
      })

      const moveUp = (index: number) => {
        if (index === 0) return
        const moduleId = currentOrder[index]
        const prevModuleId = currentOrder[index - 1]
        // Swap order values
        setConfigValue(MODULE_ORDER_PATHS[moduleId], index - 1)
        setConfigValue(MODULE_ORDER_PATHS[prevModuleId], index)
        // Trigger re-render and notify Home
        handleChange([
          ...currentOrder.slice(0, index - 1),
          moduleId,
          prevModuleId,
          ...currentOrder.slice(index + 1),
        ])
        window.dispatchEvent(new StorageEvent('storage', { key: MODULE_ORDER_PATHS[moduleId] }))
      }

      const moveDown = (index: number) => {
        if (index === currentOrder.length - 1) return
        const moduleId = currentOrder[index]
        const nextModuleId = currentOrder[index + 1]
        // Swap order values
        setConfigValue(MODULE_ORDER_PATHS[moduleId], index + 1)
        setConfigValue(MODULE_ORDER_PATHS[nextModuleId], index)
        // Trigger re-render and notify Home
        handleChange([
          ...currentOrder.slice(0, index),
          nextModuleId,
          moduleId,
          ...currentOrder.slice(index + 2),
        ])
        window.dispatchEvent(new StorageEvent('storage', { key: MODULE_ORDER_PATHS[moduleId] }))
      }

      return (
        <div className="setting-order-list">
          {currentOrder.map((moduleId, index) => (
            <div key={moduleId} className="setting-order-item">
              <span className="setting-order-label">{MODULE_LABELS[moduleId] || moduleId}</span>
              <div className="setting-order-arrows">
                <button
                  className="setting-order-btn"
                  onClick={() => moveUp(index)}
                  disabled={index === 0}
                  title="Move up"
                >
                  ▲
                </button>
                <button
                  className="setting-order-btn"
                  onClick={() => moveDown(index)}
                  disabled={index === currentOrder.length - 1}
                  title="Move down"
                >
                  ▼
                </button>
              </div>
            </div>
          ))}
        </div>
      )
    }

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
  const [config] = useState<SettingTemplate[]>(settingsConfig.template)

  return (
    <div>
      {config.map((section) => (
        <SettingSection key={section.name} section={section} />
      ))}
    </div>
  )
}
