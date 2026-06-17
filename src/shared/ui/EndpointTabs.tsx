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
    <div className='stack' data-testid={testId}>
      <div className='tabs' role='tablist'>
        {tabs.map((tab) => (
          <button
            key={tab.id}
            type='button'
            role='tab'
            aria-selected={tab.id === activeTab?.id}
            data-testid={`${testId}-tab-${tab.id}`}
            disabled={disableTabSwitch}
            onClick={() => setActiveTabId(tab.id)}
            className={cn(
              'tab',
              tab.id === activeTab?.id && 'active',
            )}
          >
            {tab.label}
          </button>
        ))}
      </div>
      {keepPanelsMounted ? (
        <div className='stack'>
          {tabs.map((tab) => (
            <div
              key={tab.id}
              role='tabpanel'
              data-testid={`${testId}-panel-${tab.id}`}
              className='tab-panel'
              hidden={tab.id !== activeTab?.id}
            >
              {tab.content}
            </div>
          ))}
        </div>
      ) : (
        <div role='tabpanel' className='tab-panel' data-testid={`${testId}-panel-${activeTab?.id}`}>{activeTab?.content}</div>
      )}
    </div>
  )
}
