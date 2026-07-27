import { useState } from "react";
import { login } from "../services/Api";
import { saveToken } from "../services/Auth";

function Login({ setPage }) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleLogin(e) {
    e.preventDefault();
    setLoading(true);

    try {
      const data = await login({
        email,
        password,
      });

      if (data.token) {
        saveToken(data.token);

        setEmail("");
        setPassword("");

        setPage("team");
      } else {
        alert("E-mailadres of wachtwoord is onjuist.");
      }
    } catch (error) {
      console.error(error);
      alert("Kan geen verbinding maken met de server.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <main
      style={{
        maxWidth: "400px",
        margin: "50px auto",
      }}
    >
      <h2>🔐 Inloggen</h2>

      <form onSubmit={handleLogin}>
        <div>
          <label htmlFor="login-email">E-mailadres</label>
          <br />

          <input
            id="login-email"
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            autoComplete="email"
            required
          />
        </div>

        <br />

        <div>
          <label htmlFor="login-password">Wachtwoord</label>
          <br />

          <input
            id="login-password"
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            autoComplete="current-password"
            required
          />
        </div>

        <br />

        <button type="submit" disabled={loading}>
          {loading ? "Bezig met inloggen..." : "Inloggen"}
        </button>
      </form>
    </main>
  );
}

export default Login;