import { render, screen } from '@testing-library/react'
import { Button } from './Button'

describe('Button', () => {
  it('includes interactive and accessibility state classes', () => {
    render(<Button variant='primary'>Action</Button>)

    const button = screen.getByRole('button', { name: 'Action' })
    expect(button).toHaveClass('button')
    expect(button).toHaveClass('primary')
  })

  it('shows pending text and disables interaction while pending', () => {
    render(<Button isPending pendingText='Loading...'>Action</Button>)

    const button = screen.getByRole('button', { name: 'Loading...' })
    expect(button).toBeDisabled()
    expect(button).toHaveAttribute('aria-busy', 'true')
    expect(button).toHaveAttribute('data-pending', 'true')
  })
})
