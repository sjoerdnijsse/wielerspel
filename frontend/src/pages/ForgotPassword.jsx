import { useState } from "react";

import { forgotPassword } from "../services/Api";

function ForgotPassword({ setPage }) {
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");

  async function handleSubmit(event) {
    event.preventDefault();
    setLoading(true);
    setError("");
    setMessage("");

    try {
      const result = await forgotPassword(email);
      setMessage(
        result.message ??
          "Als het e-mailadres bij ons bekend is, ontvang je een herstelmail."
      );
    } catch (error) {
      console.error(error);
      setError(
        error.message ||
          "Het herstelverzoek kon niet worden verstuurd."
      );
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="page-container" style={{ maxWidth: "520px" }}>
      <section className="responsive-card">
        <h2 style={{ marginTop: 0 }}>🔑 Wachtwoord vergeten</h2>

        <p>
          Vul het e-mailadres van je account in. Als het adres bij ons
          bekend is, ontvang je een link om een nieuw wachtwoord in te
          stellen.
        </p>

        {error && (
          <p role="alert" style={{ padding: "12px", border: "1px solid #c33", borderRadius: "8px" }}>
            {error}
          </p>
        )}

        {message && (
          <p style={{ padding: "12px", border: "1px solid #2f7d32", borderRadius: "8px" }}>
            {message}
          </p>
        )}

        <form onSubmit={handleSubmit}>
          <label htmlFor="forgot-password-email" style={{ display: "block", marginBottom: "15px" }}>
            <span style={{ display: "block", marginBottom: "6px" }}>
              E-mailadres
            </span>

            <input
              id="forgot-password-email"
              type="email"
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              autoComplete="email"
              required
              disabled={loading}
              className="responsive-input"
            />
          </label>

          <div className="responsive-actions">
            <button type="submit" disabled={loading}>
              {loading ? "Versturen..." : "Herstelmail versturen"}
            </button>

            <button type="button" onClick={() => setPage("login")} disabled={loading}>
              Terug naar inloggen
            </button>
          </div>
        </form>
      </section>
    </main>
  );
}

export default ForgotPassword;
