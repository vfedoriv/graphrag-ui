import { ApiError } from '../../api/types'
import { formatDocumentErrorMessage } from './documentErrors'

describe('document error formatting', () => {
  it('includes ApiError details after the primary message', () => {
    const error = new ApiError({
      status: 422,
      message: 'Document processing failed',
      details: ['Parser rejected the file', 'Use a supported format'],
    })

    expect(formatDocumentErrorMessage(error)).toBe(
      'Document processing failed Parser rejected the file Use a supported format',
    )
  })

  it('formats ApiError field errors with their field names', () => {
    const error = new ApiError({
      status: 400,
      message: 'Invalid processing options',
      fieldErrors: {
        maxPages: ['must be at least 1', 'must be at most 100'],
        parserId: ['must not be blank'],
      },
    })

    expect(formatDocumentErrorMessage(error)).toBe(
      'Invalid processing options maxPages: must be at least 1 maxPages: must be at most 100 parserId: must not be blank',
    )
  })

  it('uses the message from an ordinary Error', () => {
    expect(formatDocumentErrorMessage(new Error('Network request failed'))).toBe('Network request failed')
  })

  it.each([null, undefined, 'not an Error', { message: 'not an Error' }])(
    'uses the fallback for unknown failure %s',
    (error) => {
      expect(formatDocumentErrorMessage(error)).toBe('Request failed')
    },
  )
})
