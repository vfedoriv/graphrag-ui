import type { ReactNode } from 'react'

export function Table({ headers, rows }: { headers: string[]; rows: ReactNode[][] }) {
  return (
    <div className='overflow-auto rounded-md border border-slate-300 bg-white'>
      <table className='w-full border-collapse text-left text-sm'>
        <thead className='bg-slate-100'>
          <tr>
            {headers.map((h) => (
              <th key={h} className='border-b border-slate-300 px-3 py-2 font-semibold text-slate-800'>
                {h}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map((row, i) => (
            <tr key={i}>
              {row.map((cell, cIdx) => (
                <td key={cIdx} className='border-b border-slate-200 px-3 py-2 align-top text-slate-700'>
                  {cell}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}
