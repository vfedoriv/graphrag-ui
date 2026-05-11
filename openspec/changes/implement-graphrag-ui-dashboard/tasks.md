## 1. Project Foundation

- [ ] 1.1 Add and verify required dependencies (Router, Query, RHF, Zod, Tailwind, lucide-react, Vitest, RTL)
- [ ] 1.2 Configure Tailwind via Vite and replace starter global styles with dashboard-ready base styles
- [ ] 1.3 Configure Vitest/jsdom test setup, coverage options, and npm test scripts (`test`, `test:run`, `coverage`)
- [ ] 1.4 Add/verify foundation tests for app bootstrap and test harness configuration

## 2. App Shell and Routing

- [ ] 2.1 Implement app providers (`QueryClientProvider`, router root) and route tree under `src/app`
- [ ] 2.2 Build persistent admin shell with sidebar navigation and header status surfaces
- [ ] 2.3 Implement selected knowledge base client state persistence and route-level access helpers
- [ ] 2.4 Add/verify app shell and route navigation tests, including no dedicated health-endpoint dependency

## 3. Shared API and UI Infrastructure

- [ ] 3.1 Implement typed DTO modules and shared `apiFetch` helpers for JSON/multipart requests
- [ ] 3.2 Implement `ProblemDetail` -> `ApiError` normalization for field-level and request-level errors
- [ ] 3.3 Build reusable UI primitives (forms, table, empty/loading/error/status components)
- [ ] 3.4 Add/verify tests for API helpers, error normalization, and critical shared UI states

## 4. Knowledge Base Workflows

- [ ] 4.1 Implement knowledge base API module and query/mutation hooks with stable query keys
- [ ] 4.2 Build knowledge base list/create/rename/delete/select UI with optimistic UX guards
- [ ] 4.3 Add mutation invalidation/refetch behaviors and tests for selected-knowledge-base synchronization
- [ ] 4.4 Verify KB workflow tests pass before proceeding to schema workflows

## 5. Schema Workflows

- [ ] 5.1 Implement schema API operations (list/get/validate/create/activate) and hooks
- [ ] 5.2 Build schema registry/detail views with YAML validation feedback
- [ ] 5.3 Build schema generation flow (example -> YAML -> validate/edit -> create) with stage gating
- [ ] 5.4 Add/verify schema management and generation workflow tests before proceeding

## 6. Document Workflows

- [ ] 6.1 Implement document upload/list/process/chunks API calls and hooks
- [ ] 6.2 Build document UI for multipart upload, process actions, and status/error displays
- [ ] 6.3 Build chunk inspection UI and ensure refresh behavior after processing
- [ ] 6.4 Add/verify document workflow tests for upload, process, and chunk inspection

## 7. Query Workflows

- [ ] 7.1 Implement query API operations (generate, validate, execute, ask) and hooks
- [ ] 7.2 Build query page for prompt input, Cypher editing, validation, and execution results
- [ ] 7.3 Ensure one-shot ask flow displays answer and related query metadata clearly
- [ ] 7.4 Add/verify query workflow tests for generate/validate/execute/ask behavior

## 8. Deployment and Verification

- [ ] 8.1 Add multi-stage Dockerfile and nginx config for SPA fallback plus `/api` proxying
- [ ] 8.2 Add example compose/runtime config documenting `GRAPHRAG_API_URL` and proxy expectations
- [ ] 8.3 Run full verification (`npm run lint`, `npm run test:run`, `npm run build`) and resolve remaining failures
