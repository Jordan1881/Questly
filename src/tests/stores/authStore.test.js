import { describe, it, expect, beforeEach } from 'vitest'
import { useAuthStore } from '../../stores/authStore'

const defaultState = { userRole: 'developer', isLoggedIn: false }

describe('authStore', () => {
  beforeEach(() => {
    useAuthStore.setState(defaultState)
  })

  it('defaults to developer role and not logged in', () => {
    const { userRole, isLoggedIn } = useAuthStore.getState()
    expect(userRole).toBe('developer')
    expect(isLoggedIn).toBe(false)
  })

  it('setLoggedIn and setUserRole update state correctly', () => {
    useAuthStore.getState().setUserRole('admin')
    useAuthStore.getState().setLoggedIn(true)
    const { userRole, isLoggedIn } = useAuthStore.getState()
    expect(userRole).toBe('admin')
    expect(isLoggedIn).toBe(true)
  })
})
