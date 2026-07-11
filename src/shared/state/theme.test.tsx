import { act, render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { ThemeProvider } from './ThemeProvider'
import { useTheme } from './useTheme'
import {
  DARK_MODE_QUERY,
  THEME_STORAGE_KEY,
  applyDocumentTheme,
  readThemePreference,
  resolveTheme,
  writeThemePreference,
  type ThemePreference,
} from './theme'

function ThemeProbe() {
  const { preference, resolvedTheme, setPreference } = useTheme()
  return (
    <div>
      <output>{`${preference}:${resolvedTheme}`}</output>
      {(['light', 'system', 'dark'] satisfies ThemePreference[]).map((option) => (
        <button key={option} type='button' onClick={() => setPreference(option)}>
          {option}
        </button>
      ))}
    </div>
  )
}

function createMediaQuery(initialMatches: boolean) {
  let matches = initialMatches
  const listeners = new Set<(event: MediaQueryListEvent) => void>()
  const mediaQuery = {
    media: DARK_MODE_QUERY,
    onchange: null,
    get matches() {
      return matches
    },
    addEventListener: (_type: string, listener: (event: MediaQueryListEvent) => void) => listeners.add(listener),
    removeEventListener: (_type: string, listener: (event: MediaQueryListEvent) => void) => listeners.delete(listener),
    addListener: vi.fn(),
    removeListener: vi.fn(),
    dispatchEvent: vi.fn(),
  } as MediaQueryList

  return {
    mediaQuery,
    setMatches(nextMatches: boolean) {
      matches = nextMatches
      listeners.forEach((listener) => listener({ matches: nextMatches } as MediaQueryListEvent))
    },
  }
}

describe('theme state', () => {
  beforeEach(() => {
    localStorage.clear()
    document.documentElement.removeAttribute('data-theme')
    document.documentElement.style.colorScheme = ''
  })

  afterEach(() => {
    vi.unstubAllGlobals()
  })

  it('validates stored preferences and resolves system appearance', () => {
    expect(readThemePreference({ getItem: () => null })).toBe('system')
    expect(readThemePreference({ getItem: () => 'invalid' })).toBe('system')
    expect(readThemePreference({ getItem: () => 'dark' })).toBe('dark')
    expect(resolveTheme('system', true)).toBe('dark')
    expect(resolveTheme('system', false)).toBe('light')
    expect(resolveTheme('light', true)).toBe('light')
  })

  it('survives unavailable storage and applies document metadata', () => {
    expect(readThemePreference({ getItem: () => { throw new Error('blocked') } })).toBe('system')
    expect(() => writeThemePreference('dark', { setItem: () => { throw new Error('full') } })).not.toThrow()

    applyDocumentTheme('dark')
    expect(document.documentElement).toHaveAttribute('data-theme', 'dark')
    expect(document.documentElement.style.colorScheme).toBe('dark')
  })

  it('persists explicit selections and follows system changes only in system mode', async () => {
    const user = userEvent.setup()
    const media = createMediaQuery(false)
    vi.stubGlobal('matchMedia', vi.fn(() => media.mediaQuery))

    render(<ThemeProvider><ThemeProbe /></ThemeProvider>)
    expect(screen.getByText('system:light')).toBeInTheDocument()

    act(() => media.setMatches(true))
    expect(screen.getByText('system:dark')).toBeInTheDocument()

    await user.click(screen.getByRole('button', { name: 'light' }))
    expect(screen.getByText('light:light')).toBeInTheDocument()
    expect(localStorage.getItem(THEME_STORAGE_KEY)).toBe('light')
    expect(document.documentElement).toHaveAttribute('data-theme', 'light')

    act(() => media.setMatches(false))
    act(() => media.setMatches(true))
    expect(screen.getByText('light:light')).toBeInTheDocument()
  })
})
