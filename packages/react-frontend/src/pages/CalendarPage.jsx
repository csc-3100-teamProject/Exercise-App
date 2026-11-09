import { useState } from 'react'
import './CalendarPage.css'

const CATEGORIES = ['Strength', 'Cardio', 'Mobility']

function dateString(date) {
    const year = date.getFullYear()
    const month = String(date.getMonth() + 1).padStart(2, '0')
    const day = String(date.getDate()).padStart(2, '0')
    return `${year}-${month}-${day}`
}

function parseDate(value) {
    const [year, month, day] = value.split('-').map(Number)
    return new Date(year, month - 1, day)
}

function formatTime(time) {
    if (!time) return 'Any time'
    const [hours, minutes] = time.split(':').map(Number)
    return `${hours % 12 || 12}:${String(minutes).padStart(2, '0')} ${hours >= 12 ? 'PM' : 'AM'}`
}

function CalendarPage({ workouts = [], onSaveWorkout, onDeleteWorkout, onToggleWorkout, onNavigate, storageError, startWithForm = false }) {
    const [currentDate, setCurrentDate] = useState(new Date())
    const [selectedDate, setSelectedDate] = useState(new Date())
    const [showForm, setShowForm] = useState(startWithForm)
    const [form, setForm] = useState({ name: '', category: 'Strength', date: dateString(new Date()), time: '18:00' })
    const [editing, setEditing] = useState(false)
    const [deleted, setDeleted] = useState(null)
    const [error, setError] = useState('')
    const [message, setMessage] = useState('')

    const year = currentDate.getFullYear()
    const month = currentDate.getMonth()
    const today = dateString(new Date())
    const selected = dateString(selectedDate)
    const monthName = currentDate.toLocaleString('default', { month: 'long', year: 'numeric' })
    const daysInMonth = new Date(year, month + 1, 0).getDate()
    const firstDay = (new Date(year, month, 1).getDay() + 6) % 7
    const planned = workouts.filter((workout) => workout.date === selected)
        .sort((a, b) => (a.time || '').localeCompare(b.time || ''))

    const isSelected = (day) =>
        selectedDate.getDate() === day &&
        selectedDate.getMonth() === month &&
        selectedDate.getFullYear() === year

    function selectDate(date) {
        setSelectedDate(date)
        setShowForm(false)
        setError('')
        setMessage('')
    }

    function changeMonth(amount) {
        const next = new Date(year, month + amount, 1)
        setCurrentDate(next)
        selectDate(next)
    }

    function openForm(workout) {
        if (workout) {
            setForm({ ...workout })
            setEditing(true)
        } else {
            setForm({ name: '', category: 'Strength', date: selected, time: '18:00' })
            setEditing(false)
        }
        setError('')
        setMessage('')
        setShowForm(true)
        window.scrollTo(0, 0)
    }

    function handleChange(event) {
        const { name, value } = event.target
        setForm({ ...form, [name]: value })
        setError('')
    }

    function saveWorkout(event) {
        event.preventDefault()
        if (!form.name.trim()) {
            setError('Enter a workout name.')
            return
        }
        const date = parseDate(form.date)
        if (dateString(date) !== form.date || form.date < '1900-01-01' || form.date > '2100-12-31') {
            setError('Choose a valid date between 1900 and 2100.')
            return
        }
        if (!/^([01]\d|2[0-3]):[0-5]\d$/.test(form.time)) {
            setError('Choose a valid time.')
            return
        }
        if (form.completed && form.date > today) {
            setError('Mark this workout planned before moving it to a future date.')
            return
        }
        const duration = form.durationMin ? Number(form.durationMin) : undefined
        if (duration !== undefined &&
            (!Number.isInteger(duration) || duration < 1 || duration > 1440)) {
            setError('Enter a duration between 1 and 1440 minutes, or leave it blank.')
            return
        }
        onSaveWorkout({ ...form, name: form.name.trim(), durationMin: duration, completed: form.completed || false, exercises: form.exercises || [] })
        setCurrentDate(new Date(date.getFullYear(), date.getMonth(), 1))
        setSelectedDate(date)
        setShowForm(false)
        setMessage(editing ? 'Workout updated.' : 'Workout scheduled.')
    }

    function removeWorkout(workout) {
        onDeleteWorkout(workout.id || workout._id)
        setDeleted(workout)
        setShowForm(false)
        setMessage('Workout deleted.')
    }

    function undoDelete() {
        onSaveWorkout(deleted)
        const date = parseDate(deleted.date)
        setCurrentDate(new Date(date.getFullYear(), date.getMonth(), 1))
        selectDate(date)
        setDeleted(null)
        setMessage('Workout restored.')
    }

    function toggleWorkout(workout) {
        onToggleWorkout(workout.id || workout._id)
        setShowForm(false)
        setMessage('Workout status updated.')
    }

    return (
        <div className="calendar-page">
            <div className="calendar-container">
                <h1>Calendar</h1>
                <p className="calendar-subtitle">Plan your training. Track your progress.</p>
                {storageError && <p className="calendar-error" role="alert">{storageError}</p>}
                <button type="button" className="calendar-add" aria-expanded={showForm} onClick={() => openForm()}>
                    + Schedule workout
                </button>

                {showForm && (
                    <form className="calendar-form" onSubmit={saveWorkout}>
                        <h2>{editing ? 'Edit workout' : 'Schedule workout'}</h2>
                        <label htmlFor="workout-name">Workout name</label>
                        <input id="workout-name" name="name" value={form.name} onChange={handleChange} maxLength={80} autoFocus required />
                        <label htmlFor="workout-category">Category</label>
                        <select id="workout-category" name="category" value={form.category} onChange={handleChange}>
                            {CATEGORIES.map((category) => <option key={category}>{category}</option>)}
                        </select>
                        <label htmlFor="workout-date">Date</label>
                        <input id="workout-date" type="date" name="date" value={form.date} onChange={handleChange} min="1900-01-01" max="2100-12-31" required />
                        <label htmlFor="workout-time">Time</label>
                        <input id="workout-time" type="time" name="time" value={form.time} onChange={handleChange} required />
                        <label htmlFor="workout-duration">Duration (minutes, optional)</label>
                        <input
                            id="workout-duration"
                            type="number"
                            name="durationMin"
                            min="1"
                            max="1440"
                            step="1"
                            value={form.durationMin || ''}
                            onChange={handleChange}
                            placeholder="Leave blank if unknown"
                        />
                        {error && <p className="calendar-error" role="alert">{error}</p>}
                        <div className="calendar-actions">
                            <button type="submit" className="calendar-save">{editing ? 'Save changes' : 'Schedule workout'}</button>
                            <button type="button" className="calendar-link" onClick={() => setShowForm(false)}>Cancel</button>
                        </div>
                    </form>
                )}

                <div className="calendar-card">
                    <div className="calendar-header">
                        <h2 aria-live="polite">{monthName}</h2>
                        <div className="calendar-arrows">
                            <button type="button" aria-label="Previous month" onClick={() => changeMonth(-1)}>‹</button>
                            <button type="button" aria-label="Next month" onClick={() => changeMonth(1)}>›</button>
                        </div>
                    </div>
                    <div className="calendar-grid">
                        {['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'].map((day) => (
                            <div className="calendar-weekday" key={day}>{day}</div>
                        ))}
                        {Array.from({ length: firstDay }, (_, i) => <div key={`empty-${i}`} aria-hidden="true" />)}
                        {Array.from({ length: daysInMonth }, (_, i) => {
                            const day = i + 1
                            const date = new Date(year, month, day)
                            const dayKey = dateString(date)
                            const onDay = workouts.filter((workout) => workout.date === dayKey)
                            let dayClass = 'calendar-day'
                            if (isSelected(day)) dayClass += ' selected'
                            if (dayKey === today) dayClass += ' today'
                            return (
                                <button type="button" key={day} className={dayClass}
                                    aria-pressed={isSelected(day)} aria-current={dayKey === today ? 'date' : undefined}
                                    aria-label={`${date.toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}, ${onDay.length} workouts`}
                                    onClick={() => selectDate(date)}>
                                    <span>{day}</span>
                                    <span className="calendar-dots" aria-hidden="true">
                                        {CATEGORIES.filter((category) => onDay.some((workout) => workout.category === category)).map((category) => (
                                            <i key={category} className={`calendar-dot ${category.toLowerCase()}`} />
                                        ))}
                                    </span>
                                </button>
                            )
                        })}
                    </div>
                    <div className="calendar-legend">
                        {CATEGORIES.map((category) => <span key={category}><i className={`calendar-dot ${category.toLowerCase()}`} aria-hidden="true" />{category}</span>)}
                        <button type="button" className="calendar-link" onClick={() => { setCurrentDate(new Date()); selectDate(new Date()) }}>Today</button>
                    </div>
                </div>

                {message && <p className="calendar-message" role="status">{message}</p>}
                {deleted && <p className="calendar-subtitle">Deleted {deleted.name}. <button type="button" className="calendar-link" onClick={undoDelete}>Undo</button></p>}
                <div className="calendar-plan">
                    <h2 aria-live="polite">{selectedDate.toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' })}</h2>
                    {planned.length === 0 && <p className="calendar-empty">No workouts planned for this day.</p>}
                    {planned.map((workout) => (
                        <div className="calendar-workout" key={workout.id || workout._id}>
                            <h3>{workout.name}</h3>
                            <p>{formatTime(workout.time)} · {workout.category} · {workout.completed ? 'Completed' : 'Planned'}</p>
                            <div className="calendar-actions">
                                <button type="button" className="calendar-complete" disabled={!workout.completed && workout.date > today} onClick={() => toggleWorkout(workout)}>
                                    {workout.completed ? 'Mark planned' : 'Mark complete'}
                                </button>
                                <button type="button" className="calendar-link" onClick={() => openForm(workout)}>Edit</button>
                                <button type="button" className="calendar-delete" onClick={() => removeWorkout(workout)}>Delete</button>
                            </div>
                        </div>
                    ))}
                </div>

                <div className="calendar-footer">
                    <button type="button" className="calendar-back" onClick={() => onNavigate?.('overview')}>← Back to Overview</button>
                    <button type="button" className="calendar-back" onClick={() => onNavigate?.('progress')}>View Progress →</button>
                </div>
            </div>
        </div>
    )
}

export default CalendarPage
