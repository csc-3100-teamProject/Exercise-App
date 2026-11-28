import { useState } from 'react'
import './RoutinesPage.css'
import BottomNav from '../components/BottomNav'
import { EXERCISES, exerciseTargets, findExercise, trackingFields } from './exerciseLibrary'

const TEMPLATES = [
    {
        id: 'upper',
        name: 'Upper Body',
        category: 'Strength',
        durationMin: 45,
        exercises: [
            { name: 'Barbell bench press', sets: 3, reps: 8 },
            { name: 'Seated cable row', sets: 3, reps: 10 },
            { name: 'Seated dumbbell shoulder press', sets: 3, reps: 10 },
        ],
    },
    {
        id: 'cardio',
        name: 'Cardio Session',
        category: 'Cardio',
        durationMin: 20,
        exercises: [{ name: 'Outdoor running' }],
    },
    {
        id: 'mobility',
        name: 'Mobility Session',
        category: 'Mobility',
        durationMin: 15,
        exercises: [{ name: 'Hip Mobility' }, { name: 'Shoulder Mobility' }],
    },
]

const CATEGORIES = ['Strength', 'Cardio', 'Mobility']

function editExercise(exercise) {
    const match = findExercise(exercise.name)
    return {
        ...exercise,
        exerciseId: match?.id,
        trackingFormat: match?.trackingFormat || 'weight_reps',
    }
}

function saveExercise(exercise) {
    const result = {
        name: findExercise(exercise.name)?.name || exercise.name.trim(),
        exerciseId: exercise.exerciseId,
        trackingFormat: exercise.trackingFormat,
    }
    for (const { key } of trackingFields(exercise)) {
        if (exercise[key] !== '' && exercise[key] != null) {
            result[key] = Number(exercise[key])
        }
    }
    return result
}

function optionalNumber(value) {
    return value === '' || value == null ? undefined : Number(value)
}

function routineError(routine) {
    if (
        typeof routine.name !== 'string' ||
        !routine.name.trim() ||
        routine.name.length > 80
    ) {
        return 'Enter a routine name of up to 80 characters.'
    }
    if (!CATEGORIES.includes(routine.category)) return 'Choose a category.'
    if (
        routine.notes !== undefined &&
        (typeof routine.notes !== 'string' || routine.notes.length > 300)
    ) {
        return 'Keep notes within 300 characters.'
    }
    if (
        routine.durationMin !== undefined &&
        (!Number.isInteger(routine.durationMin) ||
            routine.durationMin < 1 ||
            routine.durationMin > 1440)
    ) {
        return 'Enter a duration from 1 to 1440 minutes, or leave it blank.'
    }
    if (!Array.isArray(routine.exercises) || routine.exercises.length === 0) {
        return 'Add at least one exercise.'
    }
    for (const exercise of routine.exercises) {
        if (
            typeof exercise?.name !== 'string' ||
            !exercise.name.trim() ||
            exercise.name.length > 80
        ) {
            return 'Enter a name for each exercise.'
        }
        for (const { key, label, min, max, step } of trackingFields(exercise)) {
            const value = exercise[key]
            if (value == null) continue
            if (!Number.isFinite(value) || value < min || value > max ||
                (step === 1 && !Number.isInteger(value))) {
                return `${label} must be between ${min} and ${max}${step === 1 ? ' using a whole number' : ''}.`
            }
        }
    }
    return ''
}

function readRoutines(key) {
    try {
        const items = JSON.parse(localStorage.getItem(key) || '[]')
        if (
            !Array.isArray(items) ||
            !items.every((item) => item && typeof item.id === 'string' && item.id && !routineError(item)) ||
            new Set(items.map((item) => item.id)).size !== items.length
        ) {
            throw new Error('Invalid routines')
        }
        return { items, error: '' }
    } catch {
        return {
            items: [],
            error: 'Could not load your saved routines. Your saved data was kept.',
        }
    }
}

function RoutineCard({ routine, expanded, onToggle, children }) {
    return (
        <article className="routine-card" aria-label={routine.name}>
            <span className="routine-category">{routine.category}</span>
            <h3>{routine.name}</h3>
            <p className="routines-note">
                {routine.exercises.length} exercises
                {routine.durationMin ? ` · ${routine.durationMin} min` : ''}
            </p>
            {routine.notes && <p className="routines-note">{routine.notes}</p>}
            <div className="routines-actions">
                <button
                    type="button"
                    className="routines-link"
                    aria-expanded={expanded}
                    onClick={onToggle}
                >
                    {expanded ? 'Hide exercises' : 'View exercises'}
                </button>
                {children}
            </div>
            {expanded && (
                <ul className="routine-exercises">
                    {routine.exercises.map((exercise, index) => (
                        <li key={index}>
                            <strong>{exercise.name}</strong>
                            <span>{exerciseTargets(exercise)}</span>
                        </li>
                    ))}
                </ul>
            )}
        </article>
    )
}

function RoutinesPage({ user, onNavigate, onUseRoutine }) {
    const storageKey = `formflow-routines-${user.id}`
    const [data, setData] = useState(() => readRoutines(storageKey))
    const [expanded, setExpanded] = useState('')
    const [form, setForm] = useState(null)
    const [deletingId, setDeletingId] = useState('')
    const [search, setSearch] = useState('')
    const [error, setError] = useState('')
    const [message, setMessage] = useState('')

    const query = search.trim().toLowerCase()
    const visibleRoutines = data.items.filter((routine) =>
        routine.name.toLowerCase().includes(query) ||
        routine.exercises.some((exercise) =>
            exercise.name.toLowerCase().includes(query)
        )
    )

    function openForm(routine, id = '') {
        setForm({
            id,
            name: routine?.name || '',
            category: routine?.category || 'Strength',
            durationMin: routine?.durationMin ?? '',
            notes: routine?.notes || '',
            exercises: routine
                ? routine.exercises.map(editExercise)
                : [editExercise({ name: '' })],
        })
        setDeletingId('')
        setError('')
        setMessage('')
        window.scrollTo(0, 0)
    }

    function changeForm(event) {
        const { name, value } = event.target
        setForm({ ...form, [name]: value })
        setError('')
    }

    function changeExercise(index, event) {
        const { name, value } = event.target
        const exercises = form.exercises.map((exercise, i) => {
            if (i !== index) return exercise
            if (name !== 'name') return { ...exercise, [name]: value }

            const updated = editExercise({ name: value })
            for (const { key } of trackingFields(updated)) {
                updated[key] = exercise[key] ?? ''
            }
            return updated
        })
        setForm({ ...form, exercises })
        setError('')
    }

    function storeRoutines(items) {
        try {
            localStorage.setItem(storageKey, JSON.stringify(items))
            setData({ items, error: '' })
            return true
        } catch {
            setError('Could not save your routines in this browser.')
            return false
        }
    }

    function saveRoutine(event) {
        event.preventDefault()
        const routine = {
            ...form,
            name: form.name.trim(),
            durationMin: optionalNumber(form.durationMin),
            notes: form.notes.trim(),
            exercises: form.exercises.map(saveExercise),
        }
        const problem = routineError(routine)
        if (problem) {
            setError(problem)
            return
        }

        routine.id = form.id || crypto.randomUUID()
        const items = form.id
            ? data.items.map((item) => item.id === routine.id ? routine : item)
            : [...data.items, routine]
        if (!storeRoutines(items)) return

        setForm(null)
        setSearch('')
        setError('')
        setMessage(form.id ? 'Routine updated.' : 'Routine saved.')
    }

    function deleteRoutine(id) {
        setMessage('')
        if (!storeRoutines(data.items.filter((routine) => routine.id !== id))) {
            return
        }
        setDeletingId('')
        setError('')
        setMessage('Routine deleted.')
    }

    function toggleExercises(id) {
        setExpanded(expanded === id ? '' : id)
    }

    return (
        <main className="routines-page">
            <div className="routines-content">
                <header>
                    <div className="routines-header">
                        <h1>Routines</h1>
                        {!form && (
                            <button
                                type="button"
                                className="routines-primary"
                                disabled={!!data.error}
                                onClick={() => openForm()}
                            >
                                + New routine
                            </button>
                        )}
                    </div>
                    <p className="routines-note">Build a plan you can use again.</p>
                </header>

                {(data.error || error) && (
                    <p className="routines-error" role="alert">{data.error || error}</p>
                )}
                {message && (
                    <p className="routines-success" role="status">{message}</p>
                )}

                {form ? (
                    <form className="routine-card routine-form" onSubmit={saveRoutine}>
                        <h2>{form.id ? 'Edit routine' : 'Create routine'}</h2>

                        <label htmlFor="routine-name">Routine name</label>
                        <input id="routine-name" name="name" value={form.name}
                            onChange={changeForm} maxLength={80} autoFocus required />

                        <label htmlFor="routine-category">Category</label>
                        <select id="routine-category" name="category"
                            value={form.category} onChange={changeForm}>
                            {CATEGORIES.map((category) => (
                                <option key={category}>{category}</option>
                            ))}
                        </select>

                        <label htmlFor="routine-duration">Duration (minutes, optional)</label>
                        <input id="routine-duration" name="durationMin" type="number"
                            min="1" max="1440" value={form.durationMin} onChange={changeForm} />

                        <label htmlFor="routine-notes">Notes (optional)</label>
                        <textarea id="routine-notes" name="notes" rows="2"
                            maxLength={300} value={form.notes} onChange={changeForm} />

                        <datalist id="routine-exercise-list">
                            {EXERCISES.map((exercise) => (
                                <option key={exercise.id} value={exercise.name} />
                            ))}
                        </datalist>
                        <p className="routines-note">
                            Pick a suggested exercise or type your own. Targets are optional.
                        </p>

                        {form.exercises.map((exercise, index) => (
                            <fieldset className="routine-exercise" key={index}>
                                <legend>Exercise {index + 1}</legend>
                                <label>
                                    Exercise name
                                    <input name="name" value={exercise.name} maxLength={80}
                                        list="routine-exercise-list"
                                        onChange={(event) => changeExercise(index, event)} required />
                                </label>
                                <div className="routine-targets">
                                    {trackingFields(exercise).map(({ key, label, min, max, step }) => (
                                        <label key={key}>
                                            {label}
                                            <input name={key} type="number" min={min} max={max} step={step}
                                                value={exercise[key] ?? ''}
                                                onChange={(event) => changeExercise(index, event)} />
                                        </label>
                                    ))}
                                </div>
                                {form.exercises.length > 1 && (
                                    <button type="button" className="routines-link"
                                        onClick={() => {
                                            setForm({
                                                ...form,
                                                exercises: form.exercises.filter((_, i) => i !== index),
                                            })
                                            setError('')
                                        }}>
                                        Remove exercise
                                    </button>
                                )}
                            </fieldset>
                        ))}

                        <button type="button" className="routines-link"
                            onClick={() => setForm({ ...form, exercises: [...form.exercises, editExercise({ name: '' })] })}>
                            + Add exercise
                        </button>
                        <div className="routines-actions">
                            <button type="submit" className="routines-primary">Save routine</button>
                            <button type="button" className="routines-link"
                                onClick={() => { setForm(null); setError('') }}>
                                Cancel
                            </button>
                        </div>
                    </form>
                ) : (
                    <>
                        <section aria-labelledby="saved-heading">
                            <h2 id="saved-heading">Your routines</h2>
                            {data.items.length > 0 && (
                                <label className="routine-search">
                                    Search routines
                                    <input type="search" value={search}
                                        onChange={(event) => setSearch(event.target.value)} />
                                </label>
                            )}
                            {!data.error && visibleRoutines.length === 0 && (
                                <p className="routines-note">
                                    {query ? 'No routines match your search.' : 'No saved routines yet.'}
                                </p>
                            )}
                            <div className="routines-list">
                                {visibleRoutines.map((routine) => (
                                    <RoutineCard key={routine.id} routine={routine}
                                        expanded={expanded === routine.id}
                                        onToggle={() => toggleExercises(routine.id)}>
                                        <button type="button" className="routines-primary"
                                            disabled={!onUseRoutine} onClick={() => onUseRoutine(routine)}>
                                            Schedule in Calendar
                                        </button>
                                        <button type="button" className="routines-link"
                                            onClick={() => openForm(routine, routine.id)}>
                                            Edit
                                        </button>
                                        <button type="button" className="routines-link"
                                            onClick={() => openForm({ ...routine, name: routine.name.slice(0, 75) + ' copy' })}>
                                            Duplicate
                                        </button>
                                        {deletingId === routine.id ? (
                                            <>
                                                <button type="button" className="routines-link routines-danger"
                                                    onClick={() => deleteRoutine(routine.id)}>
                                                    Delete routine
                                                </button>
                                                <button type="button" className="routines-link"
                                                    onClick={() => setDeletingId('')}>
                                                    Keep routine
                                                </button>
                                            </>
                                        ) : (
                                            <button type="button" className="routines-link routines-danger"
                                                onClick={() => setDeletingId(routine.id)}>
                                                Delete
                                            </button>
                                        )}
                                    </RoutineCard>
                                ))}
                            </div>
                        </section>

                        <section aria-labelledby="templates-heading">
                            <h2 id="templates-heading">Starter templates</h2>
                            <div className="routines-list">
                                {TEMPLATES.map((routine) => (
                                    <RoutineCard key={routine.id} routine={routine}
                                        expanded={expanded === routine.id}
                                        onToggle={() => toggleExercises(routine.id)}>
                                        <button type="button" className="routines-link"
                                            disabled={!!data.error} onClick={() => openForm(routine)}>
                                            Use template
                                        </button>
                                    </RoutineCard>
                                ))}
                            </div>
                        </section>
                    </>
                )}
            </div>

            <BottomNav active="routines" onNavigate={onNavigate} />
        </main>
    )
}

export default RoutinesPage
