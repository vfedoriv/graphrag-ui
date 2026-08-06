# Chunking Reference

This reference supplements [Chunking Strategy and Lifecycle](README.md) with exact constraints, API routes, provenance fields, migration semantics, examples, and implementation locations.

## Effective settings and validation

| Key | Type and constraints | Consumed by |
| --- | --- | --- |
| `app.chunking.strategy` | Enum: `recursive`, `fixed-character` | Strategy selection |
| `app.chunking.target-tokens` | Integer greater than 0 | Recursive child source/representation budget |
| `app.chunking.overlap-tokens` | Integer from 0 to `targetTokens - 1` | Recursive overlap; fixed compatibility character overlap |
| `app.chunking.hard-character-limit` | Integer greater than 0 | Child hard character budget |
| `app.chunking.parent-target-tokens` | Integer at least `targetTokens` | Recursive parent grouping |
| `app.chunking.parent-hard-character-limit` | Integer at least `hardCharacterLimit` | Recursive parent grouping |
| `app.chunking.parent-max-pages` | Integer 1 or 2 | Recursive PDF continuation grouping |
| `app.chunking.context-header-max-tokens` | Integer at least 0 | Reserved embedding-header token budget |
| `app.chunking.context-header-max-characters` | Integer at least 0 | Reserved embedding-header character budget |
| `app.chunking.representation-revision` | Non-editable deployment value | Contextual representation identity |

Compatibility aliases:

| Alias | Canonical key | Resolution rule |
| --- | --- | --- |
| `app.chunking.max-tokens` | `app.chunking.target-tokens` | Canonical runtime override wins |
| `app.chunking.max-characters` | `app.chunking.hard-character-limit` | Canonical runtime override wins |

The configured defaults are `recursive`, 800 target tokens, 80 overlap tokens, 4000 child characters, 1600 parent tokens, 8000 parent characters, two parent pages, 96 header tokens, 512 header characters, and representation `context-header-v1`.

## Split details

### Recursive structural-unit construction

1. Read parsed blocks in source-offset order.
2. Exclude `PAGE`, `TABLE`, and `TABLE_CELL` as direct structural split units.
3. Retain text gaps between accepted block ranges so excluded boundaries do not discard source content.
4. If there are no usable blocks, treat the complete section as one structural unit.
5. Recursively subdivide oversized units through paragraph, line, sentence for known English, word, and character tiers.
6. Pack adjacent units and carry only complete trailing units into overlap.

The sentence tier is enabled when section metadata `language` or `languageCode` starts with `en`. Unknown and non-English text proceeds from line to word subdivision.

### Recursive fit calculation

```text
sourceTokenLimit     = max(1, targetTokens - contextHeaderMaxTokens)
sourceCharacterLimit = max(1, hardCharacterLimit - contextHeaderMaxCharacters)

fits(candidate) =
  candidate.characters <= sourceCharacterLimit
  AND tokenizer.count(candidate) <= sourceTokenLimit
```

The reserved header budget is part of source splitting even when a particular child ultimately receives a smaller header or no header.

### Fixed-character stepping

```text
overlapCharacters = min(overlapTokens, hardCharacterLimit / 2)
step              = max(1, hardCharacterLimit - overlapCharacters)
```

The division is integer arithmetic. Token estimates are still recorded for observability, but they do not determine fixed boundaries.

## Hierarchy rules

Hierarchy creation runs only for `recursive`.

Same-section children are grouped while:

- Structural paths are compatible.
- Combined source tokens do not exceed `parentTargetTokens`.
- Combined source characters do not exceed `parentHardCharacterLimit`.

An adjacent-page PDF merge additionally requires:

- `parentMaxPages >= 2`.
- Consecutive page numbers.
- Equal, non-empty structural paths.
- `AUTHORITATIVE` block confidence on both sides.

A parent is stored with `kind=PARENT` and no embedding. A child is stored with `kind=CHILD`, with a nullable `parentChunkId`. `flatChunkCount` means children without a parent, not a third persisted kind.

## Context header construction

Header fields are attempted in this order:

1. Representation revision marker.
2. Source filename.
3. Source format.
4. Structural path.
5. Page number.

Each value has normalized whitespace and is truncated to 160 characters. The completed header plus source must remain within the configured target-token and hard-character limits. Otherwise fields are omitted or the source is embedded without a header.

Relevant metadata:

| Field | Meaning |
| --- | --- |
| `contextualized` | Whether embedding text differs from source text |
| `contextHeaderTokenCount` | Tokens contributed by the header |
| `embeddingTokenCount` | Tokens in the complete embedding text |
| `representationRevision` | Header/representation policy identity |

## Provenance and deterministic identity

Persisted chunks include the fields needed for audit and migration decisions:

| Group | Representative fields |
| --- | --- |
| Source | `sourceStart`, `sourceEnd`, `sourceHash`, section and page coordinates |
| Strategy | `strategy`, `strategyRevision`, `settingsHash`, `effectiveChunkerRevision` |
| Tokenizer | Tokenizer identity, tokenizer revision, count mode, token estimate |
| Hierarchy | `kind`, `parentChunkId`, `childIndex`, `siblingCount` |
| Structure | Structural path and block-confidence metadata |
| Representation | Representation revision and contextualization diagnostics |

Deterministic IDs use these conceptual inputs:

```text
SHA-256(
  documentContentRevision,
  strategyRevision,
  chunkKind,
  sectionIndex,
  sourceStart,
  sourceEnd
)
```

Child IDs use the `chunk_` prefix and parent IDs use `parent_`.

## Processing option inputs

Chunking receives parser output, so parser options can alter its inputs even though they are not chunking settings.

| Parser area | Examples of relevant options | Potential effect on chunking |
| --- | --- | --- |
| Text | Preserve line breaks | Changes line-tier boundaries |
| PDF | Split pages, maximum pages | Changes section/page boundaries and available continuation metadata |
| Tika PDF | Sort by position, spacing tolerance, duplicate suppression | Changes text order and whitespace |
| PDF content | Annotations, bookmarks, forms, fonts, images | Changes parsed content and metadata |
| OCR | Strategy, renderer, DPI, image format, language, page segmentation, spacing, timeout, skip behavior | Changes recovered text and line structure |
| Write limits | Extracted-text cap | Limits source reaching chunking |
| DOCX | Revision handling mode | Changes accepted/rejected revision text |

Resolution precedence is built-in parser defaults, saved document defaults, then request overrides.

## Processing stages and consumers

| Stage | Input | Output / invariant |
| --- | --- | --- |
| Parse | Document content and resolved parser options | Sections, blocks, pages, and source offsets |
| Chunk preparation | Parsed document and immutable `ChunkingContext` | Children, optional parents, embedding representations, hierarchy diagnostics |
| Embedding persistence | Prepared chunks | Child embeddings; parents persisted with null embedding; prior document chunks atomically replaced |
| Graph extraction | Persisted prepared chunks | Parents selected when present, otherwise flat children |
| Retrieval | Dense child index and graph data | Child hits with optional parent/adjacent context expansion and typed citations |

## Chunking-state API

### `GET /api/v1/chunking-state`

Returns the authoritative global effective policy, including:

- Effective values and their value sources.
- Compatibility aliases.
- Strategy and representation revisions.
- Tokenizer policy identity, revision, and count mode.
- Parser policy revision.
- Settings hash and global effective chunker revision.
- Migration lifecycle, currently explicit reprocessing required.

This is a global policy view. It is not scoped to the active knowledge base.

## Document processing and inspection APIs

| Method and route | Purpose |
| --- | --- |
| `POST /api/v1/documents/{documentId}/process` | Process with optional one-run parser overrides |
| `GET /api/v1/documents/{documentId}/processing-options` | Read effective processing-option context |
| `GET /api/v1/documents/{documentId}/processing-options/defaults` | Read saved document defaults |
| `PUT /api/v1/documents/{documentId}/processing-options/defaults` | Replace saved document defaults |
| `DELETE /api/v1/documents/{documentId}/processing-options/defaults` | Clear saved defaults |
| `GET /api/v1/documents/{documentId}/chunks/page` | Read a bounded page filtered by `PARENT` or `CHILD`, parent, or section |
| `GET /api/v1/documents/{documentId}/chunks/hierarchy` | Read bounded parent summaries and `flatChunkCount` |
| `GET /api/v1/documents/{documentId}/chunks/{chunkId}` | Read direct chunk detail |
| `GET /api/v1/documents/{documentId}/chunks` | Legacy complete list; avoid in new clients |

The frontend Explorer uses bounded endpoints with a page size of 20 and direct detail reads. It clears stale document/chunk selection when the knowledge base changes or the API returns not found.

## Reprocessing APIs

| Method and route | Purpose |
| --- | --- |
| `POST /api/v1/knowledge-bases/{knowledgeBaseId}/chunk-migrations/preview` | Classify scope and test readiness without mutation |
| `POST /api/v1/knowledge-bases/{knowledgeBaseId}/reprocessing-plans` | Create a revision-guarded immutable plan |
| `GET /api/v1/knowledge-bases/{knowledgeBaseId}/reprocessing-plans` | List plans with status/reason/selection filters and paging |
| `GET /api/v1/knowledge-bases/{knowledgeBaseId}/reprocessing-plans/{planId}` | Read plan summary and paged item state |
| `POST /api/v1/knowledge-bases/{knowledgeBaseId}/reprocessing-plans/{planId}/retry` | Retry unresolved items using a fresh snapshot |

### Selection modes

| Mode | Behavior |
| --- | --- |
| `OUTDATED_STRATEGY` | Recommended; selects `OUTDATED` and `NO_CHUNKS` documents |
| `DOCUMENT_IDS` | Selects explicitly named documents owned by the knowledge base |
| `ALL` | Forces every document, including `CURRENT` documents; UI requires confirmation |

### Classification

| Classification | Rule |
| --- | --- |
| `NO_CHUNKS` | No persisted chunks exist |
| `OUTDATED` | No active completed run for the current source hash has the parser-specific target effective revision |
| `CURRENT` | A matching active completed run exists |

### Readiness blockers

- `ACTIVE_SCHEMA_MISSING`
- `AI_PROFILE_UNRESOLVABLE`
- `EMBEDDING_SPACE_INCOMPATIBLE`
- `INVALID_MIGRATION_TARGET`
- `ACTIVE_DESTRUCTIVE_PLAN`

Preview is side-effect free. Plan creation must echo `expectedChunkerRevision`; the API returns conflict if global policy changed after preview.

### Plan and item lifecycle

Plan statuses exposed by the frontend include:

```text
QUEUED -> RUNNING -> COMPLETED
                  -> PARTIAL
                  -> FAILED
                  -> BLOCKED
                  -> INTERRUPTED
```

Items are leased to workers. Before overwrite processing, the worker compares the live source hash with the immutable plan snapshot. A changed document becomes `STALE_SOURCE`. Retry retains successful items and re-snapshots only unresolved work.

## Worked examples

### Recursive source and header budgets

Given the configured defaults:

```text
targetTokens               = 800
hardCharacterLimit         = 4000
contextHeaderMaxTokens     = 96
contextHeaderMaxCharacters = 512

maximum recursive source candidate = 704 tokens and 3488 characters
maximum final representation       = 800 tokens and 4000 characters
```

A source structural unit of 750 tokens does not fit as-is. It moves to finer tiers until each piece fits the 704-token source budget. A final header may then consume up to the reserved 96 tokens without exceeding 800.

### Parent construction

```text
child C0 = 620 tokens, path Chapter 1
child C1 = 700 tokens, path Chapter 1
parent target = 1600 tokens

C0 + C1 = 1320 tokens -> eligible for one parent, subject to character/page rules
```

Both C0 and C1 are embedded. The resulting parent is persisted without an embedding and is preferred for graph extraction.

### Preview and guarded creation

Conceptual preview response:

```json
{
  "ready": true,
  "classification": {
    "noChunks": 2,
    "outdated": 5,
    "current": 11,
    "selected": 7
  },
  "blockers": [],
  "target": {
    "expectedChunkerRevision": "chunker_<global-policy-hash>",
    "strategy": "recursive"
  }
}
```

Creation is allowed only for a matching, ready preview with selected work. The server then stores each document's parser-specific target revision in the immutable item snapshot.

## Frontend behavior map

| Page | Responsibilities |
| --- | --- |
| Chunking > Strategy | Edit nine canonical construction settings; show authoritative values, sources, revisions, aliases, and migration notice |
| Chunking > Explorer | Navigate parent branches and flat population; page children; inspect one direct chunk detail and provenance |
| Chunking > Reprocessing | Choose scope, preview, create, deep-link, poll, page history/items, and retry unresolved work |
| Documents | Process, replace, deep-link to chunk inspection, edit parser defaults, and run with overrides |

Strategy settings are global. Explorer and Reprocessing are scoped to the selected knowledge base.

## Known contract issue

The hierarchy DTO reports `flatChunkCount`, where flat records are unparented `CHILD` chunks. The frontend currently translates that population into `kind=FLAT`, but the backend page filter validates only `PARENT` and `CHILD`. A request such as this returns HTTP 400:

```text
GET /api/v1/documents/{id}/chunks/page?page=0&size=20&kind=FLAT
```

This is latent for the verified recursive documents because their `flatChunkCount` is zero. It affects inspection of fixed-character output and any recursive population that remains unparented.

## Implementation source map

Backend repository: `/home/vitaliy/workspace/graphrag`

| Concern | Primary implementation |
| --- | --- |
| Context snapshot, split delegation, target restore | `src/main/java/io/github/vfedoriv/graphrag/document/ChunkingService.java` |
| Context constraints and hashes | `src/main/java/io/github/vfedoriv/graphrag/document/chunking/ChunkingContext.java` |
| Recursive strategy | `src/main/java/io/github/vfedoriv/graphrag/document/chunking/RecursiveTokenAwareChunkingStrategy.java` |
| Fixed strategy | `src/main/java/io/github/vfedoriv/graphrag/document/chunking/FixedCharacterChunkingStrategy.java` |
| Revision calculation | `src/main/java/io/github/vfedoriv/graphrag/document/chunking/ChunkRevisionCalculator.java` |
| Tokenizer selection and estimators | `src/main/java/io/github/vfedoriv/graphrag/document/chunking/TokenizerPolicy.java`, `Cl100kTokenEstimator.java`, `Utf8ByteTokenEstimator.java` |
| Hierarchy | `src/main/java/io/github/vfedoriv/graphrag/application/processing/ChunkHierarchyBuilder.java` |
| Context header | `src/main/java/io/github/vfedoriv/graphrag/application/processing/ContextualChunkTextBuilder.java` |
| Pipeline stages | `src/main/java/io/github/vfedoriv/graphrag/application/processing/ChunkPreparationStage.java`, `EmbeddingPersistenceStage.java`, `GraphExtractionStage.java` |
| Document processing and chunk reads | `src/main/java/io/github/vfedoriv/graphrag/service/DocumentProcessingService.java` |
| Runtime catalog and effective state | `src/main/java/io/github/vfedoriv/graphrag/application/settings/RuntimeSettingsCatalog.java`, `service/RuntimeSettingsService.java`, `service/ChunkingStateService.java` |
| Preview, immutable plans, workers, retry | `src/main/java/io/github/vfedoriv/graphrag/service/SchemaReprocessingPlanService.java` |
| HTTP endpoints | `src/main/java/io/github/vfedoriv/graphrag/controller/DocumentController.java`, `ChunkingStateController.java`, `ChunkMigrationController.java` |
| Deployment defaults | `src/main/resources/application.properties` |

Frontend repository: `/home/vitaliy/workspace/graphrag-ui`

| Concern | Primary implementation |
| --- | --- |
| Strategy page | `src/features/chunking/ChunkingPage.tsx` |
| Canonical control definitions | `src/features/chunking/chunkingStrategy.ts` |
| Explorer | `src/features/chunking/ChunkExplorer.tsx` |
| Preview and plan workflow | `src/features/chunking/ChunkMigrationWorkflow.tsx` |
| Chunking and plan APIs | `src/api/chunking.ts`, `src/api/reprocessingPlans.ts`, `src/api/documents.ts` |
| DTOs | `src/api/types.ts` |
| Parser-options workflow | `src/features/documents/DocumentProcessingOptionsWorkflow.tsx` |
| Documents page | `src/features/documents/DocumentsPage.tsx` |

## Verification snapshot

The documentation was checked against the running UI and API on 2026-08-07:

- Global strategy: `recursive` with the defaults listed above.
- Token counting: exact CL100K.
- Active knowledge base: four completed text documents.
- Inspected example: four parent chunks and seven children, with zero flat chunks.
- Recommended migration preview: all four current, zero selected, ready, no blockers.
- Reprocessing history: one completed two-document plan.

These live values are an observation, not a deployment guarantee. The algorithms, constraints, and contract descriptions come from the implementation.
