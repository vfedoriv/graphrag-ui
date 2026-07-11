export type ThemePreference = 'light' | 'system' | 'dark'
export type ResolvedTheme = 'light' | 'dark'

export const THEME_STORAGE_KEY = 'graphrag.appearance'
export const DARK_MODE_QUERY = '(prefers-color-scheme: dark)'

export function isThemePreference(value: unknown): value is ThemePreference {
  return value === 'light' || value === 'system' || value === 'dark'
}

export function readThemePreference(storage: Pick<Storage, 'getItem'> | undefined = getBrowserStorage()): ThemePreference {
  try {
    const storedPreference = storage?.getItem(THEME_STORAGE_KEY)
    return isThemePreference(storedPreference) ? storedPreference : 'system'
  } catch {
    return 'system'
  }
}

export function writeThemePreference(
  preference: ThemePreference,
  storage: Pick<Storage, 'setItem'> | undefined = getBrowserStorage(),
) {
  try {
    storage?.setItem(THEME_STORAGE_KEY, preference)
  } catch {
    // A blocked or full local store must not prevent appearance changes.
  }
}

export function resolveTheme(preference: ThemePreference, systemPrefersDark: boolean): ResolvedTheme {
  if (preference === 'system') {
    return systemPrefersDark ? 'dark' : 'light'
  }
  return preference
}

export function applyDocumentTheme(theme: ResolvedTheme, root: HTMLElement = document.documentElement) {
  root.dataset.theme = theme
  root.style.colorScheme = theme
}

export function getDarkModeQuery() {
  if (typeof window === 'undefined' || typeof window.matchMedia !== 'function') {
    return undefined
  }
  return window.matchMedia(DARK_MODE_QUERY)
}

function getBrowserStorage() {
  if (typeof window === 'undefined') {
    return undefined
  }
  return window.localStorage
}
