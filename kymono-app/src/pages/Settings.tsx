import type { SettingTemplate, SettingOption, ConfigJson } from '@/types'
import { useConfig } from '@/contexts'
import { CONFIG_PATHS } from '@/config'
import { useTitle } from '@/utils/useTitle'

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
          value: true,
        },
        {
          name: 'commentToolbar',
          description: 'Show prev/next navigation between sibling nodes',
          type: 'boolean',
          value: true,
        },
        {
          name: 'responsiveYoutube',
          description: 'Resize YouTube embeds to fit screen width',
          type: 'boolean',
          value: true,
        },
        {
          name: 'responsiveImages',
          description: 'Resize images to fit screen width',
          type: 'boolean',
          value: true,
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
          name: 'friendsSubmissionsEnabled',
          description: "Enable Friends' Submissions module",
          type: 'boolean',
          value: true,
        },
        {
          name: 'latestSubmissionsEnabled',
          description: 'Enable Latest Submissions module',
          type: 'boolean',
          value: false,
        },
        {
          name: 'hotNodesEnabled',
          description: 'Enable Hot Nodes module',
          type: 'boolean',
          value: false,
        },
        {
          name: 'twoColumnLayout',
          description: 'Two-column layout on desktop',
          type: 'boolean',
          value: true,
        },
        {
          name: 'moduleOrder',
          description: 'Module display order',
          type: 'moduleOrder',
          value: ['mpn', 'quickBookmarks', 'friendsSubmissions', 'hotNodes', 'latestSubmissions'],
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
          value: true,
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
          value: true,
        },
        {
          name: 'autoLoadOnScroll',
          description: 'Auto-load next item on scroll to bottom',
          type: 'boolean',
          value: true,
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
          value: true,
        },
        {
          name: 'autoLoadCommentsOnScroll',
          description: 'Auto-load next group on scroll to bottom',
          type: 'boolean',
          value: true,
        },
      ],
    },
  ],
}

const MODULE_LABELS: Record<string, string> = {
  quickBookmarks: 'Quick Bookmarks',
  mpn: 'Most Populated Nodes',
  friendsSubmissions: "Friends' Submissions",
  latestSubmissions: 'Latest Submissions',
  hotNodes: 'Hot Nodes',
}

const MODULE_ORDER_PATHS: Record<string, string> = {
  quickBookmarks: CONFIG_PATHS.QUICK_BOOKMARKS_ORDER,
  mpn: CONFIG_PATHS.MPN_ORDER,
  friendsSubmissions: CONFIG_PATHS.FRIENDS_SUBMISSIONS_ORDER,
  latestSubmissions: CONFIG_PATHS.LATEST_SUBMISSIONS_ORDER,
  hotNodes: CONFIG_PATHS.HOT_NODES_ORDER,
}

type SettingValue = string | number | boolean | string[]

interface ModuleOrderControlProps {
  defaultOrder: string[]
}

function ModuleOrderControl({ defaultOrder }: ModuleOrderControlProps) {
  const { getValue, setValue: setConfigValue } = useConfig()

  const currentOrder = [...defaultOrder].sort((a, b) => {
    const orderA = getValue<number>(MODULE_ORDER_PATHS[a], defaultOrder.indexOf(a))
    const orderB = getValue<number>(MODULE_ORDER_PATHS[b], defaultOrder.indexOf(b))
    return orderA - orderB
  })

  const moveUp = (index: number) => {
    if (index === 0) return
    const moduleId = currentOrder[index]
    const prevModuleId = currentOrder[index - 1]
    setConfigValue(MODULE_ORDER_PATHS[moduleId], index - 1)
    setConfigValue(MODULE_ORDER_PATHS[prevModuleId], index)
  }

  const moveDown = (index: number) => {
    if (index === currentOrder.length - 1) return
    const moduleId = currentOrder[index]
    const nextModuleId = currentOrder[index + 1]
    setConfigValue(MODULE_ORDER_PATHS[moduleId], index + 1)
    setConfigValue(MODULE_ORDER_PATHS[nextModuleId], index)
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

    case 'moduleOrder':
      return <ModuleOrderControl defaultOrder={option.value as string[]} />

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

export function Settings() {
  useTitle('Settings')
  return (
    <div>
      {settingsConfig.template.map((section) => (
        <SettingSection key={section.name} section={section} />
      ))}
    </div>
  )
}
