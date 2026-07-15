import { lazy, Suspense, type ComponentType } from 'react'
import { createBrowserRouter } from 'react-router-dom'
import { AppLayout } from './AppLayout'
import { RouteLoadingFallback } from './RouteLoadingFallback'

const DashboardPage = lazyPage(() => import('../features/dashboard/DashboardPage'), 'DashboardPage')
const KnowledgeBasesPage = lazyPage(() => import('../features/knowledge-bases/KnowledgeBasesPage'), 'KnowledgeBasesPage')
const SchemasPage = lazyPage(() => import('../features/schemas/SchemasPage'), 'SchemasPage')
const SchemaBuilderPage = lazyPage(() => import('../features/schema-builder/SchemaBuilderPage'), 'SchemaBuilderPage')
const DocumentsPage = lazyPage(() => import('../features/documents/DocumentsPage'), 'DocumentsPage')
const QueriesPage = lazyPage(() => import('../features/queries/QueriesPage'), 'QueriesPage')
const SettingsPage = lazyPage(() => import('../features/settings/SettingsPage'), 'SettingsPage')
const SchemaDraftsPage = lazyPage(() => import('../features/schema-drafts/SchemaDraftsPage'), 'SchemaDraftsPage')

function lazyPage<T extends Record<string, ComponentType>>(
  load: () => Promise<T>,
  exportName: keyof T,
) {
  return lazy(async () => ({ default: (await load())[exportName] }))
}

function routeElement(Page: ComponentType) {
  return (
    <Suspense fallback={<RouteLoadingFallback />}>
      <Page />
    </Suspense>
  )
}

export const router = createBrowserRouter([
  {
    path: '/',
    element: <AppLayout />,
    children: [
      { index: true, element: routeElement(DashboardPage) },
      { path: 'knowledge-bases', element: routeElement(KnowledgeBasesPage) },
      { path: 'schemas', element: routeElement(SchemasPage) },
      { path: 'schema-builder', element: routeElement(SchemaBuilderPage) },
      { path: 'schema-drafts', element: routeElement(SchemaDraftsPage) },
      { path: 'schema-drafts/:draftId', element: routeElement(SchemaDraftsPage) },
      { path: 'documents', element: routeElement(DocumentsPage) },
      { path: 'queries', element: routeElement(QueriesPage) },
      { path: 'settings', element: routeElement(SettingsPage) },
    ],
  },
])
