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
  const index: SearchIndex = {
    prefixIndex: {},
    wordToIds: {},
  }

  for (const [name, id] of items) {
    const words = normalizeText(name).split(/\s+/).filter(Boolean)

    for (const word of words) {
      if (word.length < 3) continue

      const prefix = word.substring(0, 2)

      // Add word to prefix index
      if (!index.prefixIndex[prefix]) {
        index.prefixIndex[prefix] = []
      }
      if (!index.prefixIndex[prefix].includes(word)) {
        index.prefixIndex[prefix].push(word)
      }

      // Map word to IDs
      if (!index.wordToIds[word]) {
        index.wordToIds[word] = []
      }
      if (!index.wordToIds[word].includes(id)) {
        index.wordToIds[word].push(id)
      }
    }
  }

  return index
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

  let resultIds: string[] | null = null

  for (const queryWord of words) {
    const prefix = queryWord.substring(0, 2)
    const matchingIds: string[] = []

    // Find all words that start with the query word
    const prefixWords = index.prefixIndex[prefix] || []
    for (const word of prefixWords) {
      if (word.startsWith(queryWord)) {
        const ids = index.wordToIds[word] || []
        ids.forEach((id) => {
          if (!matchingIds.includes(id)) {
            matchingIds.push(id)
          }
        })
      }
    }

    if (resultIds === null) {
      // First word - initialize results
      resultIds = matchingIds
    } else {
      // Subsequent words - intersect with existing results
      resultIds = resultIds.filter((id) => matchingIds.includes(id))
    }
  }

  return resultIds ?? []
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
