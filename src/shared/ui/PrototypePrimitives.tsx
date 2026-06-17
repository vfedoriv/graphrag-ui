import type { ReactNode } from 'react'
import { Link } from 'react-router-dom'
import { cn } from '../lib/cn'
import { StatusBadge } from './StatusBadge'

type StripItem = {
  label: string
  value: ReactNode
  tone?: 'neutral' | 'success' | 'warning' | 'error'
}

export function WorkspaceStrip({ items }: { items: StripItem[] }) {
  return (
    <>
      {items.map((item) => (
        <StatusBadge
          key={item.label}
          tone={item.tone ?? 'neutral'}
          label={`${item.label}: ${stringifyNode(item.value)}`}
        />
      ))}
    </>
  )
}

type OperationSpineItem = {
  eyebrow: string
  title: ReactNode
  body: ReactNode
}

export function OperationSpine({
  items,
  className,
  ariaLabel,
}: {
  items: OperationSpineItem[]
  className?: string
  ariaLabel?: string
}) {
  return (
    <section className={cn('ops-spine', className)} aria-label={ariaLabel}>
      {items.map((item) => (
        <div key={item.eyebrow}>
          <span className='eyebrow'>{item.eyebrow}</span>
          <strong>{item.title}</strong>
          <small>{item.body}</small>
        </div>
      ))}
    </section>
  )
}

type ActionGridItem = {
  to: string
  title: string
  description: string
}

export function ActionGrid({ items }: { items: ActionGridItem[] }) {
  return (
    <div className='action-grid'>
      {items.map((item) => (
        <Link key={item.to} className='action-card' to={item.to}>
          <strong>{item.title}</strong>
          <small>{item.description}</small>
        </Link>
      ))}
    </div>
  )
}

type MetricItem = {
  title: string
  body: string
}

export function MetricGrid({ items }: { items: MetricItem[] }) {
  return (
    <div className='grid three'>
      {items.map((item) => (
        <div className='metric' key={item.title}>
          <strong>{item.title}</strong>
          <small>{item.body}</small>
        </div>
      ))}
    </div>
  )
}

export function Notice({
  title,
  children,
  tone = 'info',
}: {
  title: string
  children: ReactNode
  tone?: 'info' | 'success' | 'warning' | 'danger'
}) {
  return (
    <div className={cn('notice', tone !== 'info' && tone)}>
      <strong>{title}</strong>
      <p>{children}</p>
    </div>
  )
}

function stringifyNode(node: ReactNode) {
  if (typeof node === 'string' || typeof node === 'number') {
    return String(node)
  }
  return ''
}
