## Context

Schema drafts accept three discovery-source types: existing knowledge-base documents, draft-private files, and draft-private text. Separately, held-out evaluation selects normal knowledge-base documents that did not contribute active discovery evidence. The current UI preserves these backend semantics but presents the draft-private upload as “Draft-owned file” and leaves users in Release without an obvious route to create a held-out document. This makes two valid workflows appear interchangeable.

The change spans the Sources and Release sections of the same workbench. It must preserve controller ownership: normal document intake remains on `/documents`, while the draft workbench only adds discovery sources and selects evaluation inputs.

## Goals / Non-Goals

**Goals:**

- Explain before upload that a draft-private file influences schema discovery, does not become a normal document, and cannot be held out.
- Explain that Release checkboxes select eligible unseen knowledge-base documents and why discovery evidence is disabled.
- Give users an actionable link to the existing Documents upload workflow and clear return instructions.
- Keep eligibility rows, backend reasons, pagination, and disabled behavior visible and unchanged.

**Non-Goals:**

- Add document upload or processing controls to the Release section.
- Change draft-source ownership, evaluation eligibility, document processing, or aggregate invalidation behavior.
- Automatically navigate back to a draft or retain a cross-route upload wizard.
- Address the backend issue where processing an unrelated held-out document can invalidate a draft aggregate.

## Decisions

1. Rename the draft-private file card and its action using “discovery evidence,” followed by persistent explanatory copy. This puts the consequence before file selection. A tooltip was rejected because the ownership distinction is essential workflow information and must remain visible.

2. Keep normal uploads on the Documents page and use a React Router link from Release. Embedding a second uploader would duplicate the Documents controller workflow, processing states, error handling, and tests. The existing selected-workspace state already scopes `/documents` to the same knowledge base.

3. Show a short held-out explanation for every evaluation eligibility result and an emphasized guidance state when the loaded page has no eligible rows. The emphasized copy will say “on this page” so pagination cannot imply that the backend has no eligible documents outside the loaded page. Existing rows and pager remain rendered.

4. Tell users to upload and process a normal document, avoid adding it as a draft source, then return to Release. The UI will not claim that processing preserves the aggregate because that behavior is backend-owned and currently under separate investigation.

5. Verify semantics through role/name and link-target assertions rather than styling snapshots. Tests will cover the discovery warning, the `/documents` handoff, the all-ineligible guidance, and continued disabled evaluation start.

## Risks / Trade-offs

- [Users may expect an automatic return after upload] → State the manual return step explicitly and keep this change small; a guided cross-route workflow can be proposed separately.
- [A page with no eligible rows may be followed by a page with eligible rows] → Scope the emphasized message to the loaded page and retain pagination.
- [Copy could imply that all normal documents are held out] → Explicitly warn that a normal document becomes ineligible if it is added as a draft discovery source.
- [Backend invalidation can still disrupt the documented flow] → Avoid promising aggregate preservation and keep that backend defect outside this frontend proposal.
