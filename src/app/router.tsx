import { createBrowserRouter } from 'react-router-dom'
import { AppLayout } from './AppLayout'
import { DashboardPage } from '../features/dashboard/DashboardPage'
import { KnowledgeBasesPage } from '../features/knowledge-bases/KnowledgeBasesPage'
import { SchemasPage } from '../features/schemas/SchemasPage'
import { SchemaBuilderPage } from '../features/schema-builder/SchemaBuilderPage'
import { DocumentsPage } from '../features/documents/DocumentsPage'
import { QueriesPage } from '../features/queries/QueriesPage'
import { SettingsPage } from '../features/settings/SettingsPage'

export const router = createBrowserRouter([
  {
    path: '/',
    element: <AppLayout />,
    children: [
      { index: true, element: <DashboardPage /> },
      { path: 'knowledge-bases', element: <KnowledgeBasesPage /> },
      { path: 'schemas', element: <SchemasPage /> },
      { path: 'schema-builder', element: <SchemaBuilderPage /> },
      { path: 'documents', element: <DocumentsPage /> },
      { path: 'queries', element: <QueriesPage /> },
      { path: 'settings', element: <SettingsPage /> },
    ],
  },
])
