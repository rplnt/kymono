/**
 * Smooth-scroll to an element, accounting for the fixed menu height.
 */
export function scrollToElement(el: Element): void {
  const menuHeight =
    parseInt(getComputedStyle(document.documentElement).getPropertyValue('--menu-height')) || 56
  const top = el.getBoundingClientRect().top + window.scrollY - menuHeight - 8
  window.scrollTo({ top, behavior: 'smooth' })
}
