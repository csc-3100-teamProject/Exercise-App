import { useState } from 'react'
import LoginPage from './pages/LoginPage'
import OverviewPage from './pages/OverviewPage'
import CalendarPage from './pages/CalendarPage'

// Dev-only login bypass: set VITE_DEV_USER_ID in .env.local to skip the login page.
const devUser =
    import.meta.env.DEV && import.meta.env.VITE_DEV_USER_ID
        ? { id: import.meta.env.VITE_DEV_USER_ID }
        : null

function MyApp() {
    const [user, setUser] = useState(devUser)
    const [currentPage, setCurrentPage] = useState('overview')
    if (user) {
        if (currentPage === 'calendar') {
		return <CalendarPage user={user} onNavigate={setCurrentPage} />
        }
	return <OverviewPage user={user} onNavigate={setCurrentPage} />
    }

    return <LoginPage onLogin={setUser} />
}

export default MyApp
