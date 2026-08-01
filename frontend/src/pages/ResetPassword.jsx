import { useEffect, useState } from "react";

import { resetPassword } from "../services/Api";

function ResetPassword({ setPage }) {
  const [email, setEmail] = useState("");
  const [token, setToken] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");

  useEffect(() => {
    const parameters = new URLSearchParams(window.location.search);
    setEmail(parameters.get("email") ?? "");
    setToken(parameters.get("token") ?? "");
  }, []);

  async function handleSubmit(event) {
    event.preventDefault();
    setError("");
    setMessage("");

    if (!email || !token) {
      setError("De herstel-link is ongeldig of onvolledig.");
      return;
    }

    if (newPassword.length < 8) {
      setError("Het nieuwe wachtwoord moet minimaal 8 tekens bevatten.");
      return;
    }

    if (newPassword !== confirmPassword) {
      setError("De twee wachtwoorden zijn niet gelijk.");
      return;
    }

    setLoading(true);

    try {
      const result = await resetPassword({ email, token, newPassword });
      setMessage(result.message ?? "Je wachtwoord is opnieuw ingesteld.");
      setNewPassword("");
      setConfirmPassword("");
    } catch (error) {
      console.error(error);
      setError(error.message || "Het wachtwoord kon niet worden gewijzigd.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="page-container" style={{ maxWidth: "520px" }}>
      <section className="responsive-card">
        <h2 style={{ marginTop: 0 }}>🔐 Nieuw wachtwoord instellen</h2>

        {!email || !token ? (
          <>
            <p role="alert">De herstel-link is ongeldig of onvolledig.</p>
            <div className="responsive-actions">
              <button type="button" onClick={() => setPage("forgotPassword")}>
                Nieuwe herstelmail aanvragen
              </button>
            </div>
          </>
        ) : (
          <>
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

            {!message ? (
              <form onSubmit={handleSubmit}>
                <label htmlFor="new-password" style={{ display: "block", marginBottom: "15px" }}>
                  <span style={{ display: "block", marginBottom: "6px" }}>
                    Nieuw wachtwoord
                  </span>
                  <input
                    id="new-password"
                    type="password"
                    value={newPassword}
                    onChange={(event) => setNewPassword(event.target.value)}
                    autoComplete="new-password"
                    minLength="8"
                    required
                    disabled={loading}
                    className="responsive-input"
                  />
                </label>

                <label htmlFor="confirm-password" style={{ display: "block", marginBottom: "15px" }}>
                  <span style={{ display: "block", marginBottom: "6px" }}>
                    Wachtwoord herhalen
                  </span>
                  <input
                    id="confirm-password"
                    type="password"
                    value={confirmPassword}
                    onChange={(event) => setConfirmPassword(event.target.value)}
                    autoComplete="new-password"
                    minLength="8"
                    required
                    disabled={loading}
                    className="responsive-input"
                  />
                </label>

                <div className="responsive-actions">
                  <button type="submit" disabled={loading}>
                    {loading ? "Opslaan..." : "Nieuw wachtwoord opslaan"}
                  </button>
                  <button type="button" onClick={() => setPage("login")} disabled={loading}>
                    Terug naar inloggen
                  </button>
                </div>
              </form>
            ) : (
              <div className="responsive-actions">
                <button
                  type="button"
                  onClick={() => {
                    window.history.replaceState({}, "", window.location.pathname);
                    setPage("login");
                  }}
                >
                  Naar inloggen
                </button>
              </div>
            )}
          </>
        )}
      </section>
    </main>
  );
}

export default ResetPassword;
