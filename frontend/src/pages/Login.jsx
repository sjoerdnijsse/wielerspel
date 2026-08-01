import { useState } from "react";

import { login } from "../services/Api";
import { saveToken } from "../services/Auth";

function Login({ setPage }) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  async function handleLogin(event) {
    event.preventDefault();
    setLoading(true);
    setError("");

    try {
      const data = await login({ email, password });

      if (!data.token) {
        setError("E-mailadres of wachtwoord is onjuist.");
        return;
      }

      saveToken(data.token);
      setEmail("");
      setPassword("");
      setPage("team");
    } catch (error) {
      console.error(error);
      setError(
        error.message ||
          "Inloggen is mislukt. Controleer je gegevens."
      );
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="page-container" style={{ maxWidth: "480px" }}>
      <section className="responsive-card">
        <h2 style={{ marginTop: 0 }}>🔐 Inloggen</h2>

        {error && (
          <p
            role="alert"
            style={{
              padding: "12px",
              border: "1px solid #c33",
              borderRadius: "8px",
            }}
          >
            {error}
          </p>
        )}

        <form onSubmit={handleLogin}>
          <label
            htmlFor="login-email"
            style={{ display: "block", marginBottom: "15px" }}
          >
            <span style={{ display: "block", marginBottom: "6px" }}>
              E-mailadres
            </span>

            <input
              id="login-email"
              type="email"
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              autoComplete="email"
              required
              disabled={loading}
              className="responsive-input"
            />
          </label>

          <label
            htmlFor="login-password"
            style={{ display: "block", marginBottom: "15px" }}
          >
            <span style={{ display: "block", marginBottom: "6px" }}>
              Wachtwoord
            </span>

            <input
              id="login-password"
              type="password"
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              autoComplete="current-password"
              required
              disabled={loading}
              className="responsive-input"
            />
          </label>

          <div className="responsive-actions">
            <button type="submit" disabled={loading}>
              {loading ? "Bezig met inloggen..." : "Inloggen"}
            </button>

            <button
              type="button"
              onClick={() => setPage("forgotPassword")}
              disabled={loading}
            >
              Wachtwoord vergeten?
            </button>
          </div>
        </form>
      </section>
    </main>
  );
}

export default Login;
