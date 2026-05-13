import { fireEvent, render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { FileSelectButton } from './FileSelectButton'

describe('FileSelectButton', () => {
  it('resets file input value after successful selection', async () => {
    const onFileSelected = vi.fn().mockResolvedValue(undefined)
    render(<FileSelectButton buttonLabel='Select file' testId='file-select' onFileSelected={onFileSelected} />)

    const input = screen.getByTestId('file-select-input') as HTMLInputElement
    const file = new File(['hello'], 'doc.txt', { type: 'text/plain' })

    fireEvent.change(input, { target: { files: [file] } })

    await waitFor(() => expect(onFileSelected).toHaveBeenCalledWith(file))
    expect(input.value).toBe('')
  })

  it('supports async onFileSelected flow and allows same-file reselection', async () => {
    const user = userEvent.setup()
    const onFileSelected = vi.fn().mockImplementation(async () => {
      await Promise.resolve()
    })
    render(<FileSelectButton buttonLabel='Select file' testId='file-select' onFileSelected={onFileSelected} />)

    const button = screen.getByTestId('file-select')
    const input = screen.getByTestId('file-select-input') as HTMLInputElement
    const file = new File(['hello'], 'doc.txt', { type: 'text/plain' })

    await user.click(button)
    fireEvent.change(input, { target: { files: [file] } })
    await waitFor(() => expect(onFileSelected).toHaveBeenCalledTimes(1))

    fireEvent.change(input, { target: { files: [file] } })
    await waitFor(() => expect(onFileSelected).toHaveBeenCalledTimes(2))
  })
})
