import { useEffect, useRef, useState } from 'react'
import LoginPage from './pages/LoginPage'
import OverviewPage from './pages/OverviewPage'
import CalendarPage from './pages/CalendarPage'
import ProgressPage from './pages/ProgressPage'
import ProfilePage from './pages/ProfilePage'
import RoutinesPage from './pages/RoutinesPage'
import { API_URL } from './apiConfig'

function localDateString(date = new Date()) {
    const year = date.getFullYear()
    const month = String(date.getMonth() + 1).padStart(2, '0')
    const day = String(date.getDate()).padStart(2, '0')
    return `${year}-${month}-${day}`
}

function readWorkouts(storageKey) {
    try {
        const saved = JSON.parse(localStorage.getItem(storageKey) || '[]')
        if (
            !Array.isArray(saved) ||
            !saved.every(
                (workout) =>
                    workout &&
                    typeof (workout.id || workout._id) === 'string' &&
                    typeof workout.name === 'string' &&
                    workout.name.trim() !== '' &&
                    ['Strength', 'Cardio', 'Mobility'].includes(
                        workout.category
                    ) &&
                    /^\d{4}-\d{2}-\d{2}$/.test(workout.date) &&
                    (workout.durationMin == null ||
                        (Number.isInteger(workout.durationMin) &&
                            workout.durationMin >= 0 &&
                            workout.durationMin <= 1440)) &&
                    typeof workout.completed === 'boolean' &&
                    (workout.exercises === undefined ||
                        Array.isArray(workout.exercises))
            )
        ) {
            throw new Error('Invalid saved workout data')
        }
        return { workouts: saved, error: '' }
    } catch {
        return {
            workouts: [],
            error: 'Could not load workouts saved on this device. Your calendar starts empty.',
        }
    }
}

// This component remounts for a different user so local histories stay separate.
function UserPages({ user, onLogout }) {
    const storageKey = `formflow-workouts-${user.id}`
    const [calendar, setCalendar] = useState(() => readWorkouts(storageKey))
    const latestWorkouts = useRef(calendar.workouts)
    const [currentPage, setCurrentPage] = useState('overview')
    const [showCalendarForm, setShowCalendarForm] = useState(false)
    const [routineDraft, setRoutineDraft] = useState(null)

    function authHeaders() {
        return {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${localStorage.getItem('token')}`,
        }
    }

    useEffect(() => {
        let active = true
        const startingWorkouts = latestWorkouts.current

        fetch(`${API_URL}/users/${user.id}/workouts`, {
            headers: {
                Authorization: `Bearer ${localStorage.getItem('token')}`,
            },
        })
            .then((response) => {
                if (!response.ok) throw new Error('Could not load workouts')
                return response.json()
            })
            .then((workouts) => {
                // A workout saved while this request was loading takes precedence.
                if (!active || latestWorkouts.current !== startingWorkouts) return
                latestWorkouts.current = workouts
                setCalendar({ workouts, error: '' })
            })
            .catch(() => {
                if (!active || latestWorkouts.current !== startingWorkouts) return
                setCalendar({
                    workouts: startingWorkouts,
                    error: 'Could not load workouts from the server.',
                })
            })
        return () => {
            active = false
        }
    }, [user.id])

    function navigate(page) {
        if (
            ![
                'overview',
                'calendar',
                'routines',
                'progress',
                'profile',
            ].includes(page)
        )
            return
        setCurrentPage(page)
        setShowCalendarForm(false)
        setRoutineDraft(null)
        window.scrollTo(0, 0)
    }

    function updateWorkouts(workouts) {
        latestWorkouts.current = workouts
        let error = ''
        try {
            localStorage.setItem(storageKey, JSON.stringify(workouts))
        } catch {
            error =
                'Could not save on this device. Your latest changes are available until you refresh.'
        }
        setCalendar({ workouts, error })
    }

    async function saveWorkout(workout) {
        const isExistingWorkout = Boolean(workout._id)

        const endpoint = isExistingWorkout
            ? `${API_URL}/users/${user.id}/workouts/${workout._id}`
            : `${API_URL}/users/${user.id}/workouts`
        const payload = { ...workout }
        if (isExistingWorkout && payload.durationMin === undefined) {
            payload.durationMin = null
        }

        const response = await fetch(endpoint, {
            method: isExistingWorkout ? 'PATCH' : 'POST',
            headers: authHeaders(),
            body: JSON.stringify(payload),
        })
        if (!response.ok) {
            throw new Error('Could not save the workout.')
        }
        const savedWorkout = await response.json()
        const workouts = latestWorkouts.current
        const exists = workouts.some(
            (item) => (item.id || item._id) === (savedWorkout.id || savedWorkout._id)
        )
        const updated = exists
            ? workouts.map((item) =>
                (item.id || item._id) === (savedWorkout.id || savedWorkout._id) ? savedWorkout : item
            )
            : [...workouts, savedWorkout]
        updateWorkouts(updated)
    }

    async function deleteWorkout(id) {
        const workout = latestWorkouts.current.find(
            (item) => (item.id || item._id) === id
        )
        if (workout?._id) {
            const response = await fetch(
                `${API_URL}/users/${user.id}/workouts/${workout._id}`,
                { method: 'DELETE', headers: authHeaders() }
            )
            if (!response.ok) throw new Error('Could not delete the workout.')
        }

        updateWorkouts(
            latestWorkouts.current.filter(
                (item) => (item.id || item._id) !== id
            )
        )
    }

    function toggleWorkout(id) {
        const workout = calendar.workouts.find(
            (item) => (item.id || item._id) === id
        )

        if (!workout) return

        const today = localDateString()

        if (!workout.completed && workout.date > today) {
            return
        }

        const updatedWorkout = {
            ...workout,
            completed: !workout.completed,
        }

        return saveWorkout(updatedWorkout)
    }

    function openCalendarForm() {
        setRoutineDraft(null)
        setShowCalendarForm(true)
        setCurrentPage('calendar')
        window.scrollTo(0, 0)
    }

    function scheduleRoutine(routine) {
        setRoutineDraft({
            name: routine.name,
            category: routine.category,
            durationMin: routine.durationMin,
            exercises: routine.exercises.map((exercise) => ({ ...exercise })),
        })
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
                routineDraft={routineDraft}
            />
        )
    }

    if (currentPage === 'progress') {
        return (
            <ProgressPage
                workouts={calendar.workouts}
                onNavigate={navigate}
                storageError={calendar.error}
            />
        )
    }

    if (currentPage === 'routines') {
        return (
            <RoutinesPage
                user={user}
                onNavigate={navigate}
                onUseRoutine={scheduleRoutine}
            />
        )
    }

    if (currentPage === 'profile') {
        return (
            <ProfilePage
                user={user}
                onNavigate={navigate}
                onLogout={onLogout}
            />
        )
    }

    return (
        <OverviewPage
            user={user}
            onNavigate={navigate}
            onAdd={openCalendarForm}
        />
    )
}

function MyApp() {
    const [user, setUser] = useState(null)

    if (!user) {
        return (
            <LoginPage
                onLogin={(loggedInUser) => {
                    localStorage.setItem('token', loggedInUser.token)
                    setUser(loggedInUser)
                }}
            />
        )
    }

    return (
        <UserPages
            key={user.id}
            user={user}
            onLogout={() => {
                localStorage.removeItem('token')
                setUser(null)
            }}
        />
    )
}

export default MyApp
