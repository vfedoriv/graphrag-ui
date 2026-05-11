## Context

The current repository contains a starter React + Vite scaffold, while the GraphRAG backend already exposes usable `/api/v1` endpoints for knowledge bases, schemas, documents, and queries. The UI must be frontend-only, consume existing backend contracts, and avoid backend/CORS changes by using same-origin `/api` proxying in development and production.

Constraints:
- Keep backend contracts unchanged.
- Organize frontend code by feature modules.
- Build for repeated operator/admin workflows rather than marketing presentation.
- Exclude authentication and authorization from this phase.

## Goals / Non-Goals

**Goals:**
- Deliver a functional admin dashboard with navigation and feature pages for all major backend capabilities.
- Provide typed API access, stable query/mutation behavior, and consistent error normalization.
- Support document upload and query pipelines with clear pending/success/failure states.
- Ship dev and production runtime proxying plus containerized deployment.
- Add baseline automated tests for API behavior and critical workflows.
- Add or update tests incrementally at each implementation stage so behavior is verified continuously.

**Non-Goals:**
- Backend endpoint changes, schema changes, or CORS policy updates.
- Real-time job orchestration beyond synchronous request/response handling.
- Authentication/authorization, RBAC, or multi-tenant isolation.
- Full design system maturity beyond practical shared primitives.

## Decisions

1. Feature-based frontend architecture
- Decision: Use `src/features/*` for domain flows, `src/app` for shell/router/providers, `src/shared` for reusable UI/helpers, and `src/api` for transport/DTO layers.
- Rationale: Keeps each workflow cohesive and scales better than type-based foldering.
- Alternative considered: global service/store folders. Rejected due to higher coupling and weaker discoverability.

2. Manual typed API client over generated OpenAPI client
- Decision: Implement explicit DTO types and request helpers manually.
- Rationale: Faster iteration against current backend contracts and easier domain-specific error shaping.
- Alternative considered: code-generated client from `/v3/api-docs`. Rejected for v1 due to setup/maintenance overhead and lower control over ergonomics.

3. TanStack Query as server-state authority
- Decision: Use query key factories and mutation invalidation per feature; avoid global state for server data.
- Rationale: Predictable caching, refetch, and mutation synchronization with minimal custom state management.
- Alternative considered: custom reducer/store-driven data fetching. Rejected for higher complexity and duplicated cache semantics.

4. React Hook Form + Zod for forms
- Decision: Model form validation with Zod schemas and bind using RHF controllers/register.
- Rationale: Strong type inference and consistent validation behavior for create/update flows.
- Alternative considered: uncontrolled forms with ad hoc validation. Rejected due to inconsistent UX and weaker correctness.

5. Same-origin API path with environment-configured proxy targets
- Decision: Browser calls `/api/v1/...`; Vite proxies `/api` to `VITE_API_PROXY_TARGET`; nginx proxies `/api` to `GRAPHRAG_API_URL`.
- Rationale: avoids CORS changes and keeps API path stable across environments.
- Alternative considered: direct browser calls to backend host. Rejected due to CORS and deployment coupling.

6. Progressive workflow-first feature implementation order
- Decision: Build KB CRUD/selection first, then schemas, then documents, then queries.
- Rationale: downstream workflows depend on selected knowledge base and active schema context.
- Alternative considered: independent parallel implementation. Rejected due to repeated rework risk.

7. No dedicated backend health endpoint in dashboard
- Decision: Do not add a dashboard-specific health endpoint call; derive availability/status indicators from existing feature endpoint request outcomes.
- Rationale: avoids introducing new backend contract dependencies and keeps UI aligned with current API surface.
- Alternative considered: periodic `/health` polling from dashboard. Rejected due to scope expansion and unnecessary coupling.

## Risks / Trade-offs

- [Backend contract drift] -> Mitigation: centralize DTOs and API helpers; add tests around parsing and request formats.
- [Large first-pass scope] -> Mitigation: enforce feature-level milestones and keep shared primitives minimal.
- [Long-running API calls degrade UX] -> Mitigation: explicit pending indicators and disabled conflicting actions during mutations.
- [Manual client maintenance cost] -> Mitigation: keep DTOs grouped and introduce optional future diff checks against `/v3/api-docs`.
- [UI complexity with many workflows] -> Mitigation: consistent layout primitives and route-level boundaries.

## Migration Plan

1. Replace starter UI with app shell and route tree, then verify with route/shell tests.
2. Introduce API transport/error normalization layer and feature-level API modules, then verify with API helper tests.
3. Implement feature pages in dependency order (KB -> schemas -> documents -> queries), adding and running feature tests at each stage.
4. Add Docker + nginx runtime config and validate local container execution.
5. Run full verification (`lint`, tests, build) and release as separate UI artifact; rollback by reverting container/image version and static bundle.

## Open Questions

- Should selected knowledge base be restored across browser sessions indefinitely or with expiry semantics?
- What file types are prioritized for document upload UX defaults in v1 beyond backend acceptance?
