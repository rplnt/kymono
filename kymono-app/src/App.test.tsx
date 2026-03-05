import { render, screen, waitFor } from '@testing-library/react'
import App from './App'

describe('App', () => {
  it('renders navigation menu', async () => {
    render(<App />)

    // Wait for async operations to complete
    await waitFor(() => {
      expect(screen.getByTitle('Home')).toBeInTheDocument()
    })

    expect(screen.getByTitle('Bookmarks')).toBeInTheDocument()
    expect(screen.getByTitle('K')).toBeInTheDocument()
  })
})
