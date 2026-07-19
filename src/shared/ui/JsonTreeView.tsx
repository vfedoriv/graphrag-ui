import { JsonEditor, type JsonValue } from '@visual-json/react'

type JsonTreeViewProps = {
  label: string
  value: JsonValue
  onChange?: (value: JsonValue) => void
  readOnly?: boolean
  minHeight?: number
}

export function JsonTreeView({
  label,
  value,
  onChange,
  readOnly = false,
  minHeight = 260,
}: JsonTreeViewProps) {
  return (
    <div
      className='panel'
      aria-label={label}
      aria-disabled={readOnly}
      role='group'
      style={{ minHeight }}
    >
      <JsonEditor
        value={value}
        onChange={onChange}
        readOnly={readOnly}
        height='100%'
        width='100%'
        sidebarOpen
        treeShowValues
        treeShowCounts
        editorShowCounts
      />
    </div>
  )
}
