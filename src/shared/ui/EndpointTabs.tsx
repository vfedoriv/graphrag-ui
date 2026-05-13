import { useState, type ReactNode } from 'react'
import { cn } from '../lib/cn'

export type EndpointTab = {
  id: string
  label: string
  content: ReactNode
}

type EndpointTabsProps = {
  tabs: EndpointTab[]
  initialTabId?: string
  testId?: string
  disableTabSwitch?: boolean
  keepPanelsMounted?: boolean
}

export function EndpointTabs({ tabs, initialTabId, testId, disableTabSwitch = false, keepPanelsMounted = false }: EndpointTabsProps) {
  const [activeTabId, setActiveTabId] = useState(initialTabId ?? tabs[0]?.id)
  const activeTab = tabs.find((tab) => tab.id === activeTabId) ?? tabs[0]

  return (
    <div className='space-y-3' data-testid={testId}>
      <div className='flex flex-wrap gap-2 border-b border-slate-200 pb-3'>
        {tabs.map((tab) => (
          <button
            key={tab.id}
            type='button'
            data-testid={`${testId}-tab-${tab.id}`}
            disabled={disableTabSwitch}
            onClick={() => setActiveTabId(tab.id)}
            className={cn(
              'rounded-md px-3 py-2 text-sm font-medium',
              tab.id === activeTab?.id ? 'bg-emerald-100 text-emerald-900' : 'bg-slate-100 text-slate-700 hover:bg-slate-200',
            )}
          >
            {tab.label}
          </button>
        ))}
      </div>
      {keepPanelsMounted ? (
        <div className='space-y-0'>
          {tabs.map((tab) => (
            <div key={tab.id} data-testid={`${testId}-panel-${tab.id}`} className={tab.id === activeTab?.id ? 'block' : 'hidden'}>
              {tab.content}
            </div>
          ))}
        </div>
      ) : (
        <div data-testid={`${testId}-panel-${activeTab?.id}`}>{activeTab?.content}</div>
      )}
    </div>
  )
}
