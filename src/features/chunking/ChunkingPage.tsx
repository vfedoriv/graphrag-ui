import { useEffect, useMemo, useState, type ReactNode } from 'react'
import { Link, useLocation, useNavigate } from 'react-router-dom'
import { useChunkingStateQuery } from '../../api/chunking'
import { useBulkUpdateRuntimeSettingsMutation, useRuntimeSettingsQuery } from '../../api/runtimeSettings'
import type { ChunkingState, RuntimeSetting } from '../../api/types'
import { useKnowledgeBasesQuery } from '../../api/knowledgeBases'
import { useSelectedKnowledgeBase } from '../../shared/state/useSelectedKnowledgeBase'
import { Alert } from '../../shared/ui/Alert'
import { Button } from '../../shared/ui/Button'
import { ControllerPage } from '../../shared/ui/ControllerPage'
import { Input } from '../../shared/ui/Input'
import { OperationSpine, WorkspaceStrip } from '../../shared/ui/PrototypePrimitives'
import { StatusBadge } from '../../shared/ui/StatusBadge'
import {
  CANONICAL_CHUNKING_CONTROLS,
  changedCanonicalSettings,
  effectiveValueForControl,
  enumValues,
  formatChunkingValue,
  normalizeChunkingView,
  validateRuntimeSettingDraft,
} from './chunkingStrategy'
import { isRuntimeSettingEditable, isNumericSetting } from '../settings/runtimeSettingsHelpers'
import { ChunkExplorer } from './ChunkExplorer'
import { ChunkMigrationWorkflow } from './ChunkMigrationWorkflow'

export function ChunkingPage() {
  const location = useLocation()
  const navigate = useNavigate()
  const routeSearch = typeof window === 'undefined' ? location.search : window.location.search || location.search
  const rawView = new URLSearchParams(routeSearch).get('view')
  const view = normalizeChunkingView(rawView)
  const rawPlanId = new URLSearchParams(routeSearch).get('planId')
  const planId = rawPlanId?.trim() || null
  const { selectedKnowledgeBaseId } = useSelectedKnowledgeBase()
  const { data: knowledgeBases = [] } = useKnowledgeBasesQuery()
  const activeKb = knowledgeBases.find((kb) => kb.id === selectedKnowledgeBaseId) ?? null
  const isExplorerView = view === 'chunks' || view === 'explorer'

  useEffect(() => {
    if (rawView === view) return
    const params = new URLSearchParams(window.location.search)
    params.set('view', view)
    if (view !== 'reprocessing') params.delete('planId')
    const normalizedPath = `/chunking?${params.toString()}`
    window.history.replaceState(window.history.state, '', normalizedPath)
    navigate(normalizedPath, { replace: true })
  }, [navigate, rawView, view])

  const tabs = (
    <nav className='chunking-workspace-tabs' aria-label='Chunking workspace views'>
      {([
        ['strategy', 'Strategy'],
        ['chunks', 'Chunk Explorer'],
        ['reprocessing', 'Reprocessing'],
      ] as const).map(([tabView, label]) => (
        <Link
          key={tabView}
          className={`tab ${((tabView === 'chunks' && isExplorerView) || view === tabView) ? 'active' : ''}`}
          to={`/chunking?view=${tabView}`}
          role='tab'
          aria-selected={(tabView === 'chunks' && isExplorerView) || view === tabView}
        >
          {label}
        </Link>
      ))}
    </nav>
  )

  if (view === 'chunks' || view === 'explorer') {
    return <ChunkExplorer tabs={tabs} activeKb={activeKb?.name ?? selectedKnowledgeBaseId ?? null} />
  }

  if (view !== 'strategy') {
    if (view === 'reprocessing') {
      return <ChunkMigrationWorkflow
        tabs={tabs}
        activeKb={activeKb?.name ?? selectedKnowledgeBaseId ?? null}
        knowledgeBaseId={selectedKnowledgeBaseId}
        planId={planId}
        onPlanIdChange={(nextPlanId) => {
          const params = new URLSearchParams(routeSearch)
          params.set('view', 'reprocessing')
          if (nextPlanId) params.set('planId', nextPlanId)
          else params.delete('planId')
          navigate(`/chunking?${params.toString()}`, { replace: true })
        }}
      />
    }
    return (
      <ControllerPage
        title='Chunking'
        eyebrow='Global operations workspace'
        description='Inspect global chunk strategy and hand off knowledge-base operations when those views are available.'
        workspaceStrip={<WorkspaceStrip items={[{ label: 'Scope', value: 'Global strategy' }, { label: 'Selected workspace', value: activeKb?.name ?? selectedKnowledgeBaseId ?? 'None selected' }]} />}
        topSectionTitle='Reprocessing'
        topSectionDescription='This dependent view is reserved for the next chunking operations package.'
        topSectionStatus={<StatusBadge label='Not available yet' tone='warning' />}
        topSection={<div className='stack'><Alert title='Reprocessing is not implemented' message={selectedKnowledgeBaseId ? 'Return to Strategy to inspect global effective state. A later change will add this knowledge-base-scoped workflow.' : 'Select a knowledge base, then return here after the dependent workflow is available.'} tone='info' /><Link className='button' to='/chunking?view=strategy'>Back to Strategy</Link></div>}
        tabs={tabs}
        tabsTitle='Chunking workspace'
        tabsDescription='Strategy is global; Explorer and Reprocessing will be knowledge-base scoped.'
        testId='chunking-controller-page'
      />
    )
  }

  return <ChunkingStrategyView tabs={tabs} activeKb={activeKb?.name ?? selectedKnowledgeBaseId ?? null} viewWasNormalized={rawView !== null && rawView !== view} />
}

function ChunkingStrategyView({ tabs, activeKb, viewWasNormalized }: { tabs: ReactNode; activeKb: string | null; viewWasNormalized: boolean }) {
  const runtimeSettingsQuery = useRuntimeSettingsQuery()
  const chunkingStateQuery = useChunkingStateQuery()
  const [drafts, setDrafts] = useState<Record<string, string>>({})
  const [validationErrors, setValidationErrors] = useState<Record<string, string>>({})
  const [applyMessage, setApplyMessage] = useState<string | null>(null)
  const [migrationNotice, setMigrationNotice] = useState(false)
  const bulkUpdateMutation = useBulkUpdateRuntimeSettingsMutation()
  const settings = useMemo(
    () => (runtimeSettingsQuery.data ?? []).filter((setting) => typeof setting?.category === 'string' && setting.category.trim().toLowerCase() !== 'provider'),
    [runtimeSettingsQuery.data],
  )
  const state = isChunkingState(chunkingStateQuery.data) ? chunkingStateQuery.data : undefined
  const changedSettings = useMemo(() => changedCanonicalSettings(settings, state, drafts), [drafts, settings, state])
  const changedKeys = new Set(changedSettings.map((setting) => setting.key))

  const applyChanges = async () => {
    const nextErrors: Record<string, string> = {}
    for (const control of CANONICAL_CHUNKING_CONTROLS) {
      const setting = settings.find((item) => item.key === control.key)
      const draft = drafts[control.key]
      if (!setting || draft === undefined) continue
      const error = validateRuntimeSettingDraft(setting, draft)
      if (error) nextErrors[control.key] = error
    }
    setValidationErrors(nextErrors)
    if (Object.keys(nextErrors).length > 0 || changedSettings.length === 0 || !state) return

    const previousRevision = state.effectiveChunkerRevision
    setApplyMessage(null)
    try {
      await bulkUpdateMutation.mutateAsync({ updates: changedSettings })
      const [settingsResult, stateResult] = await Promise.all([
        runtimeSettingsQuery.refetch(),
        chunkingStateQuery.refetch(),
      ])
      if (settingsResult.error || stateResult.error || !stateResult.data) {
        setApplyMessage('Settings were accepted, but the combined view could not be fully refreshed. Drafts remain staged.')
        return
      }
      const runtimeReflected = changedSettings.every((update) => {
        const setting = settingsResult.data?.find((item) => item.key === update.key)
        return Boolean(setting && valuesMatch(setting.currentValue, update.value))
      })
      const aggregateReflected = changedSettings.every((update) => {
        const control = CANONICAL_CHUNKING_CONTROLS.find((item) => item.key === update.key)
        return Boolean(control && valuesMatch(effectiveValueForControl(stateResult.data, control), update.value))
      })
      if (!runtimeReflected || !aggregateReflected) {
        setApplyMessage('Settings were accepted, but the refreshed effective values do not yet include every draft. Drafts remain staged.')
        return
      }
      setDrafts((current) => {
        const next = { ...current }
        for (const setting of changedSettings) delete next[setting.key]
        return next
      })
      setApplyMessage(`${changedSettings.length} chunk setting${changedSettings.length === 1 ? '' : 's'} accepted`)
      setMigrationNotice(previousRevision !== stateResult.data.effectiveChunkerRevision)
    } catch {
      // The mutation error is rendered below and staged drafts remain intact.
    }
  }

  const topSection = (
    <div className='stack-lg'>
      <OperationSpine
        ariaLabel='Chunking strategy status'
        items={[
          { eyebrow: 'Scope', title: 'Global', body: 'Strategy values are independent of the selected knowledge base.' },
          { eyebrow: 'Runtime catalog', title: runtimeSettingsQuery.isLoading ? 'Loading' : `${settings.length} settings`, body: runtimeSettingsQuery.error ? 'Catalog unavailable' : 'Mutation metadata and constraints' },
          { eyebrow: 'Effective state', title: chunkingStateQuery.isLoading ? 'Loading' : state ? state.effectiveChunkerRevision : 'Unavailable', body: chunkingStateQuery.error ? 'Aggregate state unavailable' : 'Authoritative chunking-state read model' },
          { eyebrow: 'Migration', title: state?.migrationLifecycle ?? 'Unknown', body: 'Saving strategy never changes existing document chunks.' },
        ]}
      />
      {viewWasNormalized ? <Alert title='Chunking view normalized' message='The requested view is not recognized, so Strategy is shown.' tone='info' /> : null}
      {runtimeSettingsQuery.isLoading ? <p>Loading runtime setting definitions...</p> : null}
      {runtimeSettingsQuery.error ? <Alert title='Runtime settings unavailable' message={(runtimeSettingsQuery.error as Error).message} /> : null}
      {chunkingStateQuery.isLoading ? <p>Loading authoritative chunking state...</p> : null}
      {chunkingStateQuery.error ? <Alert title='Chunking state unavailable' message={`${(chunkingStateQuery.error as Error).message}. Runtime values below are not authoritative combined state.`} /> : null}
      {applyMessage ? <Alert title='Chunking settings updated' message={applyMessage} tone={applyMessage.includes('accepted') ? 'success' : 'info'} /> : null}
      {bulkUpdateMutation.error ? <Alert title='Apply failed' message={(bulkUpdateMutation.error as Error).message} /> : null}
      {migrationNotice ? <MigrationHandoff /> : null}
      <div className='chunking-control-grid' data-testid='chunking-canonical-controls'>
        {CANONICAL_CHUNKING_CONTROLS.map((control) => {
          const setting = settings.find((item) => item.key === control.key)
          const effectiveValue = effectiveValueForControl(state, control)
          const draft = drafts[control.key]
          const editable = Boolean(setting && state && effectiveValue !== undefined && isRuntimeSettingEditable(setting))
          const modified = changedKeys.has(control.key)
          const error = validationErrors[control.key]
          return (
            <ChunkingControlCard
              key={control.key}
              control={control}
              setting={setting}
              effectiveValue={effectiveValue}
              effectiveSource={state?.valueSources?.[control.key]}
              draft={draft}
              editable={editable}
              modified={modified}
              error={error}
              onChange={(value) => {
                setApplyMessage(null)
                setValidationErrors((current) => ({ ...current, [control.key]: validateRuntimeSettingDraft(setting!, value) ?? '' }))
                setDrafts((current) => ({ ...current, [control.key]: value }))
              }}
            />
          )
        })}
      </div>
      <div className='split-stack'>
        <p>Apply sends only changed canonical settings in one atomic request.</p>
        <Button type='button' variant='primary' isPending={bulkUpdateMutation.isPending} pendingText='Applying...' disabled={changedSettings.length === 0 || Object.values(validationErrors).some(Boolean) || !state} onClick={() => void applyChanges()}>Apply strategy changes</Button>
      </div>
      {state ? <ChunkingMetadata state={state} /> : null}
      {state?.compatibilityAliases?.length ? <CompatibilityAliases aliases={state.compatibilityAliases} /> : null}
      <GenericSettingsHandoff settings={settings} />
    </div>
  )

  return (
    <ControllerPage
      title='Chunking'
      eyebrow='Global operations workspace'
      description='Inspect the effective chunk strategy, edit curated canonical controls, and keep document migration explicit.'
      workspaceStrip={<WorkspaceStrip items={[{ label: 'Scope', value: 'Global' }, { label: 'Selected workspace', value: activeKb ?? 'None selected' }, { label: 'Authoritative read', value: '/api/v1/chunking-state' }]} />}
      topSectionTitle='Strategy'
      topSectionDescription='Effective values come from the aggregate chunking state; runtime settings provide editability and validation metadata.'
      topSectionStatus={<StatusBadge label={state ? 'Authoritative state loaded' : 'Waiting for state'} tone={state ? 'success' : 'warning'} />}
      topSection={topSection}
      tabs={tabs}
      tabsTitle='Chunking workspace'
      tabsDescription='Strategy is global. Explorer and Reprocessing will become knowledge-base-scoped workflows.'
      testId='chunking-controller-page'
    />
  )
}

function ChunkingControlCard({
  control,
  setting,
  effectiveValue,
  effectiveSource,
  draft,
  editable,
  modified,
  error,
  onChange,
}: {
  control: (typeof CANONICAL_CHUNKING_CONTROLS)[number]
  setting?: RuntimeSetting
  effectiveValue: unknown
  effectiveSource?: string
  draft?: string
  editable: boolean
  modified: boolean
  error?: string
  onChange: (value: string) => void
}) {
  const choices = setting ? enumValues(setting) : []
  const value = draft ?? formatChunkingValue(effectiveValue)
  const unavailableReason = !setting ? 'No runtime-setting definition was returned for this canonical key.' : !editable ? setting.reason ?? 'Backend marks this setting as immutable.' : effectiveValue === undefined || effectiveValue === null ? 'Aggregate effective value is unavailable.' : null
  return (
    <article className='chunking-control-card' data-testid={`chunking-control-${control.stateKey}`}>
      <div className='split-stack'>
        <div className='stack'>
          <label htmlFor={`chunking-${control.stateKey}`}>{control.label}</label>
          <code>{control.key}</code>
        </div>
        {modified ? <StatusBadge label='Draft' tone='warning' /> : null}
      </div>
      <div className='chunking-control-values'>
        <div>
          <span className='eyebrow'>Effective</span>
          <strong>{effectiveValue === undefined ? 'Unavailable' : formatChunkingValue(effectiveValue)}</strong>
          <small>Source: {effectiveSource ?? 'Not available'}</small>
        </div>
        <div>
          <span className='eyebrow'>Edit</span>
          {editable ? (
            choices.length > 0 ? (
              <select id={`chunking-${control.stateKey}`} value={value} onChange={(event) => onChange(event.target.value)} aria-label={`Draft for ${control.key}`}>
                {choices.map((choice) => <option key={String(choice)} value={String(choice)}>{String(choice)}</option>)}
              </select>
            ) : (
              <Input id={`chunking-${control.stateKey}`} aria-label={`Draft for ${control.key}`} type={isNumericSetting(setting!) ? 'number' : 'text'} min={numericConstraint(setting, 'min')} max={numericConstraint(setting, 'max')} value={value} onChange={(event) => onChange(event.target.value)} />
            )
          ) : <span className='muted'>Read-only</span>}
          {unavailableReason ? <small>{unavailableReason}</small> : null}
          {setting ? <small>Configured: {formatChunkingValue(setting.currentValue)} · Source: {setting.source}</small> : null}
          {error ? <small className='chunking-validation-error'>{error}</small> : null}
        </div>
      </div>
    </article>
  )
}

function numericConstraint(setting: RuntimeSetting | undefined, key: 'min' | 'max') {
  const value = setting?.constraints?.[key]
  return typeof value === 'number' ? value : undefined
}

function ChunkingMetadata({ state }: { state: ChunkingState }) {
  const revisionItems = Object.entries(state.componentRevisions)
  return (
    <section className='flow-card' data-testid='chunking-metadata'>
      <div className='panel-head compact'><div><p className='eyebrow'>Authoritative aggregate</p><h3>Effective metadata</h3></div><StatusBadge label={state.migrationLifecycle} tone='neutral' /></div>
      <dl className='chunking-metadata-grid'>
        <MetadataItem label='Settings hash' value={state.settingsHash} />
        <MetadataItem label='Effective chunker revision' value={state.effectiveChunkerRevision} />
        <MetadataItem label='Tokenizer' value={state.tokenizerId} />
        <MetadataItem label='Tokenizer revision' value={state.tokenizerRevision} />
        <MetadataItem label='Token count mode' value={state.tokenCountMode} />
        <MetadataItem label='Parser policy revision' value={state.parserPolicyRevision} />
        <MetadataItem label='Representation revision' value={state.representationRevision} />
        {revisionItems.map(([key, value]) => <MetadataItem key={key} label={key} value={value} />)}
        <MetadataItem label='Migration lifecycle' value={state.migrationLifecycle} />
      </dl>
    </section>
  )
}

function MetadataItem({ label, value }: { label: string; value: unknown }) {
  return <div><dt>{label}</dt><dd>{formatChunkingValue(value)}</dd></div>
}

function CompatibilityAliases({ aliases }: { aliases: ChunkingState['compatibilityAliases'] }) {
  return (
    <details className='flow-card chunking-aliases'>
      <summary>Compatibility aliases ({aliases.length})</summary>
      <p>Aliases are read-only. The aggregate state below explains configured and effective values, authority, and precedence.</p>
      <table><thead><tr><th>Alias</th><th>Canonical</th><th>Configured</th><th>Effective</th><th>Authority</th><th>Precedence</th></tr></thead><tbody>{aliases.map((alias) => <tr key={alias.aliasKey}><td><code>{alias.aliasKey}</code></td><td><code>{alias.canonicalKey}</code></td><td>{formatChunkingValue(alias.configuredValue)}</td><td>{formatChunkingValue(alias.effectiveValue)}</td><td>{alias.authoritative ? 'Authoritative' : 'Compatibility alias'}</td><td>{alias.precedence}</td></tr>)}</tbody></table>
    </details>
  )
}

function GenericSettingsHandoff({ settings }: { settings: RuntimeSetting[] }) {
  const nonCurated = settings.filter((setting) => setting.key.startsWith('app.chunking.') && !CANONICAL_CHUNKING_CONTROLS.some((control) => control.key === setting.key))
  if (nonCurated.length === 0) return null
  return (
    <div className='stack'>
      <Alert title='Additional chunk settings remain in generic Settings' message={`${nonCurated.length} non-curated setting${nonCurated.length === 1 ? '' : 's'} stay available in the full runtime catalog.`} tone='info' />
      <Link className='button' to='/settings'>Open generic Settings</Link>
    </div>
  )
}

function MigrationHandoff() {
  return (
    <div className='stack'>
      <Alert title='Existing document chunks were not changed' message='The effective chunker revision changed, but saving global strategy does not reprocess existing documents.' tone='info' />
      <Link className='button' to='/chunking?view=reprocessing'>Review Reprocessing</Link>
    </div>
  )
}

function isChunkingState(value: unknown): value is ChunkingState {
  return Boolean(value && typeof value === 'object' && 'valueSources' in value && 'effectiveChunkerRevision' in value)
}

function valuesMatch(left: unknown, right: unknown) {
  return Object.is(left, right) || JSON.stringify(left) === JSON.stringify(right)
}
