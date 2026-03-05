import { parseBookmarksXml, parseMpnXml } from './api'

describe('parseBookmarksXml', () => {
  it('parses bookmark categories', () => {
    const xml = `
      <category name="Test Category" unread="5">
        <bookmark node="123" unread="3" desc="yes" visit="2024-03-15 14:30:00">Test Bookmark</bookmark>
        <bookmark node="456" unread="0" desc="no" visit="2024-03-14 10:00:00">Another Bookmark</bookmark>
      </category>
    `

    const result = parseBookmarksXml(xml)

    expect(result).toHaveLength(1)
    expect(result[0].name).toBe('Test Category')
    expect(result[0].unread).toBe(5)
    expect(result[0].bookmarks).toHaveLength(2)

    const first = result[0].bookmarks[0]
    expect(first.node).toBe('123')
    expect(first.name).toBe('Test Bookmark')
    expect(first.unread).toBe(3)
    expect(first.hasDescendants).toBe(true)

    const second = result[0].bookmarks[1]
    expect(second.unread).toBe(0)
    expect(second.hasDescendants).toBe(false)
  })

  it('skips empty categories', () => {
    const xml = `
      <category name="Empty" unread="0"></category>
      <category name="Has Items" unread="1">
        <bookmark node="123" unread="1">Item</bookmark>
      </category>
    `

    const result = parseBookmarksXml(xml)

    expect(result).toHaveLength(1)
    expect(result[0].name).toBe('Has Items')
  })

  it('sanitizes HTML in bookmark names', () => {
    const xml = `
      <category name="Test" unread="0">
        <bookmark node="1" unread="0"><b>Bold</b> and <font color="red">red</font></bookmark>
      </category>
    `

    const result = parseBookmarksXml(xml)

    expect(result[0].bookmarks[0].nameHtml).toContain('<b>Bold</b>')
    expect(result[0].bookmarks[0].nameHtml).toContain('style="color:red"')
  })

  it('strips unsafe color values', () => {
    const xml = `
      <category name="Test" unread="0">
        <bookmark node="1" unread="0"><span style="color: url(javascript:alert(1))">XSS</span></bookmark>
      </category>
    `

    const result = parseBookmarksXml(xml)

    // Should not contain the unsafe color
    expect(result[0].bookmarks[0].nameHtml).not.toContain('javascript')
    expect(result[0].bookmarks[0].nameHtml).not.toContain('url(')
  })
})

describe('parseMpnXml', () => {
  it('parses MPN data and aggregates counts', () => {
    const xml = `
      <mpn>
        <user id="1">Node One</user>
        <user id="2">Node Two</user>
        <user id="1">Node One</user>
        <user id="1">Node One</user>
      </mpn>
    `

    const result = parseMpnXml(xml)

    expect(result).toHaveLength(2)

    // First node should have count 3
    const node1 = result.find((n) => n.id === '1')
    expect(node1?.name).toBe('Node One')
    expect(node1?.count).toBe(3)

    // Second node should have count 1
    const node2 = result.find((n) => n.id === '2')
    expect(node2?.name).toBe('Node Two')
    expect(node2?.count).toBe(1)
  })

  it('preserves insertion order', () => {
    const xml = `
      <mpn>
        <user id="3">Third</user>
        <user id="1">First</user>
        <user id="2">Second</user>
      </mpn>
    `

    const result = parseMpnXml(xml)

    // Order should be based on first appearance
    expect(result[0].id).toBe('3')
    expect(result[1].id).toBe('1')
    expect(result[2].id).toBe('2')
  })

  it('handles empty XML', () => {
    const xml = '<mpn></mpn>'
    const result = parseMpnXml(xml)
    expect(result).toEqual([])
  })
})
