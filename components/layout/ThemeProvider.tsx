'use client'

import { createContext, useContext, useEffect, useState } from 'react'

type Theme = 'light' | 'dark'

const ThemeContext = createContext<{
  theme: Theme
  toggle: () => void
}>({ theme: 'light', toggle: () => {} })

export function useTheme() {
  return useContext(ThemeContext)
}

export default function ThemeProvider({ children }: { children: React.ReactNode }) {
  const [theme, setTheme] = useState<Theme>('light')
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    if (typeof window === 'undefined') return

    const stored = localStorage.getItem('theme') as Theme | null
    const system = window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light'
    const initial = stored ?? system
    setTheme(initial)
    document.documentElement.setAttribute('data-theme', initial)
    setMounted(true)

    // Sync theme across tabs
    const onStorage = (e: StorageEvent) => {
      if (e.key === 'theme' && (e.newValue === 'light' || e.newValue === 'dark')) {
        setTheme(e.newValue as Theme)
        document.documentElement.setAttribute('data-theme', e.newValue)
      }
    }
    window.addEventListener('storage', onStorage)

    // Global scroll reveal logic
    const observer = new IntersectionObserver((entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          entry.target.classList.add('visible')
          observer.unobserve(entry.target)
        }
      })
    }, { threshold: 0.1, rootMargin: '0px 0px -50px 0px' })

    const setupObserver = () => {
      document.querySelectorAll('.reveal:not(.visible)').forEach((el) => {
        observer.observe(el)
      })
    }

    setupObserver()

    // Catch client-side route changes rendering new .reveal elements
    let debounceTimer: ReturnType<typeof setTimeout>
    const mutObserver = new MutationObserver(() => {
      clearTimeout(debounceTimer)
      debounceTimer = setTimeout(setupObserver, 100)
    })
    mutObserver.observe(document.body, { childList: true, subtree: true })

    return () => {
      window.removeEventListener('storage', onStorage)
      observer.disconnect()
      mutObserver.disconnect()
      clearTimeout(debounceTimer)
    }
  }, [])

  const toggle = () => {
    if (typeof window === 'undefined') return
    const next = theme === 'light' ? 'dark' : 'light'
    setTheme(next)
    document.documentElement.setAttribute('data-theme', next)
    localStorage.setItem('theme', next)
  }

  // Render children with opacity 0 before mount instead of visibility hidden
  if (!mounted) return <div style={{ opacity: 0 }}>{children}</div>

  return (
    <ThemeContext.Provider value={{ theme, toggle }}>
      {children}
    </ThemeContext.Provider>
  )
}
