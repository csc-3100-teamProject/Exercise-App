import { useState } from 'react'
import LoginPage from './pages/LoginPage'
import OverviewPage from './pages/OverviewPage'

// Dev-only login bypass: set VITE_DEV_USER_ID in .env.local to skip the login page.
const devUser =
    import.meta.env.DEV && import.meta.env.VITE_DEV_USER_ID
        ? { id: import.meta.env.VITE_DEV_USER_ID }
        : null

function MyApp() {
    const [user, setUser] = useState(devUser)

    if (user) {
        return <OverviewPage user={user} />
    }

    return <LoginPage onLogin={setUser} />
}

export default MyApp
