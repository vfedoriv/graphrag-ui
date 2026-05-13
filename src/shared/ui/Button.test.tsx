import { render, screen } from '@testing-library/react'
import { Button } from './Button'

describe('Button', () => {
  it('includes interactive and accessibility state classes', () => {
    render(<Button>Action</Button>)

    const button = screen.getByRole('button', { name: 'Action' })
    expect(button.className).toContain('hover:brightness-110')
    expect(button.className).toContain('active:translate-y-px')
    expect(button.className).toContain('active:scale-[0.99]')
    expect(button.className).toContain('focus-visible:outline-none')
    expect(button.className).toContain('focus-visible:ring-2')
    expect(button.className).toContain('focus-visible:ring-emerald-400')
    expect(button.className).toContain('disabled:pointer-events-none')
  })

  it('shows pending text and disables interaction while pending', () => {
    render(<Button isPending pendingText='Loading...'>Action</Button>)

    const button = screen.getByRole('button', { name: 'Loading...' })
    expect(button).toBeDisabled()
    expect(button).toHaveAttribute('aria-busy', 'true')
  })
})
