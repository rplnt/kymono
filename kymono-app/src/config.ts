import type { TimeRange } from '@/types'

// API base URL: use mock server on localhost, same origin otherwise
const isLocalhost =
  typeof window !== 'undefined' &&
  (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1')
const apiBase = isLocalhost ? 'http://localhost:8099' : ''
const externalBase = isLocalhost ? 'https://kyberia.sk' : ''

export const config = {
  base: '/id/8099985/',
  name: 'KyMoNo',
  version: 'v2.0.0',
  configUrl: 'https://cdn.jsdelivr.net/gh/rplnt/kymono@master/config.json',
  apiBase,
  externalBase,
  templates: {
    bookmarks: '9300218',
    mpn: '9300200',
    nodeView: '9300812',
    children: '9300813',
  },
  mpnBlacklist: [
    4830026, 3777728, 5898094, 2176597, 3660841, 7465941, 1522695, 1569351, 7607525, 788016,
    7194717, 7568906, 3579407, 8873929, 8894278, 5286347, 8340566,
  ] as number[],
}

export const TIME_RANGES: TimeRange[] = [
  { label: '24H', minutes: 24 * 60 },
  { label: '1W', minutes: 7 * 24 * 60 },
  { label: '1M', minutes: 30 * 24 * 60 },
  { label: '23Y', minutes: 23 * 365 * 24 * 60 },
]

// Config paths for getConfigValue/setConfigValue
export const CONFIG_PATHS = {
  VERSION: 'version',
  FONT_SIZE: 'global.fontSize',
  DEFAULT_SCREEN: 'global.defaultScreen',
  MPN_ENABLED: 'home.mpnEnabled',
  MPN_ORDER: 'home.mpnOrder',
  QUICK_BOOKMARKS_ENABLED: 'home.quickBookmarksEnabled',
  QUICK_BOOKMARKS_ORDER: 'home.quickBookmarksOrder',
  FOCUS_FILTER: 'bookmarks.focusFilter',
  INCLUDE_DESCENDANTS: 'bookmarks.includeDescendants',
  DEFAULT_TIMESPAN: 'bookmarks.defaultTimespan',
  COMMENT_TOOLBAR: 'node.commentToolbar',
} as const
