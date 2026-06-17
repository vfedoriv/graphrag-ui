import type { ReactNode } from 'react'

type ControllerPageProps = {
  title: string
  eyebrow?: string
  description?: string
  actions?: ReactNode
  workspaceStrip?: ReactNode
  topSectionTitle: string
  topSectionDescription?: string
  topSectionStatus?: ReactNode
  topSection: ReactNode
  tabs?: ReactNode
  tabsTitle?: string
  tabsDescription?: string
  tabsStatus?: ReactNode
  testId?: string
}

export function ControllerPage({
  title,
  eyebrow = 'Controller page',
  description,
  actions,
  workspaceStrip,
  topSectionTitle,
  topSectionDescription,
  topSectionStatus,
  topSection,
  tabs,
  tabsTitle = 'Workflow console',
  tabsDescription,
  tabsStatus,
  testId,
}: ControllerPageProps) {
  return (
    <section className='stack-lg' data-testid={testId}>
      <header className='page-header'>
        <div>
          <p className='eyebrow'>{eyebrow}</p>
          <h1>{title}</h1>
          {description ? <p className='lede'>{description}</p> : null}
          {workspaceStrip ? <div className='workspace-strip'>{workspaceStrip}</div> : null}
        </div>
        {actions ? <div className='header-actions'>{actions}</div> : null}
      </header>

      <section className='panel' data-testid={`${testId}-top-section`}>
        <div className='panel-head'>
          <div>
            <h2>{topSectionTitle}</h2>
            {topSectionDescription ? <p>{topSectionDescription}</p> : null}
          </div>
          {topSectionStatus ? <div className='panel-actions'>{topSectionStatus}</div> : null}
        </div>
        {topSection}
      </section>

      {tabs ? (
        <section className='panel'>
          <div className='panel-head compact'>
            <div>
              <h2>{tabsTitle}</h2>
              {tabsDescription ? <p>{tabsDescription}</p> : null}
            </div>
            {tabsStatus ? <div className='panel-actions'>{tabsStatus}</div> : null}
          </div>
          {tabs}
        </section>
      ) : null}
    </section>
  )
}
