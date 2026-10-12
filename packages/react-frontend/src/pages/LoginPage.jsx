import "./LoginPage.css";
import { useState } from "react";

function LoginPage() {
    const [isSigningUp, setIsSigningUp] = useState(false);
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
  return (
    <main className="login-page">
      <section className="login-card">
        <p className="login-brand">FORMFLOW</p>

        <h1>
            {isSigningUp ? "Create your account." : "Welcome back."}
        </h1>

        <p className="login-subtitle">
          {isSigningUp ?
            "A decision you'll never regret. Start training now!" :
            "Plan your training. Track your progress."
          }
        </p>

        <form
          className="login-form"
          onSubmit={(event) => event.preventDefault()}
        >
          <label htmlFor="email">Email</label>
          <input
            id="email"
            name="email"
            type="email"
            autoComplete="username"
            value={email}
            onChange={(event) => setPassword(event.target.value)}
            required
          />

          <label htmlFor="password">Password</label>
          <input
            id="password"
            name="password"
            type="password"
            autoComplete={isSigningUp ? "new-password" : "current-password"}
            value={password}
            onChange={(event) => setEmail(event.target.value)}
            required
          />

          <button type="submit">
            {isSigningUp ? "Create account" : "Log in"}
          </button>
        </form>
            <p className="auth-switch">
                {isSigningUp ? "Already have an account?" : "New to FormFlow?"}
            {" "}
            <button
                type="button"
                onClick={() => setIsSigningUp((current) => !current)}>
                {isSigningUp ? "Log in" : "Sign up"}
            </button>
</p>
      </section>
    </main>
  );
}

export default LoginPage;