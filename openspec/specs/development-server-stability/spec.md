## Purpose

Keep the local Vite development server stable when repository-local tooling rewrites generated metadata, while preserving normal application source HMR and reload behavior.

## Requirements

### Requirement: Generated tooling artifacts do not trigger application refreshes

The development server SHALL exclude repository-local generated tooling artifacts from its file watcher so writes beneath `.codebase-memory`, `.playwright-cli`, `.playwright-mcp`, and `output/playwright` do not trigger HMR updates or full-page reloads.

#### Scenario: Codebase-memory persists its graph

- **WHEN** codebase-memory creates or updates temporary, graph, or metadata files beneath `.codebase-memory`
- **THEN** the connected application remains mounted without an HMR update or full-page reload caused by those writes

#### Scenario: Browser automation writes diagnostic artifacts

- **WHEN** browser automation creates or updates artifacts beneath `.playwright-cli`, `.playwright-mcp`, or `output/playwright`
- **THEN** the connected application remains mounted without an HMR update or full-page reload caused by those writes

### Requirement: Application source remains hot-reloadable

The development server MUST continue watching application inputs and MUST retain normal HMR or reload behavior for source, HTML, and development configuration changes outside the explicit tooling-artifact exclusions.

#### Scenario: Application source changes

- **WHEN** a developer updates a module beneath `src`
- **THEN** Vite delivers the applicable HMR update or reload to the connected browser

#### Scenario: Vite configuration changes

- **WHEN** a developer updates the Vite development configuration
- **THEN** the change is not hidden by an overly broad watcher exclusion

### Requirement: Watcher exclusions are narrow and regression protected

The project MUST define explicit ignore patterns for the known tooling artifact directories and MUST provide automated coverage that detects removal or unintended broadening of those patterns.

#### Scenario: Watcher configuration regression check

- **WHEN** the development-server configuration test inspects the watcher exclusions
- **THEN** it confirms every known tooling artifact directory is excluded and representative application source paths remain eligible for watching

### Requirement: Production behavior is unchanged

The tooling-artifact watcher exclusions SHALL apply only to the Vite development server and SHALL NOT alter production build inputs, runtime API proxying, or generated application assets.

#### Scenario: Production build runs

- **WHEN** the production build is executed after the watcher exclusions are configured
- **THEN** it completes using the existing application entry points and produces the normal deployable assets
