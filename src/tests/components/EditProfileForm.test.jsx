import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import EditProfileForm from '../../components/EditProfileForm'

const authState = {
  user: null,
  userRole: 'developer',
}

const profileState = {
  profile: {
    id: 'u1',
    username: 'Yarden',
    email: 'yarden@example.com',
    age: 24,
    avatarUrl: 'https://example.com/a.png',
  },
  updateProfile: vi.fn(),
  uploadAvatar: vi.fn(),
}

vi.mock('../../stores/authStore', () => ({
  useAuthStore: (selector) => selector(authState),
}))

vi.mock('../../stores/profileStore', () => ({
  useProfileStore: (selector) => selector(profileState),
}))

// Deterministic image dimension probing for avatar upload flow.
const imageBehavior = { w: 800, h: 800, error: false }

class MockImage {
  constructor() {
    this.naturalWidth = imageBehavior.w
    this.naturalHeight = imageBehavior.h
    this.onload = null
    this.onerror = null
  }
  set src(_value) {
    Promise.resolve().then(() => {
      if (imageBehavior.error) this.onerror?.()
      else this.onload?.()
    })
  }
}

describe('EditProfileForm', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    authState.user = null
    authState.userRole = 'developer'
    profileState.profile = {
      id: 'u1',
      username: 'Yarden',
      email: 'yarden@example.com',
      age: 24,
      avatarUrl: 'https://example.com/a.png',
    }
    profileState.updateProfile = vi.fn().mockResolvedValue({})
    profileState.uploadAvatar = vi.fn().mockResolvedValue({ avatarUrl: 'https://example.com/new.png' })

    imageBehavior.w = 800
    imageBehavior.h = 800
    imageBehavior.error = false
    globalThis.Image = MockImage
    URL.createObjectURL = vi.fn(() => 'blob:mock')
    URL.revokeObjectURL = vi.fn()
  })

  it('renders the profile values into the form fields', () => {
    render(<EditProfileForm />)

    expect(screen.getByRole('heading', { name: 'Edit profile' })).toBeInTheDocument()
    expect(screen.getByDisplayValue('Yarden')).toBeInTheDocument()
    expect(screen.getByDisplayValue('yarden@example.com')).toBeInTheDocument()
    expect(screen.getByDisplayValue('24')).toBeInTheDocument()
  })

  it('falls back to the auth user when there is no profile', () => {
    profileState.profile = null
    authState.user = { id: 'u2', username: 'Fallback', email: 'fallback@example.com' }

    render(<EditProfileForm />)

    expect(screen.getByDisplayValue('Fallback')).toBeInTheDocument()
    expect(screen.getByDisplayValue('fallback@example.com')).toBeInTheDocument()
  })

  it('saves trimmed fields and clears age when emptied', async () => {
    const user = userEvent.setup()
    render(<EditProfileForm />)

    const ageInput = screen.getByDisplayValue('24')
    await user.clear(ageInput)

    await user.click(screen.getByRole('button', { name: 'Save changes' }))

    await waitFor(() => {
      expect(profileState.updateProfile).toHaveBeenCalledWith({
        username: 'Yarden',
        email: 'yarden@example.com',
        age: null,
      })
    })
    expect(screen.getByText('Profile updated.')).toBeInTheDocument()
  })

  it('parses a numeric age into the patch', async () => {
    const user = userEvent.setup()
    render(<EditProfileForm />)

    const ageInput = screen.getByDisplayValue('24')
    await user.clear(ageInput)
    await user.type(ageInput, '30')

    await user.click(screen.getByRole('button', { name: 'Save changes' }))

    await waitFor(() => {
      expect(profileState.updateProfile).toHaveBeenCalledWith(
        expect.objectContaining({ age: 30 }),
      )
    })
  })

  it('requires the current password when the email changes', async () => {
    const user = userEvent.setup()
    const { container } = render(<EditProfileForm />)

    const emailInput = screen.getByDisplayValue('yarden@example.com')
    await user.clear(emailInput)
    await user.type(emailInput, 'new@example.com')

    // The password field appears once the email differs from the original.
    expect(screen.getByPlaceholderText('Required to change email')).toBeInTheDocument()

    // Submit the form directly to bypass the native `required` constraint and
    // exercise the component's own password guard.
    fireEvent.submit(container.querySelector('form'))

    expect(await screen.findByText('Enter your current password to change email.')).toBeInTheDocument()
    expect(profileState.updateProfile).not.toHaveBeenCalled()
  })

  it('includes the current password when changing email with a password', async () => {
    const user = userEvent.setup()
    render(<EditProfileForm />)

    const emailInput = screen.getByDisplayValue('yarden@example.com')
    await user.clear(emailInput)
    await user.type(emailInput, 'new@example.com')

    await user.type(screen.getByPlaceholderText('Required to change email'), 'secret123')
    await user.click(screen.getByRole('button', { name: 'Save changes' }))

    await waitFor(() => {
      expect(profileState.updateProfile).toHaveBeenCalledWith(
        expect.objectContaining({
          email: 'new@example.com',
          currentPassword: 'secret123',
        }),
      )
    })
  })

  it('surfaces an error message when updateProfile rejects', async () => {
    profileState.updateProfile = vi.fn().mockRejectedValue(new Error('Update failed'))
    const user = userEvent.setup()
    render(<EditProfileForm />)

    await user.click(screen.getByRole('button', { name: 'Save changes' }))

    expect(await screen.findByText('Update failed')).toBeInTheDocument()
  })

  it('uploads a valid avatar and shows a success message', async () => {
    const { container } = render(<EditProfileForm />)

    const fileInput = container.querySelector('input[type="file"]')
    const file = new File(['data'], 'avatar.png', { type: 'image/png' })
    fireEvent.change(fileInput, { target: { files: [file] } })

    await waitFor(() => {
      expect(profileState.uploadAvatar).toHaveBeenCalledWith(file)
    })
    expect(await screen.findByText('Profile photo updated.')).toBeInTheDocument()
  })

  it('rejects an avatar that is too small', async () => {
    imageBehavior.w = 200
    imageBehavior.h = 200
    const { container } = render(<EditProfileForm />)

    const fileInput = container.querySelector('input[type="file"]')
    const file = new File(['data'], 'small.png', { type: 'image/png' })
    fireEvent.change(fileInput, { target: { files: [file] } })

    expect(await screen.findByText(/200px on the short side/i)).toBeInTheDocument()
    expect(profileState.uploadAvatar).not.toHaveBeenCalled()
  })

  it('shows an error when the image cannot be read', async () => {
    imageBehavior.error = true
    const { container } = render(<EditProfileForm />)

    const fileInput = container.querySelector('input[type="file"]')
    const file = new File(['data'], 'broken.png', { type: 'image/png' })
    fireEvent.change(fileInput, { target: { files: [file] } })

    expect(await screen.findByText(/Could not read image/i)).toBeInTheDocument()
    expect(profileState.uploadAvatar).not.toHaveBeenCalled()
  })

  it('does nothing when the avatar input has no file', () => {
    const { container } = render(<EditProfileForm />)

    const fileInput = container.querySelector('input[type="file"]')
    fireEvent.change(fileInput, { target: { files: [] } })

    expect(profileState.uploadAvatar).not.toHaveBeenCalled()
  })

  it('resolves the admin avatar variant from the user role', () => {
    authState.userRole = 'admin'
    render(<EditProfileForm />)
    // Admin variant still renders the upload button and form.
    expect(screen.getByRole('button', { name: 'Upload photo' })).toBeInTheDocument()
  })
})
