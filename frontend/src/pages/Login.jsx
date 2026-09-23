import { useState } from "react";
import { Navigate, useLocation, useNavigate } from "react-router-dom";
import { Brand, Icon } from "../components/UI";
import { useApp } from "../state/context";
import { destinationAfterAuth, getPendingInvite, pendingInvite } from "../state/invite";

export default function Login() {
  const [signup, setSignup] = useState(false);
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const { user, login, register } = useApp();
  const navigate = useNavigate();
  const location = useLocation();
  const returnTo = pendingInvite(location.state?.from) || getPendingInvite();
  async function submit(event) {
    event.preventDefault();
    const fields = new FormData(event.currentTarget);
    if (signup && fields.get("password") !== fields.get("confirm")) {
      setError("Your passwords don’t match. Please try again.");
      return;
    }
    if (signup && !fields.get("name").trim()) {
      setError("Please enter your name.");
      return;
    }
    setError("");
    setSubmitting(true);
    try {
      if (signup) {
        await register(fields.get("name").trim(), fields.get("email").trim(), fields.get("password"));
        navigate(destinationAfterAuth(returnTo, true), { state: { from: returnTo } });
      } else {
        await login(fields.get("email").trim(), fields.get("password"));
        navigate(destinationAfterAuth(returnTo));
      }
    } catch (failure) {
      setError(failure.message || "Authentication failed. Please try again.");
      setSubmitting(false);
    }
  }

  if (user && !submitting) {
    return <Navigate to="/home" replace />;
  }

  return (
    <div className="auth-shell reference-auth">
      <section className="auth-story">
        <div className="auth-story-copy">
          <Brand />
          <p>Organise football. Bring people together.</p>
        </div>
      </section>
      <section className="auth-form-panel">
        <div className="auth-form-inner">
          <h1>{signup ? "Join your crew" : "Welcome back"}</h1>
          <p className="auth-supporting">{signup ? "Create your KickSplit account." : "Sign in to get back to the game."}</p>
          <div className="segmented" aria-label="Account action">
            <button
              type="button"
              aria-pressed={!signup}
              className={!signup ? "selected" : ""}
              onClick={() => {
                setSignup(false);
                setError("");
              }}
            >
              Log in
            </button>
            <button
              type="button"
              aria-pressed={signup}
              className={signup ? "selected" : ""}
              onClick={() => {
                setSignup(true);
                setError("");
              }}
            >
              Sign up
            </button>
          </div>
          <form key={String(signup)} className="form" onSubmit={submit}>
            {signup && (
              <label>
                Full name
                <input
                  name="name"
                  placeholder="Alex Morgan"
                  autoComplete="name"
                  required
                  maxLength={60}
                />
              </label>
            )}
            <label>
              Email
              <input
                name="email"
                type="email"
                placeholder="you@example.com"
                autoComplete="email"
                required
              />
            </label>
            <label>
              Password
              <input
                name="password"
                type="password"
                placeholder="At least 6 characters"
                autoComplete={signup ? "new-password" : "current-password"}
                minLength={6}
                required
              />
            </label>
            {signup && (
              <label>
                Confirm password
                <input
                  name="confirm"
                  type="password"
                  placeholder="Enter your password again"
                  autoComplete="new-password"
                  minLength={6}
                  required
                />
              </label>
            )}
            {error && (
              <p className="error" role="alert">
                {error}
              </p>
            )}
            <button className="button primary" disabled={submitting}>
              {signup ? "Create account" : "Continue with email"}
              <Icon name="arrow" size={19} />
            </button>
          </form>
        </div>
      </section>
    </div>
  );
}
