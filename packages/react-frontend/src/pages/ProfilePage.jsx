
import { useEffect, useState } from 'react'
import './ProfilePage.css'

const API = 'http://localhost:8000'

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
                body: JSON.stringify({ username, email })
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

                        {error && <p className="profile-error" role="alert">{error}</p>}
                        {message && <p className="profile-success">{message}</p>}

                        <button className="profile-logout" onClick={onLogout}>
                            Log out
                        </button>
                    </>
                )}
            </div>

            <nav className="profile-nav">
                {['Overview', 'Calendar', 'Routines', 'Progress', 'Profile'].map((page) => (
                    <button
                        key={page}
                        className={page === 'Profile' ? 'active' : ''}
                        onClick={() => onNavigate(page.toLowerCase())}
                    >
                        {page}
                    </button>
                ))}
            </nav>
        </main>
    )
}

export default ProfilePage

