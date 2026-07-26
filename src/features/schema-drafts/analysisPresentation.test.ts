import { describe, expect, it } from 'vitest'
import {
  formatCapturedConcurrency,
  formatDurationMillis,
  formatFailureCode,
  legacyAnalysisValue,
  legacyFailureCode,
} from './analysisPresentation'

describe('analysis presentation', () => {
  it('formats captured concurrency and durations', () => {
    expect(formatCapturedConcurrency(1)).toBe('1 source at a time')
    expect(formatCapturedConcurrency(4)).toBe('4 sources at a time')
    expect(formatDurationMillis(500)).toBe('500 ms')
    expect(formatDurationMillis(10_000)).toBe('10 seconds')
    expect(formatDurationMillis(60_000)).toBe('1 minute')
  })

  it('keeps legacy values explicitly unavailable', () => {
    expect(formatCapturedConcurrency(null)).toBe(legacyAnalysisValue)
    expect(formatDurationMillis(null)).toBe(legacyAnalysisValue)
  })

  it('labels known, legacy, and future failure codes safely', () => {
    expect(formatFailureCode('SOURCE_DEADLINE_EXCEEDED')).toBe('Source deadline exceeded (SOURCE_DEADLINE_EXCEEDED)')
    expect(formatFailureCode(null)).toBe(legacyFailureCode)
    expect(formatFailureCode('FUTURE_PROVIDER_SIGNAL')).toBe('Future provider signal (FUTURE_PROVIDER_SIGNAL)')
  })
})
