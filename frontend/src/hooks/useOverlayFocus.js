import { useEffect, useRef } from 'react'

// Keep the page at its current scroll position while a drawer or dialog is open.
export default function useOverlayFocus(containerRef, isOpen, onClose) {
  const closeRef = useRef(onClose)
  closeRef.current = onClose

  useEffect(() => {
    if (!isOpen || !containerRef.current) return
    const container = containerRef.current
    const previousFocus = document.activeElement
    const scrollY = window.scrollY
    const previousStyles = ['position', 'top', 'width', 'overflow'].map((property) => [property, document.body.style[property]])
    Object.assign(document.body.style, { position: 'fixed', top: `-${scrollY}px`, width: '100%', overflow: 'hidden' })
    const focusable = () => Array.from(container.querySelectorAll('button:not(:disabled), input:not(:disabled), select:not(:disabled), textarea:not(:disabled), a[href], [tabindex="0"]')).filter((element) => element.getClientRects().length && getComputedStyle(element).visibility !== 'hidden')
    focusable()[0]?.focus({ preventScroll: true })

    const handleKey = (event) => {
      if (event.key === 'Escape') { event.preventDefault(); closeRef.current?.() }
      if (event.key !== 'Tab') return
      const elements = focusable()
      const first = elements[0]
      const last = elements.at(-1)
      if (event.shiftKey && (document.activeElement === first || !container.contains(document.activeElement))) {
        event.preventDefault(); last?.focus()
      } else if (!event.shiftKey && (document.activeElement === last || !container.contains(document.activeElement))) {
        event.preventDefault(); first?.focus()
      }
    }
    document.addEventListener('keydown', handleKey)
    return () => {
      document.removeEventListener('keydown', handleKey)
      previousStyles.forEach(([property, value]) => { document.body.style[property] = value })
      window.scrollTo({ top: scrollY, behavior: 'instant' })
      if (previousFocus?.isConnected) previousFocus.focus({ preventScroll: true })
    }
  }, [containerRef, isOpen])
}
