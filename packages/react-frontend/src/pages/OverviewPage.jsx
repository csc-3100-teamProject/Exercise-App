import './OverviewPage.css'
import { useEffect, useState } from 'react'

const API = 'http://localhost:8000'
const MAX_EXERCISES_SHOWN = 3

function localDateString(date = new Date()) {
    return date.toLocaleDateString('en-CA') // YYYY-MM-DD
}

function parseDate(dateStr) {
    const [y, m, d] = dateStr.split('-').map(Number)
    return new Date(y, m - 1, d)
}

function greeting() {
    const hour = new Date().getHours()
    if (hour < 12) return 'Good morning'
    if (hour < 18) return 'Good afternoon'
    return 'Good evening'
}

function formatTime(time) {
    if (!time) return null
    const [h, m] = time.split(':').map(Number)
    const suffix = h >= 12 ? 'PM' : 'AM'
    return `${h % 12 || 12}:${String(m).padStart(2, '0')} ${suffix}`
}

function formatTarget(exercise) {
    const parts = []
    if (exercise.sets && exercise.reps) {
        parts.push(`${exercise.sets} × ${exercise.reps}`)
    }
    if (exercise.weight) parts.push(`${exercise.weight} lb`)
    return parts.join(' · ')
}

const NUMBER_WORDS = ['No', 'One', 'Two', 'Three', 'Four', 'Five']

function planSummary(plan) {
    if (plan.length === 0) return 'Nothing planned today'
    const minutes = plan.reduce((sum, w) => sum + w.durationMin, 0)
    const count = NUMBER_WORDS[plan.length] ?? plan.length
    return `${count} workout${plan.length === 1 ? '' : 's'} · about ${minutes} min`
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

function WeekStrip({ week }) {
    return (
        <nav className="week-strip" aria-label="This week">
            {week.map((day) => (
                <div
                    key={day.date}
                    className={`week-day${day.isToday ? ' week-day-today' : ''}`}
                    aria-current={day.isToday ? 'date' : undefined}
                >
                    <span>{day.label}</span>
                    <strong>{day.day}</strong>
                    <i
                        className={day.status ? 'week-dot' : 'week-dot-empty'}
                        aria-hidden="true"
                    />
                </div>
            ))}
        </nav>
    )
}

function WorkoutCard({ workout, onStart }) {
    const shown = workout.exercises.slice(0, MAX_EXERCISES_SHOWN)
    const hidden = workout.exercises.length - shown.length
    const time = formatTime(workout.time)

    return (
        <article className="workout-card">
            <div className="workout-card-top">
                <span className="workout-category">{workout.category}</span>
                <span className="workout-menu" aria-hidden="true">
                    •••
                </span>
            </div>

            <h3>{workout.name}</h3>

            <p className="workout-details">
                {time && <span>{time}</span>}
                {time && <i aria-hidden="true" />}
                <span>{workout.durationMin} min</span>
            </p>

            {shown.length > 0 && (
                <ul className="exercise-list">
                    {shown.map((exercise, index) => (
                        <li className="exercise-row" key={exercise.name}>
                            <span className="exercise-index">
                                {String(index + 1).padStart(2, '0')}
                            </span>
                            <strong>{exercise.name}</strong>
                            <span className="exercise-target">
                                {formatTarget(exercise)}
                            </span>
                        </li>
                    ))}
                    {hidden > 0 && (
                        <li className="exercise-more">+ {hidden} more</li>
                    )}
                </ul>
            )}

            <button
                type="button"
                className="start-workout"
                onClick={() => onStart?.(workout)}
            >
                Start workout
            </button>
        </article>
    )
}

function RecentActivity({ activity }) {
    return (
        <section aria-labelledby="recent-heading">
            <div className="section-header">
                <h2 id="recent-heading">Recent activity</h2>
                <button type="button" className="link-button">
                    View all
                </button>
            </div>
            <div className="panel activity-list">
                {activity.length === 0 && (
                    <p className="empty-text">No completed workouts yet.</p>
                )}
                {activity.map((item) => (
                    <div className="activity-row" key={item.id}>
                        <div>
                            <strong>{item.name}</strong>
                            <p>
                                {parseDate(item.date).toLocaleDateString(
                                    'en-US',
                                    {
                                        weekday: 'short',
                                        month: 'short',
                                        day: 'numeric',
                                    }
                                )}
                            </p>
                        </div>
                        <div className="activity-duration">
                            <p>Duration</p>
                            <strong>{item.durationMin} min</strong>
                        </div>
                    </div>
                ))}
            </div>
        </section>
    )
}

function WeeklyGoal({ goal }) {
    const radius = 54
    const circumference = 2 * Math.PI * radius
    const progress = Math.min(goal.completed / goal.goal, 1)

    return (
        <section className="panel" aria-labelledby="goal-heading">
            <div className="panel-header">
                <h2 id="goal-heading">Weekly goal</h2>
                <span className="panel-menu" aria-hidden="true">
                    •••
                </span>
            </div>
            <div className="goal-body">
                <div className="goal-ring">
                    <svg viewBox="0 0 128 128" aria-hidden="true">
                        <circle className="ring-track" cx="64" cy="64" r={radius} />
                        <circle
                            className="ring-value"
                            cx="64"
                            cy="64"
                            r={radius}
                            strokeDasharray={circumference}
                            strokeDashoffset={circumference * (1 - progress)}
                            transform="rotate(-90 64 64)"
                        />
                    </svg>
                    <div className="goal-ring-label">
                        <strong>
                            {goal.completed}/{goal.goal}
                        </strong>
                        <span>workouts</span>
                    </div>
                </div>
                <div className="goal-text">
                    <strong>
                        {goal.remaining === 0
                            ? 'Done!'
                            : `${goal.remaining} to go`}
                    </strong>
                    <p>
                        {goal.daysRemaining} day
                        {goal.daysRemaining === 1 ? '' : 's'} remaining
                    </p>
                    <span
                        className={
                            goal.status === 'Behind' ? 'status-behind' : 'status-ok'
                        }
                    >
                        {goal.status}
                    </span>
                </div>
            </div>
        </section>
    )
}

function StreakCard({ streak }) {
    return (
        <section className="panel" aria-labelledby="streak-heading">
            <div className="panel-header">
                <h2 id="streak-heading">Current streak</h2>
            </div>
            <p className="big-number">
                <strong>{streak.weeks}</strong>
                <span>{streak.weeks === 1 ? 'week' : 'weeks'}</span>
            </p>
            <p className="muted small">
                Your longest streak is {streak.longestWeeks}{' '}
                {streak.longestWeeks === 1 ? 'week' : 'weeks'}
            </p>
            <div className="streak-days">
                {streak.days.map((day, index) => (
                    <span
                        key={day.label}
                        className={`streak-day${day.status ? ` streak-${day.status}` : ''}`}
                        title={day.label}
                    >
                        {day.label[0]}
                    </span>
                ))}
            </div>
        </section>
    )
}

function VolumeCard({ volume }) {
    const max = Math.max(...volume.daily.map((d) => d.volume), 0)
    const best = max > 0 ? volume.daily.findIndex((d) => d.volume === max) : -1

    return (
        <section className="panel" aria-labelledby="volume-heading">
            <div className="panel-header">
                <h2 id="volume-heading">Training volume</h2>
                {volume.changePct !== null && (
                    <span
                        className={`change-badge${volume.changePct < 0 ? ' change-down' : ''}`}
                    >
                        {volume.changePct > 0 ? '+' : ''}
                        {volume.changePct}%
                    </span>
                )}
            </div>
            <p className="big-number">
                <strong>{volume.total.toLocaleString()}</strong>
                <span>lb</span>
            </p>
            <p className="muted small">This week</p>
            <div className="volume-chart">
                {volume.daily.map((day, index) => (
                    <div className="volume-col" key={day.label}>
                        <div className="volume-bar-wrap">
                            <div
                                className={`volume-bar${index === best ? ' volume-bar-best' : ''}`}
                                style={{
                                    height: `${max ? Math.max((day.volume / max) * 100, 8) : 8}%`,
                                }}
                                title={`${day.volume.toLocaleString()} lb`}
                            />
                        </div>
                        <span>{day.label[0]}</span>
                    </div>
                ))}
            </div>
        </section>
    )
}

const NAV_ITEMS = [
    ['home', 'Overview'],
    ['calendar', 'Calendar'],
    ['routines', 'Routines'],
    ['progress', 'Progress'],
    ['profile', 'Profile'],
]

function OverviewPage({ user, onStart, onAdd }) {
    const [overview, setOverview] = useState(null)
    const [error, setError] = useState('')

    useEffect(() => {
        const controller = new AbortController()
        fetch(
            `${API}/users/${user.id}/overview?date=${localDateString()}`,
            { signal: controller.signal }
        )
            .then((response) => {
                if (!response.ok) throw new Error('Request failed')
                return response.json()
            })
            .then(setOverview)
            .catch((err) => {
                if (err.name !== 'AbortError') {
                    setError('Could not load your overview. Please try again.')
                }
            })
        return () => controller.abort()
    }, [user.id])

    const username = overview?.user.username ?? user.username
    const today = parseDate(overview?.today ?? localDateString())

    return (
        <main className="overview-page">
            <div className="overview-content">
                <header className="overview-header">
                    <div>
                        <h1>
                            {greeting()}
                            {username ? `, ${username}` : ''}.
                        </h1>
                        <p className="overview-date">
                            {today.toLocaleDateString('en-US', {
                                weekday: 'long',
                                month: 'long',
                                day: 'numeric',
                            })}
                        </p>
                    </div>
                    <button
                        type="button"
                        className="add-button"
                        aria-label="Add workout"
                        onClick={() => onAdd?.()}
                    >
                        +
                    </button>
                </header>

                {error && (
                    <p className="form-error" role="alert">
                        {error}
                    </p>
                )}
                {!overview && !error && (
                    <p className="muted" role="status">
                        Loading...
                    </p>
                )}

                {overview && (
                    <>
                        <WeekStrip week={overview.week} />

                        <section aria-labelledby="today-heading">
                            <h2 id="today-heading">Today’s plan</h2>
                            <div className="section-sub">
                                <p>{planSummary(overview.todaysPlan)}</p>
                                <button type="button" className="link-button">
                                    View calendar
                                </button>
                            </div>
                            {overview.todaysPlan.map((workout) => (
                                <WorkoutCard
                                    key={workout.id}
                                    workout={workout}
                                    onStart={onStart}
                                />
                            ))}
                        </section>

                        <RecentActivity activity={overview.recentActivity} />
                        <WeeklyGoal goal={overview.weeklyGoal} />
                        <StreakCard streak={overview.streak} />
                        <VolumeCard volume={overview.trainingVolume} />
                    </>
                )}
            </div>

            <nav className="bottom-nav" aria-label="Main">
                {NAV_ITEMS.map(([icon, label]) => (
                    <button
                        key={label}
                        type="button"
                        className={label === 'Overview' ? 'nav-active' : ''}
                        aria-current={label === 'Overview' ? 'page' : undefined}
                    >
                        <Icon name={icon} />
                        <span>{label}</span>
                    </button>
                ))}
            </nav>
        </main>
    )
}

export default OverviewPage
