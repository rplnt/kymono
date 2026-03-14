// Safe color patterns - hex, named colors, rgb/rgba, hsl/hsla
const SAFE_COLOR_PATTERNS = [
  /^#[0-9a-f]{3}$/i, // #RGB
  /^#[0-9a-f]{6}$/i, // #RRGGBB
  /^#[0-9a-f]{8}$/i, // #RRGGBBAA
  /^[a-z]{3,20}$/i, // Named colors (red, blue, darkgreen, etc.)
  /^rgb\(\s*\d{1,3}\s*,\s*\d{1,3}\s*,\s*\d{1,3}\s*\)$/i, // rgb(r,g,b)
  /^rgba\(\s*\d{1,3}\s*,\s*\d{1,3}\s*,\s*\d{1,3}\s*,\s*[\d.]+\s*\)$/i, // rgba(r,g,b,a)
  /^hsl\(\s*\d{1,3}\s*,\s*\d{1,3}%\s*,\s*\d{1,3}%\s*\)$/i, // hsl(h,s%,l%)
  /^hsla\(\s*\d{1,3}\s*,\s*\d{1,3}%\s*,\s*\d{1,3}%\s*,\s*[\d.]+\s*\)$/i, // hsla(h,s%,l%,a)
]

function sanitizeColor(color: string): string | null {
  const trimmed = color.trim()
  for (const pattern of SAFE_COLOR_PATTERNS) {
    if (pattern.test(trimmed)) {
      return trimmed
    }
  }
  return null
}

export function stripHtml(html: string): string {
  const parser = new DOMParser()
  const doc = parser.parseFromString(`<div>${html}</div>`, 'text/html')
  return doc.body.textContent?.trim() || ''
}

export function sanitizeHtml(html: string): string {
  const parser = new DOMParser()
  const doc = parser.parseFromString(`<div>${html}</div>`, 'text/html')
  const root = doc.body.firstChild as HTMLElement

  function processNode(node: Node): string {
    if (node.nodeType === Node.TEXT_NODE) {
      return node.textContent || ''
    }

    if (node.nodeType !== Node.ELEMENT_NODE) {
      return ''
    }

    const el = node as HTMLElement
    const tag = el.tagName.toLowerCase()
    const children = Array.from(el.childNodes).map(processNode).join('')

    // Bold tags
    if (tag === 'b' || tag === 'strong') {
      return `<b>${children}</b>`
    }

    // Italic tags
    if (tag === 'i' || tag === 'em') {
      return `<i>${children}</i>`
    }

    // Font tag - only keep color if safe
    if (tag === 'font') {
      const rawColor = el.getAttribute('color')
      const color = rawColor ? sanitizeColor(rawColor) : null
      if (color) {
        return `<span style="color:${color}">${children}</span>`
      }
      return children
    }

    // Span - only keep color from style if safe
    if (tag === 'span') {
      const style = el.getAttribute('style') || ''
      const colorMatch = style.match(/color\s*:\s*([^;]+)/i)
      if (colorMatch) {
        const color = sanitizeColor(colorMatch[1])
        if (color) {
          return `<span style="color:${color}">${children}</span>`
        }
      }
      return children
    }

    // Any other tag - just return children
    return children
  }

  return processNode(root)
}

function escapeHtml(text: string): string {
  return text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
}

export function sanitizeMailHtml(html: string): string {
  const parser = new DOMParser()
  const doc = parser.parseFromString(`<div>${html}</div>`, 'text/html')
  const root = doc.body.firstChild as HTMLElement

  function processNode(node: Node): string {
    if (node.nodeType === Node.TEXT_NODE) {
      return escapeHtml(node.textContent || '')
    }

    if (node.nodeType !== Node.ELEMENT_NODE) {
      return ''
    }

    const el = node as HTMLElement
    const tag = el.tagName.toLowerCase()
    const children = Array.from(el.childNodes).map(processNode).join('')

    if (tag === 'br') return '<br>'
    if (tag === 'b' || tag === 'strong') return `<b>${children}</b>`
    if (tag === 'i' || tag === 'em') return `<i>${children}</i>`

    if (tag === 'a') {
      const href = el.getAttribute('href')
      if (href && /^https?:\/\//i.test(href)) {
        return `<a href="${escapeHtml(href)}" target="_blank" rel="noopener noreferrer">${children}</a>`
      }
      return children
    }

    // Images → links
    if (tag === 'img') {
      const src = el.getAttribute('src')
      if (src && /^https?:\/\//i.test(src)) {
        const displayUrl = escapeHtml(src.length > 60 ? src.slice(0, 57) + '...' : src)
        return `<a href="${escapeHtml(src)}" target="_blank" rel="noopener noreferrer">${displayUrl}</a>`
      }
      return ''
    }

    if (tag === 'font') {
      const rawColor = el.getAttribute('color')
      const color = rawColor ? sanitizeColor(rawColor) : null
      if (color) return `<span style="color:${color}">${children}</span>`
      return children
    }

    if (tag === 'span') {
      const style = el.getAttribute('style') || ''
      const colorMatch = style.match(/color\s*:\s*([^;]+)/i)
      if (colorMatch) {
        const color = sanitizeColor(colorMatch[1])
        if (color) return `<span style="color:${color}">${children}</span>`
      }
      return children
    }

    return children
  }

  return processNode(root)
}

export function localizeKyberiaLinks(html: string): string {
  return html.replace(/https?:\/\/(?:www\.)?kyberia\.sk\/id\/(\d+)/g, '/id/$1')
}

export function applyNl2br(content: string, nl2br: unknown): string {
  if (nl2br === '1' || nl2br === 1 || nl2br === true) {
    return content.replace(/\n/g, '<br>\n')
  }
  return content
}
