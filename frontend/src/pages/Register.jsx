import { useState } from "react";
import { register } from "../services/Api";

function Register() {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");

  async function handleRegister(event) {
    event.preventDefault();

    setError("");
    setMessage("");

    const trimmedName = name.trim();
    const trimmedEmail = email.trim();

    if (!trimmedName) {
      setError("Naam is verplicht.");
      return;
    }

    if (!trimmedEmail) {
      setError("E-mailadres is verplicht.");
      return;
    }

    if (password.length < 8) {
      setError(
        "Het wachtwoord moet minimaal 8 tekens bevatten."
      );
      return;
    }

    try {
      setSaving(true);

      const data = await register({
        name: trimmedName,
        email: trimmedEmail,
        password,
      });

      setMessage(
        data.message || "Registratie gelukt."
      );

      setName("");
      setEmail("");
      setPassword("");
    } catch (error) {
      setError(
        error?.message ||
          "Registreren is mislukt."
      );
    } finally {
      setSaving(false);
    }
  }

  function handleNameChange(event) {
    setName(event.target.value);
    setError("");
    setMessage("");
  }

  function handleEmailChange(event) {
    setEmail(event.target.value);
    setError("");
    setMessage("");
  }

  function handlePasswordChange(event) {
    setPassword(event.target.value);
    setError("");
    setMessage("");
  }

  return (
    <main
      className="page-container"
      style={{
        maxWidth: "500px",
      }}
    >
      <h2>Registreren</h2>

      <section className="responsive-card">
        {error && (
          <div
            role="alert"
            aria-live="polite"
            style={{
              padding: "12px 14px",
              marginBottom: "18px",
              border: "1px solid #b52b25",
              borderRadius: "4px",
              background: "#fdecea",
              color: "#b52b25",
              fontWeight: "600",
            }}
          >
            {error}
          </div>
        )}

        {message && (
          <div
            role="status"
            aria-live="polite"
            style={{
              padding: "12px 14px",
              marginBottom: "18px",
              border: "1px solid #287a4b",
              borderRadius: "4px",
              background: "#edf8f1",
              color: "#20613c",
              fontWeight: "600",
            }}
          >
            {message}
          </div>
        )}

        <form onSubmit={handleRegister}>
          <label
            style={{
              display: "block",
              marginBottom: "20px",
            }}
          >
            <span
              style={{
                display: "block",
                marginBottom: "6px",
                fontWeight: "700",
              }}
            >
              Naam
            </span>

            <input
              type="text"
              value={name}
              onChange={handleNameChange}
              className="responsive-input"
              autoComplete="name"
              disabled={saving}
              required
            />

            <small
              style={{
                display: "block",
                marginTop: "6px",
                color: "#666",
              }}
            >
              Deze naam wordt getoond in het spel.
            </small>
          </label>

          <label
            style={{
              display: "block",
              marginBottom: "20px",
            }}
          >
            <span
              style={{
                display: "block",
                marginBottom: "6px",
                fontWeight: "700",
              }}
            >
              E-mailadres
            </span>

            <input
              type="email"
              value={email}
              onChange={handleEmailChange}
              className="responsive-input"
              autoComplete="email"
              disabled={saving}
              required
            />
          </label>

          <label
            style={{
              display: "block",
              marginBottom: "20px",
            }}
          >
            <span
              style={{
                display: "block",
                marginBottom: "6px",
                fontWeight: "700",
              }}
            >
              Wachtwoord
            </span>

            <input
              type="password"
              value={password}
              onChange={handlePasswordChange}
              className="responsive-input"
              autoComplete="new-password"
              disabled={saving}
              required
            />

            <small
              style={{
                display: "block",
                marginTop: "6px",
                color: "#666",
              }}
            >
              Minimaal 8 tekens.
            </small>
          </label>

          <div className="responsive-actions">
            <button
              type="submit"
              disabled={saving}
            >
              {saving
                ? "Registreren..."
                : "Registreren"}
            </button>
          </div>
        </form>
      </section>
    </main>
  );
}

export default Register;