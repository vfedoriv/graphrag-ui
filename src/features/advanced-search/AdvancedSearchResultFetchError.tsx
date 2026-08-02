import { ApiError } from '../../api/types'
import { Alert } from '../../shared/ui/Alert'

export function AdvancedSearchResultFetchError({ error }: { error: Error }) {
  if (error instanceof ApiError && error.status === 409) {
    return <Alert title='Result is not ready yet' message='The backend has not exposed a result resource for this run. The focused lifecycle context remains available and will be checked again when the run changes.' tone='info' />
  }
  if (error instanceof ApiError && error.status === 404) {
    return <Alert title='Result expired or unavailable' message='The run remains focused, but its retained result is no longer available or is not owned by the selected knowledge base. Your draft and history were preserved.' tone='info' />
  }
  return <Alert title='Result request failed' message={`${error.message} The focused run, draft, and history remain available.`} />
}
