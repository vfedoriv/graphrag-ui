## Why

The schema-draft UI exposes two intentionally different file paths—discovery evidence and held-out evaluation documents—but its current labels and navigation do not explain that boundary. Users can reasonably mistake a draft-owned file for an evaluation upload or reach Release with no eligible documents and no clear route to the Documents workflow.

## What Changes

- Rename and describe the draft-owned file form as an upload of discovery evidence that influences schema analysis, stays private to the draft, and cannot serve as held-out evaluation data.
- Add concise guidance to the Release evaluation stage explaining what the document checkboxes select and why discovery-source documents are disabled.
- Provide a direct, clearly labeled link from the held-out evaluation stage to the Documents page for uploading a separate knowledge-base document.
- Explain the return path: upload and process the document in the same workspace, do not add it as a draft source, then return to Release and select it when eligible.
- Show actionable guidance when the loaded eligibility result has no selectable rows while retaining the backend-provided ineligibility reasons.
- Add component tests covering the discovery-evidence warning, Documents navigation, and all-ineligible evaluation state.

## Capabilities

### New Capabilities

None.

### Modified Capabilities

- `schema-draft-source-analysis-ui`: Make the ownership and discovery-only purpose of draft-owned file uploads explicit before submission.
- `schema-draft-evaluation-ui`: Explain held-out document selection and provide an actionable handoff to the normal Documents upload workflow when no selectable evaluation document is available.

## Impact

- Affects copy and navigation in `SchemaDraftsPage` and `SchemaDraftReleaseWorkflow`.
- Extends schema-draft source and Release workflow component tests.
- Reuses the existing `/documents` route and shared UI primitives.
- Does not change backend APIs, eligibility rules, document processing, draft revision behavior, or source ownership semantics.
