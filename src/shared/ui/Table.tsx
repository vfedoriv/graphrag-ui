import type { ReactNode } from 'react'

export function Table({
  headers,
  rows,
  rowKeys,
  rowClassNames,
  ariaLabel,
}: {
  headers: string[]
  rows: ReactNode[][]
  rowKeys?: Array<string | number>
  rowClassNames?: string[]
  ariaLabel?: string
}) {
  return (
    <div className='table-wrap'>
      <table aria-label={ariaLabel}>
        <thead>
          <tr>
            {headers.map((h) => (
              <th key={h}>{h}</th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map((row, i) => (
            <tr key={rowKeys?.[i] ?? i} className={rowClassNames?.[i]}>
              {row.map((cell, cIdx) => (
                <td key={cIdx}>{cell}</td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}
