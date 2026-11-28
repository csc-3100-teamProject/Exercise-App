import './ProfilePage.css'
import { useEffect, useState } from 'react'
import BottomNav from '../components/BottomNav'
import { API_URL as API } from '../apiConfig'


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
    if (item.durationMin > 0) parts.push(`${item.durationMin} min`)
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

function ProfileCard({ user, onEdit }) {
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
            <button type="button" className="edit-button" onClick={onEdit}>
                Edit profile
            </button>
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

function SearchIcon() {
    return (
        <svg
            viewBox="0 0 24 24"
            width="20"
            height="20"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.8"
            strokeLinecap="round"
            strokeLinejoin="round"
            aria-hidden="true"
        >
            <circle cx="11" cy="11" r="7" />
            <path d="M21 21l-4.3-4.3" />
        </svg>
    )
}

function personSubtext(person) {
    if (person.status !== 'friend' && person.mutualFriends > 0) {
        return `${person.mutualFriends} mutual friend${person.mutualFriends === 1 ? '' : 's'}`
    }
    return `${person.level} athlete`
}

function FriendsTab({ userId, onChanged }) {
    const [query, setQuery] = useState('')
    const [search, setSearch] = useState('')
    const [reloadKey, setReloadKey] = useState(0)
    const [requests, setRequests] = useState(null)
    const [people, setPeople] = useState(null)
    const [showRequests, setShowRequests] = useState(false)
    const [confirmId, setConfirmId] = useState(null)
    const [error, setError] = useState('')

    useEffect(() => {
        const timer = setTimeout(() => setSearch(query.trim()), 250)
        return () => clearTimeout(timer)
    }, [query])

    useEffect(() => {
        const controller = new AbortController()
        const options = { headers: authHeaders(), signal: controller.signal }
        Promise.all([
            fetch(`${API}/users/${userId}/friends`, options),
            fetch(
                `${API}/users/${userId}/people?q=${encodeURIComponent(search)}`,
                options
            ),
        ])
            .then(async ([friendsResponse, peopleResponse]) => {
                if (!friendsResponse.ok || !peopleResponse.ok) {
                    throw new Error('Request failed')
                }
                setRequests((await friendsResponse.json()).requests)
                setPeople(await peopleResponse.json())
                setError('')
            })
            .catch((err) => {
                if (err.name !== 'AbortError') {
                    setError('Could not load friends. Please try again.')
                }
            })
        return () => controller.abort()
    }, [userId, search, reloadKey])

    async function act(path, options, failure) {
        setError('')
        setConfirmId(null)
        try {
            const response = await fetch(`${API}/users/${userId}${path}`, {
                ...options,
                headers: authHeaders(),
            })
            if (!response.ok && response.status !== 409) throw new Error()
            setReloadKey((key) => key + 1)
            onChanged()
        } catch {
            setError(failure)
        }
    }

    const accept = (requestId) =>
        act(
            `/friend-requests/${requestId}/accept`,
            { method: 'POST' },
            'Could not accept that request. Please try again.'
        )
    const decline = (requestId) =>
        act(
            `/friend-requests/${requestId}`,
            { method: 'DELETE' },
            'Could not decline that request. Please try again.'
        )
    const add = (person) =>
        act(
            '/friends',
            { method: 'POST', body: JSON.stringify({ userId: person.id }) },
            'Could not send that request. Please try again.'
        )
    const remove = (person) =>
        act(
            `/friends/${person.id}`,
            { method: 'DELETE' },
            'Could not remove that friend. Please try again.'
        )

    function personButton(person) {
        const request = requests?.find((r) => r.id === person.id)
        if (person.status === 'friend') {
            return confirmId === person.id ? (
                <button
                    type="button"
                    className="person-button person-remove"
                    onClick={() => remove(person)}
                >
                    Remove
                </button>
            ) : (
                <button
                    type="button"
                    className="person-button"
                    onClick={() => setConfirmId(person.id)}
                >
                    Friends
                </button>
            )
        }
        if (person.status === 'sent') {
            return (
                <button type="button" className="person-button" disabled>
                    Requested
                </button>
            )
        }
        if (person.status === 'received' && request) {
            return (
                <button
                    type="button"
                    className="person-button person-add"
                    onClick={() => accept(request.requestId)}
                >
                    Accept
                </button>
            )
        }
        return (
            <button
                type="button"
                className="person-button person-add"
                onClick={() => add(person)}
            >
                Add
            </button>
        )
    }

    return (
        <section aria-label="Friends" className="friends-tab">
            {requests && requests.length > 0 && (
                <>
                    <button
                        type="button"
                        className="requests-banner"
                        aria-expanded={showRequests}
                        onClick={() => setShowRequests((open) => !open)}
                    >
                        <span>
                            <strong>Friend requests</strong>
                            <small>
                                {requests.length} waiting for your response
                            </small>
                        </span>
                        <span className="requests-count">
                            {requests.length}
                        </span>
                    </button>
                    {showRequests && (
                        <div className="people-card">
                            {requests.map((request) => (
                                <div
                                    className="request-row"
                                    key={request.requestId}
                                >
                                    <Avatar name={request.name} />
                                    <div>
                                        <strong>{request.name}</strong>
                                        <p className="feed-meta">
                                            @{request.username}
                                        </p>
                                    </div>
                                    <div className="request-actions">
                                        <button
                                            type="button"
                                            className="person-button"
                                            onClick={() =>
                                                decline(request.requestId)
                                            }
                                        >
                                            Decline
                                        </button>
                                        <button
                                            type="button"
                                            className="person-button person-add"
                                            onClick={() =>
                                                accept(request.requestId)
                                            }
                                        >
                                            Accept
                                        </button>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </>
            )}

            <div className="people-card">
                <label className="people-search">
                    <SearchIcon />
                    <input
                        type="search"
                        value={query}
                        onChange={(e) => setQuery(e.target.value)}
                        placeholder="Search people by name"
                        aria-label="Search people by name"
                    />
                </label>
                {!people && !error && (
                    <p className="empty-text" role="status">
                        Loading...
                    </p>
                )}
                {people && people.length === 0 && (
                    <p className="empty-text">
                        {search ? 'No one found.' : 'No other people yet.'}
                    </p>
                )}
                {people?.map((person) => (
                    <div className="person-row" key={person.id}>
                        <Avatar name={person.name} />
                        <div>
                            <strong>{person.name}</strong>
                            <p className="feed-meta">{personSubtext(person)}</p>
                        </div>
                        {personButton(person)}
                    </div>
                ))}
            </div>

            {error && (
                <p className="form-error" role="alert">
                    {error}
                </p>
            )}
        </section>
    )
}

const LEVELS = ['Beginner', 'Intermediate', 'Advanced']
const UNITS = ['Imperial', 'Metric']
const EQUIPMENT = ['Full gym', 'Home gym', 'Dumbbells only', 'Bodyweight only']
const BIO_LIMIT = 200

function EditProfile({ user, userId, onSaved, onCancel }) {
    const [form, setForm] = useState({
        fullName: user.fullName,
        email: user.email,
        level: user.level,
        units: user.units,
        weeklyGoal: String(user.weeklyGoal),
        equipment: user.equipment,
        bio: user.bio,
    })
    const [error, setError] = useState('')
    const [saving, setSaving] = useState(false)

    function update(event) {
        const { name, value } = event.target
        setForm((current) => ({ ...current, [name]: value }))
        setError('')
    }

    async function save(event) {
        event.preventDefault()
        if (saving) return
        const goal = Number(form.weeklyGoal)
        if (!Number.isInteger(goal) || goal < 1 || goal > 7) {
            setError('Weekly goal must be a whole number from 1 to 7.')
            return
        }
        setSaving(true)
        try {
            const response = await fetch(`${API}/users/${userId}/profile`, {
                method: 'PATCH',
                headers: authHeaders(),
                body: JSON.stringify({
                    ...form,
                    fullName: form.fullName.trim(),
                    email: form.email.trim(),
                    weeklyGoal: goal,
                }),
            })
            if (response.status === 409) {
                throw new Error('That email is already in use.')
            }
            if (response.status === 400) {
                throw new Error('Check your details and try again.')
            }
            if (!response.ok) {
                throw new Error(
                    'Could not save your profile. Please try again.'
                )
            }
            onSaved()
        } catch (err) {
            setError(
                err instanceof TypeError
                    ? 'Could not connect to the server. Please try again.'
                    : err.message
            )
        } finally {
            setSaving(false)
        }
    }

    return (
        <form className="edit-card" onSubmit={save}>
            <div className="photo-row">
                <Avatar name={form.fullName || user.displayName} large />
                <div>
                    <strong>Profile photo</strong>
                    <p className="feed-meta">
                        Photo uploads can be connected later
                    </p>
                </div>
            </div>

            <div className="edit-fields">
                <label htmlFor="edit-name">Full name</label>
                <input
                    id="edit-name"
                    name="fullName"
                    value={form.fullName}
                    onChange={update}
                    maxLength={60}
                />

                <label htmlFor="edit-email">Email</label>
                <input
                    id="edit-email"
                    name="email"
                    type="email"
                    value={form.email}
                    onChange={update}
                    required
                />

                <label htmlFor="edit-level">Experience</label>
                <select
                    id="edit-level"
                    name="level"
                    value={form.level}
                    onChange={update}
                >
                    {LEVELS.map((level) => (
                        <option key={level}>{level}</option>
                    ))}
                </select>

                <label htmlFor="edit-units">Preferred units</label>
                <select
                    id="edit-units"
                    name="units"
                    value={form.units}
                    onChange={update}
                >
                    {UNITS.map((unit) => (
                        <option key={unit}>{unit}</option>
                    ))}
                </select>

                <label htmlFor="edit-goal">Weekly workout goal</label>
                <input
                    id="edit-goal"
                    name="weeklyGoal"
                    type="number"
                    inputMode="numeric"
                    min="1"
                    max="7"
                    value={form.weeklyGoal}
                    onChange={update}
                    required
                />

                <label htmlFor="edit-equipment">Available equipment</label>
                <select
                    id="edit-equipment"
                    name="equipment"
                    value={form.equipment}
                    onChange={update}
                >
                    {EQUIPMENT.map((item) => (
                        <option key={item}>{item}</option>
                    ))}
                </select>

                <label htmlFor="edit-bio">Bio</label>
                <textarea
                    id="edit-bio"
                    name="bio"
                    rows="4"
                    maxLength={BIO_LIMIT}
                    value={form.bio}
                    onChange={update}
                />
                <p className="char-count">
                    {form.bio.length}/{BIO_LIMIT}
                </p>
            </div>

            {error && (
                <p className="form-error" role="alert">
                    {error}
                </p>
            )}

            <div className="edit-actions">
                <button type="button" onClick={onCancel}>
                    Cancel
                </button>
                <button type="submit" className="primary" disabled={saving}>
                    {saving ? 'Saving...' : 'Save changes'}
                </button>
            </div>
        </form>
    )
}

function ProfilePage({ user, onNavigate, onLogout }) {
    const [profile, setProfile] = useState(null)
    const [error, setError] = useState('')
    const [tab, setTab] = useState('profile')
    const [reloadKey, setReloadKey] = useState(0)
    const [editing, setEditing] = useState(false)

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
    }, [user.id, reloadKey])

    return (
        <main className="profile-page">
            <div className="profile-content">
                <h1>{editing ? 'Edit profile' : 'Profile'}</h1>

                {!editing && (
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
                )}

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

                {profile && editing && (
                    <EditProfile
                        user={profile.user}
                        userId={user.id}
                        onCancel={() => setEditing(false)}
                        onSaved={() => {
                            setEditing(false)
                            setReloadKey((key) => key + 1)
                        }}
                    />
                )}

                {profile && !editing && tab === 'profile' && (
                    <>
                        <ProfileCard
                            user={profile.user}
                            onEdit={() => setEditing(true)}
                        />
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

                {!editing && tab === 'friends' && (
                    <FriendsTab
                        userId={user.id}
                        onChanged={() => setReloadKey((key) => key + 1)}
                    />
                )}
            </div>

            <BottomNav active="profile" onNavigate={onNavigate} />
        </main>
    )
}

export default ProfilePage
