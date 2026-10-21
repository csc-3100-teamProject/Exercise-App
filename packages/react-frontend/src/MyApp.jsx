import { useState } from 'react'
import LoginPage from './pages/LoginPage'
import OverviewPage from './pages/CalendarPage'

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
