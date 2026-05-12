import type { ReactNode } from 'react'

type ControllerPageProps = {
  title: string
  topSectionTitle: string
  topSection: ReactNode
  tabs?: ReactNode
  testId?: string
}

export function ControllerPage({ title, topSectionTitle, topSection, tabs, testId }: ControllerPageProps) {
  return (
    <section className='min-w-0 space-y-4' data-testid={testId}>
      <h1 className='text-2xl font-bold text-slate-900'>{title}</h1>
      <div className='min-w-0 space-y-2 rounded-md border border-slate-300 bg-white p-4' data-testid={`${testId}-top-section`}>
        <h2 className='text-base font-semibold text-slate-900'>{topSectionTitle}</h2>
        {topSection}
      </div>
      {tabs ? <div className='min-w-0 rounded-md border border-slate-300 bg-white p-4'>{tabs}</div> : null}
    </section>
  )
}
