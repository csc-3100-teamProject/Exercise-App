import { useState } from 'react'
import LoginPage from './pages/LoginPage'
import OverviewPage from './pages/CalendarPage'

function MyApp() {
    const [showOverview, setShowOverview] = useState(false)

    if (showOverview) {
        return <OverviewPage />
    }

    return <LoginPage onLogin={() => setShowOverview(true)} />
}

export default MyApp
