import './ProfilePage.css'
import { useEffect, useState } from 'react'
import BottomNav from '../components/BottomNav'

const API =
    import.meta.env.VITE_API_URL ??
    'https://formflow-c8f8crdtadajebea.westus-01.azurewebsites.net'

function localDateString(date = new Date()) {
    return date.toLocaleDateString('en-CA') // YYYY-MM-DD
}

function authHeaders() {
    return {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${localStorage.getItem('token')}`,
    }
}

function initials(name) {
    const words = name.trim().split(/\s+/)
    const letters =
        words.length > 1 ? words[0][0] + words[1][0] : name.trim().slice(0, 2)
    return letters.toUpperCase()
}

function formatClock(date) {
    return date.toLocaleTimeString('en-US', {
        hour: 'numeric',
        minute: '2-digit',
    })
}

function formatWhen(at, now = new Date()) {
    const date = new Date(at)
    const minutes = Math.round((now - date) / 60000)
    if (minutes < 1) return 'Just now'
    if (minutes < 60) return `${minutes} min ago`
    const startOfDay = (d) =>
        new Date(d.getFullYear(), d.getMonth(), d.getDate())
    const dayDiff = Math.round((startOfDay(now) - startOfDay(date)) / 86400000)
    if (dayDiff === 0) {
        return minutes < 360
            ? `${Math.floor(minutes / 60)} hr ago`
            : `Today at ${formatClock(date)}`
    }
    if (dayDiff === 1) return `Yesterday at ${formatClock(date)}`
    return date.toLocaleDateString('en-US', {
        weekday: 'short',
        month: 'short',
        day: 'numeric',
    })
}

function feedMeta(item) {
    const parts = []
    if (item.distanceMi) parts.push(`${item.distanceMi} miles`)
    parts.push(`${item.durationMin} min`)
    if (item.volume) parts.push(`${item.volume.toLocaleString()} lb volume`)
    parts.push(formatWhen(item.at))
    return parts.join(' · ')
}

function Avatar({ name, large = false }) {
    return (
        <span
            className={`avatar${large ? ' avatar-large' : ''}`}
            aria-hidden="true"
        >
            {initials(name)}
        </span>
    )
}

function ProfileCard({ user }) {
    return (
        <section className="profile-card" aria-label="Your profile">
            <div className="profile-card-top">
                <Avatar name={user.displayName} large />
                <div>
                    <h2>{user.displayName}</h2>
                    <p className="profile-email">{user.email}</p>
                    <span className="level-badge">{user.level} athlete</span>
                </div>
            </div>
        </section>
    )
}

function Stats({ stats }) {
    const items = [
        [stats.workouts, 'Workouts'],
        [stats.weekStreak, 'Week streak'],
        [stats.personalRecords, 'Personal records'],
    ]
    return (
        <div className="stat-grid">
            {items.map(([value, label]) => (
                <div className="stat-tile" key={label}>
                    <strong>{value}</strong>
                    <span>{label}</span>
                </div>
            ))}
        </div>
    )
}

function Feed({ feed, onFindFriends }) {
    return (
        <section aria-labelledby="feed-heading">
            <div className="feed-header">
                <h2 id="feed-heading">Your feed</h2>
                <button
                    type="button"
                    className="find-friends"
                    onClick={onFindFriends}
                >
                    Find friends <span aria-hidden="true">›</span>
                </button>
            </div>
            <div className="feed-list">
                {feed.length === 0 && (
                    <p className="empty-text">
                        Completed workouts from you and your friends show up
                        here.
                    </p>
                )}
                {feed.map((item) => (
                    <article className="feed-item" key={item.id}>
                        <Avatar name={item.name} />
                        <div>
                            <p className="feed-title">
                                <strong>
                                    {item.isYou ? 'You' : item.name}
                                </strong>{' '}
                                completed <strong>{item.workout}</strong>
                            </p>
                            <p className="feed-meta">{feedMeta(item)}</p>
                            {item.notes && (
                                <p className="feed-notes">{item.notes}</p>
                            )}
                        </div>
                    </article>
                ))}
            </div>
        </section>
    )
}

function ProfilePage({ user, onNavigate, onLogout }) {
    const [profile, setProfile] = useState(null)
    const [error, setError] = useState('')
    const [tab, setTab] = useState('profile')

    useEffect(() => {
        const controller = new AbortController()
        fetch(`${API}/users/${user.id}/profile?date=${localDateString()}`, {
            headers: authHeaders(),
            signal: controller.signal,
        })
            .then((response) => {
                if (!response.ok) throw new Error('Request failed')
                return response.json()
            })
            .then((data) => {
                setProfile(data)
                setError('')
            })
            .catch((err) => {
                if (err.name !== 'AbortError') {
                    setError('Could not load your profile. Please try again.')
                }
            })
        return () => controller.abort()
    }, [user.id])

    return (
        <main className="profile-page">
            <div className="profile-content">
                <h1>Profile</h1>

                <div className="profile-tabs" role="tablist">
                    <button
                        type="button"
                        role="tab"
                        aria-selected={tab === 'profile'}
                        className={tab === 'profile' ? 'tab-active' : ''}
                        onClick={() => setTab('profile')}
                    >
                        Profile
                    </button>
                    <button
                        type="button"
                        role="tab"
                        aria-selected={tab === 'friends'}
                        className={tab === 'friends' ? 'tab-active' : ''}
                        onClick={() => setTab('friends')}
                    >
                        Friends
                        {profile && <span>{profile.friendsCount}</span>}
                    </button>
                </div>

                {error && (
                    <p className="form-error" role="alert">
                        {error}
                    </p>
                )}
                {!profile && !error && (
                    <p className="muted" role="status">
                        Loading...
                    </p>
                )}

                {profile && tab === 'profile' && (
                    <>
                        <ProfileCard user={profile.user} />
                        <Stats stats={profile.stats} />
                        <Feed
                            feed={profile.feed}
                            onFindFriends={() => setTab('friends')}
                        />
                        <button
                            type="button"
                            className="logout-button"
                            onClick={onLogout}
                        >
                            Log out
                        </button>
                    </>
                )}

                {profile && tab === 'friends' && (
                    <p className="empty-text">Friends are coming soon.</p>
                )}
            </div>

            <BottomNav active="profile" onNavigate={onNavigate} />
        </main>
    )
}

export default ProfilePage
