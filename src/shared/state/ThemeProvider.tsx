import { useCallback, useEffect, useMemo, useState, type ReactNode } from 'react'
import { ThemeContext } from './themeContext'
import {
  applyDocumentTheme,
  getDarkModeQuery,
  readThemePreference,
  resolveTheme,
  writeThemePreference,
  type ThemePreference,
} from './theme'

export function ThemeProvider({ children }: { children: ReactNode }) {
  const [preference, setPreferenceState] = useState<ThemePreference>(() => readThemePreference())
  const [systemPrefersDark, setSystemPrefersDark] = useState(() => getDarkModeQuery()?.matches ?? false)
  const resolvedTheme = resolveTheme(preference, systemPrefersDark)

  useEffect(() => {
    const mediaQuery = getDarkModeQuery()
    if (!mediaQuery) {
      return
    }

    const handleChange = (event: MediaQueryListEvent) => setSystemPrefersDark(event.matches)
    mediaQuery.addEventListener('change', handleChange)
    return () => mediaQuery.removeEventListener('change', handleChange)
  }, [])

  useEffect(() => {
    applyDocumentTheme(resolvedTheme)
  }, [resolvedTheme])

  const setPreference = useCallback((nextPreference: ThemePreference) => {
    setPreferenceState(nextPreference)
    writeThemePreference(nextPreference)
  }, [])

  const value = useMemo(
    () => ({ preference, resolvedTheme, setPreference }),
    [preference, resolvedTheme, setPreference],
  )

  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>
}
