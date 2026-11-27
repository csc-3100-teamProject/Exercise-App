import './LoginPage.css'
import { useState } from 'react'

const API_URL =
    import.meta.env.VITE_API_URL ??
    'https://formflow-c8f8crdtadajebea.westus-01.azurewebsites.net'

function LoginPage({ onLogin }) {
    const [isSigningUp, setIsSigningUp] = useState(false)
    const [email, setEmail] = useState('')
    const [password, setPassword] = useState('')
    const [username, setUsername] = useState('')
    const [isSubmitting, setIsSubmitting] = useState(false)
    const [errorMessage, setErrorMessage] = useState('')
    const [successMessage, setSuccessMessage] = useState('')
    const [isResettingPassword, setIsResettingPassword] = useState(false)
    function handleSubmit(event) {
        event.preventDefault()

        if (isSubmitting) return

        setErrorMessage('')
        setSuccessMessage('')

        if (isSigningUp && !username.trim()) {
            setErrorMessage('Enter a username.')
            return
        }

        const endpoint = isSigningUp ? '/users' : '/auth/login'

        const payload = isSigningUp
            ? {
                  username: username.trim(),
                  email: email.trim(),
                  password,
              }
            : {
                  email: email.trim(),
                  password,
              }

        setIsSubmitting(true)

        return fetch(`${API_URL}${endpoint}`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(payload),
            signal: AbortSignal.timeout(10000),
        })
            .then((response) => {
                if (response.status === 409) {
                    throw new Error('That username or email is already in use.')
                }

                if (response.status === 404) {
                    throw new Error('Incorrect email or password.')
                }

                if (response.status === 400) {
                    throw new Error('Fill in every field and try again.')
                }

                if (response.status !== 200 && response.status !== 201) {
                    throw new Error('The request failed. Please try again.')
                }

                setPassword('')

                if (isSigningUp) {
                    setIsSigningUp(false)
                    setUsername('')
                    setSuccessMessage('Account created. Log in to continue.')
                } else {
                    return response.json().then(onLogin)
                }
            })
            .catch((error) => {
                if (error.name === 'TimeoutError') {
                    setErrorMessage(
                        'The server took too long to respond. Please try again.'
                    )
                } else if (error instanceof TypeError) {
                    setErrorMessage(
                        'Could not connect to the server. Please try again.'
                    )
                } else {
                    setErrorMessage(error.message)
                }
            })
            .finally(() => {
                setIsSubmitting(false)
            })
    }
    return (
        <main className="login-page">
            <section className="login-card">
                <p className="login-brand">FORMFLOW</p>

                <h1>
                    {isSigningUp ? 'Create your account.' : 'Welcome back.'}
                </h1>

                <p className="login-subtitle">
                    {isSigningUp
                        ? "A decision you'll never regret. Start training now!"
                        : 'Plan your training. Track your progress.'}
                </p>
                {isResettingPassword ? (
                    <form
                        className="login-form"
                        onSubmit={(event) => {
                            event.preventDefault()

                            setErrorMessage('')
                            setSuccessMessage('')
                            setIsSubmitting(true)

                            fetch(`${API_URL}/auth/reset-password`, {
                                method: 'PUT',
                                headers: {
                                    'Content-Type': 'application/json',
                                },
                                body: JSON.stringify({
                                    email: email.trim(),
                                    password,
                                }),
                            })
                                .then((response) => {
                                    if (!response.ok) {
                                        throw new Error(
                                            'Could not reset password.'
                                        )
                                    }

                                    setPassword('')
                                    setSuccessMessage(
                                        'Password changed. You can now log in.'
                                    )
                                    setIsResettingPassword(false)
                                })
                                .catch((error) => {
                                    setErrorMessage(error.message)
                                })
                                .finally(() => {
                                    setIsSubmitting(false)
                                })
                        }}
                    >
                        <label htmlFor="reset-email">Email</label>
                        <input
                            id="reset-email"
                            type="email"
                            value={email}
                            onChange={(event) => setEmail(event.target.value)}
                            disabled={isSubmitting}
                            required
                        />

                        <label htmlFor="reset-password">New password</label>
                        <input
                            id="reset-password"
                            type="password"
                            value={password}
                            onChange={(event) =>
                                setPassword(event.target.value)
                            }
                            disabled={isSubmitting}
                            required
                        />

                        <button type="submit" disabled={isSubmitting}>
                            {isSubmitting
                                ? 'Please wait...'
                                : 'Change password'}
                        </button>

                        <button
                            className="back-to-login"
                            type="button"
                            disabled={isSubmitting}
                            onClick={() => setIsResettingPassword(false)}
                        >
                            Back to login
                        </button>

                        {errorMessage && (
                            <p className="form-error" role="alert">
                                {errorMessage}
                            </p>
                        )}
                    </form>
                ) : (
                    <>
                        <form className="login-form" onSubmit={handleSubmit}>
                            {isSigningUp && (
                                <>
                                    <label htmlFor="username">Username</label>
                                    <input
                                        id="username"
                                        name="username"
                                        type="text"
                                        value={username}
                                        onChange={(event) =>
                                            setUsername(event.target.value)
                                        }
                                        disabled={isSubmitting}
                                        required
                                    />
                                </>
                            )}
                            <label htmlFor="email">Email</label>
                            <input
                                id="email"
                                name="email"
                                type="email"
                                autoComplete="username"
                                value={email}
                                onChange={(event) =>
                                    setEmail(event.target.value)
                                }
                                required
                            />

                            <label htmlFor="password">Password</label>
                            <input
                                id="password"
                                name="password"
                                type="password"
                                autoComplete={
                                    isSigningUp
                                        ? 'new-password'
                                        : 'current-password'
                                }
                                value={password}
                                onChange={(event) =>
                                    setPassword(event.target.value)
                                }
                                required
                            />

                            {!isSigningUp && (
                                <div className="forgot-password">
                                    <button
                                        type="button"
                                        onClick={() => {
                                            setIsResettingPassword(true)
                                            setErrorMessage('')
                                            setSuccessMessage('')
                                        }}
                                    >
                                        Forgot password?
                                    </button>
                                </div>
                            )}

                            <button type="submit" disabled={isSubmitting}>
                                {isSubmitting
                                    ? 'Please wait...'
                                    : isSigningUp
                                      ? 'Create account'
                                      : 'Log in'}
                            </button>

                            {errorMessage && (
                                <p className="form-error" role="alert">
                                    {errorMessage}
                                </p>
                            )}

                            {successMessage && (
                                <p className="form-success" role="status">
                                    {successMessage}
                                </p>
                            )}
                        </form>
                        <p className="auth-switch">
                            {isSigningUp
                                ? 'Already have an account?'
                                : 'New to FormFlow?'}{' '}
                            <button
                                type="button"
                                onClick={() =>
                                    setIsSigningUp((current) => !current)
                                }
                            >
                                {isSigningUp ? 'Log in' : 'Sign up'}
                            </button>
                        </p>
                    </>
                )}
            </section>
        </main>
    )
}

export default LoginPage
