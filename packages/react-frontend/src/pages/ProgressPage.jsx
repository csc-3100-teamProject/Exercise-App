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

function RecentWorkouts({ workouts }) {
    const recent = [...workouts].sort((a, b) => {
        return b.date.localeCompare(a.date) || (b.time || '').localeCompare(a.time || '')
    }).slice(0, 5)

    return (
        <section className="panel" aria-labelledby="completed-heading">
            <h2 id="completed-heading">Completed this month</h2>
            {recent.length === 0 && <p className="empty-text">Your completed workouts will appear here.</p>}
            <ul className="progress-activity">
                {recent.map((workout) => (
                    <li key={workout.id || workout._id}>
                        <div>
                            <strong>{workout.name}</strong>
                            <p>{parseDate(workout.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })} · {workout.category}</p>
                        </div>
                        <span>{workout.durationMin} min</span>
                    </li>
                ))}
            </ul>
        </section>
    )
}

function ProgressPage({ workouts = [], onNavigate, storageError }) {
    const today = localDateString()
    const month = today.slice(0, 7)
    const completed = workouts.filter((workout) => workout.completed && workout.date <= today && workout.date.slice(0, 7) === month)
    const minutes = completed.reduce((sum, workout) => sum + workout.durationMin, 0)
    const activeDays = new Set(completed.map((workout) => workout.date)).size
    const weightedExercises = completed.flatMap((workout) => workout.exercises || [])
        .filter((exercise) => exercise && exercise.weight > 0 && exercise.sets > 0 && exercise.reps > 0)
    const volume = weightedExercises.reduce((sum, exercise) => sum + exercise.sets * exercise.reps * exercise.weight, 0)

    return (
        <main className="progress-page">
            <div className="progress-content">
                <header className="progress-header">
                    <h1>Progress</h1>
                    <span className="progress-month">{parseDate(today).toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}</span>
                </header>
                <p className="progress-storage-note">This month · Completed workouts saved on this device.</p>
                {storageError && <p className="form-error" role="alert">{storageError}</p>}

                <section className="progress-stats" aria-label="Monthly training summary">
                    <StatCard label="Workouts" value={completed.length} description="Completed sessions" />
                    <StatCard label="Training time" value={`${(minutes / 60).toFixed(1)} h`} description={`${minutes} minutes total`} />
                    <StatCard label="Training days" value={activeDays} description="Days with a completed workout" />
                    <StatCard label="Total volume" value={weightedExercises.length ? `${volume.toLocaleString()} lb` : '—'} description="Sets × reps × weight, when logged" />
                </section>

                <WorkoutMix workouts={completed} />
                <RecentWorkouts workouts={completed} />
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

