import './BottomNav.css'

const NAV_ITEMS = [
    ['home', 'Overview', 'overview'],
    ['calendar', 'Calendar', 'calendar'],
    ['routines', 'Routines', 'routines'],
    ['progress', 'Progress', 'progress'],
    ['profile', 'Profile', 'profile'],
]

const PATHS = {
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

const ENABLED = ['overview', 'calendar', 'routines', 'progress', 'profile']

function BottomNav({ active, onNavigate }) {
    return (
        <nav className="app-nav" aria-label="Main">
            {NAV_ITEMS.map(([icon, label, page]) => (
                <button
                    key={page}
                    type="button"
                    className={page === active ? 'app-nav-active' : ''}
                    aria-current={page === active ? 'page' : undefined}
                    disabled={!ENABLED.includes(page)}
                    onClick={() => onNavigate?.(page)}
                >
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
                        {PATHS[icon]}
                    </svg>
                    <span>{label}</span>
                </button>
            ))}
        </nav>
    )
}

export default BottomNav
