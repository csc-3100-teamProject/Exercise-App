import { afterEach, beforeEach, expect, test, jest } from '@jest/globals'
import { cleanup, fireEvent, render, screen } from '@testing-library/react'
import CalendarPage from './CalendarPage'

const workout = {
    id: 'w1', name: 'Upper body', category: 'Strength',
    date: '2026-11-18', time: '18:00', completed: false,
}

const originalScroll = window.scrollTo

beforeEach(() => {
    // Use the same local date for every test, even when the real month changes.
    jest.useFakeTimers({ now: new Date(2026, 10, 18, 12) })
    // Opening the form scrolls the real page; there is nothing to scroll here.
    window.scrollTo = () => {}
})

afterEach(() => {
    cleanup()
    jest.useRealTimers()
    window.scrollTo = originalScroll
})

function clickButton(name) {
    fireEvent.click(screen.getByRole('button', { name }))
}

// Calendar navigation and selected dates
test('Testing an empty calendar starts on today', () => {
    render(<CalendarPage />)
    const today = screen.getByRole('button', { current: 'date' })
    expect(today.getAttribute('aria-pressed')).toBe('true')
    expect(screen.getByText('No workouts planned for this day.')).toBeTruthy()
})

test('Testing month navigation across a year and returning to today', () => {
    render(<CalendarPage />)
    clickButton('Next month')
    clickButton('Next month')
    const january = 'January 1, 2027, 0 workouts'
    expect(screen.getByRole('button', { name: january }).getAttribute('aria-pressed')).toBe('true')
    clickButton('Previous month')
    const december = 'December 1, 2026, 0 workouts'
    expect(screen.getByRole('button', { name: december }).getAttribute('aria-pressed')).toBe('true')
    clickButton('Today')
    expect(screen.getByRole('button', { current: 'date' }).getAttribute('aria-pressed')).toBe('true')
})

test('Testing the selected day only shows its workouts in time order', () => {
    const morning = { ...workout, id: 'w2', name: 'Morning run', time: '07:00' }
    const futureWorkout = { ...workout, id: 'w3', name: 'Yoga', date: '2026-12-01' }
    render(<CalendarPage workouts={[workout, futureWorkout, morning]} />)
    const names = screen.getAllByRole('heading', { level: 3 }).map(heading => heading.textContent)
    expect(names).toEqual(['Morning run', 'Upper body'])
    clickButton('Next month')
    clickButton('December 2, 2026, 0 workouts')
    expect(screen.queryByText('Yoga')).toBeNull()
    clickButton('December 1, 2026, 1 workouts')
    expect(screen.getByRole('heading', { name: 'Yoga' })).toBeTruthy()
    expect(screen.queryByText('Upper body')).toBeNull()
})

// Scheduling and editing workouts
test('Testing scheduling a workout on the selected date', () => {
    let savedWorkout = null
    render(<CalendarPage onSaveWorkout={value => { savedWorkout = value }} />)
    clickButton('Next month')
    clickButton('+ Schedule workout')
    fireEvent.change(screen.getByLabelText('Workout name'), { target: { value: '  Run  ' } })
    fireEvent.change(screen.getByLabelText('Category'), { target: { value: 'Cardio' } })
    fireEvent.change(screen.getByLabelText('Time'), { target: { value: '07:30' } })
    clickButton('Schedule workout')
    expect(savedWorkout.name).toBe('Run')
    expect(savedWorkout.category).toBe('Cardio')
    expect(savedWorkout.date).toBe('2026-12-01')
    expect(savedWorkout.time).toBe('07:30')
    expect(savedWorkout.completed).toBe(false)
    expect(screen.getByRole('status').textContent).toBe('Workout scheduled.')
})

test('Testing a blank name is rejected and cancel does not save', () => {
    let savedWorkout = null
    render(<CalendarPage startWithForm onSaveWorkout={value => { savedWorkout = value }} />)
    fireEvent.change(screen.getByLabelText('Workout name'), { target: { value: '   ' } })
    clickButton('Schedule workout')
    expect(screen.getByRole('alert').textContent).toBe('Enter a workout name.')
    clickButton('Cancel')
    expect(screen.queryByLabelText('Workout name')).toBeNull()
    expect(savedWorkout).toBeNull()
})

test('Testing editing keeps the original workout ID', () => {
    let savedWorkout = null
    render(<CalendarPage workouts={[workout]} onSaveWorkout={value => { savedWorkout = value }} />)
    clickButton('Edit')
    expect(screen.getByLabelText('Workout name').value).toBe('Upper body')
    fireEvent.change(screen.getByLabelText('Workout name'), { target: { value: 'Leg day' } })
    clickButton('Save changes')
    expect(savedWorkout.id).toBe('w1')
    expect(savedWorkout.name).toBe('Leg day')
})

test('Testing a completed workout cannot be moved into the future', () => {
    let savedWorkout = null
    render(<CalendarPage workouts={[{ ...workout, completed: true }]} onSaveWorkout={value => { savedWorkout = value }} />)
    clickButton('Edit')
    fireEvent.change(screen.getByLabelText('Date'), { target: { value: '2026-12-01' } })
    clickButton('Save changes')
    expect(screen.getByRole('alert').textContent).toMatch(/mark this workout planned/i)
    expect(savedWorkout).toBeNull()
})

// Workout actions
test('Testing completion is allowed today but disabled for a future workout', () => {
    let completedId = ''
    const futureWorkout = { ...workout, id: 'w2', date: '2026-12-01' }
    render(<CalendarPage workouts={[workout, futureWorkout]} onToggleWorkout={value => { completedId = value }} />)
    clickButton('Mark complete')
    expect(completedId).toBe('w1')
    clickButton('Next month')
    expect(screen.getByRole('button', { name: 'Mark complete' }).disabled).toBe(true)
})

test('Testing undo restores the workout that was deleted', () => {
    let deletedId = ''
    let savedWorkout = null
    render(<CalendarPage workouts={[workout]} onDeleteWorkout={value => { deletedId = value }} onSaveWorkout={value => { savedWorkout = value }} />)
    clickButton('Delete')
    expect(deletedId).toBe('w1')
    clickButton('Undo')
    expect(savedWorkout).toEqual(workout)
    expect(screen.queryByRole('button', { name: 'Undo' })).toBeNull()
})

test('Testing the calendar shows a storage error passed by the parent', () => {
    render(<CalendarPage storageError="Could not load workouts." />)
    expect(screen.getByRole('alert').textContent).toBe('Could not load workouts.')
})

test('Testing the calendar navigation opens Overview', () => {
    let page = ''
    render(<CalendarPage onNavigate={value => { page = value }} />)
    clickButton('Overview')
    expect(page).toBe('overview')
})
