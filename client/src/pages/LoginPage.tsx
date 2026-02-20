import React, { useState } from "react";
import { useAuth } from "../context/AuthContext";

export default function LoginPage() {
  const { login } = useAuth();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      await login(email, password);
    } catch (err: any) {
      setError(err.response?.data?.error || "Login failed");
    } finally {
      setLoading(false);
    }
  };

  const fillCredentials = (em: string) => {
    setEmail(em);
    setPassword("Upload1!");
    setError("");
  };

  return (
    <div className="login-page">
      <div className="login-card">
        <div className="login-header">
          <div className="login-logo">
            <svg
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="1.5"
            >
              <path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z" />
              <polyline points="3.27 6.96 12 12.01 20.73 6.96" />
              <line x1="12" y1="22.08" x2="12" y2="12" />
            </svg>
          </div>
          <h1>MatchDB</h1>
          <p className="login-subtitle">Data Collection Portal</p>
        </div>

        <form onSubmit={handleSubmit}>
          {error && <div className="alert alert-error">{error}</div>}

          <div className="form-group">
            <label htmlFor="email">Email address</label>
            <input
              id="email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="you@company.com"
              required
              autoFocus
            />
          </div>

          <div className="form-group">
            <label htmlFor="password">Password</label>
            <input
              id="password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
              required
            />
          </div>

          <button
            type="submit"
            className="btn btn-primary btn-block"
            disabled={loading}
          >
            {loading ? (
              <>
                <span className="spinner-sm" /> Signing in…
              </>
            ) : (
              "Sign In"
            )}
          </button>
        </form>

        <div className="login-divider">
          <span>Demo Accounts</span>
        </div>

        <div className="credentials">
          <button
            type="button"
            className="credential-card"
            onClick={() => fillCredentials("candidate_uploader@matchdb.com")}
          >
            <span className="credential-icon">👤</span>
            <div className="credential-info">
              <span className="credential-role">Candidate Uploader</span>
              <code>candidate_uploader@matchdb.com</code>
            </div>
            <span className="credential-arrow">→</span>
          </button>
          <button
            type="button"
            className="credential-card"
            onClick={() => fillCredentials("job_uploader@matchdb.com")}
          >
            <span className="credential-icon">💼</span>
            <div className="credential-info">
              <span className="credential-role">Job Uploader</span>
              <code>job_uploader@matchdb.com</code>
            </div>
            <span className="credential-arrow">→</span>
          </button>
          <p className="password-hint">
            Password for both: <code>Upload1!</code>
          </p>
        </div>
      </div>
    </div>
  );
}
