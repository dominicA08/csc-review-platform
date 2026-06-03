'use client'

import { createContext, useContext, useSyncExternalStore, useCallback, useLayoutEffect } from 'react'

type Theme = 'light' | 'dark'

const THEME_CHANGE_EVENT = 'csc-theme-change'

function readTheme(): Theme {
  if (typeof window === 'undefined') return 'dark'
  const saved = localStorage.getItem('theme')
  return saved === 'light' || saved === 'dark' ? saved : 'dark'
}

function applyThemeToDocument(resolved: Theme) {
  const root = document.documentElement
  if (resolved === 'dark') {
    root.classList.add('dark')
  } else {
    root.classList.remove('dark')
  }
  root.style.colorScheme = resolved
}

function subscribeTheme(onStoreChange: () => void) {
  const handler = () => onStoreChange()
  window.addEventListener(THEME_CHANGE_EVENT, handler)
  window.addEventListener('storage', handler)
  return () => {
    window.removeEventListener(THEME_CHANGE_EVENT, handler)
    window.removeEventListener('storage', handler)
  }
}

function publishTheme(next: Theme) {
  localStorage.setItem('theme', next)
  applyThemeToDocument(next)
  window.dispatchEvent(new Event(THEME_CHANGE_EVENT))
}

interface ThemeContextValue {
  theme: Theme
  toggleTheme: () => void
  mounted: boolean
}

const ThemeContext = createContext<ThemeContextValue>({
  theme: 'dark',
  toggleTheme: () => {},
  mounted: false,
})

export function useTheme() {
  return useContext(ThemeContext)
}

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const theme = useSyncExternalStore(subscribeTheme, readTheme, () => 'dark' as Theme)
  const mounted = useSyncExternalStore(
    () => () => {},
    () => true,
    () => false,
  )

  useLayoutEffect(() => {
    applyThemeToDocument(theme)
  }, [theme])

  const toggleTheme = useCallback(() => {
    publishTheme(theme === 'dark' ? 'light' : 'dark')
  }, [theme])

  return (
    <ThemeContext.Provider value={{ theme, toggleTheme, mounted }}>
      {children}
    </ThemeContext.Provider>
  )
}

/** Reusable toggle button — drop into any page header */
export function ThemeToggleButton({ className = '' }: { className?: string }) {
  const { theme, toggleTheme, mounted } = useTheme()

  if (!mounted) return null

  return (
    <button
      onClick={toggleTheme}
      aria-label="Toggle theme"
      className={`w-11 h-11 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 flex items-center justify-center cursor-pointer transition-all duration-200 hover:border-slate-300 dark:hover:border-slate-700 shadow-xs hover:scale-105 active:scale-95 z-20 ${className}`}
    >
      {theme === 'dark' ? (
        /* Sun Icon — switch to light */
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#f59e0b" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
          <circle cx="12" cy="12" r="5" />
          <line x1="12" y1="1" x2="12" y2="3" /><line x1="12" y1="21" x2="12" y2="23" />
          <line x1="4.22" y1="4.22" x2="5.64" y2="5.64" /><line x1="18.36" y1="18.36" x2="19.78" y2="19.78" />
          <line x1="1" y1="12" x2="3" y2="12" /><line x1="21" y1="12" x2="23" y2="12" />
          <line x1="4.22" y1="19.78" x2="5.64" y2="18.36" /><line x1="18.36" y1="5.64" x2="19.78" y2="4.22" />
        </svg>
      ) : (
        /* Moon Icon — switch to dark */
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#6366f1" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
          <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z" />
        </svg>
      )}
    </button>
  )
}
