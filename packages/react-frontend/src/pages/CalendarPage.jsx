import './CalendarPage.css'
import { useState } from 'react'

const DAY_LABELS = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun']

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

function MonthGrid({ month, selectedDate, onSelect }) {
    const year = month.getFullYear()
    const monthIndex = month.getMonth()
    const firstDay = (month.getDay() + 6) % 7
    const daysInMonth = new Date(year, monthIndex + 1, 0).getDate()
    const cellCount = Math.ceil((firstDay + daysInMonth) / 7) * 7
    const today = localDateString()

    const days = Array.from({ length: cellCount }, (_, index) => {
        const day = index - firstDay + 1
        if (day < 1 || day > daysInMonth) return null
        return localDateString(new Date(year, monthIndex, day))
    })

    return (
        <div className="calendar-grid">
            {DAY_LABELS.map((label) => (
                <span className="calendar-weekday" key={label}>
                    {label}
                </span>
            ))}
            {days.map((date, index) => {
                if (!date) {
                    return (
                        <div
                            className="calendar-blank"
                            key={`blank-${index}`}
                            aria-hidden="true"
                        />
                    )
                }

                return (
                    <button
                        type="button"
                        className={`calendar-day${date === selectedDate ? ' calendar-day-selected' : ''}${date === today ? ' calendar-day-today' : ''}`}
                        key={date}
                        aria-pressed={date === selectedDate}
                        aria-current={date === today ? 'date' : undefined}
                        aria-label={`${parseDate(date).toLocaleDateString('en-US', {
                            weekday: 'long',
                            month: 'long',
                            day: 'numeric',
                            year: 'numeric',
                        })}`}
                        onClick={() => onSelect(date)}
                    >
                        <span className="calendar-day-number">
                            {parseDate(date).getDate()}
                        </span>
                    </button>
                )
            })}
        </div>
    )
}

function SelectedDay({ date }) {
    return (
        <section className="panel calendar-selected-day" aria-labelledby="selected-day-heading">
            <p className="calendar-eyebrow">Selected day</p>
            <h2 id="selected-day-heading" aria-live="polite">
                {parseDate(date).toLocaleDateString('en-US', {
                    month: 'long',
                    day: 'numeric',
                    year: 'numeric',
                })}
            </h2>
        </section>
    )
}

function CalendarPage({ onNavigate }) {
    const today = localDateString()
    const [month, setMonth] = useState(() => {
        const date = new Date()
        return new Date(date.getFullYear(), date.getMonth(), 1)
    })
    const [selectedDate, setSelectedDate] = useState(today)

    function changeMonth(amount) {
        const next = new Date(month.getFullYear(), month.getMonth() + amount, 1)
        setMonth(next)
        setSelectedDate(localDateString(next))
    }

    function selectDate(date) {
        setSelectedDate(date)
    }

    function goToToday() {
        const date = parseDate(today)
        setMonth(new Date(date.getFullYear(), date.getMonth(), 1))
        selectDate(today)
    }

    return (
        <main className="calendar-page">
            <div className="calendar-content">
                <header className="calendar-header">
                    <h1>Calendar</h1>
                </header>

                <section aria-label="Workout calendar">
                    <div className="calendar-month-header">
                        <button type="button" aria-label="Previous month" onClick={() => changeMonth(-1)}>
                            ‹
                        </button>
                        <h2 aria-live="polite">
                            {month.toLocaleDateString('en-US', {
                                month: 'long',
                                year: 'numeric',
                            })}
                        </h2>
                        <button type="button" aria-label="Next month" onClick={() => changeMonth(1)}>
                            ›
                        </button>
                    </div>

                    <MonthGrid
                        month={month}
                        selectedDate={selectedDate}
                        onSelect={selectDate}
                    />

                    <div className="calendar-footer">
                        <button type="button" className="calendar-link-button" onClick={goToToday}>
                            Today
                        </button>
                    </div>
                </section>

                <SelectedDay date={selectedDate} />
            </div>

            <nav className="bottom-nav" aria-label="Main">
                {NAV_ITEMS.map(([icon, label]) => (
                    <button
                        key={label}
                        type="button"
                        className={label === 'Calendar' ? 'nav-active' : ''}
                        aria-current={label === 'Calendar' ? 'page' : undefined}
                        disabled={label !== 'Calendar' && (!onNavigate || label !== 'Overview')}
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

export default CalendarPage

