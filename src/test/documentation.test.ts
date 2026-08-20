import { existsSync, readFileSync, readdirSync } from 'node:fs'
import { dirname, relative, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'
import { describe, expect, it } from 'vitest'

const repositoryRoot = resolve(dirname(fileURLToPath(import.meta.url)), '../..')
const docsRoot = resolve(repositoryRoot, 'docs')

const backendPortalUrl = 'https://github.com/vfedoriv/graphrag/blob/main/src/site/markdown/index.md'
const advancedSearchUrl = 'https://github.com/vfedoriv/graphrag/blob/main/src/site/markdown/workflows/advanced-search.md'
const chunkingUrl = 'https://github.com/vfedoriv/graphrag/blob/main/src/site/markdown/workflows/chunking-reprocessing.md'

function collectMarkdownFiles(directory: string): string[] {
  return readdirSync(directory, { withFileTypes: true })
    .flatMap((entry) => {
      const path = resolve(directory, entry.name)
      if (entry.isDirectory()) return collectMarkdownFiles(path)
      return entry.isFile() && entry.name.endsWith('.md') ? [path] : []
    })
    .sort()
}

function removeFencedCode(markdown: string) {
  let fence: { marker: string; length: number } | null = null

  return markdown
    .split('\n')
    .map((line) => {
      const match = line.match(/^\s*(`{3,}|~{3,})/)
      if (!match) return fence ? '' : line

      const marker = match[1][0]
      if (!fence) fence = { marker, length: match[1].length }
      else if (marker === fence.marker && match[1].length >= fence.length) fence = null
      return ''
    })
    .join('\n')
}

function markdownTargets(markdown: string) {
  const content = removeFencedCode(markdown)
  const targets: string[] = []
  const inlineLinkPattern = /!?\[[^\]]*\]\(\s*(<[^>]+>|[^)\s]+)(?:\s+[^)]*)?\)/g
  const referenceLinkPattern = /^\s*\[[^\]]+\]:\s*(<[^>]+>|\S+)/gm

  for (const match of content.matchAll(inlineLinkPattern)) targets.push(match[1])
  for (const match of content.matchAll(referenceLinkPattern)) targets.push(match[1])
  return targets
}

function localPath(target: string) {
  const unwrapped = target.startsWith('<') && target.endsWith('>') ? target.slice(1, -1) : target
  if (unwrapped.startsWith('#') || /^(?:[a-z][a-z\d+.-]*:|\/\/)/i.test(unwrapped)) return null

  const withoutFragment = unwrapped.split('#', 1)[0].split('?', 1)[0]
  if (!withoutFragment) return null
  return decodeURIComponent(withoutFragment)
}

describe('documentation references', () => {
  const markdownFiles = [resolve(repositoryRoot, 'README.md'), ...collectMarkdownFiles(docsRoot)]

  it('resolves every relative document and image target', () => {
    const invalidTargets: string[] = []

    for (const sourceFile of markdownFiles) {
      const source = relative(repositoryRoot, sourceFile)
      for (const target of markdownTargets(readFileSync(sourceFile, 'utf8'))) {
        try {
          const path = localPath(target)
          if (path && !existsSync(resolve(dirname(sourceFile), path))) {
            invalidTargets.push(`${source}: ${target}`)
          }
        } catch {
          invalidTargets.push(`${source}: ${target} (invalid URL encoding)`)
        }
      }
    }

    expect(invalidTargets).toEqual([])
  })

  it('retains canonical backend and local companion navigation', () => {
    const read = (path: string) => readFileSync(resolve(repositoryRoot, path), 'utf8')
    const readme = read('README.md')

    expect(readme).toContain(backendPortalUrl)
    expect(readme).toContain('docs/advanced-search/README.md')
    expect(readme).toContain('docs/advanced-search/reference.md')
    expect(readme).toContain('docs/chunking/README.md')
    expect(readme).toContain('docs/chunking/reference.md')
    expect(readme).toContain('docs/testing-gap-report.md')

    for (const path of ['docs/advanced-search/README.md', 'docs/advanced-search/reference.md']) {
      expect(read(path)).toContain(advancedSearchUrl)
    }
    for (const path of ['docs/chunking/README.md', 'docs/chunking/reference.md']) {
      expect(read(path)).toContain(chunkingUrl)
    }
  })
})
