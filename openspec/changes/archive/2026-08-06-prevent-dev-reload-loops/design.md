## Context

Vite watches the project root and forwards file changes through its HMR pipeline. This repository also stores generated development-tool artifacts under the root. The codebase-memory service rewrites `.codebase-memory/graph.db.zst.tmp`, atomically replaces `graph.db.zst`, and updates `artifact.json` on a short cadence. Browser automation can similarly write `.playwright-cli`, `.playwright-mcp`, or `output/playwright` artifacts.

Live HMR diagnostics showed those writes reaching Vite as file-change events approximately every three seconds. The Tailwind Vite integration then invalidated `src/index.css`, causing the visible recurring refresh. These artifacts are development metadata rather than application inputs.

## Goals / Non-Goals

**Goals:**

- Prevent generated local-tool artifacts from entering Vite's watcher and HMR pipeline.
- Keep HMR active for application source and retain full reloads for genuine configuration or HTML changes.
- Cover both currently observed codebase-memory writes and the repository-local browser artifact locations used by project tooling.
- Make the intended watcher boundary explicit and regression-testable.

**Non-Goals:**

- Changing codebase-memory persistence frequency or artifact format.
- Disabling Vite's file watcher or Tailwind HMR globally.
- Ignoring every hidden directory or every generated file in the repository.
- Changing production build inputs, runtime proxying, backend behavior, or UI features.

## Decisions

### Configure narrow watcher exclusions in Vite

Add anymatch-compatible directory patterns to `server.watch.ignored` for `.codebase-memory`, `.playwright-cli`, `.playwright-mcp`, and `output/playwright`. Vite appends user-provided ignore patterns to its built-in exclusions, so this uses the framework's supported watcher boundary without replacing existing defaults.

The patterns will match the directories at any depth where appropriate and include all descendants, including temporary files created during atomic persistence.

**Alternative considered:** Disable the watcher or HMR. Rejected because it would remove the fast source-edit feedback expected from the development server.

**Alternative considered:** Ignore all dot-prefixed directories. Rejected because the scope is broader than the diagnosed problem and could hide future application inputs or configuration changes.

**Alternative considered:** Change codebase-memory to write outside the repository. Rejected because the tracked graph artifact is intentionally shareable repository metadata and that change belongs to another system.

### Keep the change development-only

Place the exclusions under Vite's `server.watch` configuration. This ensures the behavior applies only to the development server; the production build continues to use its existing entry points and dependency graph.

### Verify the boundary and the retained behavior

Add focused automated coverage for the configured ignored paths and for the continued watchability of representative source paths. Complement this with a live smoke check: while the development server is connected to a browser, repeated codebase-memory writes must not cause CSS invalidation or document reload, while editing a source module must still trigger HMR.

## Risks / Trade-offs

- [A future tool writes artifacts to a new repository-local directory] → Document the rationale and extend the narrow ignore list when that tool is adopted.
- [An ignored directory later contains an application input] → Keep exclusions explicit by tool directory and require a configuration test that rejects overly broad hidden-directory ignores.
- [A watcher exclusion prevents Vite events but a plugin maintains an independent watcher] → Validate with live HMR diagnostics after implementation and, if necessary, configure that plugin's content sources separately.
- [The running development server does not pick up configuration changes] → Restart Vite as part of verification and document that restart requirement.

## Migration Plan

1. Add the narrow watcher exclusions and regression coverage.
2. Restart the local Vite server so the updated watcher is created.
3. Confirm generated artifact rewrites no longer produce HMR or reload events.
4. Confirm a representative source edit still produces HMR and the normal validation suite passes.

Rollback consists of reverting the watcher exclusions and restarting Vite; no data or API migration is involved.

## Open Questions

None. The observed write paths and supported Vite configuration mechanism are confirmed.
