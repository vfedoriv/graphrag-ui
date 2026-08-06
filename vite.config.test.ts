import { describe, expect, it } from 'vitest'
import config, { toolingWatcherIgnorePatterns } from './vite.config'

const toolingPaths = [
  '.codebase-memory/graph.db.zst.tmp',
  '.playwright-cli/traces/trace.zip',
  '.playwright-mcp/session/metadata.json',
  'output/playwright/screenshots/home.png',
]

const applicationPaths = ['src/main.tsx', 'index.html', 'vite.config.ts']

function matchesDirectoryPattern(pattern: string, filePath: string) {
  const directory = pattern.slice(3, -3)
  return filePath.split('/').some((_, index, segments) => {
    const candidate = segments.slice(index, index + directory.split('/').length).join('/')
    return candidate === directory
  })
}

describe('Vite development watcher configuration', () => {
  it('ignores every generated tooling directory and its descendants', () => {
    const ignored = config.server?.watch?.ignored

    expect(ignored).toEqual([...toolingWatcherIgnorePatterns])

    for (const filePath of toolingPaths) {
      expect(
        ignored?.some(
          (pattern) =>
            typeof pattern === 'string' && matchesDirectoryPattern(pattern, filePath),
        ),
      ).toBe(true)
    }
  })

  it('does not use a broad exclusion that hides application inputs', () => {
    const ignored = config.server?.watch?.ignored

    for (const filePath of applicationPaths) {
      expect(
        ignored?.some(
          (pattern) =>
            typeof pattern === 'string' && matchesDirectoryPattern(pattern, filePath),
        ),
      ).toBe(false)
    }

    expect(ignored).not.toContain('**/.*')
    expect(ignored).not.toContain('**/*')
  })
})
