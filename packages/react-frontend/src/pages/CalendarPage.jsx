import './CalendarPage.css'
import { useState } from 'react'

const DAY_LABELS = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun']
const CATEGORIES = ['Strength', 'Cardio', 'Mobility']

function localDateString(date = new Date()) {
    const year = date.getFullYear()
    const month = String(date.getMonth() + 1).padStart(2, '0')
    const day = String(date.getDate()).padStart(2, '0')
    return `${year}-${month}-${day}`
}

function parseDate(dateStr) {
    const [y, m, d] = dateStr.split('-').map(Number)
    return new Date(y, m - 1, d)
}

function formatTime(time) {
    if (!time) return 'Any time'
    const [h, m] = time.split(':').map(Number)
    const suffix = h >= 12 ? 'PM' : 'AM'
    return `${h % 12 || 12}:${String(m).padStart(2, '0')} ${suffix}`
}

function categoryColor(category) {
    if (category === 'Cardio') return '#54d2bd'
    if (category === 'Mobility') return '#a78bfa'
    return '#c6f35c'
}

function Icon({ name }) {
    const paths = {
        home: <path d="M3 11l9-8 9 8v9a1 1 0 0 1-1 1h-5v-6H9v6H4a1 1 0 0 1-1-1z" />,
        calendar: (
            <>
                <rect x="3" y="4" width="18" height="17" rx="2" />
                <path d="M3 9h18M8 2v4M16 2v4" />
            </>
        ),
        routines: (
            <>
                <rect x="4" y="3" width="16" height="18" rx="2" />
                <path d="M8 8h8M8 12h8M8 16h5" />
            </>
        ),
        progress: <path d="M4 20V10M9 20V4M14 20v-8M19 20V8M2 20h20" />,
        profile: (
            <>
                <circle cx="12" cy="8" r="4" />
                <path d="M4 21a8 8 0 0 1 16 0" />
            </>
        ),
    }
    return (
        <svg
            viewBox="0 0 24 24"
            width="24"
            height="24"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.8"
            strokeLinecap="round"
            strokeLinejoin="round"
            aria-hidden="true"
        >
            {paths[name]}
        </svg>
    )
}

const NAV_ITEMS = [
    ['home', 'Overview'],
    ['calendar', 'Calendar'],
    ['routines', 'Routines'],
    ['progress', 'Progress'],
    ['profile', 'Profile'],
]

function MonthGrid({ month, selectedDate, workouts, onSelect }) {
    const year = month.getFullYear()
    const monthIndex = month.getMonth()
    const firstDay = (month.getDay() + 6) % 7
    const daysInMonth = new Date(year, monthIndex + 1, 0).getDate()
    const cellCount = Math.ceil((firstDay + daysInMonth) / 7) * 7
    const today = localDateString()

    const days = []
    for (let index = 0; index < cellCount; index++) {
        const day = index - firstDay + 1
        if (day < 1 || day > daysInMonth) {
            days.push(null)
        } else {
            days.push(localDateString(new Date(year, monthIndex, day)))
        }
    }

    return (
        <div className="calendar-grid">
            {DAY_LABELS.map((label) => (
                <span className="calendar-weekday" key={label}>
                    {label}
                </span>
            ))}
            {days.map((date, index) => {
                if (!date) {
                    return (
                        <div
                            className="calendar-blank"
                            key={`blank-${index}`}
                            aria-hidden="true"
                        />
                    )
                }

                const onDay = workouts.filter((workout) => workout.date === date)
                const categories = CATEGORIES.filter((category) =>
                    onDay.some((workout) => workout.category === category)
                )

                let dayClass = 'calendar-day'
                if (date === selectedDate) dayClass += ' calendar-day-selected'
                if (date === today) dayClass += ' calendar-day-today'

                return (
                    <button
                        type="button"
                        className={dayClass}
                        key={date}
                        aria-pressed={date === selectedDate}
                        aria-current={date === today ? 'date' : undefined}
                        aria-label={`${parseDate(date).toLocaleDateString('en-US', {
                            weekday: 'long',
                            month: 'long',
                            day: 'numeric',
                            year: 'numeric',
                        })}, ${onDay.length} workout${onDay.length === 1 ? '' : 's'}`}
                        onClick={() => onSelect(date)}
                    >
                        <span className="calendar-day-number">
                            {parseDate(date).getDate()}
                        </span>
                        <span className="calendar-day-dots" aria-hidden="true">
                            {categories.map((category) => (
                                <i
                                    key={category}
                                    style={{ background: categoryColor(category) }}
                                />
                            ))}
                        </span>
                    </button>
                )
            })}
        </div>
    )
}

function SelectedDay({ date, workouts, onAdd, onEdit, onDelete, onToggle }) {
    const selectedWorkouts = workouts
        .filter((workout) => workout.date === date)
        .sort((a, b) => (a.time || '').localeCompare(b.time || ''))

    return (
        <section className="panel calendar-selected-day" aria-labelledby="selected-day-heading">
            <p className="calendar-eyebrow">Selected day</p>
            <h2 id="selected-day-heading" aria-live="polite">
                {parseDate(date).toLocaleDateString('en-US', {
                    month: 'long',
                    day: 'numeric',
                    year: 'numeric',
                })}
            </h2>

            {selectedWorkouts.length === 0 && (
                <div>
                    <p className="empty-text">No workouts scheduled for this day.</p>
                    <button type="button" className="calendar-link-button calendar-empty-add" onClick={onAdd}>
                        + Schedule workout
                    </button>
                </div>
            )}

            <div className="calendar-workout-list">
                {selectedWorkouts.map((workout) => (
                    <article
                        className="calendar-workout-card"
                        key={workout.id || workout._id}
                        style={{ borderLeftColor: categoryColor(workout.category) }}
                    >
                        <div className="calendar-workout-top">
                            <h3>{workout.name}</h3>
                            <span className="calendar-workout-status">
                                {workout.completed ? 'Completed' : 'Planned'}
                            </span>
                        </div>
                        <p>{formatTime(workout.time)} · {workout.category}</p>
                        <div className="calendar-workout-actions">
                            <button
                                type="button"
                                className="calendar-complete-button"
                                disabled={!workout.completed && workout.date > localDateString()}
                                title={!workout.completed && workout.date > localDateString() ? 'Future workouts can be completed on their scheduled day.' : undefined}
                                onClick={() => onToggle(workout.id || workout._id)}
                            >
                                {workout.completed ? 'Mark planned' : 'Mark complete'}
                            </button>
                            <button type="button" className="calendar-link-button" onClick={() => onEdit(workout)}>
                                Edit
                            </button>
                            <button type="button" className="calendar-delete-button" onClick={() => onDelete(workout)}>
                                Delete
                            </button>
                        </div>
                    </article>
                ))}
            </div>
        </section>
    )
}

function ScheduleForm({ date, initialWorkout, onSave, onCancel }) {
    const emptyWorkout = { name: '', category: 'Strength', date, time: '18:00' }
    const [workout, setWorkout] = useState(initialWorkout || emptyWorkout)
    const [errorMessage, setErrorMessage] = useState('')

    function handleChange(event) {
        const { name, value } = event.target
        setWorkout({ ...workout, [name]: value })
        setErrorMessage('')
    }

    function handleSubmit(event) {
        event.preventDefault()

        if (!workout.name.trim()) {
            setErrorMessage('Enter a workout name.')
            return
        }

        const parsedDate = parseDate(workout.date)
        if (!/^\d{4}-\d{2}-\d{2}$/.test(workout.date) || localDateString(parsedDate) !== workout.date || workout.date < '1900-01-01' || workout.date > '2100-12-31') {
            setErrorMessage('Choose a valid date between 1900 and 2100.')
            return
        }

        if (!/^([01]\d|2[0-3]):[0-5]\d$/.test(workout.time)) {
            setErrorMessage('Choose a valid workout time.')
            return
        }

        if (workout.completed && workout.date > localDateString()) {
            setErrorMessage('Mark this workout planned before moving it to a future date.')
            return
        }

        onSave({
            ...workout,
            name: workout.name.trim(),
            completed: workout.completed || false,
            exercises: workout.exercises || [],
        })
    }

    return (
        <section className="panel" id="calendar-schedule" aria-labelledby="schedule-heading">
            <div className="calendar-panel-header">
                <h2 id="schedule-heading">{initialWorkout ? 'Edit workout' : 'Schedule workout'}</h2>
                <button type="button" className="calendar-link-button" onClick={onCancel}>
                    Cancel
                </button>
            </div>

            <form className="calendar-form" onSubmit={handleSubmit}>
                <label htmlFor="workout-name">Workout name</label>
                <input
                    id="workout-name"
                    name="name"
                    value={workout.name}
                    onChange={handleChange}
                    placeholder="Upper Body Power"
                    maxLength={80}
                    autoFocus
                    required
                />

                <label htmlFor="workout-category">Category</label>
                <select
                    id="workout-category"
                    name="category"
                    value={workout.category}
                    onChange={handleChange}
                >
                    {CATEGORIES.map((category) => (
                        <option key={category}>{category}</option>
                    ))}
                </select>

                <label htmlFor="workout-date">Date</label>
                <input
                    id="workout-date"
                    name="date"
                    type="date"
                    min="1900-01-01"
                    max="2100-12-31"
                    value={workout.date}
                    onChange={handleChange}
                    required
                />

                <label htmlFor="workout-time">Time</label>
                <input
                    id="workout-time"
                    name="time"
                    type="time"
                    value={workout.time}
                    onChange={handleChange}
                    required
                />

                {errorMessage && (
                    <p className="form-error" role="alert">{errorMessage}</p>
                )}

                <button type="submit" className="calendar-save-button">
                    {initialWorkout ? 'Save changes' : 'Schedule workout'}
                </button>
            </form>
        </section>
    )
}

function CalendarPage({ workouts = [], onSaveWorkout, onDeleteWorkout, onToggleWorkout, onNavigate, storageError, startWithForm = false }) {
    const today = localDateString()
    const [month, setMonth] = useState(() => {
        const date = new Date()
        return new Date(date.getFullYear(), date.getMonth(), 1)
    })
    const [selectedDate, setSelectedDate] = useState(today)
    const [showForm, setShowForm] = useState(startWithForm)
    const [editingWorkout, setEditingWorkout] = useState(null)
    const [deletedWorkout, setDeletedWorkout] = useState(null)
    const [successMessage, setSuccessMessage] = useState('')

    function changeMonth(amount) {
        const next = new Date(month.getFullYear(), month.getMonth() + amount, 1)
        setMonth(next)
        setSelectedDate(localDateString(next))
        setSuccessMessage('')
        setShowForm(false)
    }

    function selectDate(date) {
        setSelectedDate(date)
        setSuccessMessage('')
        setShowForm(false)
    }

    function goToToday() {
        const date = parseDate(today)
        setMonth(new Date(date.getFullYear(), date.getMonth(), 1))
        selectDate(today)
    }

    function openForm() {
        setSuccessMessage('')
        setEditingWorkout(null)
        setShowForm(true)
    }

    function saveWorkout(workout) {
        const date = parseDate(workout.date)

        onSaveWorkout(workout)
        setMonth(new Date(date.getFullYear(), date.getMonth(), 1))
        setSelectedDate(workout.date)
        setShowForm(false)
        setEditingWorkout(null)
        setSuccessMessage(`${workout.name} ${editingWorkout ? 'updated' : 'scheduled'}.`)
    }

    function editWorkout(workout) {
        setEditingWorkout(workout)
        setShowForm(true)
        setSuccessMessage('')
        window.scrollTo(0, 0)
    }

    function deleteWorkout(workout) {
        onDeleteWorkout(workout.id || workout._id)
        setDeletedWorkout(workout)
        setShowForm(false)
        setEditingWorkout(null)
        setSuccessMessage(`${workout.name} deleted.`)
    }

    function undoDelete() {
        onSaveWorkout(deletedWorkout)
        const date = parseDate(deletedWorkout.date)
        setMonth(new Date(date.getFullYear(), date.getMonth(), 1))
        setSelectedDate(deletedWorkout.date)
        setSuccessMessage(`${deletedWorkout.name} restored.`)
        setDeletedWorkout(null)
    }

    function toggleWorkout(id) {
        onToggleWorkout(id)
        setShowForm(false)
        setEditingWorkout(null)
        setSuccessMessage('Workout status updated.')
    }

    return (
        <main className="calendar-page">
            <div className="calendar-content">
                <header className="calendar-header">
                    <h1>Calendar</h1>
                    <button
                        type="button"
                        className="calendar-add-button"
                        aria-label="Add workout"
                        aria-expanded={showForm}
                        aria-controls={showForm ? 'calendar-schedule' : undefined}
                        onClick={openForm}
                    >
                        +
                    </button>
                </header>

                {storageError && <p className="form-error" role="alert">{storageError}</p>}

                {showForm && (
                    <ScheduleForm
                        key={editingWorkout ? editingWorkout.id || editingWorkout._id : 'new'}
                        date={selectedDate}
                        initialWorkout={editingWorkout}
                        onSave={saveWorkout}
                        onCancel={() => setShowForm(false)}
                    />
                )}

                <section aria-label="Workout calendar">
                    <div className="calendar-month-header">
                        <button type="button" aria-label="Previous month" onClick={() => changeMonth(-1)}>
                            ‹
                        </button>
                        <h2 aria-live="polite">
                            {month.toLocaleDateString('en-US', {
                                month: 'long',
                                year: 'numeric',
                            })}
                        </h2>
                        <button type="button" aria-label="Next month" onClick={() => changeMonth(1)}>
                            ›
                        </button>
                    </div>

                    <MonthGrid
                        month={month}
                        selectedDate={selectedDate}
                        workouts={workouts}
                        onSelect={selectDate}
                    />

                    <div className="calendar-footer">
                        <ul className="calendar-legend" aria-label="Workout categories">
                            {CATEGORIES.map((category) => (
                                <li key={category}>
                                    <i style={{ background: categoryColor(category) }} aria-hidden="true" />
                                    {category}
                                </li>
                            ))}
                        </ul>
                        <button type="button" className="calendar-link-button" onClick={goToToday}>
                            Today
                        </button>
                    </div>
                </section>

                {successMessage && (
                    <p className="form-success" role="status">{successMessage}</p>
                )}

                {deletedWorkout && (
                    <p className="calendar-undo">
                        Deleted {deletedWorkout.name}.{' '}
                        <button type="button" className="calendar-link-button" onClick={undoDelete}>Undo</button>
                    </p>
                )}

                <SelectedDay
                    date={selectedDate}
                    workouts={workouts}
                    onAdd={openForm}
                    onEdit={editWorkout}
                    onDelete={deleteWorkout}
                    onToggle={toggleWorkout}
                />
            </div>

            <nav className="bottom-nav" aria-label="Main">
                {NAV_ITEMS.map(([icon, label]) => (
                    <button
                        key={label}
                        type="button"
                        className={label === 'Calendar' ? 'nav-active' : ''}
                        aria-current={label === 'Calendar' ? 'page' : undefined}
                        disabled={!['Overview', 'Calendar', 'Progress'].includes(label)}
                        onClick={() => onNavigate?.(label.toLowerCase())}
                    >
                        <Icon name={icon} />
                        <span>{label}</span>
                    </button>
                ))}
            </nav>
        </main>
    )
}

export default CalendarPage