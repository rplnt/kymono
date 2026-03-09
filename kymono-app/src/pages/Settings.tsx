import { useState } from 'react'
import type { SettingTemplate, SettingOption, ConfigJson } from '@/types'
import { useConfig } from '@/contexts'
import { CONFIG_PATHS, CONFIG_DEFAULTS, DEFAULT_MODULE_ORDER } from '@/config'
import { useTitle } from '@/utils/useTitle'

function d(path: string): number | string | boolean | string[] {
  return CONFIG_DEFAULTS[path] as number | string | boolean | string[]
}

const settingsConfig: ConfigJson = {
  version: 1,
  template: [
    {
      title: 'Global',
      name: 'global',
      settings: [
        {
          name: 'fontSize',
          description: 'Size',
          type: 'enum',
          value: ['S', 'M', 'L', 'XL'],
        },
        {
          name: 'defaultScreen',
          description: 'Screen to show when KyMoNo is started',
          type: 'enum',
          value: ['H', 'B', 'K', 'M'],
        },
        {
          name: 'fullTimestamps',
          description: 'Display full timestamps',
          type: 'boolean',
          value: d(CONFIG_PATHS.FULL_TIMESTAMPS),
        },
        {
          name: 'commentToolbar',
          description: 'Show prev/next navigation between sibling nodes',
          type: 'boolean',
          value: d(CONFIG_PATHS.COMMENT_TOOLBAR),
        },
        {
          name: 'responsiveYoutube',
          description: 'Resize YouTube embeds to fit screen width',
          type: 'boolean',
          value: d(CONFIG_PATHS.RESPONSIVE_YOUTUBE),
        },
        {
          name: 'responsiveImages',
          description: 'Resize images to fit screen width',
          type: 'boolean',
          value: d(CONFIG_PATHS.RESPONSIVE_IMAGES),
        },
        {
          name: 'pullToRefresh',
          description: 'Pull to refresh on touch devices',
          type: 'boolean',
          value: d(CONFIG_PATHS.PULL_TO_REFRESH),
        },
      ],
    },
    {
      title: 'Home',
      name: 'home',
      settings: [
        {
          name: 'twoColumnLayout',
          description: 'Two-column layout on desktop',
          type: 'boolean',
          value: d(CONFIG_PATHS.TWO_COLUMN_LAYOUT),
        },
        {
          name: 'modules',
          description: 'Modules',
          type: 'modules',
          value: '',
        },
      ],
    },
    {
      title: 'Bookmarks',
      name: 'bookmarks',
      settings: [
        {
          name: 'includeDescendants',
          description: 'NEW filter will also show nodes with new descendants',
          type: 'boolean',
          value: d(CONFIG_PATHS.INCLUDE_DESCENDANTS),
        },
      ],
    },
    {
      title: 'K',
      name: 'k',
      settings: [
        {
          name: 'progressiveDisplay',
          description: 'Progressive load (display items in batches)',
          type: 'boolean',
          value: d(CONFIG_PATHS.K_PROGRESSIVE_DISPLAY),
        },
        {
          name: 'autoLoadOnScroll',
          description: 'Auto-load next item on scroll to bottom',
          type: 'boolean',
          value: d(CONFIG_PATHS.K_AUTO_LOAD_SCROLL),
        },
      ],
    },
    {
      title: 'Node',
      name: 'node',
      settings: [
        {
          name: 'progressiveComments',
          description: 'Progressive load (display comment groups in batches)',
          type: 'boolean',
          value: d(CONFIG_PATHS.NODE_PROGRESSIVE_COMMENTS),
        },
        {
          name: 'autoLoadCommentsOnScroll',
          description: 'Auto-load next group on scroll to bottom',
          type: 'boolean',
          value: d(CONFIG_PATHS.NODE_AUTO_LOAD_COMMENTS_SCROLL),
        },
        {
          name: 'hideTopic',
          description: 'Hide topic by default (forums & nodeshells)',
          type: 'boolean',
          value: d(CONFIG_PATHS.NODE_HIDE_TOPIC),
        },
      ],
    },
  ],
}

const MODULE_CONFIG: { id: string; label: string; enabledPath: string; orderPath: string }[] = [
  {
    id: 'quickBookmarks',
    label: 'Quick Bookmarks',
    enabledPath: CONFIG_PATHS.QUICK_BOOKMARKS_ENABLED,
    orderPath: CONFIG_PATHS.QUICK_BOOKMARKS_ORDER,
  },
  {
    id: 'mpn',
    label: 'Most Populated Nodes',
    enabledPath: CONFIG_PATHS.MPN_ENABLED,
    orderPath: CONFIG_PATHS.MPN_ORDER,
  },
  {
    id: 'friendsSubmissions',
    label: "Friends' Submissions",
    enabledPath: CONFIG_PATHS.FRIENDS_SUBMISSIONS_ENABLED,
    orderPath: CONFIG_PATHS.FRIENDS_SUBMISSIONS_ORDER,
  },
  {
    id: 'latestSubmissions',
    label: 'Latest Submissions',
    enabledPath: CONFIG_PATHS.LATEST_SUBMISSIONS_ENABLED,
    orderPath: CONFIG_PATHS.LATEST_SUBMISSIONS_ORDER,
  },
  {
    id: 'hotNodes',
    label: 'Hot Nodes',
    enabledPath: CONFIG_PATHS.HOT_NODES_ENABLED,
    orderPath: CONFIG_PATHS.HOT_NODES_ORDER,
  },
  {
    id: 'freshK',
    label: 'Fresh K',
    enabledPath: CONFIG_PATHS.FRESH_K_ENABLED,
    orderPath: CONFIG_PATHS.FRESH_K_ORDER,
  },
]

type SettingValue = string | number | boolean | string[]

function ModuleControl() {
  const { getValue, setValue: setConfigValue } = useConfig()

  const sorted = [...MODULE_CONFIG].sort((a, b) => {
    const defA = DEFAULT_MODULE_ORDER.indexOf(a.id)
    const defB = DEFAULT_MODULE_ORDER.indexOf(b.id)
    const orderA = getValue<number>(a.orderPath, defA === -1 ? 999 : defA)
    const orderB = getValue<number>(b.orderPath, defB === -1 ? 999 : defB)
    return orderA - orderB
  })

  const moveUp = (index: number) => {
    if (index === 0) return
    const cur = sorted[index]
    const prev = sorted[index - 1]
    setConfigValue(cur.orderPath, index - 1)
    setConfigValue(prev.orderPath, index)
  }

  const moveDown = (index: number) => {
    if (index === sorted.length - 1) return
    const cur = sorted[index]
    const next = sorted[index + 1]
    setConfigValue(cur.orderPath, index + 1)
    setConfigValue(next.orderPath, index)
  }

  return (
    <div className="setting-order-list">
      {sorted.map((mod, index) => {
        const enabledDefault = (CONFIG_DEFAULTS[mod.enabledPath] as boolean) ?? true
        const enabled = getValue<boolean>(mod.enabledPath, enabledDefault)
        return (
          <div key={mod.id} className="setting-order-item">
            <label className="setting-order-toggle">
              <input
                type="checkbox"
                className="setting-checkbox"
                checked={Boolean(enabled)}
                onChange={(e) => setConfigValue(mod.enabledPath, e.target.checked)}
              />
              <span className="setting-order-label">{mod.label}</span>
            </label>
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
                disabled={index === sorted.length - 1}
                title="Move down"
              >
                ▼
              </button>
            </div>
          </div>
        )
      })}
    </div>
  )
}

interface SettingControlProps {
  category: string
  option: SettingOption
}

function SettingControl({ category, option }: SettingControlProps) {
  const { getValue, setValue: setConfigValue } = useConfig()
  const path = `${category}.${option.name}`
  const defaultValue = option.type === 'enum' ? (option.value as string[])[0] : option.value
  const value = getValue(path, defaultValue as SettingValue)

  const handleChange = (newValue: SettingValue) => {
    setConfigValue(path, newValue)
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

    case 'modules':
      return <ModuleControl />

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
      {section.settings.map((option) => {
        const inner = (
          <>
            <div className="setting-description">{option.description}</div>
            <SettingControl category={section.name} option={option} />
          </>
        )
        if (option.type === 'modules') {
          return (
            <div key={option.name}>
              <SettingControl category={section.name} option={option} />
            </div>
          )
        }
        return option.type === 'boolean' ? (
          <label key={option.name} className="setting-row setting-row-toggle">
            {inner}
          </label>
        ) : (
          <div key={option.name} className="setting-row">
            {inner}
          </div>
        )
      })}
    </div>
  )
}

function ResetConfigButton() {
  const { resetConfig } = useConfig()
  const [confirming, setConfirming] = useState(false)

  return (
    <button
      className={`btn-reset-config ${confirming ? 'btn-reset-confirm' : ''}`}
      onClick={() => {
        if (confirming) {
          resetConfig()
          setConfirming(false)
        } else {
          setConfirming(true)
        }
      }}
      onBlur={() => setConfirming(false)}
    >
      {confirming ? 'confirm reset' : 'reset config'}
    </button>
  )
}

export function Settings() {
  useTitle('Settings')
  return (
    <div>
      {settingsConfig.template.map((section) => (
        <SettingSection key={section.name} section={section} />
      ))}
      <div className="setting-section">
        <ResetConfigButton />
      </div>
    </div>
  )
}
