
import { useState } from 'react'
import './CalendarPage.css'
import './OverviewPage.css'

function CalendarPage({ user, onNavigate }) {
    const [currentDate, setCurrentDate] = useState(new Date())
    const [selectedDate, setSelectedDate] = useState(new Date())

    const year = currentDate.getFullYear()
    const month = currentDate.getMonth()

    const monthName = currentDate.toLocaleString('default', {
        month: 'long',
        year: 'numeric'
    })

    const daysInMonth = new Date(year, month + 1, 0).getDate()
    const firstDay = (new Date(year, month, 1).getDay() + 6) % 7

    const changeMonth = (amount) => {
        setCurrentDate(new Date(year, month + amount, 1))
    }

    const isSelected = (day) =>
        selectedDate.getDate() === day &&
        selectedDate.getMonth() === month &&
        selectedDate.getFullYear() === year

    return (
        <div className="calendar-page">
            <div className="calendar-container">
                <h1>Calendar</h1>
                <p className="calendar-subtitle">
                    Plan your training. Track your progress.
                </p>

                <div className="calendar-card">
                    <div className="calendar-header">
                        <h2>{monthName}</h2>
                        <div className="calendar-arrows">
                            <button onClick={() => changeMonth(-1)}>‹</button>
                            <button onClick={() => changeMonth(1)}>›</button>
                        </div>
                    </div>

                    <div className="calendar-grid">
                        {['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'].map(day => (
                            <div className="calendar-weekday" key={day}>
                                {day}
                            </div>
                        ))}

                        {Array.from({ length: firstDay }, (_, i) => (
                            <div key={`empty-${i}`} />
                        ))}

                        {Array.from({ length: daysInMonth }, (_, i) => {
                            const day = i + 1

                            return (
                                <button
                                    key={day}
                                    className={`calendar-day ${isSelected(day) ? 'selected' : ''}`}
                                    onClick={() =>
                                        setSelectedDate(new Date(year, month, day))
                                    }
                                >
                                    {day}
                                </button>
                            )
                        })}
                    </div>
                </div>

                <div className="calendar-plan">
                    <h2>
                        {selectedDate.toLocaleDateString('en-US', {
                            weekday: 'long',
                            month: 'long',
                            day: 'numeric'
                        })}
                    </h2>
                    <div className="calendar-empty">
                        No workouts planned for this day.
                    </div>
                </div>

                <button
                    className="calendar-back"
                    onClick={() => onNavigate('overview')}
                >
                    ← Back to Overview
                </button>
            </div>
        </div>
    )
}

export default CalendarPage

