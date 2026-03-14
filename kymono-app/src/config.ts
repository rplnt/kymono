import type { TimeRange } from '@/types'

// API base URL: use mock server on localhost, same origin otherwise
const isLocalhost =
  typeof window !== 'undefined' &&
  (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1')
const apiBase = isLocalhost ? 'http://localhost:8099' : ''
const externalBase = isLocalhost ? 'https://kyberia.sk' : ''

export const config = {
  base: '/id/9301167/',
  name: 'KyMoNo',
  version: 'v2.0.3',
  configUrl: 'https://cdn.jsdelivr.net/gh/rplnt/kymono@master/config.json',
  apiBase,
  externalBase,
  templates: {
    bookmarks: '9300218',
    people: '9302170',
    replies: '9302167',
    node: '9300812',
    k: '9301229',
    friendsSubmissions: '9301246',
    mail: '9301411',
    lastK: '9301400',
  },
  mpnBlacklist: new Set([
    '4830026',
    '3777728',
    '5898094',
    '2176597',
    '3660841',
    '7465941',
    '1522695',
    '1569351',
    '7607525',
    '788016',
    '7194717',
    '7568906',
    '3579407',
    '8873929',
    '8894278',
    '5286347',
    '8340566',
    '9301167',
  ]),
}

export const TIME_RANGES: TimeRange[] = [
  { label: '24H', minutes: 24 * 60 },
  { label: '1W', minutes: 7 * 24 * 60 },
  { label: '1M', minutes: 30 * 24 * 60 },
  { label: '1Y', minutes: 365 * 24 * 60 },
  { label: 'ALL', minutes: 0 },
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
  INCLUDE_DESCENDANTS: 'bookmarks.includeDescendants',
  COMMENT_TOOLBAR: 'global.commentToolbar',
  FULL_TIMESTAMPS: 'global.fullTimestamps',
  K_PROGRESSIVE_DISPLAY: 'k.progressiveDisplay',
  K_AUTO_LOAD_SCROLL: 'k.autoLoadOnScroll',
  NODE_PROGRESSIVE_COMMENTS: 'node.progressiveComments',
  NODE_AUTO_LOAD_COMMENTS_SCROLL: 'node.autoLoadCommentsOnScroll',
  NODE_HIDE_TOPIC: 'node.hideTopic',
  NODE_HIDE_MOOD: 'node.hideMood',
  FRIENDS_SUBMISSIONS_ENABLED: 'home.friendsSubmissionsEnabled',
  FRIENDS_SUBMISSIONS_ORDER: 'home.friendsSubmissionsOrder',
  LATEST_SUBMISSIONS_ENABLED: 'home.latestSubmissionsEnabled',
  LATEST_SUBMISSIONS_ORDER: 'home.latestSubmissionsOrder',
  RESPONSIVE_YOUTUBE: 'global.responsiveYoutube',
  RESPONSIVE_IMAGES: 'global.responsiveImages',
  HOT_NODES_ENABLED: 'home.hotNodesEnabled',
  HOT_NODES_ORDER: 'home.hotNodesOrder',
  FRESH_K_ENABLED: 'home.freshKEnabled',
  FRESH_K_ORDER: 'home.freshKOrder',
  TWO_COLUMN_LAYOUT: 'home.twoColumnLayout',
  PULL_TO_REFRESH: 'global.pullToRefresh',
} as const

// Default module order (single source of truth)
export const DEFAULT_MODULE_ORDER: string[] = [
  'mpn',
  'quickBookmarks',
  'friendsSubmissions',
  'hotNodes',
  'freshK',
  'latestSubmissions',
]

// Default values for all config paths (single source of truth)
export const CONFIG_DEFAULTS: Record<string, unknown> = {
  [CONFIG_PATHS.FONT_SIZE]: 'S',
  [CONFIG_PATHS.DEFAULT_SCREEN]: 'H',
  [CONFIG_PATHS.FULL_TIMESTAMPS]: false,
  [CONFIG_PATHS.COMMENT_TOOLBAR]: true,
  [CONFIG_PATHS.RESPONSIVE_YOUTUBE]: true,
  [CONFIG_PATHS.RESPONSIVE_IMAGES]: true,
  [CONFIG_PATHS.QUICK_BOOKMARKS_ENABLED]: true,
  [CONFIG_PATHS.MPN_ENABLED]: true,
  [CONFIG_PATHS.FRIENDS_SUBMISSIONS_ENABLED]: true,
  [CONFIG_PATHS.LATEST_SUBMISSIONS_ENABLED]: false,
  [CONFIG_PATHS.HOT_NODES_ENABLED]: true,
  [CONFIG_PATHS.FRESH_K_ENABLED]: false,
  [CONFIG_PATHS.TWO_COLUMN_LAYOUT]: true,
  [CONFIG_PATHS.INCLUDE_DESCENDANTS]: true,
  [CONFIG_PATHS.K_PROGRESSIVE_DISPLAY]: true,
  [CONFIG_PATHS.K_AUTO_LOAD_SCROLL]: true,
  [CONFIG_PATHS.NODE_PROGRESSIVE_COMMENTS]: true,
  [CONFIG_PATHS.NODE_AUTO_LOAD_COMMENTS_SCROLL]: true,
  [CONFIG_PATHS.NODE_HIDE_TOPIC]: true,
  [CONFIG_PATHS.NODE_HIDE_MOOD]: true,
  [CONFIG_PATHS.PULL_TO_REFRESH]: false,
}
