import { useState } from 'react'
import LoginPage from './pages/LoginPage'
import OverviewPage from './pages/OverviewPage'
import CalendarPage from './pages/CalendarPage'
import ProgressPage from './pages/ProgressPage'
import ProfilePage from './pages/ProfilePage'

const devUser =
    import.meta.env.DEV && import.meta.env.VITE_DEV_USER_ID
        ? { id: import.meta.env.VITE_DEV_USER_ID }
        : null

function localDateString(date = new Date()) {
    const year = date.getFullYear()
    const month = String(date.getMonth() + 1).padStart(2, '0')
    const day = String(date.getDate()).padStart(2, '0')
    return `${year}-${month}-${day}`
}

function readWorkouts(storageKey) {
    try {
        const saved = JSON.parse(localStorage.getItem(storageKey) || '[]')
        if (!Array.isArray(saved) || !saved.every((workout) =>
            workout && typeof (workout.id || workout._id) === 'string' &&
            typeof workout.name === 'string' && workout.name.trim() !== '' &&
            ['Strength', 'Cardio', 'Mobility'].includes(workout.category) &&
            /^\d{4}-\d{2}-\d{2}$/.test(workout.date) &&
            (workout.durationMin === undefined ||
                (Number.isInteger(workout.durationMin) && workout.durationMin >= 0 && workout.durationMin <= 1440)) &&
            typeof workout.completed === 'boolean' &&
            (workout.exercises === undefined || Array.isArray(workout.exercises))
        )) {
            throw new Error('Invalid saved workout data')
        }
        return { workouts: saved, error: '' }
    } catch {
        return { workouts: [], error: 'Could not load workouts saved on this device. Your calendar starts empty.' }
    }
}

// This component remounts for a different user so local histories stay separate.
function UserPages({ user, onLogout }) {
    const storageKey = `formflow-workouts-${user.id}`
    const [calendar, setCalendar] = useState(() => readWorkouts(storageKey))
    const [currentPage, setCurrentPage] = useState('overview')
    const [showCalendarForm, setShowCalendarForm] = useState(false)

    function navigate(page) {
        if (!['overview', 'calendar', 'progress', 'profile'].includes(page)) return
        setCurrentPage(page)
        setShowCalendarForm(false)
        window.scrollTo(0, 0)
    }

    function updateWorkouts(workouts) {
        let error = ''
        try {
            localStorage.setItem(storageKey, JSON.stringify(workouts))
        } catch {
            error = 'Could not save on this device. Your latest changes are available until you refresh.'
        }
        setCalendar({ workouts, error })
    }

    function saveWorkout(workout) {
        const saved = { ...workout, id: workout.id || workout._id || crypto.randomUUID() }
        const exists = calendar.workouts.some((item) => (item.id || item._id) === saved.id)
        const updated = exists
            ? calendar.workouts.map((item) => (item.id || item._id) === saved.id ? saved : item)
            : [...calendar.workouts, saved]
        updateWorkouts(updated)
    }

    function deleteWorkout(id) {
        updateWorkouts(calendar.workouts.filter((workout) => (workout.id || workout._id) !== id))
    }

    function toggleWorkout(id) {
        const updated = calendar.workouts.map((workout) => {
            if ((workout.id || workout._id) !== id) return workout
            const today = localDateString()
            if (!workout.completed && workout.date > today) return workout
            return { ...workout, completed: !workout.completed }
        })
        updateWorkouts(updated)
    }

    function openCalendarForm() {
        setShowCalendarForm(true)
        setCurrentPage('calendar')
        window.scrollTo(0, 0)
    }

    if (currentPage === 'calendar') {
        return (
            <CalendarPage
                workouts={calendar.workouts}
                onSaveWorkout={saveWorkout}
                onDeleteWorkout={deleteWorkout}
                onToggleWorkout={toggleWorkout}
                onNavigate={navigate}
                storageError={calendar.error}
                startWithForm={showCalendarForm}
            />
        )
    }

    if (currentPage === 'progress') {
        return <ProgressPage workouts={calendar.workouts} onNavigate={navigate} storageError={calendar.error} />
    }
    if (currentPage === 'profile') {
        return (
            <ProfilePage
                user={user}
                onNavigate={navigate}
                onLogout={() => onLogout()}
            />
        )
    }

    return <OverviewPage user={user} onNavigate={navigate} onAdd={openCalendarForm} />
}

function MyApp() {
    const [user, setUser] = useState(devUser)

    if (!user) return <LoginPage onLogin={setUser} />

    return <UserPages key={user.id} user={user} onLogout={() => setUser(null)} />
}

export default MyApp
