import { useState } from 'react'
import './RoutinesPage.css'

const TEMPLATES = [
    {
        id: 'upper', name: 'Upper Body', category: 'Strength', durationMin: 45,
        exercises: [
            { name: 'Bench Press', sets: 3, reps: 8 },
            { name: 'Row', sets: 3, reps: 10 },
            { name: 'Shoulder Press', sets: 3, reps: 10 }
        ]
    },
    {
        id: 'cardio', name: 'Cardio Session', category: 'Cardio', durationMin: 20,
        exercises: [{ name: 'Cardio of your choice' }]
    },
    {
        id: 'mobility', name: 'Mobility Session', category: 'Mobility', durationMin: 15,
        exercises: [{ name: 'Hip Mobility' }, { name: 'Shoulder Mobility' }]
    }
]

const NAV_ITEMS = [
    ['home', 'Overview'], ['calendar', 'Calendar'], ['routines', 'Routines'],
    ['progress', 'Progress'], ['profile', 'Profile']
]

function Icon({ name }) {
    const paths = {
        home: <path d="M3 11l9-8 9 8v9a1 1 0 0 1-1 1h-5v-6H9v6H4a1 1 0 0 1-1-1z" />,
        calendar: <><rect x="3" y="4" width="18" height="17" rx="2" /><path d="M3 9h18M8 2v4M16 2v4" /></>,
        routines: <><rect x="4" y="3" width="16" height="18" rx="2" /><path d="M8 8h8M8 12h8M8 16h5" /></>,
        progress: <path d="M4 20V10M9 20V4M14 20v-8M19 20V8M2 20h20" />,
        profile: <><circle cx="12" cy="8" r="4" /><path d="M4 21a8 8 0 0 1 16 0" /></>
    }
    return (
        <svg viewBox="0 0 24 24" width="24" height="24" fill="none" stroke="currentColor"
            strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
            {paths[name]}
        </svg>
    )
}

function RoutinesPage({ onNavigate }) {
    const [expanded, setExpanded] = useState('')

    return (
        <main className="routines-page">
            <div className="routines-content">
                <header>
                    <h1>Routines</h1>
                    <p className="routines-note">Build a plan you can use again.</p>
                </header>

                <section className="routine-card" aria-labelledby="saved-heading">
                    <h2 id="saved-heading">Your routines</h2>
                    <p className="routines-note">No saved routines yet. Browse the starter templates below.</p>
                </section>

                <section aria-labelledby="templates-heading">
                    <h2 id="templates-heading">Starter templates</h2>
                    <div className="routines-list">
                        {TEMPLATES.map((routine) => (
                            <article className="routine-card" key={routine.id}>
                                <span className="routine-category">{routine.category}</span>
                                <h3>{routine.name}</h3>
                                <p className="routines-note">{routine.exercises.length} exercises · {routine.durationMin} min</p>
                                <button type="button" className="routines-link"
                                    aria-expanded={expanded === routine.id} aria-controls={`routine-${routine.id}`}
                                    onClick={() => setExpanded(expanded === routine.id ? '' : routine.id)}>
                                    {expanded === routine.id ? 'Hide exercises' : 'View exercises'}
                                </button>
                                {expanded === routine.id && (
                                    <ul className="routine-exercises" id={`routine-${routine.id}`}>
                                        {routine.exercises.map((exercise, index) => (
                                            <li key={index}>
                                                <strong>{exercise.name}</strong>
                                                {exercise.sets && exercise.reps && <span>{exercise.sets} × {exercise.reps}</span>}
                                            </li>
                                        ))}
                                    </ul>
                                )}
                            </article>
                        ))}
                    </div>
                </section>
            </div>

            <nav className="bottom-nav" aria-label="Main">
                {NAV_ITEMS.map(([icon, label]) => (
                    <button key={label} type="button" className={label === 'Routines' ? 'nav-active' : ''}
                        aria-current={label === 'Routines' ? 'page' : undefined}
                        onClick={() => onNavigate?.(label.toLowerCase())}>
                        <Icon name={icon} />
                        <span>{label}</span>
                    </button>
                ))}
            </nav>
        </main>
    )
}

export default RoutinesPage
