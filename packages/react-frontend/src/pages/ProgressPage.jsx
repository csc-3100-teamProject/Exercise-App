import { useState } from 'react'
import './ProgressPage.css'

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

function StatCard({ label, value, description }) {
    return (
        <div className="progress-stat">
            <p>{label}</p>
            <strong>{value}</strong>
            <span>{description}</span>
        </div>
    )
}

function WorkoutMix({ workouts }) {
    return (
        <section className="panel" aria-labelledby="mix-heading">
            <h2 id="mix-heading">Workout mix</h2>
            {workouts.length === 0 ? (
                <p className="empty-text">Complete a workout in Calendar to see your workout mix.</p>
            ) : (
                <ul className="progress-mix-list">
                    {CATEGORIES.map((category) => {
                        const count = workouts.filter((workout) => workout.category === category).length
                        const percent = Math.round((count / workouts.length) * 100)
                        return (
                            <li key={category}>
                                <div className="progress-mix-label">
                                    <span>{category}</span>
                                    <strong>{count} · {percent}%</strong>
                                </div>
                                <div className="progress-mix-track" aria-hidden="true">
                                    <div className="progress-mix-value" style={{ width: `${percent}%`, background: categoryColor(category) }} />
                                </div>
                            </li>
                        )
                    })}
                </ul>
            )}
        </section>
    )
}

function MonthlyActivity({ workouts, currentDate }) {
    const year = currentDate.getFullYear()
    const month = currentDate.getMonth()
    const daysInMonth = new Date(year, month + 1, 0).getDate()
    const firstDay = (new Date(year, month, 1).getDay() + 6) % 7
    const weeks = []

    for (let i = 0; i < Math.ceil((firstDay + daysInMonth) / 7); i++) {
        const start = Math.max(1, i * 7 - firstDay + 1)
        const end = Math.min(daysInMonth, (i + 1) * 7 - firstDay)
        const startDate = localDateString(new Date(year, month, start))
        const endDate = localDateString(new Date(year, month, end))
        const count = workouts.filter((workout) => workout.date >= startDate && workout.date <= endDate).length
        weeks.push({ start, end, count })
    }

    const max = Math.max(...weeks.map((week) => week.count), 1)

    return (
        <section className="panel" aria-labelledby="activity-heading">
            <h2 id="activity-heading">Monthly activity</h2>
            <p className="progress-panel-note">Completed workouts by week</p>
            {workouts.length === 0 ? (
                <p className="empty-text">No completed workouts in this month.</p>
            ) : (
                <>
                    <ul className="progress-chart" aria-label="Completed workouts by week">
                        {weeks.map((week) => (
                            <li key={week.start} aria-label={`Days ${week.start} to ${week.end}: ${week.count} completed workouts`}>
                                <strong>{week.count}</strong>
                                <div className="progress-bar-wrap" aria-hidden="true">
                                    <div className="progress-bar" style={{ height: `${(week.count / max) * 100}%` }} />
                                </div>
                                <span>{week.start}–{week.end}</span>
                            </li>
                        ))}
                    </ul>
                    <p className="progress-panel-note">Days of the month · Monday to Sunday groups</p>
                </>
            )}
        </section>
    )
}

function BestLifts({ workouts }) {
    const records = []

    for (const workout of workouts) {
        for (const exercise of workout.exercises || []) {
            if (!exercise || typeof exercise.name !== 'string' || !exercise.name.trim()) continue
            if (!Number.isFinite(exercise.weight) || exercise.weight <= 0) continue

            const name = exercise.name.trim()
            const record = records.find((item) => item.name.toLowerCase() === name.toLowerCase())
            if (!record) {
                records.push({ name, weight: exercise.weight, date: workout.date })
            } else if (exercise.weight > record.weight) {
                record.weight = exercise.weight
                record.date = workout.date
            }
        }
    }

    const best = records.sort((a, b) => b.weight - a.weight).slice(0, 3)

    return (
        <section className="panel" aria-labelledby="records-heading">
            <h2 id="records-heading">Best lifts</h2>
            <p className="progress-panel-note">Up to three heaviest logged weights in the selected month</p>
            {best.length === 0 && (
                <p className="empty-text">Best lifts appear when completed workouts include exercise weights.</p>
            )}
            <ul className="progress-activity">
                {best.map((record) => (
                    <li key={record.name.toLowerCase()}>
                        <div>
                            <strong>{record.name}</strong>
                            <p>{parseDate(record.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}</p>
                        </div>
                        <span>{record.weight.toLocaleString()} lb</span>
                    </li>
                ))}
            </ul>
        </section>
    )
}

function RecentWorkouts({ workouts, onNavigate }) {
    const [showAll, setShowAll] = useState(false)
    const sorted = [...workouts].sort((a, b) => {
        return b.date.localeCompare(a.date) || (b.time || '').localeCompare(a.time || '')
    })
    const recent = showAll ? sorted : sorted.slice(0, 5)

    return (
        <section className="panel" aria-labelledby="completed-heading">
            <div className="progress-section-header">
                <h2 id="completed-heading">Completed workouts</h2>
                {sorted.length > 5 && (
                    <button type="button" className="progress-link" aria-expanded={showAll}
                        aria-controls="progress-workout-list" onClick={() => setShowAll(!showAll)}>
                        {showAll ? 'Show less' : `View all (${sorted.length})`}
                    </button>
                )}
            </div>
            {recent.length === 0 && <p className="empty-text">Your completed workouts will appear here.</p>}
            {recent.length === 0 && (
                <button type="button" className="progress-link" onClick={() => onNavigate?.('calendar')}>Open Calendar →</button>
            )}
            <ul className="progress-activity" id="progress-workout-list">
                {recent.map((workout) => (
                    <li key={workout.id || workout._id}>
                        <div>
                            <strong>{workout.name}</strong>
                            <p>{parseDate(workout.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })} · {workout.category}</p>
                        </div>
                        {Number.isFinite(workout.durationMin) && workout.durationMin > 0 && (
                            <span>{workout.durationMin} min</span>
                        )}
                    </li>
                ))}
            </ul>
        </section>
    )
}

function ProgressPage({ workouts = [], onNavigate, storageError }) {
    const [currentDate, setCurrentDate] = useState(new Date())
    const today = localDateString()
    const month = localDateString(currentDate).slice(0, 7)
    const isCurrentMonth = month === today.slice(0, 7)
    const monthName = currentDate.toLocaleDateString('en-US', {
        month: 'long',
        year: 'numeric'
    })
    const completed = workouts.filter((workout) => workout.completed && workout.date <= today && workout.date.slice(0, 7) === month)
    const timedWorkouts = completed.filter((workout) => Number.isFinite(workout.durationMin) && workout.durationMin > 0)
    const minutes = timedWorkouts.reduce((sum, workout) => sum + workout.durationMin, 0)
    const activeDays = new Set(completed.map((workout) => workout.date)).size
    const weightedExercises = completed.flatMap((workout) => workout.exercises || [])
        .filter((exercise) => exercise && Number.isFinite(exercise.weight) && exercise.weight > 0 &&
            Number.isFinite(exercise.sets) && exercise.sets > 0 && Number.isFinite(exercise.reps) && exercise.reps > 0)
    const volume = weightedExercises.reduce((sum, exercise) => sum + exercise.sets * exercise.reps * exercise.weight, 0)

    function changeMonth(amount) {
        setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() + amount, 1))
    }

    return (
        <main className="progress-page">
            <div className="progress-content">
                <header className="progress-header">
                    <h1>Progress</h1>
                    <span className="progress-month" aria-live="polite">{monthName}</span>
                </header>
                <div className="progress-month-controls">
                    <button type="button" onClick={() => changeMonth(-1)}>‹ Previous</button>
                    <button type="button" disabled={isCurrentMonth} onClick={() => setCurrentDate(new Date())}>This month</button>
                    <button type="button" disabled={isCurrentMonth} onClick={() => changeMonth(1)}>Next ›</button>
                </div>
                <p className="progress-storage-note">Completed workouts in the selected month.</p>
                {storageError && <p className="form-error" role="alert">{storageError}</p>}

                <section className="progress-stats" aria-label="Monthly training summary">
                    <StatCard label="Workouts" value={completed.length} description="Completed sessions" />
                    <StatCard label="Logged time" value={timedWorkouts.length ? `${(minutes / 60).toFixed(1)} h` : '—'} description={timedWorkouts.length ? `${minutes} recorded minutes` : 'No duration recorded'} />
                    <StatCard label="Training days" value={activeDays} description="Days with a completed workout" />
                    <StatCard label="Total volume" value={weightedExercises.length ? `${volume.toLocaleString()} lb` : '—'} description="Sets × reps × weight, when logged" />
                </section>

                <MonthlyActivity workouts={completed} currentDate={currentDate} />
                <WorkoutMix workouts={completed} />
                <BestLifts workouts={completed} />
                <RecentWorkouts key={month} workouts={completed} onNavigate={onNavigate} />
            </div>

            <nav className="bottom-nav" aria-label="Main">
                {NAV_ITEMS.map(([icon, label]) => (
                    <button
                        key={label}
                        type="button"
                        className={label === 'Progress' ? 'nav-active' : ''}
                        aria-current={label === 'Progress' ? 'page' : undefined}
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

export default ProgressPage

