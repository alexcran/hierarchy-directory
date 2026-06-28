'use client'

import { useCallback, useEffect, useRef, useState } from 'react'
import { usePathname } from 'next/navigation'

export function NavigationProgress() {
  const pathname = usePathname()
  const [visible, setVisible] = useState(false)
  const [progress, setProgress] = useState(0)
  const visibleRef = useRef(false)
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null)
  const hideTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  const clearTimers = useCallback(() => {
    if (intervalRef.current) clearInterval(intervalRef.current)
    if (hideTimeoutRef.current) clearTimeout(hideTimeoutRef.current)
    intervalRef.current = null
    hideTimeoutRef.current = null
  }, [])

  const start = useCallback(() => {
    clearTimers()
    visibleRef.current = true
    setVisible(true)
    setProgress(8)
    intervalRef.current = setInterval(() => {
      setProgress(current => {
        if (current >= 88) return current
        return current + Math.max(2, (88 - current) * 0.08)
      })
    }, 140)
  }, [clearTimers])

  const complete = useCallback(() => {
    if (!visibleRef.current) return
    if (intervalRef.current) clearInterval(intervalRef.current)
    intervalRef.current = null
    setProgress(100)
    hideTimeoutRef.current = setTimeout(() => {
      visibleRef.current = false
      setVisible(false)
      setProgress(0)
    }, 220)
  }, [])

  useEffect(() => {
    const originalPushState = window.history.pushState
    const originalReplaceState = window.history.replaceState

    function completeSoon() {
      window.setTimeout(() => complete(), 450)
    }

    window.history.pushState = function pushState(...args) {
      start()
      const result = originalPushState.apply(this, args)
      completeSoon()
      return result
    }

    window.history.replaceState = function replaceState(...args) {
      start()
      const result = originalReplaceState.apply(this, args)
      completeSoon()
      return result
    }

    function handleClick(event: MouseEvent) {
      if (event.defaultPrevented || event.button !== 0 || event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return
      const target = event.target instanceof Element ? event.target.closest('a[href]') : null
      if (!(target instanceof HTMLAnchorElement)) return
      if (target.target && target.target !== '_self') return
      const url = new URL(target.href)
      if (url.origin !== window.location.origin) return
      if (url.pathname === window.location.pathname && url.search === window.location.search && url.hash) return
      start()
    }

    function handlePopState() {
      start()
    }

    document.addEventListener('click', handleClick, true)
    window.addEventListener('popstate', handlePopState)

    return () => {
      window.history.pushState = originalPushState
      window.history.replaceState = originalReplaceState
      document.removeEventListener('click', handleClick, true)
      window.removeEventListener('popstate', handlePopState)
      clearTimers()
    }
  }, [clearTimers, start, complete])

  useEffect(() => {
    complete()
  }, [pathname, complete])

  return (
    <div
      aria-hidden="true"
      className={`fixed left-0 right-0 top-16 z-[60] h-0.5 overflow-hidden transition-opacity duration-150 ${visible ? 'opacity-100' : 'opacity-0'}`}
    >
      <div
        className="h-full bg-[#7A1B2E] transition-[width] duration-200 ease-out"
        style={{ width: `${progress}%` }}
      />
    </div>
  )
}
