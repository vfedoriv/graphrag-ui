## ADDED Requirements

### Requirement: Development runtime proxies API via Vite
The system SHALL proxy `/api` requests from the Vite development server to a configurable backend target using `VITE_API_PROXY_TARGET` with a local default.

#### Scenario: Use default development backend target
- **WHEN** no explicit proxy target environment variable is provided during development
- **THEN** the system SHALL proxy `/api` requests to `http://localhost:8080`

### Requirement: Production runtime serves SPA and proxies API via nginx
The system SHALL package static frontend assets in a container runtime with nginx configured for SPA fallback routing and `/api` proxying to `GRAPHRAG_API_URL`.

#### Scenario: Resolve client route refresh
- **WHEN** a user refreshes a non-root client-side route in production
- **THEN** nginx SHALL return the SPA entrypoint and preserve `/api` path proxy behavior for backend calls
