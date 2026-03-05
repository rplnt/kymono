import { buildSearchIndex, searchIndex, truncate } from './search'

describe('buildSearchIndex', () => {
  it('creates index from items', () => {
    const items: Array<[string, string]> = [
      ['Hello World', 'id1'],
      ['Hello There', 'id2'],
      ['Goodbye World', 'id3'],
    ]

    const index = buildSearchIndex(items)

    // Check prefix index
    expect(index.prefixIndex['he']).toContain('hello')
    expect(index.prefixIndex['wo']).toContain('world')
    expect(index.prefixIndex['th']).toContain('there')
    expect(index.prefixIndex['go']).toContain('goodbye')

    // Check word to IDs mapping
    expect(index.wordToIds['hello']).toEqual(['id1', 'id2'])
    expect(index.wordToIds['world']).toEqual(['id1', 'id3'])
  })

  it('ignores short words', () => {
    const items: Array<[string, string]> = [['A to B', 'id1']]
    const index = buildSearchIndex(items)

    // Short words (< 3 chars) should not be indexed
    expect(index.prefixIndex['a']).toBeUndefined()
    expect(index.prefixIndex['to']).toBeUndefined()
  })

  it('normalizes Slovak characters', () => {
    const items: Array<[string, string]> = [['Príliš žluťoučký', 'id1']]
    const index = buildSearchIndex(items)

    // Slovak chars should be normalized
    expect(index.prefixIndex['pr']).toContain('prilis')
    expect(index.prefixIndex['zl']).toContain('zlutoucky')
  })
})

describe('searchIndex', () => {
  const items: Array<[string, string]> = [
    ['React Components', 'id1'],
    ['React Hooks Guide', 'id2'],
    ['Vue Components', 'id3'],
    ['Angular Tutorial', 'id4'],
  ]
  const index = buildSearchIndex(items)

  it('returns null for empty query', () => {
    expect(searchIndex(index, '')).toBeNull()
    expect(searchIndex(index, 'a')).toBeNull()
  })

  it('finds items by prefix', () => {
    const results = searchIndex(index, 'rea')
    expect(results).toContain('id1')
    expect(results).toContain('id2')
    expect(results).not.toContain('id3')
  })

  it('intersects multiple words', () => {
    const results = searchIndex(index, 'react comp')
    expect(results).toEqual(['id1'])
  })

  it('returns empty array for no matches', () => {
    const results = searchIndex(index, 'python')
    expect(results).toEqual([])
  })
})

describe('truncate', () => {
  it('does not truncate short strings', () => {
    expect(truncate('hello', 10)).toBe('hello')
  })

  it('truncates long strings with ellipsis', () => {
    // maxLength 10 = 7 chars + 3 for '...'
    expect(truncate('hello world test', 10)).toBe('hello w...')
  })

  it('trims trailing punctuation', () => {
    expect(truncate('hello, world!', 10)).toBe('hello...')
  })

  it('handles exact length', () => {
    expect(truncate('hello', 5)).toBe('hello')
  })
})
