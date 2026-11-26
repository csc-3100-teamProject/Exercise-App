import { afterEach, expect, test } from '@jest/globals'
import { cleanup, fireEvent, render, screen } from '@testing-library/react'
import OverviewPage from './OverviewPage'

const user = { id: 'user-1', username: 'Tavn' }
const overview = {
    user, today: '2026-11-18', week: [], todaysPlan: [], recentActivity: [],
    weeklyGoal: { completed: 2, goal: 5, remaining: 3, daysRemaining: 4, status: 'On track' },
    streak: { weeks: 1, longestWeeks: 2, days: [] },
    trainingVolume: { total: 0, changePct: null, daily: [] },
}

const originalFetch = globalThis.fetch

afterEach(() => {
    cleanup()
    globalThis.fetch = originalFetch
})

// Give the page the same response shape it gets from the backend.
function returnOverview(data) {
    globalThis.fetch = async () => ({ ok: true, json: async () => data })
}

// Overview responses
test('Testing the loading message is replaced by an empty plan', async () => {
    returnOverview(overview)
    render(<OverviewPage user={user} />)
    expect(screen.getByRole('status').textContent).toBe('Loading...')
    expect(await screen.findByText('Nothing planned today')).toBeTruthy()
    expect(screen.queryByRole('status')).toBeNull()
    expect(screen.getByText('No completed workouts yet.')).toBeTruthy()
    expect(screen.getByText('3 to go')).toBeTruthy()
})

test('Testing a failed overview request shows an error', async () => {
    globalThis.fetch = async () => ({ ok: false })
    render(<OverviewPage user={user} />)
    const error = await screen.findByRole('alert')
    expect(error.textContent).toBe('Could not load your overview. Please try again.')
    expect(screen.queryByText('Nothing planned today')).toBeNull()
})

// Workout actions and navigation
test('Testing the workout preview and starting the selected workout', async () => {
    let startedWorkout = null
    const workout = {
        id: 'w1', name: 'Upper body', category: 'Strength', time: '18:30', durationMin: 40,
        exercises: [{ name: 'Bench press', sets: 3, reps: 8, weight: 95 },
            { name: 'Row' }, { name: 'Curl' }, { name: 'Push-up' }],
    }
    returnOverview({ ...overview, todaysPlan: [workout] })
    render(<OverviewPage user={user} onStart={value => { startedWorkout = value }} />)
    expect(await screen.findByRole('heading', { name: 'Upper body' })).toBeTruthy()
    expect(screen.getByText('One workout · about 40 min')).toBeTruthy()
    expect(screen.getByText('6:30 PM')).toBeTruthy()
    expect(screen.getByText('3 × 8 · 95 lb')).toBeTruthy()
    expect(screen.getByText('+ 1 more')).toBeTruthy()
    expect(screen.queryByText('Push-up')).toBeNull()
    fireEvent.click(screen.getByRole('button', { name: 'Start workout' }))
    expect(startedWorkout).toEqual(workout)
})

test('Testing the add workout button', async () => {
    let timesAdded = 0
    returnOverview(overview)
    render(<OverviewPage user={user} onAdd={() => { timesAdded++ }} />)
    await screen.findByText('Nothing planned today')
    fireEvent.click(screen.getByRole('button', { name: 'Add workout' }))
    expect(timesAdded).toBe(1)
})

test('Testing View calendar opens the calendar from today’s plan', async () => {
    let page = ''
    returnOverview(overview)
    render(<OverviewPage user={user} onNavigate={value => { page = value }} />)
    fireEvent.click(await screen.findByRole('button', { name: /view calendar/i }))
    expect(page).toBe('calendar')
})
