'use client'

import { useEffect, useRef } from 'react'
import { usePathname } from 'next/navigation'

function getOrCreateVisitorId(): string {
  if (typeof window === 'undefined') return ''
  try {
    let vid = localStorage.getItem('vex_vid')
    if (!vid) {
      vid = 'v_' + Math.random().toString(36).substring(2, 10) + Date.now().toString(36)
      localStorage.setItem('vex_vid', vid)
    }
    return vid
  } catch {
    return 'v_' + Math.random().toString(36).substring(2, 10)
  }
}

export default function LiveVisitorTracker() {
  const pathname = usePathname()
  const lastPathRef = useRef<string>('')
  const visitorIdRef = useRef<string>('')

  useEffect(() => {
    visitorIdRef.current = getOrCreateVisitorId()
  }, [])

  // Send page view on path change
  useEffect(() => {
    if (!pathname || pathname.startsWith('/admin') || pathname.startsWith('/api')) {
      return
    }

    const vid = visitorIdRef.current || getOrCreateVisitorId()
    visitorIdRef.current = vid
    lastPathRef.current = pathname

    const payload = JSON.stringify({
      visitorId: vid,
      path: pathname,
      referrer: typeof document !== 'undefined' ? document.referrer : null,
      isHeartbeat: false,
    })

    if (typeof navigator !== 'undefined' && 'sendBeacon' in navigator) {
      navigator.sendBeacon('/api/track', new Blob([payload], { type: 'application/json' }))
    } else {
      fetch('/api/track', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: payload,
        keepalive: true,
      }).catch(() => {})
    }
  }, [pathname])

  // Periodic heartbeat every 20 seconds while tab is visible
  useEffect(() => {
    const sendHeartbeat = () => {
      const currentPath = window.location.pathname
      if (currentPath.startsWith('/admin') || currentPath.startsWith('/api')) {
        return
      }

      const vid = visitorIdRef.current || getOrCreateVisitorId()
      const payload = JSON.stringify({
        visitorId: vid,
        path: currentPath,
        isHeartbeat: true,
      })

      if (typeof navigator !== 'undefined' && 'sendBeacon' in navigator) {
        navigator.sendBeacon('/api/track', new Blob([payload], { type: 'application/json' }))
      } else {
        fetch('/api/track', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: payload,
          keepalive: true,
        }).catch(() => {})
      }
    }

    const interval = setInterval(() => {
      if (document.visibilityState === 'visible') {
        sendHeartbeat()
      }
    }, 20000)

    const handleVisibility = () => {
      if (document.visibilityState === 'visible') {
        sendHeartbeat()
      }
    }

    document.addEventListener('visibilitychange', handleVisibility)

    return () => {
      clearInterval(interval)
      document.removeEventListener('visibilitychange', handleVisibility)
    }
  }, [])

  return null
}
