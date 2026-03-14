import { describe, it, expect, beforeEach } from 'vitest'
import { useSprintStore } from '../../stores/sprintStore'
import { createMockSprint } from '../factories/index'

const defaultState = { activeSprint: null }

describe('sprintStore', () => {
  beforeEach(() => {
    useSprintStore.setState(defaultState)
  })

  it('initialises with no active sprint', () => {
    expect(useSprintStore.getState().activeSprint).toBeNull()
  })

  it('setSprint sets the active sprint and closeSprint clears it', () => {
    const sprint = createMockSprint()
    useSprintStore.getState().setSprint(sprint)
    expect(useSprintStore.getState().activeSprint).toEqual(sprint)
    useSprintStore.getState().closeSprint()
    expect(useSprintStore.getState().activeSprint).toBeNull()
  })
})
