// pages/Login.jsx

import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

export default function Login() {
  const { login } = useAuth();
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  return (
    <div className="auth-page">
      <div className="card">
        <h1>Log in</h1>
        <form onSubmit={handleSubmit}>
          <label htmlFor="email">Email</label>
          <input id="email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} required />

          <label htmlFor="password">Password</label>
          <input id="password" type="password" value={password} onChange={(e) => setPassword(e.target.value)} required />

          {error && <p className="error-text">{error}</p>}

          <div className="form-actions">
            <button type="submit" disabled={busy}>{busy ? "Logging in..." : "Log in"}</button>
          </div>
        </form>
        <p className="muted" style={{ marginTop: 16 }}>
          No account yet? <Link to="/register">Sign up</Link>
        </p>
      </div>
    </div>
  );
}