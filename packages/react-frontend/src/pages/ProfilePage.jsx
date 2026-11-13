import { useEffect, useState } from 'react'
import './ProfilePage.css'

const API = 'http://localhost:8000'

const NAV_ITEMS = [
    ['home', 'Overview'],
    ['calendar', 'Calendar'],
    ['routines', 'Routines'],
    ['progress', 'Progress'],
    ['profile', 'Profile'],
]

function Icon({ name }) {
    const paths = {
        home: (
            <path d="M3 11l9-8 9 8v9a1 1 0 0 1-1 1h-5v-6H9v6H4a1 1 0 0 1-1-1z" />
        ),
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

function ProfilePage({ user, onNavigate, onLogout }) {
    const [username, setUsername] = useState('')
    const [email, setEmail] = useState('')
    const [editing, setEditing] = useState(false)
    const [loading, setLoading] = useState(true)
    const [saving, setSaving] = useState(false)
    const [error, setError] = useState('')
    const [message, setMessage] = useState('')

    useEffect(() => {
        fetch(`${API}/users/${user.id}/profile`)
            .then((res) => {
                if (!res.ok) throw new Error('Failed to load profile')
                return res.json()
            })
            .then((data) => {
                setUsername(data.username)
                setEmail(data.email)
            })
            .catch(() => setError('Could not load profile'))
            .finally(() => setLoading(false))
    }, [user.id])

    async function saveProfile(e) {
        e.preventDefault()
        setError('')
        setMessage('')
        setSaving(true)

        try {
            const res = await fetch(`${API}/users/${user.id}/profile`, {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ username, email }),
            })

            if (!res.ok) {
                throw new Error('Could not save profile')
            }

            const updated = await res.json()
            setUsername(updated.username)
            setEmail(updated.email)
            setEditing(false)
            setMessage('Profile updated successfully')
        } catch {
            setError('Could not save profile. Please try again.')
        } finally {
            setSaving(false)
        }
    }

    return (
        <main className="profile-page">
            <div className="profile-content">
                <h1>Profile</h1>

                {loading ? (
                    <p>Loading...</p>
                ) : (
                    <>
                        <div className="profile-header">
                            <div className="profile-avatar">
                                {username.charAt(0).toUpperCase()}
                            </div>
                            <h2>{username}</h2>
                            <p>{email}</p>
                        </div>

                        <form className="profile-card" onSubmit={saveProfile}>
                            <div className="profile-card-header">
                                <h2>Personal information</h2>

                                <button
                                    type="button"
                                    onClick={() => {
                                        setEditing(!editing)
                                        setMessage('')
                                    }}
                                >
                                    {editing ? 'Cancel' : 'Edit'}
                                </button>
                            </div>

                            <label htmlFor="profile-username">Username</label>

                            <input
                                id="profile-username"
                                value={username}
                                onChange={(e) => setUsername(e.target.value)}
                                disabled={!editing}
                                required
                            />

                            <label htmlFor="profile-email">Email</label>

                            <input
                                id="profile-email"
                                type="email"
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                                disabled={!editing}
                                required
                            />

                            {editing && (
                                <button
                                    className="profile-save"
                                    type="submit"
                                    disabled={saving}
                                >
                                    {saving ? 'Saving...' : 'Save changes'}
                                </button>
                            )}
                        </form>

                        {error && (
                            <p className="profile-error" role="alert">
                                {error}
                            </p>
                        )}

                        {message && (
                            <p className="profile-success">{message}</p>
                        )}

                        <button
                            className="profile-logout"
                            type="button"
                            onClick={onLogout}
                        >
                            Log out
                        </button>
                    </>
                )}
            </div>

            <nav className="profile-nav" aria-label="Main">
                {NAV_ITEMS.map(([icon, label]) => (
                    <button
                        key={label}
                        type="button"
                        className={label === 'Profile' ? 'nav-active' : ''}
                        aria-current={label === 'Profile' ? 'page' : undefined}
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

export default ProfilePage
