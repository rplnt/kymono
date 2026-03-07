import type { SearchIndex } from '@/types'

// Slovak character normalization map
const SLOVAK_CHARS: Record<string, string> = {
  ľ: 'l',
  š: 's',
  č: 'c',
  ť: 't',
  ž: 'z',
  ý: 'y',
  á: 'a',
  í: 'i',
  é: 'e',
  ú: 'u',
  ä: 'a',
  ň: 'n',
  ô: 'o',
  ř: 'r',
  ď: 'd',
}

const RE_SLOVAK = /[ľščťžýáíéúäňôřď]/g
const RE_SPLIT = /[-_.,\\/;:|+=*&'"@$^]|(&\w+;)/g
const RE_REMOVE = /[0-9]+|[()[\]<>{}#!?%]/g

/**
 * Normalize a string for search (lowercase, remove accents)
 */
function normalizeText(text: string): string {
  return text
    .toLowerCase()
    .replace(RE_SLOVAK, (char) => SLOVAK_CHARS[char] || char)
    .replace(RE_SPLIT, ' ')
    .replace(RE_REMOVE, '')
}

/**
 * Build a search index from items
 * @param items Array of [name, id] tuples
 */
export function buildSearchIndex(items: Array<[string, string]>): SearchIndex {
  const prefixSets: Record<string, Set<string>> = {}
  const wordIdSets: Record<string, Set<string>> = {}

  for (const [name, id] of items) {
    const words = normalizeText(name).split(/\s+/).filter(Boolean)

    for (const word of words) {
      if (word.length < 3) continue

      const prefix = word.substring(0, 2)

      if (!prefixSets[prefix]) prefixSets[prefix] = new Set()
      prefixSets[prefix].add(word)

      if (!wordIdSets[word]) wordIdSets[word] = new Set()
      wordIdSets[word].add(id)
    }
  }

  const prefixIndex: Record<string, string[]> = {}
  for (const [k, v] of Object.entries(prefixSets)) prefixIndex[k] = [...v]

  const wordToIds: Record<string, string[]> = {}
  for (const [k, v] of Object.entries(wordIdSets)) wordToIds[k] = [...v]

  return { prefixIndex, wordToIds }
}

/**
 * Search the index for matching IDs
 * @param index The search index
 * @param query Search query string
 * @returns Array of matching IDs
 */
export function searchIndex(index: SearchIndex, query: string): string[] | null {
  if (!query || query.length < 2) return null

  const words = normalizeText(query)
    .split(/\s+/)
    .filter((w) => w.length >= 2)
  if (words.length === 0) return null

  let resultSet: Set<string> | null = null

  for (const queryWord of words) {
    const prefix = queryWord.substring(0, 2)
    const matchingIds = new Set<string>()

    // Find all words that start with the query word
    const prefixWords = index.prefixIndex[prefix] || []
    for (const word of prefixWords) {
      if (word.startsWith(queryWord)) {
        const ids = index.wordToIds[word] || []
        for (const id of ids) matchingIds.add(id)
      }
    }

    if (resultSet === null) {
      resultSet = matchingIds
    } else {
      // Intersect with existing results
      for (const id of resultSet) {
        if (!matchingIds.has(id)) resultSet.delete(id)
      }
    }
  }

  return resultSet ? [...resultSet] : []
}

/**
 * Truncate a string with ellipsis
 * Trims trailing spaces and punctuation before adding ellipsis
 */
export function truncate(str: string, maxLength: number): string {
  if (str.length <= maxLength) return str
  const cut = str.substring(0, maxLength - 3).replace(/[\s\-.,;:!?'"()]+$/, '')
  return cut + '...'
}
